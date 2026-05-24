import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILIERES = ["GL", "RT", "IASIG", "MISI", "BI"];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const TYPES = ["CM", "TD", "TP"];
const emptyForm = { filiere: "GL", jour: 1, heure_debut: "08:00", heure_fin: "10:00", type_seance: "CM", salle: "", subject_id: "" };

export default function AdminSchedule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filterFiliere, setFilterFiliere] = useState("GL");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: sched }, { data: subs }] = await Promise.all([
      supabase.from("schedule").select("*").order("jour").order("heure_debut"),
      supabase.from("subjects").select("id,nom,code,filiere"),
    ]);
    setSchedule(sched || []);
    setSubjects(subs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const filteredSubs = subjects.filter((s) => s.filiere === form.filiere);

  const save = async () => {
    if (!form.salle || !form.subject_id) {
      toast({ title: "Erreur", description: "Salle et matière sont requis.", variant: "destructive" }); return;
    }
    setSaving(true);
    const sub = subjects.find((s) => s.id === form.subject_id);
    await supabase.from("schedule").insert({
      filiere: form.filiere,
      jour: Number(form.jour),
      heure_debut: `${form.heure_debut}:00`,
      heure_fin: `${form.heure_fin}:00`,
      type_seance: form.type_seance,
      salle: form.salle,
      subject_id: form.subject_id,
    });
    toast({ title: "Séance ajoutée" });
    setModal(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("schedule").delete().eq("id", id);
    toast({ title: "Séance supprimée" });
    load();
  };

  const displayed = schedule.filter((s) => s.filiere === filterFiliere);
  const byDay: Record<number, any[]> = {};
  displayed.forEach((s) => { (byDay[s.jour] = byDay[s.jour] || []).push(s); });

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {FILIERES.map((f) => (
            <button key={f} onClick={() => setFilterFiliere(f)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition ${filterFiliere === f ? "bg-foreground text-background border-foreground" : "border-soft-border hover:border-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm({ ...emptyForm, filiere: filterFiliere }); setModal(true); }}
          className="bg-foreground text-background px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition">
          <Plus size={15} /> Ajouter une séance
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOURS.map((jour, idx) => {
          const day = idx + 1;
          const courses = byDay[day] || [];
          return (
            <div key={jour} className="retro-card p-4">
              <div className="font-display text-lg mb-3 flex items-center justify-between">
                {jour}
                <span className="text-xs text-muted-foreground font-sans font-normal">{courses.length} séance{courses.length !== 1 ? "s" : ""}</span>
              </div>
              {courses.length === 0
                ? <div className="text-xs text-muted-foreground py-4 text-center">Libre ✦</div>
                : <div className="space-y-2">
                    {courses.map((c) => (
                      <div key={c.id} className="retro-soft p-3 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-xs font-bold mb-0.5">{c.heure_debut?.slice(0, 5)} – {c.heure_fin?.slice(0, 5)}</div>
                          <div className="font-semibold text-sm">{c.subjects?.nom || "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.type_seance} • Salle {c.salle}</div>
                        </div>
                        <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setModal(false)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Nouvelle séance</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Filière</label>
                <select value={form.filiere} onChange={(e) => set("filiere", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {FILIERES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Jour</label>
                <select value={form.jour} onChange={(e) => set("jour", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {JOURS.map((j, i) => <option key={j} value={i + 1}>{j}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Début</label>
                <input type="time" value={form.heure_debut} onChange={(e) => set("heure_debut", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Fin</label>
                <input type="time" value={form.heure_fin} onChange={(e) => set("heure_fin", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Type</label>
                <select value={form.type_seance} onChange={(e) => set("type_seance", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Salle *</label>
                <input value={form.salle} onChange={(e) => set("salle", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Matière *</label>
              <select value={form.subject_id} onChange={(e) => set("subject_id", e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm">
                <option value="">— Choisir une matière —</option>
                {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>)}
              </select>
              {filteredSubs.length === 0 && <p className="text-xs text-muted-foreground mt-1">Aucune matière pour la filière {form.filiere}. Ajoutez-en dans l'onglet Matières.</p>}
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={15} className="animate-spin" />} Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
