import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

export const PublicChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Bonjour ! Je suis 9antra, l'assistant IA de la Faculté des Sciences de Bizerte (FSB). Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.5 }
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const el = document.getElementById('chatbot-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setIsOpen(true);
              }
            }}
            className="fixed bottom-6 right-6 bg-accent text-foreground font-display font-bold py-3 px-5 rounded-full border-2 border-foreground flex items-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all z-50"
            aria-label="Ouvrir le chat"
          >
            <div className="relative flex items-center justify-center bg-white rounded-full w-10 h-10 border-2 border-foreground overflow-hidden shadow-sm">
              <img src="/logo.png" alt="9antra" className="w-9 h-9 object-contain" />
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }} 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-foreground"
              />
            </div>
            <span className="hidden sm:inline tracking-wide">Besoin d'aide ?</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[450px] md:w-[500px] h-[650px] max-h-[85vh] bg-background border-4 border-foreground rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-foreground text-background p-4 flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold">9antra</h3>
                <p className="text-xs opacity-80">Posez vos questions sur la faculté</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-background/20 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-foreground text-background' : 'bg-background border-2 border-foreground/10 shadow-sm'}`}>
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t-2 border-foreground/10 bg-background flex items-center gap-2">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Votre question..."
                className="flex-1 px-4 py-2 rounded-full border-2 border-foreground/20 focus:outline-none focus:border-foreground transition-colors" 
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()} 
                className="w-10 h-10 rounded-full bg-accent text-foreground grid place-items-center disabled:opacity-50 flex-shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
