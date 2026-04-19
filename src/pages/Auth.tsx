import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Squiggle, StarSpark } from "@/components/Doodles";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { prenom, nom },
          },
        });
        if (error) throw error;
        toast({ title: "Compte créé !", description: "Tu peux te connecter maintenant." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="hidden lg:flex bg-foreground text-background flex-col justify-between p-12 relative overflow-hidden">
        <Link to="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="relative z-10">
          <div className="font-display text-7xl leading-[0.9] mb-6">
            Bienvenue<br/>
            dans <span className="text-accent">ton</span><br/>
            espace.
          </div>
          <p className="text-background/60 max-w-sm">
            Tes notes, ton planning, tes documents — et un assistant qui répond à tout. En français, /20.
          </p>
        </div>
        <div className="text-xs text-background/40 font-mono">EduPort. — v1.0</div>
        <StarSpark className="absolute top-20 right-12 w-32 h-32 text-accent animate-float-slow" />
        <Squiggle className="absolute bottom-32 left-12 w-64 h-6 text-accent" />
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center p-6 md:p-12">
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto">
          <div className="retro-tag mb-6">{mode === "login" ? "Connexion" : "Inscription"}</div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">
            {mode === "login" ? "Re-bonjour 👋" : "Crée ton compte"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? "Connecte-toi pour accéder à ton portail." : "Quelques infos et c'est parti."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" value={prenom} onChange={setPrenom} required />
                <Field label="Nom" value={nom} onChange={setNom} required />
              </div>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Mot de passe" type="password" value={password} onChange={setPassword} required minLength={6} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:translate-y-[-2px] transition disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-foreground underline underline-offset-4">
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", ...rest }: any) => (
  <div>
    <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/40 transition"
      {...rest}
    />
  </div>
);

export default Auth;
