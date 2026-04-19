import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { moyenneMatiere, mention, fmt, moyenneGenerale } from "@/lib/grading";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const Notes = () => {
  const { profileId } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSubj, setOpenSubj] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      const { data } = await supabase.from("grades")
        .select("*, subjects(id,nom,code,coefficient,semestre)")
        .eq("student_id", profileId).order("date_evaluation");
      setGrades(data || []);
      setLoading(false);
    })();
  }, [profileId]);

  const bySubj = useMemo(() => {
    const m: Record<string, any> = {};
    grades.forEach((g) => {
      const id = g.subjects?.id; if (!id) return;
      if (!m[id]) m[id] = { ...g.subjects, notes: [] };
      m[id].notes.push(g);
    });
    return Object.values(m).map((s: any) => ({ ...s, moyenne: moyenneMatiere(s.notes) }));
  }, [grades]);

  const bySemestre = useMemo(() => {
    const m: Record<string, any[]> = {};
    bySubj.forEach((s: any) => {
      m[s.semestre] = m[s.semestre] || [];
      m[s.semestre].push(s);
    });
    return m;
  }, [bySubj]);

  const moyG = moyenneGenerale(bySubj.map((s: any) => ({ moyenne: s.moyenne, coefficient: Number(s.coefficient) })));

  // Evolution per evaluation across all subjects
  const evolution = useMemo(() => {
    return [...grades]
      .sort((a, b) => a.date_evaluation.localeCompare(b.date_evaluation))
      .map((g, i) => ({
        idx: i + 1,
        date: format(parseISO(g.date_evaluation), "dd MMM", { locale: fr }),
        note: Number(g.note),
        matiere: g.subjects?.nom,
      }));
  }, [grades]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="retro-tag mb-3">Mes notes</div>
        <h1 className="font-display text-4xl md:text-5xl">Bulletin & évolution</h1>
        <p className="text-muted-foreground mt-2">Détail par matière, par semestre, et courbes d'évolution.</p>
      </div>

      {/* Top stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="retro-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Moyenne générale</div>
          <div className="font-display text-5xl">{fmt(moyG)}<span className="text-xl text-muted-foreground">/20</span></div>
          <div className="mt-2 retro-tag bg-accent">{mention(moyG).label}</div>
        </div>
        <div className="retro-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Matières suivies</div>
          <div className="font-display text-5xl">{bySubj.length}</div>
          <div className="text-xs text-muted-foreground mt-2">{Object.keys(bySemestre).length} semestre{Object.keys(bySemestre).length > 1 ? "s" : ""}</div>
        </div>
        <div className="retro-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Évaluations</div>
          <div className="font-display text-5xl">{grades.length}</div>
          <div className="text-xs text-muted-foreground mt-2">Notes saisies</div>
        </div>
      </div>

      {/* Global evolution */}
      {evolution.length > 1 && (
        <div className="retro-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} />
            <h2 className="font-display text-2xl">Évolution globale</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--soft-border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "2px solid hsl(var(--foreground))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="note" stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-subject bar chart */}
      {bySubj.length > 0 && (
        <div className="retro-card p-6">
          <h2 className="font-display text-2xl mb-4">Moyennes par matière</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubj.map((s: any) => ({ nom: s.nom.split(" ").slice(0, 2).join(" "), moyenne: Number(s.moyenne.toFixed(2)) }))} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--soft-border))" />
                <XAxis dataKey="nom" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "2px solid hsl(var(--foreground))", borderRadius: 12 }} />
                <Bar dataKey="moyenne" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* By semester */}
      {Object.entries(bySemestre).sort().map(([sem, subs]: any) => (
        <div key={sem} className="space-y-3">
          <h2 className="font-display text-2xl flex items-center gap-3">
            Semestre {sem.replace("S", "")}
            <span className="text-sm text-muted-foreground font-sans font-normal">
              moyenne {fmt(moyenneGenerale(subs.map((s: any) => ({ moyenne: s.moyenne, coefficient: Number(s.coefficient) }))))}/20
            </span>
          </h2>
          <div className="grid gap-3">
            {subs.map((s: any) => (
              <div key={s.id} className="retro-card overflow-hidden">
                <button onClick={() => setOpenSubj(openSubj === s.id ? null : s.id)} className="w-full p-5 flex items-center justify-between gap-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{s.nom}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.code} • coef {s.coefficient}</div>
                  </div>
                  <div className="font-display text-2xl shrink-0">{fmt(s.moyenne)}<span className="text-sm text-muted-foreground">/20</span></div>
                </button>
                {openSubj === s.id && (
                  <div className="border-t-2 border-foreground p-5 bg-secondary/40 space-y-2 animate-fade-in">
                    {s.notes.map((n: any) => (
                      <div key={n.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="retro-tag mr-2 text-[10px]">{n.type}</span>
                          {format(parseISO(n.date_evaluation), "d MMM yyyy", { locale: fr })}
                          <span className="text-muted-foreground ml-2">poids {n.poids}</span>
                        </div>
                        <div className="font-mono font-semibold">{Number(n.note).toFixed(2)}/20</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {bySubj.length === 0 && (
        <div className="retro-card p-12 text-center">
          <div className="text-muted-foreground mb-4">Aucune note pour le moment.</div>
          <div className="text-sm">Charge les données démo depuis le tableau de bord.</div>
        </div>
      )}
    </div>
  );
};

export default Notes;
