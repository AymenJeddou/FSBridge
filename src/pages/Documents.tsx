import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, Sparkles, Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const TYPES: { id: any; label: string; desc: string }[] = [
  { id: "attestation_inscription", label: "Attestation d'inscription", desc: "Prouve que vous êtes inscrit pour l'année universitaire en cours." },
  { id: "releve_notes", label: "Relevé de notes", desc: "Détail de vos moyennes par matière avec mention." },
  { id: "attestation_presence", label: "Attestation de présence", desc: "Confirmation de votre assiduité aux cours." },
  { id: "convention_stage", label: "Convention de stage", desc: "Document tripartite pour effectuer un stage." },
];

const STATUS_STYLES: Record<string, string> = {
  en_attente: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]",
  approuve: "bg-[#d1fae5] text-[#065f46] border-[#10b981]",
  refuse: "bg-[#fee2e2] text-[#991b1b] border-[#ef4444]",
};
const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
};

const Documents = () => {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("attestation_inscription");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!profileId) return;
    const { data } = await supabase.from("document_requests").select("*").eq("student_id", profileId).order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [profileId]);

  const submit = async () => {
    if (!profileId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("document_requests")
        .insert({ student_id: profileId, type: type as any, motif })
        .select().single();
      if (error) throw error;
      toast({ title: "Demande envoyée", description: "L'agent IA traite votre demande..." });
      setOpen(false); setMotif("");
      // Trigger AI agent
      const { error: fnError } = await supabase.functions.invoke("document-agent", { body: { requestId: data.id } });
      if (fnError) console.error(fnError);
      await load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVars}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVars} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="retro-tag mb-3">Documents officiels</div>
          <h1 className="font-display text-4xl md:text-5xl">Mes demandes</h1>
          <p className="text-muted-foreground mt-2 max-w-md">Demande tes documents — l'agent IA vérifie ton éligibilité et génère le PDF en quelques secondes.</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-foreground text-background px-5 py-3 rounded-full font-semibold flex items-center gap-2">
          <Plus size={16} /> Nouvelle demande
        </button>
      </motion.div>

      {/* Requests */}
      {requests.length === 0 ? (
        <motion.div variants={itemVars} className="retro-card p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-muted-foreground" />
          <div className="text-muted-foreground">Aucune demande pour l'instant.</div>
        </motion.div>
      ) : (
        <motion.div variants={itemVars} className="space-y-3">
          {requests.map((r) => {
            const t = TYPES.find((x) => x.id === r.type);
            return (
              <div key={r.id} className="retro-card p-5 flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 bg-foreground text-background rounded-2xl grid place-items-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg">{t?.label}</div>
                  <div className="text-xs text-muted-foreground">Demandé le {format(parseISO(r.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</div>
                  {r.motif && <div className="text-sm mt-1 italic">« {r.motif} »</div>}
                  {r.decision_ia && (
                    <div className="text-xs mt-2 flex items-start gap-1.5 text-muted-foreground">
                      <Sparkles size={12} className="mt-0.5 shrink-0" />
                      <span>Décision IA : {r.decision_ia}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`retro-tag ${STATUS_STYLES[r.statut]}`}>{STATUS_LABEL[r.statut]}</span>
                  {r.pdf_url && (
                    <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-semibold underline underline-offset-4 flex items-center gap-1">
                      <Download size={12} /> {r.statut === "en_attente" ? "Imprimer le brouillon" : "Télécharger"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="retro-card bg-card max-w-lg w-full p-6 space-y-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="retro-tag mb-2">Nouvelle demande</div>
                <h2 className="font-display text-2xl">Quel document ?</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {TYPES.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)} className={`w-full text-left p-3 rounded-2xl border-2 transition ${type === t.id ? "border-foreground bg-foreground text-background" : "border-soft-border hover:border-foreground"}`}>
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className={`text-xs ${type === t.id ? "text-background/70" : "text-muted-foreground"}`}>{t.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5">Motif (optionnel)</label>
              <textarea rows={2} value={motif} onChange={(e) => setMotif(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/40" />
            </div>
            <button onClick={submit} disabled={submitting} className="w-full bg-foreground text-background py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Envoyer la demande
            </button>
          </div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Documents;
