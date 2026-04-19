
# Portail Étudiant — Style Retrofly

Une app étudiante en français, système tunisien /20, avec auth, IA conversationnelle, et génération auto de documents PDF. Esthétique inspirée de Retrofly : noir & blanc, gros titres bold, illustrations line-art, cartes gris doux arrondies, micro-animations.

## Direction créative

- **Palette** : fond crème `#FAFAF7`, encre noire `#0A0A0A`, gris doux pour cartes, un seul accent vif (jaune moutarde ou rouge tomette) utilisé avec parcimonie
- **Typo** : grosses display sans-serif pour titres (style Retrofly), Inter pour le corps
- **Illustrations** : line-art noir et blanc (style hand-drawn) pour empty states, hero, badges de réussite
- **Animations** : transitions de page douces, hover tilts sur cartes, compteur animé pour les moyennes, marquee subtile, illustrations qui "respirent"
- **Cartes** : grands radius, ombres minimales, beaucoup d'espace blanc

## Rôles & authentification

- **Étudiant** : email/mot de passe, accès à son espace
- **Admin** : crée comptes étudiants/profs, voit stats globales
- Table `profiles` (infos), table `user_roles` séparée (sécurité), `has_role()` security definer

## Espace Étudiant

1. **Dashboard** — salutation, moyenne générale animée, mention (Passable→Excellent), prochains cours, raccourcis
2. **Mes notes** — par semestre/UE/matière, détail DS + Examen + coefficients, moyenne pondérée, **graphiques d'évolution** (par matière, par semestre)
3. **Mon profil** — infos perso, filière, niveau, photo, modifiable
4. **Mes professeurs** — annuaire avec matières enseignées, contact, bureau
5. **Emploi du temps** — vue semaine
6. **Documents** — demande de :
   - Attestation d'inscription
   - Relevé de notes
   - Attestation de présence
   - Convention de stage
   Suivi du statut (en attente / approuvé / refusé) + téléchargement PDF
7. **Assistant IA** — chat conversationnel qui répond sur grades, moyennes, planning, profs, documents (contexte étudiant injecté côté serveur)

## Espace Admin

1. **Dashboard** — stats : nb étudiants, moyennes par filière, demandes documents, graphiques
2. **Gestion utilisateurs** — créer/éditer étudiants & profs, assigner rôles
3. **Gestion notes** — saisir/modifier les notes
4. **Demandes documents** — voir log des décisions de l'agent IA, override possible

## Agents IA (via Lovable AI)

- **Assistant étudiant** (edge function streaming) — accès aux notes/planning/profs de l'étudiant authentifié, répond en français
- **Agent administratif** (edge function) — auto-approbation intelligente : vérifie éligibilité (étudiant inscrit, à jour), décide approuvé/refusé avec justification, déclenche génération PDF si OK
- **Génération PDF** : templates officiels en français avec en-tête, données étudiant, QR code de vérification, signature

## Données (modèle simplifié)

- `profiles` (étudiants & profs) — nom, prénom, CIN, filière, niveau, photo
- `user_roles` — student | admin | professor
- `subjects` — matière, coefficient, semestre, prof
- `grades` — étudiant, matière, type (DS/Examen), note /20
- `schedule` — créneaux de cours
- `document_requests` — type, statut, décision IA, PDF généré
- `chat_conversations` + `chat_messages` — historique IA

## Pages & routes

`/` (landing publique style Retrofly) · `/auth` · `/dashboard` · `/notes` · `/profil` · `/professeurs` · `/emploi-du-temps` · `/documents` · `/assistant` · `/admin/*`

## Livrable de cette première itération

Tout sauf les données : structure DB complète, auth, layout + navigation animée, landing, dashboard étudiant avec moyenne animée, page notes avec graphiques d'évolution, profil, professeurs, documents (demande + statut), assistant IA streaming, espace admin (stats + gestion utilisateurs + revue documents), edge functions IA + génération PDF. Données de démo seedées pour tester immédiatement.
