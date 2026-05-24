import { useState } from "react";
import { ShieldCheck, BarChart2, Users, GraduationCap, BookOpen, Calendar, ClipboardList, FileText, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminStats from "@/components/admin/AdminStats";
import AdminStudents from "@/components/admin/AdminStudents";
import AdminProfessors from "@/components/admin/AdminProfessors";
import AdminSubjects from "@/components/admin/AdminSubjects";
import AdminSchedule from "@/components/admin/AdminSchedule";
import AdminGrades from "@/components/admin/AdminGrades";
import AdminDocuments from "@/components/admin/AdminDocuments";
import AdminAccounts from "@/components/admin/AdminAccounts";

type Tab = "stats" | "students" | "professors" | "subjects" | "schedule" | "grades" | "documents" | "accounts";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "stats",      label: "Statistiques",    icon: BarChart2 },
  { id: "students",   label: "Étudiants",        icon: Users },
  { id: "professors", label: "Professeurs",      icon: GraduationCap },
  { id: "subjects",   label: "Matières",         icon: BookOpen },
  { id: "schedule",   label: "Emploi du temps",  icon: Calendar },
  { id: "grades",     label: "Notes",            icon: ClipboardList },
  { id: "documents",  label: "Documents",        icon: FileText },
  { id: "accounts",   label: "Comptes",          icon: UserPlus },
];

const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
  stats:      <AdminStats />,
  students:   <AdminStudents />,
  professors: <AdminProfessors />,
  subjects:   <AdminSubjects />,
  schedule:   <AdminSchedule />,
  grades:     <AdminGrades />,
  documents:  <AdminDocuments />,
  accounts:   <AdminAccounts />,
};

const Admin = () => {
  const [tab, setTab] = useState<Tab>("stats");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="retro-tag mb-3"><ShieldCheck size={11} /> Espace admin</div>
        <h1 className="font-display text-4xl md:text-5xl">Tableau d'administration</h1>
        <p className="text-muted-foreground mt-2">Gérez les utilisateurs, les matières, les notes et les documents.</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 border-b-2 border-foreground min-w-max pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-2xl border-2 border-b-0 transition-all -mb-0.5 ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background border-foreground/20 hover:border-foreground text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {TAB_COMPONENTS[tab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Admin;
