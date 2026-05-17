import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { moyenneMatiere, moyenneGenerale, fmt } from "@/lib/grading";

const GRADE_TYPES = ["DS", "TP", "Examen", "Rattrapage", "Projet"];

export default function AdminGrades() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [grades, setGrades] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject_id: "", note: "", poids: "1", type: "DS", date_evaluation: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: roles }, { data: profiles }, { data: subs }] = await Promise.all([
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("profiles").select("id,user_id,prenom,nom,filiere,niveau"),
      supabase.from("subjects").select("id,nom,code,filiere,coefficient,semestre"),
    ]);
    const adminIds = (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id);
    const studentIds = (roles || []).filter((r: any) => r.role === "student" && !adminIds.includes(r.user_id)).map((r: any) => r.user_id);
    const studentProfiles = (profiles || []).filter((p: any) => studentIds.includes(p.user_id));
    setStudents(studentProfiles);
    setSubjects(subs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadGrades = async (studentId: string) => {
    setLoadingGrades(true);
    const { data } = await supabase.from("grades").select("*, subjects(id,nom,code,coefficient,semestre)").eq("student_id", studentId).order("date_evaluation");
    setGrades(data || []);
    setLoadingGrades(false);
  };

  const selectStudent = (id: string) => {
    setSelectedStudent(id);
    if (id) loadGrades(id);
    else setGrades([]);
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const studentFiliere = students.find((s) => s.id === selectedStudent)?.filiere;
  const filteredSubjects = subjects.filter((s) => !studentFiliere || s.filiere === studentFiliere);

  const addGrade = async () => {
    if (!selectedStudent || !form.subject_id || !form.note) {
      toast({ title: "Erreur", description: "Étudiant, matière et note sont requis.", variant: "destructive" }); return;
    }
    const note = Number(form.note);
    if (note < 0 || note > 20) { toast({ title: "Erreur", description: "La note doit être entre 0 et 20.", variant: "destructive" }); return; }
    setSaving(true);
    const sub = subjects.find((s) => s.id === form.subject_id);
    await supabase.from("grades").insert({
      student_id: selectedStudent,
      subject_id: form.subject_id,
      note, poids: Number(form.poids),
      type: form.type as any,
      date_evaluation: form.date_evaluation,
    });
    toast({ title: "Note ajoutée" });
    setModal(false);
    setForm({ subject_id: "", note: "", poids: "1", type: "DS", date_evaluation: new Date().toISOString().slice(0, 10) });
    setSaving(false);
    loadGrades(selectedStudent);
  };

  const delGrade = async (id: string) => {
    await supabase.from("grades").delete().eq("id", id);
    toast({ title: "Note supprimée" });
    loadGrades(selectedStudent);
  };

  // compute average for the selected student
  const bySubj: Record<string, any> = {};
  grades.forEach((g: any) => {
    const id = g.subjects?.id || g.subject_id;
    if (!id) return;
    if (!bySubj[id]) bySubj[id] = { coefficient: Number(g.subjects?.coefficient || 1), notes: [] };
    bySubj[id].notes.push({ note: Number(g.note), poids: Number(g.poids), type: g.type, date_evaluation: g.date_evaluation });
  });
  const moyG = moyenneGenerale(Object.values(bySubj).map((s: any) => ({ moyenne: moyenneMatiere(s.notes), coefficient: s.coefficient })));

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Student selector */}
      <div className="retro-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-60">
          <select value={selectedStudent} onChange={(e) => selectStudent(e.target.value)}
            className="w-full pl-4 pr-9 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold appearance-none">
            <option value="">— Sélectionner un étudiant —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.filiere} · {s.niveau})</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
        {selectedStudent && (
          <>
            <div className="text-sm">Moyenne : <span className="font-mono font-bold">{grades.length > 0 ? `${fmt(moyG)}/20` : "—"}</span></div>
            <button onClick={() => setModal(true)} className="bg-foreground text-background px-4 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition ml-auto">
              <Plus size={14} /> Ajouter une note
            </button>
          </>
        )}
      </div>

      {/* Grades table */}
      {selectedStudent && (
        loadingGrades
          ? <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>
          : <div className="retro-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-foreground text-background">
                  <tr>
                    {["Matière", "Type", "Date", "Poids", "Note", ""].map((h) => (
                      <th key={h} className="text-left p-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune note pour cet étudiant.</td></tr>}
                  {grades.map((g) => (
                    <tr key={g.id} className="border-t border-soft-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold">{g.subjects?.nom || "—"}<span className="text-xs text-muted-foreground ml-1 font-mono">{g.subjects?.code}</span></td>
                      <td className="p-3"><span className="retro-tag text-[10px]">{g.type}</span></td>
                      <td className="p-3 text-xs text-muted-foreground">{g.date_evaluation}</td>
                      <td className="p-3 font-mono text-xs">{g.poids}</td>
                      <td className="p-3 font-mono font-bold text-lg">{Number(g.note).toFixed(2)}<span className="text-xs text-muted-foreground font-normal">/20</span></td>
                      <td className="p-3">
                        <button onClick={() => delGrade(g.id)} className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {!selectedStudent && (
        <div className="retro-card p-12 text-center text-muted-foreground">
          Sélectionnez un étudiant pour voir et gérer ses notes.
        </div>
      )}

      {/* Add grade modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setModal(false)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Nouvelle note</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Matière *</label>
              <select value={form.subject_id} onChange={(e) => set("subject_id", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                <option value="">— Choisir —</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {GRADE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Note * /20</label>
                <input type="number" min={0} max={20} step={0.25} value={form.note} onChange={(e) => set("note", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Poids</label>
                <input type="number" min={1} max={3} value={form.poids} onChange={(e) => set("poids", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Date d'évaluation</label>
              <input type="date" value={form.date_evaluation} onChange={(e) => set("date_evaluation", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
            </div>
            <button onClick={addGrade} disabled={saving} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={15} className="animate-spin" />} Ajouter la note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
