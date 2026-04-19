import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOC_LABELS: Record<string, string> = {
  attestation_inscription: "Attestation d'inscription",
  releve_notes: "Relevé de notes",
  attestation_presence: "Attestation de présence",
  convention_stage: "Convention de stage",
};

function buildPdfHtml(opts: {
  type: string; profile: any; gradesByMatiere?: any[]; moyenne?: number; mention?: string; refNum: string;
}) {
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const fullName = `${opts.profile.prenom || ""} ${opts.profile.nom || ""}`.trim();

  let body = "";
  if (opts.type === "releve_notes" && opts.gradesByMatiere) {
    const rows = opts.gradesByMatiere.map((m: any) =>
      `<tr><td>${m.nom}</td><td style="text-align:center">${m.coefficient}</td><td style="text-align:center; font-weight:600">${m.moyenne.toFixed(2)}/20</td></tr>`
    ).join("");
    body = `
      <p>Le présent relevé certifie les résultats académiques obtenus par l'étudiant(e) ci-dessus pour le semestre en cours.</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #000;">
        <thead><tr style="background:#0a0a0a; color:#fafaf7"><th style="padding:10px; text-align:left">Matière</th><th style="padding:10px">Coef.</th><th style="padding:10px">Moyenne</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="border-top:2px solid #000; font-weight:700"><td style="padding:12px">MOYENNE GÉNÉRALE</td><td style="text-align:center">—</td><td style="text-align:center; font-size:18px">${opts.moyenne?.toFixed(2)}/20</td></tr></tfoot>
      </table>
      <p>Mention : <strong>${opts.mention || "—"}</strong></p>`;
  } else if (opts.type === "attestation_inscription") {
    body = `<p>Le Doyen de l'Université certifie que <strong>${fullName}</strong>, titulaire du CIN n° <strong>${opts.profile.cin || "—"}</strong>, est régulièrement inscrit(e) en <strong>${opts.profile.niveau || ""}</strong>, filière <strong>${opts.profile.filiere || ""}</strong>, pour l'année universitaire en cours.</p>
    <p>La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>`;
  } else if (opts.type === "attestation_presence") {
    body = `<p>Nous certifions que <strong>${fullName}</strong>, étudiant(e) en <strong>${opts.profile.niveau || ""}</strong>, filière <strong>${opts.profile.filiere || ""}</strong>, est régulièrement présent(e) aux cours dispensés au sein de notre établissement.</p>
    <p>Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>`;
  } else if (opts.type === "convention_stage") {
    body = `<p>La présente convention est établie entre l'Université et l'organisme d'accueil, en faveur de <strong>${fullName}</strong> (CIN ${opts.profile.cin || "—"}), étudiant(e) en <strong>${opts.profile.niveau || ""}</strong>, filière <strong>${opts.profile.filiere || ""}</strong>.</p>
    <p>Elle régit les conditions du stage à effectuer dans le cadre de la formation universitaire de l'étudiant(e). Les modalités précises seront annexées au présent document.</p>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${DOC_LABELS[opts.type]}</title>
  <style>
    @page { size: A4; margin: 22mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #0a0a0a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0a0a0a; padding-bottom:14px; margin-bottom:30px; }
    .logo { font-family:'Helvetica',sans-serif; font-weight:900; font-size:28px; letter-spacing:-1px; }
    .meta { text-align:right; font-size:11px; color:#555; }
    h1 { font-family:'Helvetica',sans-serif; font-size:26px; text-transform:uppercase; letter-spacing:1px; text-align:center; margin:30px 0 8px; }
    .subtitle { text-align:center; color:#555; font-size:12px; margin-bottom:30px; }
    .infos { background:#f5f3ed; border-left:4px solid #0a0a0a; padding:14px 20px; margin:20px 0; font-size:14px; }
    .footer { margin-top:60px; display:flex; justify-content:space-between; align-items:flex-end; }
    .signature { text-align:right; }
    .signature-line { border-top:1px solid #000; padding-top:5px; margin-top:50px; font-size:11px; }
    .stamp { width:90px; height:90px; border:2px solid #0a0a0a; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:10px; text-align:center; transform:rotate(-8deg); }
    .ref { font-family: monospace; font-size:11px; color:#555; }
  </style></head><body>
    <div class="header">
      <div>
        <div class="logo">EDUPORT.</div>
        <div style="font-size:11px; color:#555">Université Tunisienne — République Tunisienne</div>
      </div>
      <div class="meta">Tunis, le ${today}<br/><span class="ref">Réf. ${opts.refNum}</span></div>
    </div>
    <h1>${DOC_LABELS[opts.type]}</h1>
    <div class="subtitle">Document officiel</div>
    <div class="infos">
      <strong>Nom & Prénom :</strong> ${fullName}<br/>
      <strong>CIN :</strong> ${opts.profile.cin || "—"}<br/>
      <strong>Filière :</strong> ${opts.profile.filiere || "—"}<br/>
      <strong>Niveau :</strong> ${opts.profile.niveau || "—"}
    </div>
    ${body}
    <div class="footer">
      <div class="stamp">SIGNÉ<br/>NUMÉRIQUEMENT</div>
      <div class="signature">
        <div class="signature-line">Service Scolarité</div>
      </div>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { requestId } = await req.json();
    if (!requestId) throw new Error("requestId manquant");

    const { data: docReq, error: reqErr } = await admin.from("document_requests")
      .select("*, profiles(*)").eq("id", requestId).maybeSingle();
    if (reqErr || !docReq) throw new Error("Demande introuvable");

    const profile = docReq.profiles;
    if (!profile) throw new Error("Profil étudiant introuvable");

    // ===== Auto-approval AI logic =====
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let decision = "approuve";
    let reason = "Étudiant inscrit, documents requis disponibles, demande conforme.";

    if (LOVABLE_API_KEY) {
      try {
        const eligibilityCtx = `Type de document demandé : ${DOC_LABELS[docReq.type]}
Étudiant : ${profile.prenom} ${profile.nom}
Filière : ${profile.filiere || "non renseignée"}
Niveau : ${profile.niveau || "non renseigné"}
CIN renseigné : ${profile.cin ? "oui" : "non"}
Motif : ${docReq.motif || "(aucun)"}`;
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Tu es un agent administratif d'université tunisienne. Tu vérifies l'éligibilité d'une demande de document officiel. Réponds en JSON strict : {\"decision\":\"approuve\"|\"refuse\",\"raison\":\"phrase courte en français\"}. Refuse uniquement si des informations critiques manquent (filière, niveau pour attestation d'inscription par exemple). Sois bienveillant et auto-approuve quand c'est raisonnable." },
              { role: "user", content: eligibilityCtx },
            ],
            tools: [{
              type: "function",
              function: {
                name: "decide",
                description: "Émet la décision d'approbation",
                parameters: {
                  type: "object",
                  properties: {
                    decision: { type: "string", enum: ["approuve", "refuse"] },
                    raison: { type: "string" },
                  },
                  required: ["decision", "raison"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "decide" } },
          }),
        });
        const aiData = await aiResp.json();
        const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (tc) {
          const args = JSON.parse(tc.function.arguments);
          decision = args.decision;
          reason = args.raison;
        }
      } catch (err) {
        console.error("AI eligibility check failed, defaulting to approve:", err);
      }
    }

    if (decision === "refuse") {
      await admin.from("document_requests").update({
        statut: "refuse", decision_ia: reason, reviewed_at: new Date().toISOString(),
      }).eq("id", requestId);
      return new Response(JSON.stringify({ ok: true, decision: "refuse", reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Generate PDF (HTML for now — viewable in browser, printable to PDF) =====
    let extras: any = {};
    if (docReq.type === "releve_notes") {
      const { data: grades } = await admin.from("grades")
        .select("note,poids, subjects(nom,coefficient)").eq("student_id", profile.id);
      const bySubj: Record<string, any> = {};
      (grades || []).forEach((g: any) => {
        const sn = g.subjects?.nom || "?";
        if (!bySubj[sn]) bySubj[sn] = { nom: sn, coefficient: g.subjects?.coefficient || 1, notes: [] };
        bySubj[sn].notes.push({ note: Number(g.note), poids: Number(g.poids) });
      });
      const arr = Object.values(bySubj).map((s: any) => {
        const sumW = s.notes.reduce((a: number, b: any) => a + b.poids, 0);
        const moy = sumW ? s.notes.reduce((a: number, b: any) => a + b.note * b.poids, 0) / sumW : 0;
        return { ...s, moyenne: moy };
      });
      const sumC = arr.reduce((a: number, b: any) => a + Number(b.coefficient), 0);
      const moyG = sumC ? arr.reduce((a: number, b: any) => a + b.moyenne * Number(b.coefficient), 0) / sumC : 0;
      const mention = moyG >= 16 ? "Très Bien" : moyG >= 14 ? "Bien" : moyG >= 12 ? "Assez Bien" : moyG >= 10 ? "Passable" : "Insuffisant";
      extras = { gradesByMatiere: arr, moyenne: moyG, mention };
    }

    const refNum = `EP-${new Date().getFullYear()}-${requestId.slice(0, 8).toUpperCase()}`;
    const html = buildPdfHtml({ type: docReq.type, profile, refNum, ...extras });

    // Upload HTML to storage (browser-renderable, "PDF-style")
    const path = `${profile.user_id}/${docReq.type}-${requestId}.html`;
    const { error: uploadErr } = await admin.storage.from("documents")
      .upload(path, new Blob([html], { type: "text/html" }), { upsert: true, contentType: "text/html" });
    if (uploadErr) throw uploadErr;

    const { data: signed } = await admin.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 7);

    await admin.from("document_requests").update({
      statut: "approuve",
      decision_ia: reason,
      pdf_url: signed?.signedUrl || path,
      reviewed_at: new Date().toISOString(),
    }).eq("id", requestId);

    return new Response(JSON.stringify({ ok: true, decision: "approuve", url: signed?.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("doc-agent error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
