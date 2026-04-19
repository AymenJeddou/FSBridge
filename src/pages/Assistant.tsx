import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Quelle est ma moyenne générale ?",
  "Quels cours j'ai demain ?",
  "Quelles sont mes meilleures notes ?",
  "Comment contacter mon professeur de réseaux ?",
];

const Assistant = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !session) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) { toast({ title: "Trop de requêtes", description: "Réessaie dans un instant.", variant: "destructive" }); setLoading(false); return; }
      if (resp.status === 402) { toast({ title: "Crédits IA épuisés", description: "Ajoute des crédits dans le workspace.", variant: "destructive" }); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Échec du flux");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((m) => m.map((msg, idx) => idx === m.length - 1 ? { ...msg, content: acc } : msg));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-80px)] max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="retro-tag mb-2"><Sparkles size={11} /> Assistant IA</div>
        <h1 className="font-display text-3xl md:text-4xl">Demande-moi tout.</h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto retro-card p-4 mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-12 text-center">
            <div className="font-display text-2xl mb-2">Bonjour ✦</div>
            <p className="text-muted-foreground text-sm mb-6">Je connais ton dossier : notes, planning, profs, documents.</p>
            <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left p-3 retro-soft hover:bg-muted/70 text-sm transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-foreground text-background" : "retro-soft"}`}>
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pose ta question..."
          className="flex-1 px-5 py-4 rounded-full border-2 border-foreground bg-background focus:outline-none focus:ring-4 focus:ring-accent/40" />
        <button type="submit" disabled={loading || !input.trim()} className="w-14 h-14 rounded-full bg-foreground text-background grid place-items-center disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export default Assistant;
