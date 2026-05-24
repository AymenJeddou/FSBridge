import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, CheckCircle, Search, ChevronDown, Pencil, Trash2, X, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILIERES = ["GL", "RT", "IASIG", "MISI", "BI"];
const NIVEAUX_STUDENT = ["L1", "L2", "L3", "M1", "M2"];

const emptyForm = { 
  user_id: "",
  email: "", 
  password: "", 
  role: "student" as "student" | "professor" | "admin", 
  prenom: "", 
  nom: "", 
  filiere: "GL", 
  niveau: "L1", 
  bureau: "" 
};

export default function AdminAccounts() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "form">("list");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const loadAccounts = async () => {
    setLoadingList(true);
    try {
      const [{ data: allRoles }, { data: allProfiles }] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("profiles").select("*")
      ]);

      const rolesMap: Record<string, string[]> = {};
      (allRoles || []).forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      const mapped = (allProfiles || []).map((p) => {
        const roles = rolesMap[p.user_id] || [];
        const primaryRole = roles.includes("admin") 
          ? "admin" 
          : roles.includes("professor") 
            ? "professor" 
            : "student";
        return {
          ...p,
          role: primaryRole,
          roles
        };
      });

      setAccounts(mapped);
    } catch (err: any) {
      toast({ title: "Erreur de chargement", description: err.message, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleEdit = (acc: any) => {
    setForm({
      user_id: acc.user_id,
      email: acc.email || "",
      password: "", // blank by default when editing
      role: acc.role,
      prenom: acc.prenom || "",
      nom: acc.nom || "",
      filiere: acc.filiere || "GL",
      niveau: acc.niveau && NIVEAUX_STUDENT.includes(acc.niveau) ? acc.niveau : "L1",
      bureau: acc.bureau || ""
    });
    setIsEditing(true);
    setView("form");
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${name} ?`)) return;
    setLoadingList(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "delete", userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Compte supprimé", description: `Le compte de ${name} a été supprimé.` });
      loadAccounts();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      setLoadingList(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.prenom || !form.nom) {
      toast({ title: "Champs manquants", description: "Prénom, nom et email sont obligatoires.", variant: "destructive" }); 
      return;
    }
    if (!isEditing && !form.password) {
      toast({ title: "Mot de passe manquant", description: "Veuillez spécifier un mot de passe pour le nouveau compte.", variant: "destructive" }); 
      return;
    }

    setLoadingSubmit(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        action: isEditing ? "update" : "create",
        userId: isEditing ? form.user_id : undefined,
        email: form.email,
        password: form.password || undefined,
        prenom: form.prenom,
        nom: form.nom,
        role: form.role,
        filiere: form.role === "admin" ? null : form.filiere,
        niveau: form.role === "professor" ? "Professeur" : form.role === "admin" ? null : form.niveau,
        bureau: form.role === "professor" ? form.bureau : null
      };

      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: payload,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (error) {
        console.error("Edge Function Error:", error);
        throw error;
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({ 
        title: isEditing ? "Compte modifié !" : "Compte créé !", 
        description: `${form.prenom} ${form.nom} a été ${isEditing ? "mis à jour" : "ajouté"} avec succès.` 
      });

      setSuccess(true);
      setForm(emptyForm);
      setIsEditing(false);
      setView("list");
      loadAccounts();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally { 
      setLoadingSubmit(false); 
    }
  };

  const filtered = accounts.filter((acc) => {
    const searchStr = `${acc.prenom || ""} ${acc.nom || ""} ${acc.email || ""}`.toLowerCase();
    const matchSearch = !search || searchStr.includes(search.toLowerCase());
    const matchRole = filterRole === "all" || acc.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="retro-tag mb-3"><Users size={11} /> Comptes utilisateurs</div>
          <h2 className="font-display text-3xl">Gestion des comptes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recherchez, filtrez, modifiez ou créez de nouveaux comptes d'étudiants, professeurs ou administrateurs.
          </p>
        </div>

        {view === "list" ? (
          <button 
            onClick={() => {
              setForm(emptyForm);
              setIsEditing(false);
              setView("form");
            }}
            className="retro-btn flex items-center gap-2 bg-accent text-foreground font-semibold px-4 py-2.5 rounded-2xl border-2 border-foreground"
          >
            <UserPlus size={16} />
            <span>Nouveau compte</span>
          </button>
        ) : (
          <button 
            onClick={() => setView("list")}
            className="retro-btn flex items-center gap-2 bg-background hover:bg-muted text-foreground font-semibold px-4 py-2.5 rounded-2xl border-2 border-foreground"
          >
            <ArrowLeft size={16} />
            <span>Retour à la liste</span>
          </button>
        )}
      </div>

      {success && (
        <div className="retro-card p-4 bg-accent flex items-center gap-3">
          <CheckCircle size={18} />
          <span className="font-semibold text-sm">Opération effectuée avec succès !</span>
        </div>
      )}

      {view === "list" ? (
        // List View
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[250px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un compte (Nom, email...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans"
              />
            </div>
            {/* Role Filter */}
            <div className="relative">
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-4 pr-9 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold appearance-none cursor-pointer"
              >
                <option value="all">Tous les rôles</option>
                <option value="student">👤 Étudiants</option>
                <option value="professor">🎓 Professeurs</option>
                <option value="admin">🛡️ Administrateurs</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          {loadingList ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="animate-spin text-foreground" size={32} />
            </div>
          ) : (
            <div className="retro-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-foreground text-background">
                  <tr>
                    {["Nom complet", "Email", "Rôle", "Détail", ""].map((h) => (
                      <th key={h} className="text-left p-3.5 font-semibold font-display tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">
                        Aucun compte correspondant trouvé.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((acc) => {
                      const initiales = `${acc.prenom?.[0] || ""}${acc.nom?.[0] || ""}`.toUpperCase();
                      return (
                        <tr key={acc.id} className="border-t-2 border-soft-border hover:bg-muted/40 transition-colors">
                          <td className="p-3.5 font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-accent/40 text-foreground border-2 border-foreground text-xs grid place-items-center font-display shrink-0 font-bold">
                                {initiales}
                              </div>
                              <span className="font-sans text-sm">{acc.prenom} {acc.nom}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-foreground text-xs font-mono">{acc.email}</td>
                          <td className="p-3.5">
                            <span className={`retro-tag text-[10px] font-bold ${
                              acc.role === "admin" 
                                ? "bg-red-200 border-red-500" 
                                : acc.role === "professor" 
                                  ? "bg-green-200 border-green-500" 
                                  : "bg-blue-200 border-blue-500"
                            }`}>
                              {acc.role === "admin" ? "🛡️ Admin" : acc.role === "professor" ? "🎓 Prof" : "👤 Étudiant"}
                            </span>
                          </td>
                          <td className="p-3.5 text-xs font-semibold">
                            {acc.role === "student" && (
                              <span className="font-mono text-muted-foreground">{acc.filiere} • {acc.niveau}</span>
                            )}
                            {acc.role === "professor" && (
                              <span className="text-muted-foreground">Bureau {acc.bureau || "—"}</span>
                            )}
                            {acc.role === "admin" && (
                              <span className="text-muted-foreground font-normal italic">Accès total</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleEdit(acc)}
                                title="Modifier" 
                                className="p-2 rounded-xl hover:bg-muted transition text-foreground border-2 border-transparent hover:border-foreground"
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                onClick={() => handleDelete(acc.user_id, `${acc.prenom} ${acc.nom}`)}
                                title="Supprimer" 
                                className="p-2 rounded-xl hover:bg-destructive hover:text-destructive-foreground transition text-muted-foreground border-2 border-transparent hover:border-foreground"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-xs text-muted-foreground font-semibold px-1">
            {filtered.length} compte{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      ) : (
        // Create / Edit Form View
        <form onSubmit={submit} className="retro-card max-w-lg p-6 space-y-5 bg-card">
          <div className="border-b-2 border-foreground pb-2">
            <h3 className="font-display text-2xl">
              {isEditing ? `Modifier le compte de ${form.prenom}` : "Nouveau compte"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditing 
                ? "Modifiez les informations d'un utilisateur existant de la plateforme." 
                : "Remplissez les champs pour enregistrer un nouvel étudiant, professeur ou administrateur."
              }
            </p>
          </div>

          {/* Role toggle */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-2">Rôle *</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "student", label: "👤 Étudiant" },
                { id: "professor", label: "🎓 Professeur" },
                { id: "admin", label: "🛡️ Admin" }
              ] as const).map((r) => (
                <button 
                  type="button" 
                  key={r.id} 
                  onClick={() => set("role", r.id)}
                  className={`py-2.5 rounded-2xl border-2 font-semibold text-sm transition ${
                    form.role === r.id 
                      ? "bg-foreground text-background border-foreground shadow-sm" 
                      : "border-soft-border hover:border-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Prénom *</label>
              <input 
                value={form.prenom} 
                onChange={(e) => set("prenom", e.target.value)} 
                required
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans" 
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Nom *</label>
              <input 
                value={form.nom} 
                onChange={(e) => set("nom", e.target.value)} 
                required
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans" 
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Email *</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => set("email", e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans" 
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">
              Mot de passe {isEditing && <span className="text-muted-foreground font-normal">(laisser vide pour inchangé)</span>}
            </label>
            <input 
              type="password" 
              value={form.password} 
              onChange={(e) => set("password", e.target.value)} 
              placeholder={isEditing ? "•••••••• (laisser vide)" : "••••••••"}
              required={!isEditing} 
              minLength={6}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-soft-border bg-background focus:outline-none text-sm font-sans" 
            />
          </div>

          {/* Filière & Niveau — students/professors only */}
          {form.role !== "admin" && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Filière</label>
              <select 
                value={form.filiere} 
                onChange={(e) => set("filiere", e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none text-sm font-semibold cursor-pointer"
              >
                {FILIERES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {/* Niveau — students only */}
          {form.role === "student" && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Niveau</label>
              <div className="flex gap-2 flex-wrap">
                {NIVEAUX_STUDENT.map((n) => (
                  <button 
                    type="button" 
                    key={n} 
                    onClick={() => set("niveau", n)}
                    className={`px-4 py-2 rounded-2xl border-2 text-sm font-semibold transition ${
                      form.niveau === n 
                        ? "bg-foreground text-background border-foreground" 
                        : "border-soft-border hover:border-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bureau — professors only */}
          {form.role === "professor" && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Numéro de bureau</label>
              <input 
                value={form.bureau} 
                onChange={(e) => set("bureau", e.target.value)} 
                placeholder="ex: B12"
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/30 text-sm font-sans" 
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-3 border-t-2 border-foreground">
            <button 
              type="button" 
              onClick={() => setView("list")}
              className="flex-1 py-3 rounded-2xl font-semibold border-2 border-foreground hover:bg-muted transition text-center text-sm"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loadingSubmit}
              className="flex-1 bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 border-2 border-foreground transition text-sm"
            >
              {loadingSubmit ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {loadingSubmit 
                ? "Enregistrement…" 
                : isEditing 
                  ? "Modifier le compte" 
                  : "Créer le compte"
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
