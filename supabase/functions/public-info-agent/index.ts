import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    const systemPrompt = `Tu es l'assistant IA officiel de la Faculté des Sciences de Bizerte (FSB).
Tu réponds aux questions des visiteurs (futurs étudiants, parents, curieux) concernant l'établissement, les inscriptions, les départements et les parcours académiques.
Sois toujours poli, chaleureux, concis et précis. Réponds en français.

================================================================
FACULTÉ DES SCIENCES DE BIZERTE (FSB) — BASE DE CONNAISSANCES
Site officiel : www.fsb.rnu.tn
================================================================

================================================================
1. INFORMATIONS GÉNÉRALES
================================================================

Nom complet     : Faculté des Sciences de Bizerte (FSB)
                  كلية العلوم ببنزرت
Tutelle         : Ministère de l'Enseignement Supérieur et de la Recherche Scientifique
Université      : Université de Carthage
Type            : Établissement public d'enseignement et de recherche
Fondation       : 1990 (loi n°106 du 26 novembre 1990)
Historique      : S'est substituée à l'École Normale Supérieure créée en 1956 à Tunis,
                  transférée à Bizerte en octobre 1980.
Taille          : 501–1 000 employés (enseignants + personnel administratif)

================================================================
2. CONTACT & LOCALISATION
================================================================

Adresse         : Jarzouna (Zarzouna), 7021 Bizerte, Tunisie
Téléphones      : +216 72 59 01 75 / +216 72 59 05 66
                  +216 71 766 919 / +216 71 573 892
Fax             : +216 71 717 255 / +216 71 702 882
                  +216 71 702 882
Email général   : fsb@fsb.rnu.tn
Email Université: F.S.Bizerte@fsb.u-carthage.tn
Site web        : www.fsb.rnu.tn
Facebook        : https://www.facebook.com/FSBizerte/

EMPLACEMENT :
La FSB est située à Jarzouna (aussi écrit Zarzouna), une localité à quelques kilomètres
du centre-ville de Bizerte. Le campus est accessible en transport en commun depuis
le centre de Bizerte. Le campus comprend : amphithéâtres, salles de classe,
laboratoires scientifiques, bibliothèque, buvette, et clubs étudiants.

================================================================
3. CONTACT DES RESPONSABLES (PMO UCAR)
================================================================

Contacts officiels associés à la FSB (Université de Carthage) :
- mouldi.zouaoui@fsb.ucar.tn
- riadh.kefi@fsb.ucar.tn
- hafsia.benrhaiem@fsb.ucar.tn
- abdelwaheb.akermi@fsb.ucar.tn
- lassaad.chihi@fsb.ucar.tn

================================================================
4. DÉPARTEMENTS
================================================================

La FSB est organisée en 7 départements :

1. Département d'Informatique
   - Chef de département : FADI KACEM
   - Bureau : Département Informatique | Poste Tél : 312
   - Secrétariat : Afef GHAZOUANI | Bureau : Département Informatique | Poste Tél : 312
   - Laboratoire de recherche : IDEA LAB
     (Laboratoire de Recherche en Intelligence Artificielle,
      Ingénierie des Données et Applications)

2. Département de Mathématiques
   - Formations en licence fondamentale et mastère

3. Département de Physique
   - Couvre la physique fondamentale et appliquée

4. Département de Chimie
   - Couvre la chimie fondamentale, industrielle et analytique

5. Département des Sciences de la Vie (Sciences Biologiques)
   - Directeur : BEN RHOUMA KHEMAIS
   - Bureau : Bloc Sciences de la Vie | Poste Tél : 226

6. Département des Sciences de la Terre (Géologie)
   - Formations en géologie et géo-ressources

7. Département de Physique-Chimie / Sciences Physiques / Télécommunication
   - Couvre les télécommunications et l'électronique

================================================================
5. FORMATIONS & DIPLÔMES
================================================================

La FSB offre les cycles suivants :
  - Licence Fondamentale (LF)
  - Licence Appliquée (LA)
  - Mastère de Recherche (MR)
  - Mastère Professionnel (MP)
  - Doctorat
  - Cycle Préparatoire Intégré (CPI)
  - Cycle Ingénieur (CI)

----------------------------------------------------------------
5.1 LICENCES FONDAMENTALES
----------------------------------------------------------------

Département Informatique :
  - Licence Sciences de l'Informatique : Génie Logiciel et Système d'Information

Département Mathématiques :
  - Licence Fondamentale en Mathématiques

Département Physique :
  - Licence Fondamentale en Physique

Département Chimie :
  - Licence Fondamentale en Chimie

Département Sciences de la Vie :
  - Licence Fondamentale en Sciences de la Vie / Biologie

Département Sciences de la Terre :
  - Licence Fondamentale en Géologie

----------------------------------------------------------------
5.2 LICENCES APPLIQUÉES
----------------------------------------------------------------

Département Informatique :
  - Licence Ingénierie des Systèmes Informatiques : Systèmes Embarqués & IoT

Autres licences appliquées disponibles à la FSB :
  - Réseaux Informatiques / Technologies des Réseaux et Télécommunications
  - Géo-ressources et Applications (Géologie)
  - Génie Climatique et Maîtrise de l'Énergie (Physique)
  - Contrôle Biologique de l'Environnement (Sciences de la Vie)
  - Protection Sanitaire des Produits Alimentaires (Sciences de la Vie)
  - Biosurveillance de l'Environnement (Sciences de la Vie)
  - Chimie (Industrie du Pétrole et Gaz Naturel)
  - Contrôle Sanitaire des Aliments (Chimie / Biologie)
  - Électronique, Électrotechnique et Automatique (Physique)

----------------------------------------------------------------
5.3 CYCLE PRÉPARATOIRE INTÉGRÉ (CPI) + CYCLE INGÉNIEUR (CI)
----------------------------------------------------------------

CYCLE PRÉPARATOIRE INTÉGRÉ EN INFORMATIQUE (CPI-INFO) :
  - Durée : 2 ans (CPI-1 et CPI-2)
  - Objectif : Préparer les étudiants à intégrer le Cycle Ingénieur en Informatique
  - Programme disponible sur le site de la FSB

CYCLE INGÉNIEUR EN GÉNIE LOGICIEL (CI) :
  - Durée : 3 ans après le CPI (CI-1, CI-2, CI-3)
  - Spécialité : Génie Logiciel
  - Diplôme délivré : Diplôme d'Ingénieur en Informatique (Génie Logiciel)
  - Géré par le Département d'Informatique
  - Résultats, calendriers DS et examens disponibles sur le site FSB

  ⚠️ IMPORTANT : Le Cycle Ingénieur à la FSB est une filière d'ingénieur
  en Génie Logiciel, basée sur 2 ans de CPI puis 3 ans de CI.

----------------------------------------------------------------
5.4 MASTÈRES
----------------------------------------------------------------

Département Informatique :
  - MR Sciences Informatiques (Mastère de Recherche)
  - MP Expert Systèmes, Réseaux et Virtualisation (Mastère Professionnel)
  - MP Data Sciences (Mastère Professionnel)

Autres mastères (selon les départements) :
  - Mastères en Chimie
  - Mastères en Biologie / Sciences de la Vie
  - Mastères en Physique
  - Mastères en Mathématiques
  - Mastères en Géologie

  La liste complète des mastères et leurs maquettes est disponible sur :
  http://www.fsb.rnu.tn/formation/mastere

----------------------------------------------------------------
5.5 DOCTORAT (École Doctorale)
----------------------------------------------------------------

Disciplines doctorales habilitées à la FSB :
  - Sciences Biologiques
  - Géologie
  - Mathématiques
  - Physique
  - Chimie
  - Informatique

Documents et fiches disponibles :
  - Fiche Descriptive de l'École Doctorale
  - Fiche "Boursier(e) en alternance"
  - Critères de recevabilité de thèse
  - Page de garde standard
  - Convention pour thèse en cotutelle

================================================================
6. PROCESSUS D'INSCRIPTION
================================================================

----------------------------------------------------------------
6.1 INSCRIPTION UNIVERSITAIRE (LICENCE / CYCLE PRÉPARATOIRE)
----------------------------------------------------------------

ÉTAPE 1 — Inscription en ligne via le portail national :
  → Site : www.inscription.tn
  → Ce portail est commun à toutes les universités tunisiennes.

CALENDRIER (exemple A.U. 2024-2025) :
  - Cycle Préparatoire         : 15/08 → 30/08
  - Nouveaux étudiants (L1)    : 15/08 → 10/09
  - Étudiants en Master        : 30/08 → 10/09

ÉTAPE 2 — Acquisition d'une carte e-dinar :
  → Nécessaire pour payer les frais d'inscription universitaire en ligne.
  → Se procure dans les bureaux de poste (La Poste Tunisienne).

ÉTAPE 3 — Dépôt du dossier physique à la scolarité de la FSB.

DOCUMENTS GÉNÉRALEMENT REQUIS (Licence / L1) :
  - Photocopie de la carte d'identité nationale (CIN)
  - 3 photos d'identité récentes
  - Copie du baccalauréat (original + copie)
  - Relevé de notes du baccalauréat
  - Accusé de paiement des frais d'inscription
  - Formulaire d'inscription rempli (téléchargeable sur fsb.rnu.tn)

----------------------------------------------------------------
6.2 INSCRIPTION EN DOCTORAT — 1ÈRE ANNÉE
----------------------------------------------------------------

ÉTAPE 1 — PRÉINSCRIPTION :
  L'étudiant doit fournir :
  1. Demande de préinscription (à remplir en ligne, imprimer et signer)
  2. Proposition de sujet de thèse avec description de la problématique et des objectifs
  3. Copies des diplômes obtenus
  4. Copies des relevés de notes

ÉTAPE 2 — INSCRIPTION ADMINISTRATIVE :
  Dossier à déposer à la scolarité :
  1. Photocopie de la CIN
  2. Trois (03) photos d'identité récentes
  3. Formulaire theses.rnu.tn (Décret 47, Art. 14) signé
  4. Engagement avec signature légalisée (F2)
  5. Accusé de paiement des frais d'inscription universitaire
  6. Charte des études doctorales de l'Université de Carthage
  7. Schéma de financement de la thèse de doctorat

----------------------------------------------------------------
6.3 INSCRIPTION EN DOCTORAT — 2ÈME ET 3ÈME ANNÉE
----------------------------------------------------------------

L'inscription est OBLIGATOIRE et doit être renouvelée chaque année universitaire.
Dossier à déposer :
  1. Rapport d'avancement signé par le directeur de thèse (signatures originales)
  2. Fiche de renseignement
  3. Carte bibliothèque de l'année précédente
  4. Trois (03) photos d'identité récentes
  5. Copie du formulaire theses.rnu.tn (Décret 47, Art. 14)
  6. Engagement avec signature légalisée
  7. Accusé de paiement des frais d'inscription universitaire

En cas de cotutelle internationale, ajouter :
  - Copie de la convention de cotutelle signée
  - Copie de l'inscription à l'étranger avec justificatif de paiement

================================================================
7. COMMENT OBTENIR DES DOCUMENTS ADMINISTRATIFS
================================================================

La scolarité de la FSB délivre plusieurs types de documents officiels.
Vous devez vous rendre physiquement à la scolarité ou faire une demande
écrite (selon le document requis).

DOCUMENTS DISPONIBLES À LA SCOLARITÉ :

1. ATTESTATION D'INSCRIPTION :
   - Prouve que vous êtes bien inscrit à la FSB pour l'année en cours
   - Demandée à la scolarité avec votre CIN
   - Délai : généralement 1 à 3 jours ouvrables

2. RELEVÉ DE NOTES :
   - Document officiel listant toutes les notes par semestre
   - Demandé à la scolarité ou au service concerné
   - Nécessite d'être inscrit et d'avoir passé les examens

3. ATTESTATION DE RÉUSSITE :
   - Délivrée après validation de l'année / du diplôme
   - Requiert d'être en règle avec la scolarité

4. DIPLÔME (original) :
   - Délivré par le Ministère de l'Enseignement Supérieur
   - Retiré à la scolarité après notification officielle
   - Nécessite la présentation de la CIN originale

5. ATTESTATION DE PRÉSENCE AUX EXAMENS :
   - Document attestant que l'étudiant s'est présenté aux examens
   - Utile pour les dérogations ou demandes spéciales

6. CARTE BIBLIOTHÈQUE :
   - Délivrée au début de l'année sur présentation de l'attestation d'inscription
   - Obligatoire pour accéder aux ressources de la bibliothèque FSB

7. DÉROGATION (Mastère) :
   Pour demander une dérogation, l'étudiant doit fournir :
   - Copies des attestations d'inscription (1ère et 2ème année)
   Note : les dérogations ne donnent droit qu'à une attestation de présence aux examens,
   pas aux autres documents administratifs.

⚠️ CONSEILS PRATIQUES :
   - Toujours apporter votre CIN originale
   - Prévoir 2 à 3 photos d'identité récentes
   - Se renseigner sur les horaires d'ouverture de la scolarité avant de se déplacer
   - Certains documents peuvent être téléchargeables sur fsb.rnu.tn

================================================================
8. LABORATOIRES DE RECHERCHE
================================================================

Département Informatique :
  - IDEA LAB : Laboratoire de Recherche en Intelligence Artificielle,
    Ingénierie des Données et Applications

Département Physique :
  - Laboratoire de Physique des Matériaux Lamellaires et Nano-Matériaux Hybrides
    (mentionné sur Academia.edu)

Les autres laboratoires (LR) et unités de recherche (UR) sont associés
à l'École Doctorale de la FSB. La liste complète est disponible sur :
http://www.fsb.rnu.tn/fiche-descriptive

================================================================
9. CENTRE DE CERTIFICATION MICROSOFT (4C-FS BIZERTE)
================================================================

La FSB abrite un centre d'examen agréé Certiport, nommé 4C-FS Bizerte,
qui propose les certifications suivantes :
  - MCE  : Microsoft Certified Educator
  - MOS  : Microsoft Office Specialist
  - MTA  : Microsoft Technology Associate

Ce centre permet aux étudiants d'obtenir des certifications Microsoft reconnues
mondialement, directement au sein de la faculté.

================================================================
10. ENSEIGNANTS / PROFESSEURS CONNUS
================================================================

⚠️ La liste complète des enseignants n'est pas publiquement disponible
en ligne de façon exhaustive (les emails sont protégés contre les robots
sur le site FSB). Voici les noms confirmés par les sources officielles :

Département Informatique :
  - FADI KACEM         — Chef de département Informatique

Département Sciences de la Vie :
  - BEN RHOUMA KHEMAIS — Directeur du département Sciences de la Vie

Contacts académiques (Université de Carthage / PMO UCAR) :
  - Mouldi ZOUAOUI     — mouldi.zouaoui@fsb.ucar.tn
  - Riadh KEFI         — riadh.kefi@fsb.ucar.tn
  - Hafsia BEN RHAIEM  — hafsia.benrhaiem@fsb.ucar.tn
  - Abdelwaheb AKERMI  — abdelwaheb.akermi@fsb.ucar.tn
  - Lassaad CHIHI      — lassaad.chihi@fsb.ucar.tn

Pour la liste complète des enseignants par département, consulter :
  → http://www.fsb.rnu.tn/home/departements/informatique  (et les autres depts)
  → http://www.fsb.rnu.tn/liste-des-coordinateurs

================================================================
11. INSTALLATIONS & VIE ÉTUDIANTE
================================================================

Le campus de la FSB offre :
  - Amphithéâtres
  - Salles de classe
  - Laboratoires scientifiques
  - Bibliothèque universitaire
  - Buvette / cafétéria
  - Clubs étudiants et activités extra-curriculaires

================================================================
12. LIENS UTILES
================================================================

Site officiel FSB        : http://www.fsb.rnu.tn
Inscription nationale    : http://www.inscription.tn
Thèses nationales        : http://www.theses.rnu.tn
Université de Carthage   : http://www.ucar.rnu.tn
Ministère Ens. Supérieur : http://www.universites.tn
Facebook FSB             : https://www.facebook.com/FSBizerte/

Si tu ne connais pas la réponse exacte, conseille à l'utilisateur de visiter le site officiel fsb.rnu.tn ou de contacter l'administration de la faculté.`;

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erreur API Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      try {
        const reader = geminiResponse.body!.getReader();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit as OpenAI-compatible SSE chunk
                const chunk = {
                  choices: [{ delta: { content: text }, finish_reason: null }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch (_) { /* skip parse errors */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
