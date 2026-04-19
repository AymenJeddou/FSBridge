import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mention, moyenneMatiere, moyenneGenerale } from "@/lib/grading";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Squiggle, StarSpark, ScribbleArrow } from "@/components/Doodles";
import { Link } from "react-router-dom";
import { Calendar, GraduationCap, Sparkles, FileText, ArrowUpRight, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, profileId } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [moy, setMoy] = useState(0);
  const [todayCourses, setTodayCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const load = async () => {
    if (!profileId || !user) return;
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
    setProfile(p);

    const { data: grades } = await supabase.from("grades")
      .select("note,poids,type,date_evaluation, subjects(id,nom,coefficient)")
      .eq("student_id", profileId);

    const bySubj: Record<string, any> = {};
    (grades || []).forEach((g: any) => {
      const id = g.subjects?.id;
      if (!id) return;
      if (!bySubj[id]) bySubj[id] = { coefficient: g.subjects?.coefficient || 1, notes: [] };
      bySubj[id].notes.push({ note: Number(g.note), poids: Number(g.poids), type: g.type, date_evaluation: g.date_evaluation });
    });
    const arr = Object.values(bySubj).map((s: any) => ({ moyenne: moyenneMatiere(s.notes), coefficient: Number(s.coefficient) }));
    setMoy(moyenneGenerale(arr));

    if (p?.filiere) {
      const today = ((new Date().getDay() + 6) % 7) + 1;
      const { data: sched } = await supabase.from("schedule")
        .select("*, subjects(nom)").eq("filiere", p.filiere).eq("jour", today).order("heure_debut");
      setTodayCourses(sched || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [profileId]);

  const seed = async () => {
    setSeeding(true);
    try {
      await supabase.functions.invoke("seed-demo");
      setSeeded(true);
      await load();
    } finally { setSeeding(false); }
  };

  const m = mention(moy);
  const heure = new Date().getHours();
  const greeting = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-2">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="font-display text-4xl md:text-5xl">
            {greeting}, <span className="relative inline-block">{profile?.prenom || "étudiant"}.<Squiggle className="absolute -bottom-2 left-0 w-full h-2 text-accent" /></span>
          </h1>
        </div>
        {!profile?.filiere && (
          <button onClick={seed} disabled={seeding || seeded} className="bg-foreground text-background px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2">
            {seeding && <Loader2 size={14} className="animate-spin" />}
            {seeded ? "Données chargées ✓" : "Charger des données démo"}
          </button>
        )}
      </div>

      {/* Hero stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="retro-card p-8 lg:col-span-2 relative grain">
          <div className="flex items-start justify-between mb-4">
            <div className="retro-tag">Moyenne générale</div>
            <StarSpark className="w-6 h-6 text-accent" />
          </div>
          <div className="font-display text-7xl md:text-8xl leading-none mb-3">
            <AnimatedNumber value={moy} />
            <span className="text-3xl text-muted-foreground">/20</span>
          </div>
          <div className={`retro-tag border-foreground ${moy >= 14 ? "bg-accent" : moy >= 10 ? "bg-secondary" : "bg-destructive text-destructive-foreground border-destructive"}`}>
            Mention {m.label}
          </div>
        </div>

        <Link to="/assistant" className="retro-card retro-card-hover p-6 bg-foreground text-background flex flex-col justify-between">
          <div>
            <Sparkles className="mb-3" />
            <h3 className="font-display text-2xl mb-2">Assistant IA</h3>
            <p className="text-sm text-background/70">Pose-moi tes questions sur tes notes ou ton planning.</p>
          </div>
          <div className="flex items-center gap-1 mt-6 text-sm font-semibold">
            Discuter <ArrowUpRight size={16} />
          </div>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: "/notes", icon: GraduationCap, label: "Mes notes", sub: "Voir le détail" },
          { to: "/emploi-du-temps", icon: Calendar, label: "Emploi du temps", sub: "Cette semaine" },
          { to: "/documents", icon: FileText, label: "Documents", sub: "Demander un PDF" },
          { to: "/professeurs", icon: ScribbleArrow as any, label: "Professeurs", sub: "Annuaire" },
        ].map((l: any) => (
          <Link key={l.to} to={l.to} className="retro-card retro-card-hover p-5">
            <l.icon size={20} className="mb-3" />
            <div className="font-display text-lg leading-tight">{l.label}</div>
            <div className="text-xs text-muted-foreground">{l.sub}</div>
          </Link>
        ))}
      </div>

      {/* Today */}
      <div className="retro-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Aujourd'hui</h2>
          <Link to="/emploi-du-temps" className="text-sm font-semibold underline underline-offset-4">Voir la semaine</Link>
        </div>
        {todayCourses.length === 0 ? (
          <div className="text-muted-foreground text-sm py-6 text-center">Pas de cours aujourd'hui ✦</div>
        ) : (
          <div className="space-y-2">
            {todayCourses.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 retro-soft">
                <div className="font-mono text-sm font-semibold w-24">{c.heure_debut?.slice(0, 5)}–{c.heure_fin?.slice(0, 5)}</div>
                <div className="flex-1">
                  <div className="font-semibold">{c.subjects?.nom}</div>
                  <div className="text-xs text-muted-foreground">{c.type_seance} • Salle {c.salle}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
