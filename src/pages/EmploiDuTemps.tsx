import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const EmploiDuTemps = () => {
  const { profileId, role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      if (role === "professor") {
        const { data, error } = await supabase.from("schedule")
          .select("*, subjects!inner(nom, code, professor_id)")
          .eq("subjects.professor_id", profileId)
          .order("jour").order("heure_debut");
        if (error) console.error("Error fetching professor schedule:", error);
        setItems(data || []);
      } else {
        const { data: me } = await supabase.from("profiles").select("filiere").eq("id", profileId).maybeSingle();
        const { data } = await supabase.from("schedule")
          .select("*, subjects(nom, code)")
          .eq("filiere", me?.filiere || "")
          .order("jour").order("heure_debut");
        setItems(data || []);
      }
      setLoading(false);
    })();
  }, [profileId, role]);

  const byDay = useMemo(() => {
    const m: Record<number, any[]> = {};
    items.forEach((i) => { (m[i.jour] = m[i.jour] || []).push(i); });
    return m;
  }, [items]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVars}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVars}>
        <div className="retro-tag mb-3">Emploi du temps</div>
        <h1 className="font-display text-4xl md:text-5xl">Ma semaine</h1>
      </motion.div>

      <motion.div variants={itemVars} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOURS.map((j, idx) => {
          const day = idx + 1;
          const courses = byDay[day] || [];
          return (
            <motion.div variants={itemVars} key={j} className="retro-card p-5">
              <div className="font-display text-xl mb-3 flex items-center justify-between">
                {j}
                <span className="text-xs text-muted-foreground font-sans font-normal">{courses.length} séance{courses.length > 1 ? "s" : ""}</span>
              </div>
              {courses.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">Libre ✦</div>
              ) : (
                <div className="space-y-2">
                  {courses.map((c) => (
                    <div key={c.id} className="retro-soft p-3">
                      <div className="font-mono text-xs font-semibold mb-1">{c.heure_debut?.slice(0, 5)} – {c.heure_fin?.slice(0, 5)}</div>
                      <div className="font-semibold text-sm">{c.subjects?.nom}</div>
                      <div className="text-xs text-muted-foreground">{c.type_seance} • Salle {c.salle}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default EmploiDuTemps;
