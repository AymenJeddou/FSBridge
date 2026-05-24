import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  en_attente: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]",
  approuve: "bg-[#d1fae5] text-[#065f46] border-[#10b981]",
  refuse: "bg-[#fee2e2] text-[#991b1b] border-[#ef4444]",
};
const STATUS_LABEL: Record<string, string> = { en_attente: "En attente", approuve: "Approuvé", refuse: "Refusé" };

export default function AdminDocuments() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "en_attente" | "approuve" | "refuse">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("document_requests").select("*, profiles(prenom,nom,filiere)").order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, statut: "approuve" | "refuse") => {
    try {
      const { error: fnError } = await supabase.functions.invoke("document-agent", {
        body: { requestId: id, action: statut === "approuve" ? "approve" : "refuse" }
      });
      if (fnError) throw fnError;
      toast({ title: statut === "approuve" ? "Demande approuvée (signée par le Doyen)" : "Demande refusée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      load();
    }
  };

  const filtered = docs.filter((d) => filter === "all" || d.statut === filter);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["all", "en_attente", "approuve", "refuse"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition ${filter === f ? "bg-foreground text-background border-foreground" : "border-soft-border hover:border-foreground"}`}>
            {f === "all" ? "Toutes" : STATUS_LABEL[f]}
            <span className="ml-1.5 text-xs opacity-60">({f === "all" ? docs.length : docs.filter((d) => d.statut === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="retro-card p-12 text-center text-muted-foreground">Aucune demande.</div>
        )}
        {filtered.map((d) => (
          <div key={d.id} className="retro-card p-5 flex items-start gap-4 flex-wrap">
            <div className="w-10 h-10 bg-foreground text-background rounded-xl grid place-items-center shrink-0 font-display text-sm">
              {d.profiles?.prenom?.[0]}{d.profiles?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{d.profiles?.prenom} {d.profiles?.nom}
                <span className="ml-2 text-muted-foreground font-normal text-sm">— {d.type?.replace(/_/g, " ")}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Filière {d.profiles?.filiere} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
              </div>
              {d.motif && <div className="text-sm italic mt-1 text-muted-foreground">« {d.motif} »</div>}
              {d.decision_ia && <div className="text-xs mt-1 text-muted-foreground">IA : {d.decision_ia}</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`retro-tag text-[10px] ${STATUS_STYLES[d.statut]}`}>{STATUS_LABEL[d.statut]}</span>
              <button onClick={() => update(d.id, "approuve")} title="Approuver"
                className="p-2 rounded-full border-2 border-foreground hover:bg-foreground hover:text-background transition">
                <Check size={14} />
              </button>
              <button onClick={() => update(d.id, "refuse")} title="Refuser"
                className="p-2 rounded-full border-2 border-foreground hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
