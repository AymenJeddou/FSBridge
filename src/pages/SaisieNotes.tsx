import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, GraduationCap, Search, Plus, Trash2, Pencil, X, ChevronRight, Check, ArrowLeft, Calendar, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { moyenneMatiere, fmt } from "@/lib/grading";

const GRADE_TYPES = ["DS", "TP", "Examen", "Rattrapage", "Projet"];

export default function SaisieNotes() {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // DB loaded states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Active selections
  const [selectedSubj, setSelectedSubj] = useState<any | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchStudent, setSearchStudent] = useState("");

  // Modal / Form state
  const [formOpen, setFormOpen] = useState(false);
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  const [form, setForm] = useState({
    note: "",
    poids: "1",
    type: "DS",
    date_evaluation: new Date().toISOString().slice(0, 10),
    commentaire: ""
  });

  const loadInitialData = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      // 1. Fetch professor's subjects
      const { data: subjs, error: subjsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("professor_id", profileId);
      
      if (subjsError) throw subjsError;
      setSubjects(subjs || []);

      if ((subjs || []).length === 0) {
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
      setStudents(studentProfiles);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [profileId]);

  const loadGradesForStudent = async (studentId: string, subjectId: string) => {
    setLoadingGrades(true);
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId)
        .eq("subject_id", subjectId)
        .order("date_evaluation");
      
      if (error) throw error;
      setGrades(data || []);
    } catch (err: any) {
      toast({ title: "Erreur de chargement des notes", description: err.message, variant: "destructive" });
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    if (student && selectedSubj) {
      loadGradesForStudent(student.id, selectedSubj.id);
    } else {
      setGrades([]);
    }
  };

  const handleOpenAddForm = () => {
    setForm({
      note: "",
      poids: "1",
      type: "DS",
      date_evaluation: new Date().toISOString().slice(0, 10),
      commentaire: ""
    });
    setIsEditingGrade(false);
    setActiveGradeId(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (g: any) => {
    setForm({
      note: String(g.note),
      poids: String(g.poids || 1),
      type: g.type || "DS",
      date_evaluation: g.date_evaluation || new Date().toISOString().slice(0, 10),
      commentaire: g.commentaire || ""
    });
    setIsEditingGrade(true);
    setActiveGradeId(g.id);
    setFormOpen(true);
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;
    try {
      const { error } = await supabase
        .from("grades")
        .delete()
        .eq("id", gradeId);
      
      if (error) throw error;
      toast({ title: "Note supprimée", description: "L'évaluation a été retirée." });
      
      if (selectedStudent && selectedSubj) {
        loadGradesForStudent(selectedStudent.id, selectedSubj.id);
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubj) return;
    
    const noteVal = Number(form.note);
    if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
      toast({ title: "Note invalide", description: "La note doit être comprise entre 0 et 20.", variant: "destructive" });
      return;
    }

    setSavingGrade(true);
    try {
      if (isEditingGrade && activeGradeId) {
        // Update existing grade
        const { error } = await supabase
          .from("grades")
          .update({
            note: noteVal,
            poids: Number(form.poids),
            type: form.type as any,
            date_evaluation: form.date_evaluation,
            commentaire: form.commentaire || null
          })
          .eq("id", activeGradeId);
        
        if (error) throw error;
        toast({ title: "Note mise à jour", description: "L'évaluation a été modifiée avec succès." });
      } else {
        // Insert new grade
        const { error } = await supabase
          .from("grades")
          .insert({
            student_id: selectedStudent.id,
            subject_id: selectedSubj.id,
            note: noteVal,
            poids: Number(form.poids),
            type: form.type as any,
            date_evaluation: form.date_evaluation,
            commentaire: form.commentaire || null
          });
        
        if (error) throw error;
        toast({ title: "Note enregistrée", description: "L'évaluation a été ajoutée au bulletin." });
      }

      setFormOpen(false);
      loadGradesForStudent(selectedStudent.id, selectedSubj.id);
    } catch (err: any) {
      toast({ title: "Erreur d'enregistrement", description: err.message, variant: "destructive" });
    } finally {
      setSavingGrade(false);
    }
  };

  // Filter students by current subject's filiere and search query
  const filteredStudents = useMemo(() => {
    if (!selectedSubj) return [];
    return students.filter(s => {
      const matchFiliere = s.filiere === selectedSubj.filiere;
      const searchStr = `${s.prenom || ""} ${s.nom || ""} ${s.email || ""}`.toLowerCase();
      const matchSearch = !searchStudent || searchStr.includes(searchStudent.toLowerCase());
      return matchFiliere && matchSearch;
    });
  }, [students, selectedSubj, searchStudent]);

  // Compute average of the grades displayed in table
  const studentAverage = useMemo(() => {
    const formatted = grades.map(g => ({
      note: Number(g.note),
      poids: Number(g.poids)
    }));
    return formatted.length > 0 ? moyenneMatiere(formatted) : null;
  }, [grades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-foreground" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="retro-tag mb-3"><GraduationCap size={11} /> Espace enseignant</div>
        <h1 className="font-display text-4xl md:text-5xl">Saisie des notes</h1>
        <p className="text-muted-foreground mt-2">
          Attribuez des notes, modifiez les évaluations existantes et suivez les moyennes individuelles par matière.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="retro-card p-12 text-center bg-card">
          <GraduationCap className="mx-auto text-muted-foreground mb-3" size={36} />
          <h3 className="font-display text-xl mb-1">Aucune matière attribuée</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Vous n'avez pas encore de matière assignée. Vous devez être lié à une matière en tant que professeur pour saisir des notes.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* STEP 1: Select Subject (Left column) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="retro-card p-4 bg-background">
              <h3 className="font-display text-lg mb-3">1. Choisir le cours</h3>
              <div className="space-y-2">
                {subjects.map((s) => {
                  const active = selectedSubj?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSubj(s);
                        setSelectedStudent(null);
                        setGrades([]);
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                        active 
                          ? "bg-foreground text-background border-foreground shadow-sm font-bold" 
                          : "bg-card border-soft-border hover:border-foreground"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-display text-md truncate">{s.nom}</div>
                        <div className={`text-xs font-mono mt-0.5 ${active ? "text-background/80" : "text-muted-foreground"}`}>
                          {s.code} • Filière {s.filiere}
                        </div>
                      </div>
                      {active && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Student (Left column under Subject) */}
            {selectedSubj && (
              <div className="retro-card p-4 bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">2. Étudiants ({filteredStudents.length})</h3>
                  <span className="retro-tag text-[9px] bg-secondary font-bold">Filière {selectedSubj.filiere}</span>
                </div>
                
                {/* Search Student Box */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Chercher un élève..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-foreground bg-background text-xs font-sans focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground italic">
                      Aucun étudiant inscrit
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const active = selectedStudent?.id === st.id;
                      const initiales = `${st.prenom?.[0] || ""}${st.nom?.[0] || ""}`.toUpperCase();
                      return (
                        <button
                          key={st.id}
                          onClick={() => handleSelectStudent(st)}
                          className={`w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            active
                              ? "bg-accent/40 border-foreground shadow-sm font-semibold"
                              : "bg-card border-transparent hover:border-soft-border"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-foreground text-background text-[9px] grid place-items-center font-bold font-display shrink-0">
                              {initiales}
                            </div>
                            <span className="text-xs truncate">{st.prenom} {st.nom}</span>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Grading & List view (Right 2 columns) */}
          <div className="lg:col-span-2">
            {selectedStudent && selectedSubj ? (
              <div className="space-y-4">
                {/* Student header summary */}
                <div className="retro-card p-5 bg-card flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent text-foreground border-2 border-foreground grid place-items-center font-bold font-display">
                      {selectedStudent.prenom?.[0].toUpperCase()}{selectedStudent.nom?.[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display text-xl">{selectedStudent.prenom} {selectedStudent.nom}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedStudent.niveau} • {selectedStudent.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Moyenne matière</div>
                      <div className="font-display text-2xl font-bold">
                        {studentAverage !== null ? `${fmt(studentAverage)}/20` : "—"}
                      </div>
                    </div>
                    <button 
                      onClick={handleOpenAddForm}
                      className="retro-btn flex items-center gap-1.5 bg-foreground text-background font-semibold px-4 py-2 rounded-xl text-xs border-2 border-foreground shadow-sm hover:opacity-90 transition"
                    >
                      <Plus size={14} />
                      <span>Ajouter une note</span>
                    </button>
                  </div>
                </div>

                {/* Grades list table */}
                {loadingGrades ? (
                  <div className="retro-card p-12 flex items-center justify-center">
                    <Loader2 className="animate-spin text-foreground" size={24} />
                  </div>
                ) : (
                  <div className="retro-card overflow-hidden bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-foreground text-background">
                        <tr>
                          {["Type", "Poids", "Date d'évaluation", "Note", "Commentaire", ""].map((h) => (
                            <th key={h} className="text-left p-3 font-semibold font-display text-xs tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grades.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">
                              Aucune note enregistrée pour cet étudiant dans cette matière.
                            </td>
                          </tr>
                        ) : (
                          grades.map((g) => (
                            <tr key={g.id} className="border-t border-soft-border hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <span className={`retro-tag text-[9px] font-bold ${
                                  g.type === "Examen" 
                                    ? "bg-red-100 border-red-500" 
                                    : g.type === "DS" 
                                      ? "bg-blue-100 border-blue-500" 
                                      : "bg-green-100 border-green-500"
                                }`}>
                                  {g.type}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-xs font-semibold">{g.poids}</td>
                              <td className="p-3 text-xs text-muted-foreground font-mono">{g.date_evaluation}</td>
                              <td className="p-3 font-mono font-bold text-md">
                                {Number(g.note).toFixed(2)}
                                <span className="text-xs text-muted-foreground font-normal">/20</span>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate" title={g.commentaire}>
                                {g.commentaire || "—"}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1 justify-end">
                                  <button 
                                    onClick={() => handleOpenEditForm(g)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteGrade(g.id)}
                                    className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground text-muted-foreground hover:text-destructive-foreground transition"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="retro-card p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center bg-card">
                <GraduationCap size={48} className="text-muted-foreground/60 mb-3" />
                <h3 className="font-display text-xl mb-1">Aucune sélection</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {selectedSubj 
                    ? "Veuillez sélectionner un étudiant dans la liste de gauche pour voir ou modifier ses notes." 
                    : "Veuillez sélectionner un cours, puis un étudiant dans la liste pour commencer à saisir des notes."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insert / Edit Grade Dialog (Modal) */}
      {formOpen && selectedStudent && selectedSubj && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setFormOpen(false)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-soft-border pb-2">
              <div>
                <h2 className="font-display text-2xl">
                  {isEditingGrade ? "Modifier la note" : "Nouvelle note"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Élève : {selectedStudent.prenom} {selectedStudent.nom} • Matière : {selectedSubj.code}
                </p>
              </div>
              <button onClick={() => setFormOpen(false)} className="p-2 rounded-full hover:bg-muted border-2 border-transparent hover:border-foreground transition"><X size={16} /></button>
            </div>

            <form onSubmit={submitGrade} className="space-y-4">
              {/* Type, Note, Poids grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Type *</label>
                  <select 
                    value={form.type} 
                    onChange={(e) => setForm({ ...form, type: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-xs font-semibold cursor-pointer"
                  >
                    {GRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Note * (/20)</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={20} 
                    step={0.25} 
                    required 
                    value={form.note} 
                    onChange={(e) => setForm({ ...form, note: e.target.value })} 
                    placeholder="ex: 14.5"
                    className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-xs font-mono font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Poids (Coef)</label>
                  <input 
                    type="number" 
                    min={0.1} 
                    max={5} 
                    step={0.1} 
                    required 
                    value={form.poids} 
                    onChange={(e) => setForm({ ...form, poids: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-xs font-mono font-semibold" 
                  />
                </div>
              </div>

              {/* Evaluation Date */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Date d'évaluation</span>
                </label>
                <input 
                  type="date" 
                  required 
                  value={form.date_evaluation} 
                  onChange={(e) => setForm({ ...form, date_evaluation: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-xs font-mono font-semibold" 
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                  <FileText size={12} />
                  <span>Commentaire (optionnel)</span>
                </label>
                <input 
                  value={form.commentaire} 
                  onChange={(e) => setForm({ ...form, commentaire: e.target.value })} 
                  placeholder="ex: Excellent projet de groupe, Rattrapage"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-soft-border bg-background focus:outline-none text-xs font-sans" 
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-soft-border">
                <button 
                  type="button" 
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold border-2 border-foreground hover:bg-muted transition text-center text-xs"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={savingGrade}
                  className="flex-1 bg-foreground text-background py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 border-2 border-foreground hover:opacity-90 transition text-xs shadow-sm"
                >
                  {savingGrade ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{isEditingGrade ? "Enregistrer" : "Ajouter la note"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
