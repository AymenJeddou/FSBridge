import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileText, GraduationCap, Calendar, Bot } from "lucide-react";
import { ScribbleArrow, StarSpark, Squiggle, StudentDoodle, ChartDoodle, PaperPlane, StackBooks } from "@/components/Doodles";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Top nav */}
      <header className="border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FSBridge Logo" className="w-16 h-16 object-contain" />
            <span className="font-display text-xl">FSBridge.</span>
          </div>
          <Link to="/auth" className="px-7 py-3 bg-foreground text-background rounded-full font-semibold text-base hover:bg-foreground/90 transition shadow-sm">
            Se connecter →
          </Link>
        </div>
      </header>

      {/* Marquee */}
      <div className="border-b-2 border-foreground bg-accent overflow-hidden">
        <div className="flex gap-12 py-3 animate-marquee whitespace-nowrap font-display text-sm uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0">
              {["Inscriptions ouvertes", "Résultats publiés", "Emplois du temps mis à jour", "Demandes de documents", "Alertes administratives", "Messagerie étudiant", "Accès sécurisé"].map((t, i) => (
                <span key={i} className="flex items-center gap-12">{t} <span className="text-foreground/60">✦</span></span>
              ))} 
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 relative">
            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.92] mb-6">
              Ton portail
              <br />
              étudiant qui<br />
              <span className="relative inline-block">
                pense.
                <Squiggle className="absolute -bottom-3 left-0 w-full h-3 text-accent" />
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Notes, emploi du temps, professeurs, documents officiels — et un assistant IA qui répond à toutes tes questions.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/auth?mode=signup" className="group inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full font-semibold hover:translate-y-[-2px] transition-transform">
                Commencer
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold border-2 border-foreground hover:bg-foreground hover:text-background transition">
                J'ai déjà un compte
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div><span className="font-display text-3xl text-foreground">2</span> agents IA</div>
              <div className="w-px h-8 bg-foreground/20" />
              <div><span className="font-display text-3xl text-foreground">4</span> docs auto</div>
              <div className="w-px h-8 bg-foreground/20" />
              <div><span className="font-display text-3xl text-foreground">/20</span> note tunisienne</div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }}
              className="retro-card p-8 relative grain"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="retro-tag">Bulletin S5</div>
                <StarSpark className="w-6 h-6 text-accent" />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Moyenne générale</div>
              <div className="font-display text-7xl mb-2">15.<span className="text-accent">42</span></div>
              <div className="retro-tag bg-accent border-foreground mb-6">Mention Bien</div>

              <div className="space-y-3">
                {[
                  { n: "Algorithmique", v: 17.5 },
                  { n: "Bases de données", v: 14.8 },
                  { n: "Réseaux", v: 13.2 },
                ].map((s) => (
                  <div key={s.n} className="flex items-center justify-between text-sm">
                    <span>{s.n}</span>
                    <span className="font-mono font-semibold">{s.v}/20</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
              className="absolute -bottom-6 -left-6 retro-card p-4 bg-accent flex items-center gap-3 hidden md:flex"
            >
              <Bot size={20} />
              <div>
                <div className="text-xs uppercase tracking-wider">Assistant IA</div>
                <div className="font-semibold text-sm">Demande-moi tout</div>
              </div>
            </motion.div>

            <StudentDoodle className="absolute -top-10 -right-6 w-28 h-28 text-foreground hidden md:block animate-float-slow" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t-2 border-foreground bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="font-display text-4xl md:text-5xl max-w-xl leading-tight">
              Tout ce dont tu as besoin,<br />
              <span className="italic font-head">au même endroit.</span>
            </h2>
            <ScribbleArrow className="w-32 h-12 text-foreground" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: "Notes & moyennes", desc: "Suivi détaillé par UE, DS, examens. Graphiques d'évolution.", doodle: <ChartDoodle className="w-full h-full" /> },
              { icon: Calendar, title: "Emploi du temps", desc: "Vue semaine claire avec salles, types de séance et professeurs.", doodle: <StackBooks className="w-full h-full" /> },
              { icon: FileText, title: "Documents auto", desc: "Attestations, relevés, conventions — générés en PDF en quelques secondes.", doodle: <PaperPlane className="w-full h-full" /> },
              { icon: Bot, title: "Assistant intelligent", desc: "Pose tes questions sur tes notes, ton planning ou tes profs. Il connaît ton dossier.", featured: true },
              { icon: Sparkles, title: "Agent administratif", desc: "Tes demandes sont auto-validées par une IA qui vérifie ton éligibilité." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`retro-card retro-card-hover p-6 ${f.featured ? "bg-foreground text-background" : ""}`}
              >
                <div className={`w-11 h-11 rounded-full grid place-items-center mb-4 ${f.featured ? "bg-accent text-foreground" : "bg-foreground text-background"}`}>
                  <f.icon size={20} />
                </div>
                <h3 className="font-display text-2xl mb-2">{f.title}</h3>
                <p className={`text-sm ${f.featured ? "text-background/70" : "text-muted-foreground"}`}>{f.desc}</p>
                {f.doodle && (
                  <div className="mt-6 h-32 flex items-center justify-center text-foreground/70">
                    {f.doodle}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-6">
            Prêt à commencer
            <br />
            <span className="bg-accent px-3">ton semestre ?</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Connecte-toi à ton espace ou crée ton compte étudiant en moins d'une minute.
          </p>
          <Link to="/auth" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-semibold hover:scale-[1.02] transition-transform">
            Accéder au portail
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t-2 border-foreground py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FSBridge. — Système /20 • Tunisie
      </footer>
    </div>
  );
};

export default Landing;
