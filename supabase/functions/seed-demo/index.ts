import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Get profile
    const { data: profile } = await admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (!profile) throw new Error("Profil introuvable");

    // Update profile if missing data
    if (!profile.filiere) {
      await admin.from("profiles").update({
        filiere: profile.filiere || "Génie Informatique",
        niveau: profile.niveau || "3ème année Licence",
        cin: profile.cin || `${10000000 + Math.floor(Math.random() * 9000000)}`,
        telephone: profile.telephone || "+216 20 000 000",
      }).eq("id", profile.id);
    }

    // Check if subjects already seeded for this filiere
    const filiere = "Génie Informatique";
    const { data: existing } = await admin.from("subjects").select("id").eq("filiere", filiere).limit(1);

    let subjectIds: string[] = [];
    if (!existing?.length) {
      // Create professors
      const profs = [
        { prenom: "Sami", nom: "Ben Salah", email: `prof.bensalah.${Date.now()}@eduport.tn`, bureau: "B-204" },
        { prenom: "Leila", nom: "Trabelsi", email: `prof.trabelsi.${Date.now()}@eduport.tn`, bureau: "A-110" },
        { prenom: "Mehdi", nom: "Khelifi", email: `prof.khelifi.${Date.now()}@eduport.tn`, bureau: "C-302" },
        { prenom: "Amira", nom: "Gharbi", email: `prof.gharbi.${Date.now()}@eduport.tn`, bureau: "B-115" },
        { prenom: "Karim", nom: "Mejri", email: `prof.mejri.${Date.now()}@eduport.tn`, bureau: "A-201" },
      ];
      const profIds: string[] = [];
      for (const p of profs) {
        const { data } = await admin.from("profiles").insert({
          user_id: crypto.randomUUID(), // pseudo, no auth user, but UNIQUE so OK if not FK-enforced
          ...p, filiere, niveau: "Professeur",
        }).select("id").single().then(r => r).catch(() => ({ data: null }));
        if (data) profIds.push(data.id);
      }

      const subjects = [
        { nom: "Algorithmique avancée", code: "INFO301", coefficient: 3, semestre: "S5", professor_id: profIds[0] },
        { nom: "Bases de données", code: "INFO302", coefficient: 3, semestre: "S5", professor_id: profIds[1] },
        { nom: "Réseaux informatiques", code: "INFO303", coefficient: 2, semestre: "S5", professor_id: profIds[2] },
        { nom: "Génie logiciel", code: "INFO304", coefficient: 3, semestre: "S5", professor_id: profIds[3] },
        { nom: "Anglais technique", code: "LANG301", coefficient: 1, semestre: "S5", professor_id: profIds[4] },
        { nom: "Développement Web", code: "INFO401", coefficient: 3, semestre: "S6", professor_id: profIds[0] },
        { nom: "Intelligence artificielle", code: "INFO402", coefficient: 3, semestre: "S6", professor_id: profIds[1] },
        { nom: "Sécurité informatique", code: "INFO403", coefficient: 2, semestre: "S6", professor_id: profIds[2] },
      ];
      const { data: subRows } = await admin.from("subjects").insert(
        subjects.map(s => ({ ...s, filiere }))
      ).select("id");
      subjectIds = subRows?.map(s => s.id) || [];

      // Schedule
      const sched = [
        { subject_id: subjectIds[0], jour: 1, heure_debut: "08:30", heure_fin: "10:00", salle: "B-12", type_seance: "Cours" },
        { subject_id: subjectIds[1], jour: 1, heure_debut: "10:15", heure_fin: "11:45", salle: "A-08", type_seance: "Cours" },
        { subject_id: subjectIds[2], jour: 2, heure_debut: "08:30", heure_fin: "10:00", salle: "C-05", type_seance: "Cours" },
        { subject_id: subjectIds[3], jour: 2, heure_debut: "13:30", heure_fin: "15:00", salle: "B-12", type_seance: "TP" },
        { subject_id: subjectIds[0], jour: 3, heure_debut: "10:15", heure_fin: "11:45", salle: "Lab-3", type_seance: "TP" },
        { subject_id: subjectIds[4], jour: 3, heure_debut: "14:00", heure_fin: "15:30", salle: "A-12", type_seance: "Cours" },
        { subject_id: subjectIds[1], jour: 4, heure_debut: "08:30", heure_fin: "10:00", salle: "Lab-1", type_seance: "TP" },
        { subject_id: subjectIds[2], jour: 4, heure_debut: "10:15", heure_fin: "11:45", salle: "C-05", type_seance: "TD" },
        { subject_id: subjectIds[3], jour: 5, heure_debut: "08:30", heure_fin: "11:45", salle: "B-12", type_seance: "Cours" },
      ];
      await admin.from("schedule").insert(sched.map(s => ({ ...s, filiere, niveau: "L3" })));
    } else {
      const { data: subs } = await admin.from("subjects").select("id").eq("filiere", filiere);
      subjectIds = subs?.map(s => s.id) || [];
    }

    // Seed grades for THIS student if none exist
    const { data: existingGrades } = await admin.from("grades").select("id").eq("student_id", profile.id).limit(1);
    if (!existingGrades?.length && subjectIds.length) {
      const grades: any[] = [];
      const types = ["DS", "Examen", "TP"];
      for (const sid of subjectIds) {
        for (let i = 0; i < 3; i++) {
          const base = 10 + Math.random() * 8;
          const date = new Date();
          date.setMonth(date.getMonth() - (3 - i));
          grades.push({
            student_id: profile.id,
            subject_id: sid,
            type: types[i],
            note: Math.round(base * 4) / 4,
            poids: i === 1 ? 2 : 1,
            date_evaluation: date.toISOString().slice(0, 10),
          });
        }
      }
      await admin.from("grades").insert(grades);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("seed error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
