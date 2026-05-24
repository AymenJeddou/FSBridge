import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILIERES = ["GL", "RT", "IASIG", "MISI", "BI"];
const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6"];
const empty = { nom: "", code: "", coefficient: 2, semestre: "S5", filiere: "GL", professor_id: "" };

export default function AdminSubjects() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: roles }, { data: profiles }] = await Promise.all([
      supabase.from("subjects").select("*"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("profiles").select("id,user_id,prenom,nom"),
    ]);
    const profIds = (roles || []).filter((r: any) => r.role === "professor").map((r: any) => r.user_id);
    const profProfiles = (profiles || []).filter((p: any) => profIds.includes(p.user_id));
    setProfs(profProfiles);
    setSubjects(subs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(empty); setModal("add"); };
  const openEdit = (s: any) => {
    setForm({ nom: s.nom, code: s.code, coefficient: s.coefficient, semestre: s.semestre, filiere: s.filiere, professor_id: s.professor_id || "" });
    setEditId(s.id);
    setModal("edit");
  };

  const save = async () => {
    if (!form.nom || !form.code) { toast({ title: "Erreur", description: "Nom et code sont requis.", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { ...form, coefficient: Number(form.coefficient), professor_id: form.professor_id || null };
    if (modal === "add") {
      await supabase.from("subjects").insert(payload);
    } else {
      await supabase.from("subjects").update(payload).eq("id", editId);
    }
    toast({ title: modal === "add" ? "Matière ajoutée" : "Matière mise à jour" });
    setModal(null);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    toast({ title: "Matière supprimée" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="bg-foreground text-background px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition">
          <Plus size={15} /> Ajouter une matière
        </button>
      </div>

      <div className="retro-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-foreground text-background">
            <tr>
              {["Code", "Matière", "Filière", "Semestre", "Coef.", "Professeur", ""].map((h) => (
                <th key={h} className="text-left p-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucune matière.</td></tr>}
            {subjects.map((s) => {
              const prof = profs.find((p) => p.id === s.professor_id);
              return (
                <tr key={s.id} className="border-t border-soft-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-bold">{s.code}</td>
                  <td className="p-3 font-semibold">{s.nom}</td>
                  <td className="p-3"><span className="retro-tag text-[10px]">{s.filiere}</span></td>
                  <td className="p-3 font-mono text-xs">{s.semestre}</td>
                  <td className="p-3 font-mono">{s.coefficient}</td>
                  <td className="p-3 text-muted-foreground text-xs">{prof ? `${prof.prenom} ${prof.nom}` : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted transition"><Pencil size={13} /></button>
                      <button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setModal(null)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{modal === "add" ? "Nouvelle matière" : "Modifier la matière"}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Nom *</label>
                <input value={form.nom} onChange={(e) => set("nom", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Code *</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Filière</label>
                <select value={form.filiere} onChange={(e) => set("filiere", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {FILIERES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Semestre</label>
                <select value={form.semestre} onChange={(e) => set("semestre", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {SEMESTRES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Coef.</label>
                <input type="number" min={1} max={10} value={form.coefficient} onChange={(e) => set("coefficient", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Professeur responsable</label>
              <select value={form.professor_id} onChange={(e) => set("professor_id", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                <option value="">— Aucun —</option>
                {profs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {modal === "add" ? "Ajouter" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
