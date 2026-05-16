import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

export const EmbeddedChatbot = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Bonjour ! Je suis 9antra, l'assistant IA de la Faculté des Sciences de Bizerte (FSB). Posez-moi vos questions ici directement !" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Msg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-info-agent`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) throw new Error("Échec de la communication avec l'assistant.");

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
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Désolé, une erreur est survenue." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retro-card border-4 border-foreground rounded-2xl overflow-hidden bg-background h-[650px] flex flex-col shadow-[8px_8px_0px_rgba(0,0,0,1)]">
      <div className="bg-foreground text-background p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-foreground overflow-hidden shadow-sm">
          <img src="/logo.png" alt="9antra" className="w-10 h-10 object-contain" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Discuter avec 9antra</h3>
          <p className="text-sm opacity-80">Posez vos questions sur la FSB</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.role === 'user' ? 'bg-foreground text-background' : 'bg-background border-2 border-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)]'}`}>
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-4 border-t-2 border-foreground bg-background flex items-center gap-3">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Écrivez votre question ici..."
          className="flex-1 px-4 py-3 rounded-full border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all" 
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()} 
          className="h-12 w-12 rounded-full bg-accent text-foreground border-2 border-foreground grid place-items-center disabled:opacity-50 hover:bg-accent/80 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};
