import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, FileText, BookOpen, Loader2 } from "lucide-react";
import { moyenneMatiere, moyenneGenerale } from "@/lib/grading";

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, profs: 0, subjects: 0, pending: 0, byFiliere: [] as any[] });

  useEffect(() => {
    (async () => {
      const [{ data: roles }, { data: subjects }, { data: docs }, { data: grades }] = await Promise.all([
        supabase.from("user_roles").select("role,user_id"),
        supabase.from("subjects").select("id"),
        supabase.from("document_requests").select("statut"),
        supabase.from("grades").select("note,poids,subjects(coefficient,filiere),profiles!inner(filiere)").eq("student_id", ""),
      ]);
      // For mock, calculate per-filiere from all grades
      const { data: allGrades } = await supabase.from("grades").select("note,poids,subjects(coefficient,filiere)");
      const byF: Record<string, { sumW: number; sumNW: number }> = {};
      (allGrades || []).forEach((g: any) => {
        const f = g.subjects?.filiere || "—";
        if (!byF[f]) byF[f] = { sumW: 0, sumNW: 0 };
        byF[f].sumW += Number(g.poids);
        byF[f].sumNW += Number(g.note) * Number(g.poids);
      });
      const byFiliere = Object.entries(byF).map(([nom, v]) => ({ nom, moy: v.sumW ? v.sumNW / v.sumW : 0 }));
      const adminIds = (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id);
      
      setStats({
        students: (roles || []).filter((r: any) => r.role === "student" && !adminIds.includes(r.user_id)).length,
        profs: (roles || []).filter((r: any) => r.role === "professor" && !adminIds.includes(r.user_id)).length,
        subjects: (subjects || []).length,
        pending: (docs || []).filter((d: any) => d.statut === "en_attente").length,
        byFiliere,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Étudiants", v: stats.students, icon: Users },
          { label: "Professeurs", v: stats.profs, icon: GraduationCap },
          { label: "Matières", v: stats.subjects, icon: BookOpen },
          { label: "Docs en attente", v: stats.pending, icon: FileText, hl: true },
        ].map((s, i) => (
          <div key={i} className={`retro-card p-6 ${s.hl && s.v > 0 ? "bg-accent" : ""}`}>
            <s.icon size={20} className="mb-3" />
            <div className="font-display text-5xl">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="retro-card p-6">
        <h3 className="font-display text-2xl mb-5">Moyennes par filière</h3>
        {stats.byFiliere.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune donnée de notes disponible.</div>
        ) : (
          <div className="space-y-4">
            {stats.byFiliere.map((f) => (
              <div key={f.nom} className="flex items-center gap-4">
                <div className="w-20 text-sm font-semibold">{f.nom}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-soft-border">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${(f.moy / 20) * 100}%` }} />
                </div>
                <div className="font-mono font-bold w-16 text-right text-sm">{f.moy.toFixed(2)}/20</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
