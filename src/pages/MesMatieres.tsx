import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, BookOpen, GraduationCap, Users, Calendar, Award, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { moyenneMatiere, fmt } from "@/lib/grading";

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function MesMatieres() {
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [expandedSubj, setExpandedSubj] = useState<string | null>(null);

  const loadData = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      // 1. Fetch subjects taught by the professor
      const { data: subjs, error: subjsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("professor_id", profileId);
      
      if (subjsError) throw subjsError;
      const subjectsList = subjs || [];

      if (subjectsList.length === 0) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all student profiles directly from profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
      
      if (profilesError) throw profilesError;
      
      // Filter student profiles in memory: must have a filiere, not be a professor, and not be admin
      const studentProfiles = (allProfiles || []).filter(
        p => p.filiere && p.niveau !== "Professeur" && p.email !== "admin@eduport.tn"
      );

      // 3. Fetch all grades for these subjects
      const subjectIds = subjectsList.map(s => s.id);
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .in("subject_id", subjectIds);
      
      if (gradesError) throw gradesError;

      setSubjects(subjectsList);
      setStudents(studentProfiles);
      setGrades(gradesData || []);
    } catch (err: any) {
      console.error("Error loading professor subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profileId]);

  // Map subjects with enrolled students and performance stats
  const enrichedSubjects = useMemo(() => {
    return subjects.map((subj) => {
      // Find students in the same filiere
      const enrolled = students.filter(s => s.filiere === subj.filiere);
      
      // Map students with their grades and average for this subject
      const enrolledWithGrades = enrolled.map((student) => {
        const studentGradesInSubj = grades.filter(
          g => g.student_id === student.id && g.subject_id === subj.id
        );
        
        // Calculate average using grading utility
        const notesFormatted = studentGradesInSubj.map(g => ({
          note: Number(g.note),
          poids: Number(g.poids)
        }));
        
        const average = notesFormatted.length > 0 ? moyenneMatiere(notesFormatted) : null;
        
        return {
          ...student,
          grades: studentGradesInSubj,
          average
        };
      });

      // Calculate class average
      const studentAverages = enrolledWithGrades
        .map(s => s.average)
        .filter((avg): avg is number => avg !== null);
      
      const classAverage = studentAverages.length > 0 
        ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
        : null;

      return {
        ...subj,
        students: enrolledWithGrades,
        classAverage,
        activeStudentCount: studentAverages.length
      };
    });
  }, [subjects, students, grades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-foreground" size={36} />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVars}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVars}>
        <div className="retro-tag mb-3"><BookOpen size={11} /> Espace enseignant</div>
        <h1 className="font-display text-4xl md:text-5xl">Mes matières</h1>
        <p className="text-muted-foreground mt-2">
          Consultez la liste des cours que vous enseignez, le nombre d'élèves inscrits, et suivez la moyenne générale de la classe.
        </p>
      </motion.div>

      {/* Global Quick Stats */}
      <motion.div variants={itemVars} className="grid md:grid-cols-3 gap-4">
        <div className="retro-card p-6 bg-accent/10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Matières assignées</div>
          <div className="font-display text-5xl">{subjects.length}</div>
          <p className="text-xs text-muted-foreground mt-2 font-semibold">Réparties sur les filières et semestres</p>
        </div>
        <div className="retro-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Total étudiants suivis</div>
          <div className="font-display text-5xl">
            {new Set(enrichedSubjects.flatMap(s => s.students.map(st => st.id))).size}
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-semibold">Élèves uniques inscrits à vos matières</p>
        </div>
        <div className="retro-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Notes saisies</div>
          <div className="font-display text-5xl">{grades.length}</div>
          <p className="text-xs text-muted-foreground mt-2 font-semibold">Évaluations enregistrées ce semestre</p>
        </div>
      </motion.div>

      {enrichedSubjects.length === 0 ? (
        <motion.div variants={itemVars} className="retro-card p-12 text-center bg-card">
          <BookOpen className="mx-auto text-muted-foreground mb-3" size={36} />
          <h3 className="font-display text-xl mb-1">Aucune matière attribuée</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Vous n'avez pas encore été assigné à une matière dans la base de données. 
            Veuillez contacter un administrateur pour lier votre profil aux matières correspondantes.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVars} className="space-y-4">
          <h2 className="font-display text-2xl px-1">Liste de vos cours</h2>
          
          <div className="space-y-4">
            {enrichedSubjects.map((subj) => {
              const isExpanded = expandedSubj === subj.id;
              return (
                <div key={subj.id} className="retro-card overflow-hidden bg-card">
                  {/* Card Header Button */}
                  <button 
                    onClick={() => setExpandedSubj(isExpanded ? null : subj.id)}
                    className="w-full p-6 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="retro-tag text-[10px] bg-foreground text-background font-mono font-bold">
                          {subj.code || "SANS-CODE"}
                        </span>
                        <span className="retro-tag text-[10px] bg-blue-100 border-blue-500 font-bold">
                          Filière {subj.filiere}
                        </span>
                        <span className="retro-tag text-[10px] bg-green-100 border-green-500 font-bold">
                          Semestre {subj.semestre}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl">{subj.nom}</h3>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      {/* Class Stats */}
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Moyenne classe</div>
                        <div className="font-display text-xl font-bold">
                          {subj.classAverage !== null ? `${fmt(subj.classAverage)}/20` : "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Étudiants</div>
                        <div className="font-display text-xl font-bold flex items-center gap-1 justify-end">
                          <Users size={16} className="text-muted-foreground" />
                          <span>{subj.students.length}</span>
                        </div>
                      </div>

                      <div className="p-2 border-2 border-foreground rounded-full bg-background">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </button>

                  {/* Expandable Student List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t-2 border-foreground bg-secondary/25"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between border-b border-soft-border pb-2">
                            <h4 className="font-display text-lg flex items-center gap-2">
                              <GraduationCap size={16} />
                              <span>Élèves inscrits</span>
                            </h4>
                            <span className="text-xs text-muted-foreground font-semibold">
                              Filière {subj.filiere} • Coef {subj.coefficient}
                            </span>
                          </div>

                          {subj.students.length === 0 ? (
                            <div className="text-center py-6 text-sm text-muted-foreground font-medium">
                              Aucun étudiant inscrit dans la filière {subj.filiere} pour le moment.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-muted-foreground text-xs uppercase border-b border-soft-border">
                                    <th className="text-left py-2 font-bold">Nom complet</th>
                                    <th className="text-left py-2 font-bold">Niveau</th>
                                    <th className="text-left py-2 font-bold">Email</th>
                                    <th className="text-right py-2 font-bold">Moyenne de l'élève</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subj.students.map((student: any) => {
                                    const initiales = `${student.prenom?.[0] || ""}${student.nom?.[0] || ""}`.toUpperCase();
                                    return (
                                      <tr key={student.id} className="border-b border-soft-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="py-3 font-semibold flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-accent/30 text-foreground border-2 border-foreground text-[10px] grid place-items-center font-bold font-display">
                                            {initiales}
                                          </div>
                                          <span>{student.prenom} {student.nom}</span>
                                        </td>
                                        <td className="py-3 font-mono text-xs text-muted-foreground">{student.niveau || "L1"}</td>
                                        <td className="py-3 text-xs font-mono text-muted-foreground">{student.email}</td>
                                        <td className="py-3 text-right">
                                          {student.average !== null ? (
                                            <span className={`font-mono font-bold ${
                                              student.average >= 10 ? "text-foreground" : "text-destructive"
                                            }`}>
                                              {fmt(student.average)}/20
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted-foreground italic">Aucune note</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
