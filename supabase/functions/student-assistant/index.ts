import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { messages } = await req.json();

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

    let context = "";
    if (profile) {
      const { data: grades } = await admin.from("grades")
        .select("note,poids,type,date_evaluation, subjects(nom,coefficient,semestre)")
        .eq("student_id", profile.id);
      const { data: schedule } = await admin.from("schedule")
        .select("jour,heure_debut,heure_fin,salle,type_seance, subjects(nom)")
        .eq("filiere", profile.filiere);
      const { data: profs } = await admin.from("profiles")
        .select("prenom,nom,email,bureau, subjects:subjects!subjects_professor_id_fkey(nom)")
        .eq("filiere", profile.filiere)
        .eq("niveau", "Professeur");

      // Compute averages per subject
      const bySubj: Record<string, { nom: string; coef: number; sem: string; notes: { note: number; poids: number; type: string }[] }> = {};
      (grades || []).forEach((g: any) => {
        const sn = g.subjects?.nom || "?";
        if (!bySubj[sn]) bySubj[sn] = { nom: sn, coef: g.subjects?.coefficient || 1, sem: g.subjects?.semestre || "?", notes: [] };
        bySubj[sn].notes.push({ note: Number(g.note), poids: Number(g.poids), type: g.type });
      });
      const subjLines = Object.values(bySubj).map(s => {
        const sumW = s.notes.reduce((a, b) => a + b.poids, 0);
        const moy = sumW ? s.notes.reduce((a, b) => a + b.note * b.poids, 0) / sumW : 0;
        return `- ${s.nom} (${s.sem}, coef ${s.coef}): moyenne ${moy.toFixed(2)}/20 [${s.notes.map(n => `${n.type}=${n.note}`).join(", ")}]`;
      }).join("\n");

      const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
      const schedLines = (schedule || []).map((s: any) =>
        `- ${jours[s.jour - 1]} ${s.heure_debut?.slice(0, 5)}-${s.heure_fin?.slice(0, 5)} : ${s.subjects?.nom} (${s.type_seance}, salle ${s.salle})`
      ).join("\n");

      const profLines = (profs || []).map((p: any) =>
        `- Pr. ${p.prenom} ${p.nom} — bureau ${p.bureau || "n/a"} — ${p.email}`
      ).join("\n");

      context = `
DOSSIER DE L'ÉTUDIANT :
Nom : ${profile.prenom} ${profile.nom}
Filière : ${profile.filiere || "Non renseignée"}
Niveau : ${profile.niveau || "Non renseigné"}
CIN : ${profile.cin || "—"}

NOTES (système tunisien /20) :
${subjLines || "Aucune note encore."}

EMPLOI DU TEMPS :
${schedLines || "Pas d'emploi du temps."}

PROFESSEURS DE LA FILIÈRE :
${profLines || "Aucun professeur listé."}
`;
    }

    const systemPrompt = `Tu es l'assistant IA personnel d'un étudiant universitaire tunisien. Tu réponds TOUJOURS en français, de façon concise, chaleureuse et précise.

Tu as accès en temps réel au dossier de l'étudiant ci-dessous. Utilise uniquement ces données pour répondre à ses questions sur ses notes, sa moyenne, son emploi du temps, ses professeurs, ou ses démarches administratives. Si tu n'as pas l'info, dis-le honnêtement.

Le système de notation est sur 20. Mentions : Passable (≥10), Assez Bien (≥12), Bien (≥14), Très Bien (≥16).

${context}`;

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erreur API Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      try {
        const reader = geminiResponse.body!.getReader();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit as OpenAI-compatible SSE chunk
                const chunk = {
                  choices: [{ delta: { content: text }, finish_reason: null }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
              // Check for finish
              const finishReason = parsed?.candidates?.[0]?.finishReason;
              if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
                // emit finish
              }
            } catch (_) { /* skip parse errors */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
