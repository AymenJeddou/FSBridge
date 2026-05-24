import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { LayoutDashboard, GraduationCap, User, Users, Calendar, FileText, Sparkles, LogOut, ShieldCheck, Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const studentLinks = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/notes", label: "Mes notes", icon: GraduationCap },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: Calendar },
  { to: "/professeurs", label: "Professeurs", icon: Users },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/assistant", label: "Assistant IA", icon: Sparkles },
  { to: "/profil", label: "Mon profil", icon: User },
];

const adminLinks = [
  { to: "/admin", label: "Administration", icon: ShieldCheck },
  { to: "/profil", label: "Mon profil", icon: User },
];

const professorLinks = [
  { to: "/emploi-du-temps", label: "Mon planning", icon: Calendar },
  { to: "/mes-matieres", label: "Mes matières", icon: BookOpen },
  { to: "/saisie-notes", label: "Saisie des notes", icon: GraduationCap },
  { to: "/profil", label: "Mon profil", icon: User },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { role, signOut, user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  let links = studentLinks;
  if (role === "admin") links = adminLinks;
  else if (role === "professor") links = professorLinks;


  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — mobile */}
      <header className="lg:hidden sticky top-0 z-40 border-b-2 border-foreground bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-foreground p-1 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="FSBridge" className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-xl">FSBridge</span>
          </button>
          <button onClick={() => setOpen(!open)} className="p-2 border-2 border-foreground rounded-full">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-30 h-screen w-72 bg-background border-r-2 border-foreground p-6 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex items-center gap-2 mb-10">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-foreground p-1 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="FSBridge" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">FSBridge</div>
              <div className="text-xs text-muted-foreground">Portail étudiant</div>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/dashboard" || l.to === "/admin"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative",
                    isActive
                      ? "bg-foreground text-background"
                      : "hover:bg-muted text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <l.icon size={18} className="shrink-0" />
                    <span>{l.label}</span>
                    {isActive && (
                      <motion.div layoutId="dot" className="ml-auto w-2 h-2 bg-accent rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="retro-soft p-3 mb-3">
              <div className="text-xs text-muted-foreground">Connecté</div>
              <div className="text-sm font-semibold truncate">{user?.email}</div>
              <div className="text-xs mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                {role === "admin" ? "Administrateur" : role === "professor" ? "Professeur" : "Étudiant"}
              </div>
            </div>
            <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2 border-2 border-foreground rounded-2xl text-sm font-semibold hover:bg-foreground hover:text-background transition">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        {open && <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setOpen(false)} />}

        {/* Main */}
        <main className="flex-1 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .35, ease: "easeOut" }}
            className="p-6 lg:p-10 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
