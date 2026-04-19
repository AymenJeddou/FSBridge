import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Profil = () => {
  const { user, profileId, refresh } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<any>({});

  useEffect(() => {
    if (!profileId) return;
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle().then(({ data }) => {
      setP(data || {});
      setLoading(false);
    });
  }, [profileId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      prenom: p.prenom, nom: p.nom, cin: p.cin, filiere: p.filiere,
      niveau: p.niveau, telephone: p.telephone, bio: p.bio,
      date_naissance: p.date_naissance || null,
    }).eq("id", profileId!);
    setSaving(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Profil enregistré ✓" }); refresh(); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <motion.div 
      className="space-y-8 max-w-3xl"
      variants={containerVars}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVars}>
        <div className="retro-tag mb-3">Mon profil</div>
        <h1 className="font-display text-4xl md:text-5xl">Mes informations</h1>
      </motion.div>

      <motion.div variants={itemVars} className="retro-card p-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-foreground text-background rounded-full grid place-items-center font-display text-2xl">
          {p.prenom?.[0]}{p.nom?.[0]}
        </div>
        <div>
          <div className="font-display text-2xl">{p.prenom} {p.nom}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <div className="text-xs text-muted-foreground mt-1">{p.filiere} • {p.niveau}</div>
        </div>
      </motion.div>

      <motion.form variants={itemVars} onSubmit={save} className="retro-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Prénom" v={p.prenom} set={(v) => setP({ ...p, prenom: v })} />
          <Field label="Nom" v={p.nom} set={(v) => setP({ ...p, nom: v })} />
          <Field label="CIN" v={p.cin || ""} set={(v) => setP({ ...p, cin: v })} />
          <Field label="Téléphone" v={p.telephone || ""} set={(v) => setP({ ...p, telephone: v })} />
          <Field label="Filière" v={p.filiere || ""} set={(v) => setP({ ...p, filiere: v })} />
          <Field label="Niveau" v={p.niveau || ""} set={(v) => setP({ ...p, niveau: v })} />
          <Field label="Date de naissance" type="date" v={p.date_naissance || ""} set={(v) => setP({ ...p, date_naissance: v })} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Bio</label>
          <textarea value={p.bio || ""} onChange={(e) => setP({ ...p, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/40" />
        </div>
        <button type="submit" disabled={saving} className="bg-foreground text-background px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
      </motion.form>
    </motion.div>
  );
};

const Field = ({ label, v, set, type = "text" }: any) => (
  <div>
    <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">{label}</label>
    <input type={type} value={v} onChange={(e) => set(e.target.value)}
      className="w-full px-4 py-3 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/40" />
  </div>
);

export default Profil;
