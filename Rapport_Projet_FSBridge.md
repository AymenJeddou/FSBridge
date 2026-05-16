# Rapport de Projet : FSBridge
## Système de Gestion et d'Accompagnement Étudiant Intelligent

**Étudiant :** [Ton Nom]
**Institution :** Faculté des Sciences de Bizerte (FSB)
**Date :** 21 Avril 2026
**Projet :** Portail Étudiant FSBridge

---

## 1. Présentation du Projet
**FSBridge** est un portail étudiant de nouvelle génération conçu spécifiquement pour répondre aux besoins des étudiants universitaires tunisiens. Plus qu'un simple outil de consultation de notes, FSBridge se positionne comme un "pont" entre l'étudiant, l'administration et le savoir académique, en intégrant une couche d'intelligence artificielle avancée.

### Objectifs principaux :
- Centraliser les informations académiques (notes, planning, documents).
- Automatiser les tâches administratives courantes.
- Fournir un accompagnement personnalisé via un assistant IA.
- Moderniser l'expérience utilisateur avec une interface "Brutaliste/Retro" haut de gamme.

---

## 2. Architecture Technique (Stack)
Le projet repose sur une architecture moderne utilisant des technologies "cloud-native" et "typesafe" :

| Couche | Technologie | Justification |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Performance, modularité et écosystème riche. |
| **Styling** | Tailwind CSS | Flexibilité totale sur le design system "Retrofly". |
| **Navigation** | React Router | Gestion fluide des pages (Dashboard, Assistant, Profil). |
| **Backend/DB** | Supabase | Base de données PostgreSQL temps réel et authentification sécurisée. |
| **IA** | Gemini AI (Google) | Modèle de langage performant pour l'assistance contextuelle. |
| **Déploiement** | Edge Functions | Exécution des requêtes IA au plus proche de l'utilisateur. |

---

## 3. Fonctionnalités Clés

### 3.1. Dashboard Intelligent
Un tableau de bord central qui résume la situation académique de l'étudiant :
- Calcul automatique de la moyenne générale (Système /20).
- Visualisation des notes par unité d'enseignement (UE).
- Mention automatique selon les barèmes tunisiens.

### 3.2. Assistant IA (FSB Assistant)
L'intelligence artificielle intégrée au portail permet de :
- Répondre à des questions sur l'emploi du temps ou les salles de cours.
- Expliquer des concepts de cours à partir des documents importés.
- Analyser les performances académiques pour suggérer des axes d'amélioration.

### 3.3. Gestion des Documents & Administration
Un module de génération automatique de documents en format PDF :
- Attestations de présence.
- Relevés de notes.
- Conventions de stage (prévu).

### 3.4. Emploi du Temps Dynamique
Une vue claire et responsive du planning hebdomadaire avec identification rapide des types de séances (Cours, TD, TP) et des professeurs responsables.

---

## 4. Design & Ergonomie
Le projet utilise une identité visuelle forte nommée **FSBridge Design System** :
- **Couleurs :** Prédominance du Noir et Jaune (Accent) pour une lisibilité maximale.
- **Typographie :** Utilisation de polices grotesques pour un aspect professionnel et moderne.
- **Interactivité :** Animations fluides (Framer Motion) pour améliorer l'engagement utilisateur sans alourdir l'application.

---

## 5. Perspectives d'Évolution
- **Version Mobile Native :** Développement d'une application mobile pour des notifications push en temps réel.
- **Module Professeur :** Permettre aux enseignants de saisir les notes et de communiquer directement avec les groupes.
- **Intégration Paiement :** Permettre le paiement des frais d'inscription ou des services connexes via le portail.

---

## Conclusion
**FSBridge** n'est pas seulement un projet technique ; c'est une solution concrète visant à digitaliser et améliorer le quotidien des étudiants de la FSB. En combinant la puissance de PostgreSQL et de l'IA (Gemini), le projet offre un outil robuste, sécurisé et véritablement intelligent.
