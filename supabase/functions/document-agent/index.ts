import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

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

function buildPdf(opts: {
  type: string; profile: any; gradesByMatiere?: any[]; moyenne?: number; mention?: string; refNum: string;
}): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 22;
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const fullName = `${opts.profile.prenom || ""} ${opts.profile.nom || ""}`.trim();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("EDUPORT.", margin, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Université Tunisienne — République Tunisienne", margin, 30);
  doc.text(`Tunis, le ${today}`, pageW - margin, 24, { align: "right" });
  doc.setFontSize(7);
  doc.text(`Réf. ${opts.refNum}`, pageW - margin, 30, { align: "right" });
  doc.setDrawColor(10);
  doc.setLineWidth(0.6);
  doc.line(margin, 35, pageW - margin, 35);

  // Title
  doc.setTextColor(10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(DOC_LABELS[opts.type].toUpperCase(), pageW / 2, 52, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Document officiel", pageW / 2, 58, { align: "center" });

  // Info box
  let y = 72;
  doc.setFillColor(245, 243, 237);
  doc.rect(margin, y, pageW - margin * 2, 30, "F");
  doc.setDrawColor(10);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 30);
  doc.setTextColor(10);
  doc.setFontSize(10);
  const infoX = margin + 5;
  doc.setFont("helvetica", "bold"); doc.text("Nom & Prénom :", infoX, y + 7);
  doc.setFont("helvetica", "normal"); doc.text(fullName, infoX + 32, y + 7);
  doc.setFont("helvetica", "bold"); doc.text("CIN :", infoX, y + 14);
  doc.setFont("helvetica", "normal"); doc.text(opts.profile.cin || "—", infoX + 32, y + 14);
  doc.setFont("helvetica", "bold"); doc.text("Filière :", infoX, y + 21);
  doc.setFont("helvetica", "normal"); doc.text(opts.profile.filiere || "—", infoX + 32, y + 21);
  doc.setFont("helvetica", "bold"); doc.text("Niveau :", infoX, y + 28);
  doc.setFont("helvetica", "normal"); doc.text(opts.profile.niveau || "—", infoX + 32, y + 28);

  y += 42;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  // Body
  const wrap = (text: string, maxW: number) => doc.splitTextToSize(text, maxW);
  const writeP = (text: string) => {
    const lines = wrap(text, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 4;
  };

  if (opts.type === "attestation_inscription") {
    writeP(`Le Doyen de l'Université certifie que ${fullName}, titulaire du CIN n° ${opts.profile.cin || "—"}, est régulièrement inscrit(e) en ${opts.profile.niveau || ""}, filière ${opts.profile.filiere || ""}, pour l'année universitaire en cours.`);
    writeP("La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.");
  } else if (opts.type === "attestation_presence") {
    writeP(`Nous certifions que ${fullName}, étudiant(e) en ${opts.profile.niveau || ""}, filière ${opts.profile.filiere || ""}, est régulièrement présent(e) aux cours dispensés au sein de notre établissement.`);
    writeP("Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.");
  } else if (opts.type === "convention_stage") {
    writeP(`La présente convention est établie entre l'Université et l'organisme d'accueil, en faveur de ${fullName} (CIN ${opts.profile.cin || "—"}), étudiant(e) en ${opts.profile.niveau || ""}, filière ${opts.profile.filiere || ""}.`);
    writeP("Elle régit les conditions du stage à effectuer dans le cadre de la formation universitaire de l'étudiant(e). Les modalités précises seront annexées au présent document.");
  } else if (opts.type === "releve_notes" && opts.gradesByMatiere) {
    writeP("Le présent relevé certifie les résultats académiques obtenus par l'étudiant(e) ci-dessus pour le semestre en cours.");
    y += 2;
    // Table header
    const colX = [margin, margin + 95, margin + 130];
    const colW = [95, 35, pageW - margin * 2 - 130];
    doc.setFillColor(10, 10, 10);
    doc.rect(margin, y, pageW - margin * 2, 9, "F");
    doc.setTextColor(250, 250, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Matière", colX[0] + 3, y + 6);
    doc.text("Coef.", colX[1] + colW[1] / 2, y + 6, { align: "center" });
    doc.text("Moyenne", colX[2] + colW[2] / 2, y + 6, { align: "center" });
    y += 9;
    // Rows
    doc.setTextColor(10);
    doc.setFont("helvetica", "normal");
    opts.gradesByMatiere.forEach((m: any, i: number) => {
      if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(margin, y, pageW - margin * 2, 8, "F"); }
      doc.text(String(m.nom).slice(0, 50), colX[0] + 3, y + 5.5);
      doc.text(String(m.coefficient), colX[1] + colW[1] / 2, y + 5.5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`${m.moyenne.toFixed(2)}/20`, colX[2] + colW[2] / 2, y + 5.5, { align: "center" });
      doc.setFont("helvetica", "normal");
      y += 8;
    });
    // Total
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 2;
    doc.setFillColor(10, 10, 10);
    doc.rect(margin, y, pageW - margin * 2, 11, "F");
    doc.setTextColor(250, 250, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("MOYENNE GÉNÉRALE", colX[0] + 3, y + 7);
    doc.setFontSize(13);
    doc.text(`${opts.moyenne?.toFixed(2)}/20`, colX[2] + colW[2] / 2, y + 7.5, { align: "center" });
    y += 16;
    doc.setTextColor(10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Mention : ", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(opts.mention || "—", margin + 20, y);
    y += 8;
  }

  // Footer — stamp + signature
  const footerY = 260;
  // Stamp circle
  doc.setDrawColor(10);
  doc.setLineWidth(1.2);
  doc.circle(margin + 18, footerY, 16);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("SIGNÉ", margin + 18, footerY - 2, { align: "center" });
  doc.text("NUMÉRIQUEMENT", margin + 18, footerY + 3, { align: "center" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(opts.refNum, margin + 18, footerY + 8, { align: "center" });
  // Signature line
  doc.setDrawColor(10);
  doc.setLineWidth(0.4);
  doc.line(pageW - margin - 60, footerY + 5, pageW - margin, footerY + 5);
  doc.setFontSize(9);
  doc.text("Service Scolarité", pageW - margin, footerY + 10, { align: "right" });

  return doc.output("arraybuffer") as unknown as Uint8Array;
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
    const pdfBytes = buildPdf({ type: docReq.type, profile, refNum, ...extras });

    const path = `${profile.user_id}/${docReq.type}-${requestId}.pdf`;
    const { error: uploadErr } = await admin.storage.from("documents")
      .upload(path, new Blob([pdfBytes], { type: "application/pdf" }), { upsert: true, contentType: "application/pdf" });
    if (uploadErr) throw uploadErr;

    const { data: signed } = await admin.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 7, { download: `${DOC_LABELS[docReq.type]}.pdf` });

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
