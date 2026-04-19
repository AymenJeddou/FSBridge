import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Professeurs = () => {
  const { profileId } = useAuth();
  const [profs, setProfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      const { data: me } = await supabase.from("profiles").select("filiere").eq("id", profileId).maybeSingle();
      const filiere = me?.filiere;
      const { data } = await supabase.from("profiles")
        .select("*, subjects:subjects!subjects_professor_id_fkey(nom,code)")
        .eq("filiere", filiere || "")
        .eq("niveau", "Professeur");
      setProfs(data || []);
      setLoading(false);
    })();
  }, [profileId]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVars}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVars}>
        <div className="retro-tag mb-3">Professeurs</div>
        <h1 className="font-display text-4xl md:text-5xl">L'équipe pédagogique</h1>
      </motion.div>

      {profs.length === 0 ? (
        <motion.div variants={itemVars} className="retro-card p-12 text-center text-muted-foreground">Aucun professeur listé pour le moment.</motion.div>
      ) : (
        <motion.div variants={itemVars} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profs.map((p) => (
            <motion.div variants={itemVars} key={p.id} className="retro-card retro-card-hover p-6">
              <div className="w-14 h-14 bg-foreground text-background rounded-full grid place-items-center font-display text-lg mb-4">
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div className="font-display text-xl">Pr. {p.prenom} {p.nom}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin size={12} /> Bureau {p.bureau || "—"}
              </div>
              {p.email && (
                <a href={`mailto:${p.email}`} className="text-xs flex items-center gap-1 mt-1 text-foreground/70 hover:text-foreground truncate">
                  <Mail size={12} /> {p.email}
                </a>
              )}
              {p.subjects?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.subjects.map((s: any, i: number) => (
                    <span key={i} className="text-[10px] retro-tag bg-secondary">{s.nom}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Professeurs;
