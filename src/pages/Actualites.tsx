import { useState, useEffect, useCallback, useRef } from "react";
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
  Sparkles,
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

interface ArticleExtraDetails {
  subtitle: string;
  readingTime: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  keyStat: string;
  keyStatLabel: string;
  fullMarkdown?: string;
  highlights: string[];
  quoteText?: string;
  quoteAuthor?: string;
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

// Minimal markdown renderer (bold + headings + lists)
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-2xl mt-6 mb-2 text-foreground">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="font-display text-xl mt-5 mb-2 text-foreground/90">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <li
          key={i}
          className="ml-6 list-disc text-muted-foreground leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return (
      <p
        key={i}
        className="text-muted-foreground leading-relaxed mb-4 text-justify"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
};

// ─── Article Extra Data Lookup ────────────────────────────────────────────────

const getArticleExtra = (title: string, fallbackContent: string): ArticleExtraDetails => {
  const normalized = title.toLowerCase();
  
  if (normalized.includes("startup world cup")) {
    return {
      subtitle: "Trois startups d'élite choisies pour défendre les couleurs de la Tunisie à la Grande Finale de San Francisco.",
      readingTime: "4 min de lecture",
      authorName: "Skander Khelil",
      authorRole: "Chroniqueur Tech & Innovation",
      authorAvatar: "SK",
      keyStat: "$1,000,000",
      keyStatLabel: "Investissement potentiel en jeu",
      quoteText: "Cette opportunité est un catalyseur exceptionnel. Le simple fait d'échanger avec des mentors de la Silicon Valley valide notre vision globale.",
      quoteAuthor: "Yasmine Dridi, Co-fondatrice de PWN & Patch",
      highlights: [
        "PWN & Patch décroche la 1ère place nationale grâce à son outil de détection intelligente de vulnérabilités.",
        "Le pavillon tunisien bénéficiera de sessions de pitch intensives avec des experts et business angels.",
        "San Francisco accueillera plus de 60 nations pour cette finale mondiale d'envergure historique."
      ],
      fullMarkdown: `## Une Étape Historique pour la Tech Tunisienne\n\nPour la toute première fois de son histoire, la Tunisie rejoint le cercle prestigieux de la **Startup World Cup**. Trois startups d'exception ont été rigoureusement sélectionnées à la suite d'un processus de pitch national de haut niveau.\n\n### Les Ambassadeurs du Changement\n\n1. **PWN & Patch** : Cette startup révolutionne la cybersécurité avec des outils de détection de failles pilotés par l'intelligence artificielle. Leur solution permet de sécuriser des infrastructures critiques en temps réel.\n2. **NextGen Agri** : Spécialisée dans l'IoT agricole, elle résout le défi du stress hydrique en maximisant l'efficacité de l'irrigation.\n3. **EdTech Flow** : Une plateforme éducative intelligente qui adapte le rythme d'apprentissage de chaque étudiant universitaire.\n\n### Direction la Silicon Valley\n\nEn octobre prochain, les lauréats s'envoleront pour San Francisco. Ils auront l'opportunité unique de pitcher devant des investisseurs de capital-risque influents de la **Silicon Valley**. L'objectif ultime ? Ramener le grand prix d'investissement de **1 million de dollars** pour propulser leur startup à l'échelle mondiale.`
    };
  }
  
  if (normalized.includes("tunpay")) {
    return {
      subtitle: "La Banque Centrale de Tunisie standardise les paiements mobiles pour accélérer l'inclusion financière.",
      readingTime: "3 min de lecture",
      authorName: "Mariem Zarrouk",
      authorRole: "Analyste Fintech & Économie",
      authorAvatar: "MZ",
      keyStat: "+81%",
      keyStatLabel: "Transactions mobiles en 1 an",
      quoteText: "L'interopérabilité est la clé de voûte de l'inclusion financière. TUNPAY simplifie la vie des commerçants et garantit la sécurité absolue des transactions.",
      quoteAuthor: "Dr. Amel Ben FSB, Chercheuse en Économie Numérique",
      highlights: [
        "Unification sous un seul label visuel pour toutes les banques et établissements de paiement tunisiens.",
        "Facilité d'utilisation totale : un simple code QR pour payer tous vos achats instantanément.",
        "Plan national ambitieux visant à réduire la circulation physique du cash de 50% d'ici 2028."
      ],
      fullMarkdown: `## Modernisation Financière en Tunisie\n\nLa Banque Centrale de Tunisie (BCT) vient de franchir un cap historique avec le lancement officiel du label national **TUNPAY**. Cette initiative vise à harmoniser et à simplifier l'écosystème du paiement mobile en Tunisie, le rendant pleinement interopérable.\n\n### Pourquoi TUNPAY ?\n\nHusqu'à présent, les différents systèmes de paiement mobile étaient fragmentés. TUNPAY résout ce problème en garantissant que **n'importe quelle application bancaire ou portefeuille électronique** puisse payer n'importe quel commerçant affilié, peu importe le réseau.\n\n### Une Croissance Explosive\n\nAvec une hausse spectaculaire de **81% des transactions mobiles** l'année dernière, la Tunisie est mûre pour cette transition. Le label s'accompagne de protocoles de sécurité cryptographique renforcés pour garantir la confiance des consommateurs.`
    };
  }
  
  if (normalized.includes("tsyp 14")) {
    return {
      subtitle: "L'IEEE INSAT remporte l'organisation du rassemblement d'ingénierie le plus attendu de l'année.",
      readingTime: "5 min de lecture",
      authorName: "Firas Labidi",
      authorRole: "Responsable Événementiel IEEE",
      authorAvatar: "FL",
      keyStat: "1,200+",
      keyStatLabel: "Congressistes attendus à Hammamet",
      quoteText: "Nous préparons une édition mémorable à Hammamet. C'est l'occasion en or de prouver la force d'innovation et d'impact de notre jeunesse.",
      quoteAuthor: "Nour Houda, Présidente IEEE INSAT",
      highlights: [
        "Vote historique désignant la section INSAT à la tête de la 14ème édition du congrès.",
        "3 jours d'ateliers intenses sur l'intelligence artificielle, l'IoT et l'énergie durable.",
        "Networking majeur avec des industriels et des recruteurs de premier plan en Tunisie."
      ],
      fullMarkdown: `## Le Plus Grand Rassemblement Étudiant de Tunisie\n\nC'est désormais officiel : le **IEEE Tunisian Student and Young Professional Congress (TSYP 14)** sera organisé par la prestigieuse section étudiante de l'IEEE INSAT. L'événement se tiendra en décembre 2026 à Hammamet.\n\n### Un Programme Riche et Stimulant\n\nLe congrès accueillera plus de **1200 participants** de toutes les universités tunisiennes. Au menu :\n- **Hackathons thématiques** : Résolution de problèmes réels d'efficacité énergétique.\n- **Conférences scientifiques** : Présentation des dernières percées mondiales dans le domaine des télécommunications et de l'IA.\n- **Challenge inter-sections** : Une compétition amicale évaluant l'impact communautaire de chaque groupe.\n\n### Opportunité Professionnelle Unique\n\nTSYP n'est pas qu'une fête technologique, c'est aussi un carrefour de recrutement géant où de nombreuses entreprises tunisiennes et internationales viennent dénicher les meilleurs profils d'ingénieurs tunisiens.`
    };
  }
  
  if (normalized.includes("ai ad award")) {
    return {
      subtitle: "ESPRIT et l'AFI s'associent pour redynamiser l'économie locale par l'intelligence artificielle.",
      readingTime: "4 min de lecture",
      authorName: "Dr. Salim Bouzid",
      authorRole: "Expert Intelligence Artificielle & Marketing",
      authorAvatar: "SB",
      keyStat: "14,000 TND",
      keyStatLabel: "Grand Prix octroyé à l'équipe gagnante",
      quoteText: "L'IA générative nous permet de projeter et valoriser les zones industrielles tunisiennes dans le futur en quelques clics.",
      quoteAuthor: "Amine Chaabane, Lead Developer de l'équipe lauréate",
      highlights: [
        "155 participants répartis en équipes multidisciplinaires pendant 48 heures de hackathon.",
        "Création de jumeaux numériques et de visuels marketing générés par IA de pointe.",
        "Mise en valeur du potentiel logistique et d'infrastructure de la Tunisie."
      ],
      fullMarkdown: `## Le Futur des Zones Industrielles avec la GenAI\n\nCo-organisé par l'Agence Foncière Industrielle (AFI) et l'école d'ingénieurs ESPRIT, le hackathon **AI AD Award** a mis au défi la jeune génération d'utiliser la puissance de l'IA Générative pour repenser le marketing territorial.\n\n### Le Projet Lauréat\n\nL'équipe gagnante a créé un **jumeau numérique intelligent** simulant les flux d'énergie et la logistique en temps réel de la zone industrielle de Bizerte. En combinant Midjourney pour les visuels d'aménagement et ChatGPT pour la génération de profils d'attractivité, le projet a ébloui le jury.\n\n### Attractivité et Innovation\n\nCe type d'initiative démontre que l'IA n'est pas qu'un outil spéculatif, mais un levier concret pour attirer des investissements industriels majeurs en modernisant l'accès aux données territoriales.`
    };
  }
  
  if (normalized.includes("hackathon municipal")) {
    return {
      subtitle: "Une tournée nationale d'innovation ouverte pour relever les défis de la gestion urbaine tunisienne.",
      readingTime: "3 min de lecture",
      authorName: "Anis Mezghani",
      authorRole: "Urbaniste & Mentor Ville Durable",
      authorAvatar: "AM",
      keyStat: "50 Ans",
      keyStatLabel: "FNCT - Célébration utile & active",
      quoteText: "Nous co-construisons les villes tunisiennes de demain en impliquant directement les citoyens et les talents académiques.",
      quoteAuthor: "Directeur de la Transition Digitale de la FNCT",
      highlights: [
        "Tournée régionale passant par Sfax, Sidi Bouzid et Tozeur avec plus de 50 innovations.",
        "Solutions concrètes axées sur l'écologie, l'éclairage intelligent et le tri des déchets.",
        "Financement et déploiement garantis par les municipalités partenaires pour les vainqueurs."
      ],
      fullMarkdown: `## Célébration Utile et Participative\n\nPour marquer son 50ème anniversaire, la Fédération Nationale des Communes Tunisiennes (FNCT) a lancé le **Hackathon Municipal**, un programme d'innovation décentralisé destiné aux étudiants et chercheurs.\n\n### Des Défis de Proximité\n\nChaque ville étape a ses propres problématiques :\n- **Sfax** s'est concentrée sur le tri sélectif des déchets grâce aux applications connectées.\n- **Tozeur** a exploré des solutions d'irrigation intelligente pour préserver les palmeraies.\n- **Sidi Bouzid** a mis l'accent sur les plateformes collaboratives de signalement citoyen.\n\n### De l'Idée au Déploiement\n\nLes 3 meilleurs projets de chaque région bénéficieront d'un accompagnement technique et financier pour être intégrés directement dans les plans d'aménagement urbain locaux.`
    };
  }
  
  if (normalized.includes("startups hiring") || normalized.includes("hiring junior")) {
    return {
      subtitle: "Découvrez les entreprises en pleine expansion qui proposent les meilleurs environnements pour débuter en 2026.",
      readingTime: "4 min de lecture",
      authorName: "Wassim Trabelsi",
      authorRole: "Coach Carrière & DRH",
      authorAvatar: "WT",
      keyStat: "3,000 TND",
      keyStatLabel: "Salaire d'entrée Junior Maximum",
      quoteText: "Le marché 2026 recherche des profils adaptables, capables de collaborer efficacement avec des outils d'assistance IA.",
      quoteAuthor: "Yassine Ben FSB, Alumni FSB & Ingénieur Principal",
      highlights: [
        "Mentorat technique structuré et opportunités de mobilité internationale.",
        "Expensya et Vneuron en tête des intentions d'embauche de juniors.",
        "GOMYCODE recrute ses meilleurs diplômés pour leur expansion continue."
      ],
      fullMarkdown: `## Un Marché Dynamique pour les Jeunes Diplômés\n\nL'année 2026 s'avère particulièrement propice pour les nouveaux diplômés des filières informatiques et d'ingénierie. Plusieurs startups tunisiennes de premier ordre déploient de vastes campagnes de recrutement de juniors.\n\n### Les Leaders du Classement\n\n1. **Expensya** : Acteur incontournable de la Fintech, l'entreprise propose des salaires attractifs allant jusqu'à **3000 TND** pour les juniors, accompagnés de formations continues de haut niveau.\n2. **Vneuron** : Un fleuron technologique spécialisé dans la conformité et la numérisation des processus bancaires (RegTech), idéal pour forger de solides compétences en ingénierie logicielle.\n3. **GOMYCODE** : Grâce à son expansion continue dans plus de 10 pays en Afrique et au Moyen-Orient, l'entreprise offre des parcours d'évolution interne exceptionnels.\n\n### Comment se démarquer ?\n\nLes recruteurs insistent sur deux critères majeurs : un profil GitHub actif contenant des projets réels, et une bonne compréhension des architectures cloud modernes.`
    };
  }
  
  if (normalized.includes("n8n tunisia")) {
    return {
      subtitle: "Les professionnels de la tech s'unissent pour démocratiser l'automatisation en entreprise.",
      readingTime: "3 min de lecture",
      authorName: "Emna Mansour",
      authorRole: "Consultante en Automatisation & DevOps",
      authorAvatar: "EM",
      keyStat: "150+",
      keyStatLabel: "Inscrits en moins de 24 heures",
      quoteText: "L'automatisation libère du temps créatif. n8n permet aux équipes de bâtir des workflows ultra-puissants sans dépendance technique.",
      quoteAuthor: "Mohamed Ali, Fondateur du Meetup n8n Tunisie",
      highlights: [
        "Premier événement physique officiel dédié à l'outil d'automatisation open-source n8n.",
        "Retours d'expérience pratiques sur le couplage d'API complexes et d'agents IA.",
        "Atelier pratique exclusif de création de nœuds personnalisés."
      ],
      fullMarkdown: `## L'Ère de l'Entreprise Connectée\n\nLa communauté technologique tunisienne s'enrichit d'un nouveau groupe avec le lancement officiel du meetup **n8n Tunisie**. L'édition inaugurale se déroulera à Hammamet, réunissant experts et néophytes.\n\n### Pourquoi n8n séduit ?\n\nContrairement aux solutions propriétaires coûteuses, n8n propose une approche open-source extensible qui garantit la souveraineté des données. Il permet de connecter facilement des CRM, des serveurs de bases de données et des modèles d'IA comme Gemini ou OpenAI.\n\n### Au Programme du Meetup\n\nDes démonstrations en direct montreront comment automatiser l'accueil des nouveaux étudiants, comment générer des rapports de notes automatiques, et comment intégrer un chatbot de support sur WhatsApp en moins de 30 minutes.`
    };
  }
  
  if (normalized.includes("huawei ict")) {
    return {
      subtitle: "Excellence tunisienne au concours mondial de référence en réseau, cloud et informatique.",
      readingTime: "4 min de lecture",
      authorName: "Prof. Hechmi Karray",
      authorRole: "Responsable Réseaux & Télécoms FSB",
      authorAvatar: "HK",
      keyStat: "3 Équipes",
      keyStatLabel: "Qualifiées d'office pour Shenzhen",
      quoteText: "Se mesurer aux meilleurs mondiaux à Shenzhen est un défi extraordinaire qui valide la qualité académique tunisienne.",
      quoteAuthor: "Amine, Membre de l'équipe Cloud d'ENSI",
      highlights: [
        "Plus de 20 000 candidats africains éliminés lors des sélections régionales.",
        "Tekup, ENSI et Esprit représenteront la Tunisie lors de la finale mondiale.",
        "Bourses prestigieuses et opportunités d'intégration chez Huawei en Asie."
      ],
      fullMarkdown: `## La Tunisie au Sommet de l'ICT Africain\n\nLes étudiants tunisiens continuent d'illustrer le savoir-faire national à l'échelle internationale. Trois équipes d'élite issues de **Tekup, ENSI et Esprit** se sont brillamment qualifiées pour la prestigieuse finale mondiale du **Huawei ICT Competition** à Shenzhen, en Chine.\n\n### Les Axes du Concours\n\nLa compétition est scindée en trois parcours technologiques exigeants :\n- **Network Track** : Configuration avancée de commutateurs, cybersécurité des réseaux d'entreprise.\n- **Cloud Track** : Conception d'architectures cloud hybrides intelligentes et sécurisées.\n- **Computing Track** : Manipulation de conteneurs, architectures de calcul intensif et processeurs de dernière génération.\n\n### Un Tremplin de Carrière Exceptionnel\n\nEn plus des prix et trophées, les lauréats bénéficieront d'un contact privilégié avec les ingénieurs de recherche et développement de Huawei à Shenzhen, leur ouvrant de grandes portes pour leur carrière future.`
    };
  }
  
  if (normalized.includes("ooun")) {
    return {
      subtitle: "L'OOUN insuffle une dimension sociale et durable à la créativité technologique des étudiants.",
      readingTime: "4 min de lecture",
      authorName: "Sonia Bellamine",
      authorRole: "Sociologue de l'Éducation FSB",
      authorAvatar: "SB",
      keyStat: "25",
      keyStatLabel: "Projets solidaires et écologiques",
      quoteText: "La technologie n'a de valeur que si elle sert à réduire les inégalités et à préserver notre environnement local.",
      quoteAuthor: "M. le Directeur Général de l'OOUN",
      highlights: [
        "Collaboration inédite entre l'OOUN et l'Université de Manouba.",
        "Formations intensives en Design Thinking et méthodologie Lean Startup.",
        "Accompagnement de 6 mois en pépinière d'entreprises pour les gagnants."
      ],
      fullMarkdown: `## Mettre la Tech au Service de l'Humain\n\nOrganisé à la Cité des Sciences de Tunis, le premier **Hackath'OOUN** s'est concentré sur la promotion de l'entrepreneuriat social au sein de l'université tunisienne. Pendant 72 heures, les équipes ont planché sur des solutions répondant aux objectifs de développement durable des Nations Unies.\n\n### L'Innovation Sociale à l'Honneur\n\nLe projet phare ayant remporté l'adhésion unanime est **HandiCap-Link**. Conçu par une équipe d'étudiants enthousiastes, il s'agit d'un système d'adaptation automatique de contenus académiques (cours en PDF, vidéos) grâce à l'IA pour les étudiants malvoyants ou malentendants.\n\n### Pérennisation des Idées\n\nContrairement aux hackathons classiques où les projets dorment dans des tiroirs, l'OOUN s'engage à financer l'hébergement et le mentorat des trois meilleurs projets au sein de sa pépinière sociale pour assurer leur lancement commercial.`
    };
  }
  
  if (normalized.includes("triangle") || normalized.includes("partenariat")) {
    return {
      subtitle: "Le nouveau cadre de collaboration dévoilé au TDS 10 pour booster les services publics de demain.",
      readingTime: "5 min de lecture",
      authorName: "Sami Ben Slimane",
      authorRole: "Analyste Économie Digitale",
      authorAvatar: "SS",
      keyStat: "TDS 10",
      keyStatLabel: "Sommet de la Transformation Tunisienne",
      quoteText: "Il faut cesser de voir les startups comme de simples prestataires, mais plutôt comme des partenaires de co-création stratégique.",
      quoteAuthor: "Président de la commission TDS",
      highlights: [
        "Unification stratégique : Secteur Public, Secteur Privé, et Startups.",
        "Lancement d'un Sandbox réglementaire national pour accélérer les tests.",
        "Focus initial sur la santé numérique et la modernisation administrative."
      ],
      fullMarkdown: `## Une Nouvelle Vision pour la Numérisation\n\nLe Tunisia Digital Summit (**TDS 10**) a été le théâtre d'une annonce stratégique majeure : l'introduction du concept de **Partenariat Triangle**. Ce modèle propose de redéfinir la manière dont l'État et les grands groupes collaborent avec l'écosystème des startups.\n\n### Les Trois Piliers\n\n- **Le Public (L'État)** : Rôle de régulateur et d'agrégateur d'infrastructures. Il offre un terrain d'expérimentation légal (sandbox).\n- **Le Privé (Les Grandes Entreprises)** : Fournit le capital d'amorçage, le mentorat métier et les débouchés industriels.\n- **Les Startups** : Insufflent l'innovation de pointe, l'agilité technique et la rupture technologique nécessaire.\n\n### Des Applications Imminentes\n\nLes premiers chantiers identifiés concernent la numérisation complète de l'état civil tunisien et le déploiement national du dossier médical partagé, deux projets d'envergure qui bénéficieront de cette synergie tripartite.`
    };
  }
  
  // Custom generated or fallback database articles
  return {
    subtitle: "Découvrez les détails exclusifs et l'analyse approfondie de cet événement universitaire marquant.",
    readingTime: "2 min de lecture",
    authorName: "Rédaction FSB Bridge",
    authorRole: "Équipe Editoriale",
    authorAvatar: "FB",
    keyStat: "FSB",
    keyStatLabel: "Faculté des Sciences de Bizerte",
    quoteText: "La diffusion rapide et transparente de l'information est essentielle pour stimuler l'innovation et fédérer notre communauté académique.",
    quoteAuthor: "Direction Générale FSBridge",
    highlights: [
      "Un suivi rigoureux de l'actualité scientifique et étudiante tunisienne.",
      "Des opportunités régulières de formation, de concours et de réseautage.",
      "Engagement continu de la faculté dans la transition numérique et l'excellence."
    ],
    fullMarkdown: `## Actualité Universitaire FSB\n\n${fallbackContent}`
  };
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
    transition={{ delay: index < 3 ? index * 0.08 : 0, duration: 0.4 }}
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
}) => {
  const extra = getArticleExtra(article.title, article.content);
  
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 scrollbar-thin"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="retro-card w-full max-w-4xl overflow-hidden bg-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Banner Image with Overlay Buttons */}
          <div className="relative aspect-[21/9] w-full border-b-2 border-foreground overflow-hidden bg-muted">
            <img
              src={article.image_url ?? `https://picsum.photos/seed/${article.id}/800/400`}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Dark gradient overlay on bottom of image for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-background border-2 border-foreground rounded-full hover:bg-foreground hover:text-background transition-all active:translate-x-[2px] active:translate-y-[2px]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Grid Layout: Main Content (Left) & Sidebar (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-foreground">
            
            {/* Main Content Column */}
            <div className="md:col-span-2 p-6 md:p-8 border-r-0 md:border-r-2 border-foreground space-y-6">
              
              {/* Category tag & reading time */}
              <div className="flex items-center gap-3">
                <span className={`retro-tag text-[10px] ${getCategoryStyle(article.category)}`}>
                  <Tag size={10} />
                  {article.category}
                </span>
                <span className="text-xs font-mono text-muted-foreground bg-muted border border-foreground/10 px-2.5 py-1 rounded">
                  ⏱️ {extra.readingTime}
                </span>
              </div>

              {/* Title & Catchy Subtitle */}
              <div className="space-y-3">
                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl leading-tight text-foreground">
                  {article.title}
                </h1>
                <p className="text-base md:text-lg text-foreground/80 font-medium italic border-l-4 border-accent pl-4 py-0.5">
                  "{extra.subtitle}"
                </p>
              </div>

              {/* Author & Date Card (Retro Banner) */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 border-2 border-foreground/10 rounded-xl">
                <div className="w-10 h-10 rounded-full border-2 border-foreground bg-accent text-foreground font-display flex items-center justify-center shrink-0">
                  {extra.authorAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {extra.authorName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {extra.authorRole}
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-muted-foreground border-l border-foreground/10 pl-3 shrink-0">
                  Publié le <br />
                  <span className="font-semibold text-foreground">{formatDate(article.created_at)}</span>
                </div>
              </div>

              {/* Extended Markdown Content */}
              <div className="prose-like space-y-4 pt-2">
                {renderMarkdown(extra.fullMarkdown || article.content)}
              </div>

              {/* Quote Block with Retro styling */}
              {extra.quoteText && (
                <div className="retro-card bg-accent/10 border-l-8 border-l-accent p-5 my-6 space-y-2">
                  <p className="text-sm md:text-base font-semibold leading-relaxed text-foreground italic">
                    « {extra.quoteText} »
                  </p>
                  <p className="text-xs font-bold text-muted-foreground text-right">
                    — {extra.quoteAuthor}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="p-6 md:p-8 bg-muted/20 space-y-6">
              
              {/* Highlight statistics box */}
              <div className="retro-card bg-accent text-foreground p-5 space-y-1.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">Chiffre Clé</div>
                <div className="font-display text-2xl md:text-3xl leading-none py-1">
                  {extra.keyStat}
                </div>
                <div className="text-[11px] font-mono font-medium leading-tight text-foreground/80">
                  {extra.keyStatLabel}
                </div>
              </div>

              {/* Key Bullet Highlights */}
              <div className="retro-card bg-card p-5 space-y-4">
                <h3 className="font-display text-xs uppercase tracking-wide border-b-2 border-foreground pb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent" /> Points Forts
                </h3>
                <ul className="space-y-3.5 text-xs text-muted-foreground">
                  {extra.highlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-accent shrink-0 font-bold mt-0.5">⚡</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fake interactions (Retro share buttons) */}
              <div className="retro-card bg-card p-5 space-y-4">
                <h3 className="font-display text-xs uppercase tracking-wide border-b-2 border-foreground pb-2">
                  Interagir
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button className="flex items-center justify-center gap-1 py-2 border-2 border-foreground rounded hover:bg-accent hover:text-foreground transition font-semibold active:translate-x-[1px] active:translate-y-[1px]">
                    👍 Utile
                  </button>
                  <button className="flex items-center justify-center gap-1 py-2 border-2 border-foreground rounded hover:bg-accent hover:text-foreground transition font-semibold active:translate-x-[1px] active:translate-y-[1px]">
                    🔁 Partager
                  </button>
                </div>
              </div>

              {/* FSB Portal Info / Notice */}
              <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-foreground/15 pt-4 space-y-2">
                <p>
                  📢 <strong>Note officielle :</strong> Cet article est certifié par la cellule de communication de la FSB.
                </p>
                <p>
                  Pour toute correction ou contribution, veuillez contacter le secrétariat ou envoyer un mail à <code>contact@fsb.rnu.tn</code>.
                </p>
              </div>

            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-muted/45 flex items-center justify-between border-t border-foreground/10">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-background rounded-full text-xs font-semibold hover:bg-foreground hover:text-background transition active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ArrowLeft size={12} />
              Retour aux actualités
            </button>
            
            <span className="text-[10px] font-mono text-muted-foreground">
              Réf: {article.id.slice(0, 8)}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Actualites = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    setAgentMessage("🤖 [Agent] Analyse de l'actualité universitaire...");
    
    const t1 = setTimeout(() => {
      setAgentMessage("🔍 [Agent] Recherche de sources fiables de la FSB...");
    }, 700);

    const t2 = setTimeout(() => {
      setAgentMessage("✍️ [Agent] Rédaction et validation de l'article...");
    }, 1400);

    const t3 = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
      setIsGenerating(false);
    }, 2000);

    timeoutsRef.current = [t1, t2, t3];
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

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
      setVisibleCount(3);
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
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-6">
              {articles.slice(0, visibleCount).map((a, i) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  index={i}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>

            {/* Generate Article Button */}
            {visibleCount < articles.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="retro-card retro-card-hover bg-accent text-foreground hover:bg-foreground hover:text-background font-display px-8 py-4 border-2 border-foreground rounded-full flex items-center gap-3 transition-all duration-300 disabled:opacity-85 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-hard"
                >
                  <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} />
                  {isGenerating ? "Génération..." : "Générer un article"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-foreground py-8 text-center text-sm text-muted-foreground mt-8">
        © {new Date().getFullYear()} FSBridge — Faculté des Sciences de Bizerte
      </footer>

      {/* ── Agent Loading Status Popup ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 retro-card bg-foreground text-background border-2 border-background p-4 shadow-hard max-w-sm flex items-center gap-3.5 font-mono text-xs"
            style={{
              boxShadow: "4px 4px 0 0 hsl(var(--accent))",
            }}
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-accent mb-0.5 tracking-wider uppercase">
                Agent Actif • FSBridge AI
              </div>
              <p className="truncate text-background/90 font-medium">
                {agentMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Article detail modal ── */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default Actualites;
