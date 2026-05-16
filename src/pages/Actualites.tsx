import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Tag,
  X,
  RefreshCw,
  Newspaper,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";


// Configuration using environment variables or hardcoded fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cqpjzxdoqvjqffuzcqnb.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                         import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                         "sb_publishable_9-5DaaNTFMV-t6k_8SoJMQ_Iaj6eFCw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Category colours (retro palette) ─────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  "Événements":  "bg-accent text-foreground border-foreground",
  "Étudiants":   "bg-[hsl(210,80%,88%)] text-[hsl(210,60%,20%)] border-[hsl(210,60%,20%)]",
  "Recherche":   "bg-[hsl(280,60%,88%)] text-[hsl(280,50%,20%)] border-[hsl(280,50%,20%)]",
  "Partenariats":"bg-[hsl(140,55%,80%)] text-[hsl(140,50%,15%)] border-[hsl(140,50%,15%)]",
  "Général":     "bg-muted text-foreground border-foreground",
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_STYLES[cat] ?? "bg-muted text-foreground border-foreground";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
  published: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const excerpt = (text: string, max = 150) => {
  // Strip markdown symbols for preview
  const stripped = text.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\n/g, " ");
  return stripped.length > max ? stripped.slice(0, max) + "…" : stripped;
};

// Minimal markdown renderer (bold + headings)
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-2xl mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="font-display text-xl mt-5 mb-2">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <li
          key={i}
          className="ml-4 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    if (line.trim() === "") return <br key={i} />;
    const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return (
      <p
        key={i}
        className="text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
};

// ─── Article Card ─────────────────────────────────────────────────────────────

const ArticleCard = ({
  article,
  onClick,
  index,
}: {
  article: Article;
  onClick: () => void;
  index: number;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    className="retro-card retro-card-hover flex flex-col cursor-pointer overflow-hidden"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    {/* Image */}
    <div className="relative aspect-video overflow-hidden border-b-2 border-foreground">
      <img
        src={article.image_url ?? `https://picsum.photos/seed/${article.id}/800/400`}
        alt={article.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      {/* Category overlay */}
      <span
        className={`absolute top-3 left-3 retro-tag text-[11px] ${getCategoryStyle(article.category)}`}
      >
        {article.category}
      </span>
    </div>

    {/* Body */}
    <div className="flex flex-col flex-1 p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Calendar size={12} />
        {formatDate(article.created_at)}
      </div>

      <h2 className="font-display text-xl leading-tight mb-3 line-clamp-2">
        {article.title}
      </h2>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
        {excerpt(article.content)}
      </p>

      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        Lire la suite
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </motion.article>
);

// ─── Article Detail Modal ─────────────────────────────────────────────────────

const ArticleModal = ({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) => (
  <AnimatePresence>
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4"
      onClick={onClose}
    >
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="retro-card w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative aspect-video border-b-2 border-foreground overflow-hidden">
          <img
            src={article.image_url ?? `https://picsum.photos/seed/${article.id}/800/400`}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-background border-2 border-foreground rounded-full hover:bg-foreground hover:text-background transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={`retro-tag text-[11px] ${getCategoryStyle(article.category)}`}>
              <Tag size={10} />
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              {formatDate(article.created_at)}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="prose-like space-y-1">
            {renderMarkdown(article.content)}
          </div>

          {/* Back button */}
          <div className="mt-10 pt-6 border-t-2 border-foreground/10">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-foreground rounded-full text-sm font-semibold hover:bg-foreground hover:text-background transition"
            >
              <ArrowLeft size={14} />
              Retour aux actualités
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Actualites = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);

  // ── Fetch articles ──────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      console.error("Fetch articles error:", err);
      setError("Impossible de charger les articles. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);



  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b-2 border-foreground sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <img src="/logo.png" alt="FSBridge" className="w-10 h-10 object-contain" />
            <span className="font-display text-lg">FSBridge.</span>
          </Link>

          <div className="flex items-center gap-3">


            <button
              onClick={fetchArticles}
              disabled={loading}
              className="p-2.5 border-2 border-foreground rounded-full hover:bg-foreground hover:text-background transition disabled:opacity-40"
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero band ── */}
      <section className="border-b-2 border-foreground bg-accent">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-foreground text-background grid place-items-center shrink-0 mt-1">
              <Newspaper size={22} />
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl leading-tight mb-2">
                Actualités
              </h1>
              <p className="text-lg text-foreground/70 max-w-xl">
                Restez informés des dernières nouvelles de la{" "}
                <strong>Faculté des Sciences de Bizerte</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Loading skeleton */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="retro-card overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-muted rounded-full w-1/3 animate-pulse" />
                  <div className="h-5 bg-muted rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="retro-card border-destructive p-8 text-center">
            <p className="text-destructive font-semibold mb-4">{error}</p>
            <button
              onClick={fetchArticles}
              className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-semibold hover:bg-foreground/85 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="retro-card p-16 text-center"
          >
            <Newspaper size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-display text-2xl mb-2">Aucun article pour l'instant</h2>
            <p className="text-muted-foreground mb-6">
              Revenez plus tard pour découvrir les dernières nouvelles de la faculté.
            </p>
          </motion.div>
        )}

        {/* Article grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((a, i) => (
              <ArticleCard
                key={a.id}
                article={a}
                index={i}
                onClick={() => setSelected(a)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-foreground py-8 text-center text-sm text-muted-foreground mt-8">
        © {new Date().getFullYear()} FSBridge — Faculté des Sciences de Bizerte
      </footer>

      {/* ── Article detail modal ── */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default Actualites;
