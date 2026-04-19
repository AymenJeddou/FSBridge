import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, GraduationCap, FileText, ShieldCheck, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mention, moyenneMatiere, moyenneGenerale } from "@/lib/grading";

const Admin = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"stats" | "users" | "docs">("stats");
  const [stats, setStats] = useState<any>({ students: 0, profs: 0, docs: 0, pending: 0, byFiliere: [] });
  const [users, setUsers] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: roles }, { data: profs }, { data: docReqs }, { data: grades }] = await Promise.all([
      supabase.from("user_roles").select("role,user_id"),
      supabase.from("profiles").select("*"),
      supabase.from("document_requests").select("*, profiles(prenom,nom,filiere)").order("created_at", { ascending: false }),
      supabase.from("grades").select("note,poids, subjects(coefficient,filiere), profiles!inner(filiere)"),
    ]);
    const studentCount = roles?.filter((r: any) => r.role === "student").length || 0;
    const profCount = (profs || []).filter((p: any) => p.niveau === "Professeur").length;

    // moyennes par filière
    const byF: Record<string, { sumW: number; sumNW: number }> = {};
    (grades || []).forEach((g: any) => {
      const f = g.profiles?.filiere || "—";
      if (!byF[f]) byF[f] = { sumW: 0, sumNW: 0 };
      byF[f].sumW += Number(g.poids);
      byF[f].sumNW += Number(g.note) * Number(g.poids);
    });
    const byFiliere = Object.entries(byF).map(([nom, v]) => ({ nom, moy: v.sumW ? v.sumNW / v.sumW : 0 }));

    setStats({
      students: studentCount, profs: profCount,
      docs: docReqs?.length || 0,
      pending: (docReqs || []).filter((d: any) => d.statut === "en_attente").length,
      byFiliere,
    });
    setUsers(profs || []);
    setDocs(docReqs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: "admin" | "professor" | "student") => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
    toast({ title: "Rôle mis à jour" });
    load();
  };

  const overrideDoc = async (id: string, statut: "approuve" | "refuse") => {
    await supabase.from("document_requests").update({ statut, reviewed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Demande mise à jour" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="retro-tag mb-3"><ShieldCheck size={11} /> Espace admin</div>
        <h1 className="font-display text-4xl md:text-5xl">Tableau d'administration</h1>
      </div>

      <div className="flex gap-2 border-b-2 border-foreground">
        {[
          { id: "stats", label: "Statistiques" },
          { id: "users", label: "Utilisateurs" },
          { id: "docs", label: "Documents" },
        ].map((t: any) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-semibold text-sm rounded-t-2xl border-2 border-foreground border-b-0 -mb-0.5 ${tab === t.id ? "bg-foreground text-background" : "bg-background"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Étudiants", v: stats.students, icon: Users },
              { label: "Professeurs", v: stats.profs, icon: GraduationCap },
              { label: "Demandes", v: stats.docs, icon: FileText },
              { label: "En attente", v: stats.pending, icon: FileText, hl: true },
            ].map((s: any, i) => (
              <div key={i} className={`retro-card p-5 ${s.hl ? "bg-accent" : ""}`}>
                <s.icon size={18} className="mb-2" />
                <div className="font-display text-4xl">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="retro-card p-6">
            <h3 className="font-display text-2xl mb-4">Moyennes par filière</h3>
            {stats.byFiliere.length === 0 ? <div className="text-sm text-muted-foreground">Aucune donnée.</div> : (
              <div className="space-y-2">
                {stats.byFiliere.map((f: any) => (
                  <div key={f.nom} className="flex items-center gap-4">
                    <div className="w-48 text-sm">{f.nom}</div>
                    <div className="flex-1 h-3 retro-soft rounded-full overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${(f.moy / 20) * 100}%` }} />
                    </div>
                    <div className="font-mono font-semibold w-16 text-right">{f.moy.toFixed(2)}/20</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="retro-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foreground text-background">
              <tr><th className="text-left p-3">Nom</th><th className="text-left p-3">Email</th><th className="text-left p-3">Filière</th><th className="text-left p-3">Niveau</th><th className="text-left p-3">Rôle</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-soft-border">
                  <td className="p-3 font-semibold">{u.prenom} {u.nom}</td>
                  <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="p-3">{u.filiere || "—"}</td>
                  <td className="p-3">{u.niveau || "—"}</td>
                  <td className="p-3">
                    {u.user_id && (
                      <select onChange={(e) => setRole(u.user_id, e.target.value as any)} defaultValue=""
                        className="text-xs px-2 py-1 rounded border border-soft-border bg-background">
                        <option value="" disabled>Modifier…</option>
                        <option value="student">Étudiant</option>
                        <option value="professor">Professeur</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "docs" && (
        <div className="space-y-3">
          {docs.map((d) => (
            <div key={d.id} className="retro-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{d.profiles?.prenom} {d.profiles?.nom} <span className="text-muted-foreground">— {d.type}</span></div>
                {d.decision_ia && <div className="text-xs text-muted-foreground mt-1">IA : {d.decision_ia}</div>}
              </div>
              <span className={`retro-tag ${d.statut === "approuve" ? "bg-accent" : d.statut === "refuse" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-secondary"}`}>{d.statut}</span>
              <div className="flex gap-1">
                <button onClick={() => overrideDoc(d.id, "approuve")} className="p-2 rounded-full border-2 border-foreground hover:bg-foreground hover:text-background"><Check size={14} /></button>
                <button onClick={() => overrideDoc(d.id, "refuse")} className="p-2 rounded-full border-2 border-foreground hover:bg-destructive hover:border-destructive hover:text-destructive-foreground"><X size={14} /></button>
              </div>
            </div>
          ))}
          {docs.length === 0 && <div className="retro-card p-8 text-center text-muted-foreground">Aucune demande.</div>}
        </div>
      )}
    </div>
  );
};

export default Admin;
