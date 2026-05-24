import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronDown, Trash2, Pencil, X } from "lucide-react";
import { moyenneMatiere, moyenneGenerale, fmt } from "@/lib/grading";
import { useToast } from "@/hooks/use-toast";

export default function AdminStudents() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("all");
  const [filieres, setFilieres] = useState<string[]>([]);
  
  const [modal, setModal] = useState<"edit" | null>(null);
  const [form, setForm] = useState({ user_id: "", prenom: "", nom: "", email: "", filiere: "", niveau: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const adminIds = (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id);
    const studentIds = (roles || []).filter((r: any) => r.role === "student" && !adminIds.includes(r.user_id)).map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: allGrades } = await supabase.from("grades").select("student_id,note,poids,subjects(coefficient)");

    const studentProfiles = (profiles || []).filter((p: any) => studentIds.includes(p.user_id));
    const fl = [...new Set(studentProfiles.map((p: any) => p.filiere).filter(Boolean))];
    setFilieres(fl as string[]);

    const gradesByStudent: Record<string, any[]> = {};
    (allGrades || []).forEach((g: any) => {
      if (!gradesByStudent[g.student_id]) gradesByStudent[g.student_id] = [];
      gradesByStudent[g.student_id].push(g);
    });

    const enriched = studentProfiles.map((p: any) => {
      const grades = gradesByStudent[p.id] || [];
      const bySubj: Record<string, any> = {};
      grades.forEach((g: any) => {
        const coef = g.subjects?.coefficient || 1;
        const key = `${g.subjects?.id || Math.random()}`;
        if (!bySubj[key]) bySubj[key] = { coefficient: coef, notes: [] };
        bySubj[key].notes.push({ note: Number(g.note), poids: Number(g.poids), type: g.type, date_evaluation: g.date_evaluation });
      });
      const arr = Object.values(bySubj).map((s: any) => ({ moyenne: moyenneMatiere(s.notes), coefficient: s.coefficient }));
      return { ...p, moyenne: moyenneGenerale(arr), gradeCount: grades.length };
    });

    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Étudiant supprimé !" });
      load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (s: any) => {
    setForm({
      user_id: s.user_id,
      prenom: s.prenom || "",
      nom: s.nom || "",
      email: s.email || "",
      filiere: s.filiere || "GL",
      niveau: s.niveau || "L1",
    });
    setModal("edit");
  };

  const save = async () => {
    if (!form.prenom || !form.nom || !form.email) {
      toast({ title: "Erreur", description: "Prénom, nom et email sont requis.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "update", userId: form.user_id, ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Étudiant mis à jour !" });
      setModal(null);
      load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    const searchString = `${s.prenom || ""} ${s.nom || ""} ${s.email || ""}`.toLowerCase();
    const matchSearch = !search || searchString.includes(search.toLowerCase());
    const matchFiliere = filterFiliere === "all" || s.filiere === filterFiliere;
    return matchSearch && matchFiliere;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un étudiant…"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm"
          />
        </div>
        <div className="relative">
          <select value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}
            className="pl-4 pr-9 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold appearance-none">
            <option value="all">Toutes les filières</option>
            {filieres.map((f) => <option key={f}>{f}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      <div className="retro-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-foreground text-background">
            <tr>
              {["Nom", "Email", "Filière", "Niveau", "Moyenne", "Notes", ""].map((h) => (
                <th key={h} className="text-left p-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun étudiant trouvé.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-soft-border hover:bg-muted/40 transition-colors">
                <td className="p-3 font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background text-xs grid place-items-center font-display shrink-0">
                      {s.prenom?.[0]}{s.nom?.[0]}
                    </div>
                    {s.prenom} {s.nom}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{s.email}</td>
                <td className="p-3"><span className="retro-tag text-[10px]">{s.filiere || "—"}</span></td>
                <td className="p-3 font-mono text-xs">{s.niveau || "—"}</td>
                <td className="p-3">
                  <span className={`font-mono font-bold ${s.moyenne >= 10 ? "text-foreground" : "text-destructive"}`}>
                    {s.gradeCount > 0 ? `${fmt(s.moyenne)}/20` : "—"}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{s.gradeCount}</td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted transition"><Pencil size={13} /></button>
                    <button onClick={() => del(s.user_id)} className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground">{filtered.length} étudiant{filtered.length !== 1 ? "s" : ""}</div>

      {modal === "edit" && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setModal(null)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Modifier l'étudiant</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Prénom *</label>
                <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Nom *</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Email *</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Filière</label>
                <select value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {["GL", "RT", "IASIG", "MISI", "BI"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Niveau</label>
                <select value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {["L1", "L2", "L3", "M1", "M2"].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={15} className="animate-spin" />} Enregistrer les modifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
