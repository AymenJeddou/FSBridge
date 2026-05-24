import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, MapPin, BookOpen, Trash2, Pencil, X, Search, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminProfessors() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profs, setProfs] = useState<any[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("all");
  const [filieres, setFilieres] = useState<string[]>([]);

  const [modal, setModal] = useState<"edit" | null>(null);
  const [form, setForm] = useState({ user_id: "", prenom: "", nom: "", email: "", bureau: "", filiere: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const adminIds = (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id);
      const profIds = (roles || []).filter((r: any) => r.role === "professor" && !adminIds.includes(r.user_id)).map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: subjects } = await supabase.from("subjects").select("*");

      const profProfiles = (profiles || []).filter((p: any) => profIds.includes(p.user_id));
      const enriched = profProfiles.map((p: any) => ({
        ...p,
        subjects: (subjects || []).filter((s: any) => s.professor_id === p.id),
      }));

      // Gather all distinct filieres that any subject or professor is linked to
      const fls = new Set<string>();
      enriched.forEach((p) => {
        if (p.filiere) fls.add(p.filiere);
        p.subjects.forEach((s: any) => {
          if (s.filiere) fls.add(s.filiere);
        });
      });
      setFilieres(Array.from(fls));
      setProfs(enriched);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce professeur ?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Professeur supprimé !" });
      load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (p: any) => {
    setForm({
      user_id: p.user_id,
      prenom: p.prenom || "",
      nom: p.nom || "",
      email: p.email || "",
      bureau: p.bureau || "",
      filiere: p.filiere || "GL",
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

      toast({ title: "Professeur mis à jour !" });
      setModal(null);
      load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Search & filter logic
  const filtered = profs.filter((p) => {
    const searchString = `${p.prenom || ""} ${p.nom || ""} ${p.email || ""} ${p.bureau || ""}`.toLowerCase();
    const matchSearch = !search || searchString.includes(search.toLowerCase()) || p.subjects.some((s: any) => s.nom.toLowerCase().includes(search.toLowerCase()));
    
    const matchFiliere = filterFiliere === "all" || p.filiere === filterFiliere || p.subjects.some((s: any) => s.filiere === filterFiliere);
    return matchSearch && matchFiliere;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un professeur (Nom, bureau, matière)…"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans"
          />
        </div>
        <div className="relative">
          <select 
            value={filterFiliere} 
            onChange={(e) => setFilterFiliere(e.target.value)}
            className="pl-4 pr-9 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold appearance-none cursor-pointer"
          >
            <option value="all">Tous les départements</option>
            {filieres.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Grid of Professors */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="retro-card p-8 text-center text-muted-foreground col-span-3">Aucun professeur correspondant trouvé.</div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="retro-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-foreground text-background rounded-full grid place-items-center font-display text-lg shrink-0 font-bold">
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </div>
                  <div>
                    <div className="font-display text-lg leading-tight">Pr. {p.prenom} {p.nom}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> Bureau {p.bureau || "—"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                  <button onClick={() => del(p.user_id)} className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition text-muted-foreground hover:text-destructive-foreground"><Trash2 size={13} /></button>
                </div>
              </div>
              
              {p.email && (
                <a href={`mailto:${p.email}`} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground truncate font-mono">
                  <Mail size={12} /> {p.email}
                </a>
              )}
            </div>

            <div className="border-t border-soft-border pt-3 mt-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <BookOpen size={11} /> Matières enseignées
              </div>
              {p.subjects.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">Aucune matière assignée</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {p.subjects.map((s: any) => (
                    <span key={s.id} className="retro-tag text-[10px] bg-secondary font-semibold">
                      {s.nom} <span className="opacity-60">({s.filiere})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground font-semibold px-1">
        {filtered.length} professeur{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
      </div>

      {modal === "edit" && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30" onClick={() => setModal(null)}>
          <div className="retro-card bg-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Modifier le professeur</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Prénom *</label>
                <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-sans" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Nom *</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-sans" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Email *</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Bureau</label>
                <input value={form.bureau} onChange={(e) => setForm({ ...form, bureau: e.target.value })} placeholder="Ex: B12" className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-sans" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1">Département/Filière</label>
                <select value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} className="w-full px-3 py-2 rounded-xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold cursor-pointer">
                  {["GL", "RT", "IASIG", "MISI", "BI"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 border-2 border-foreground transition">
              {saving && <Loader2 size={15} className="animate-spin" />} Enregistrer les modifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
