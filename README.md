# Studio — plateforme de création de sites professionnels

Configurateur visuel qui permet à un professionnel de construire gratuitement la
maquette de son futur site, de la tester comme un vrai visiteur, puis de
découvrir le prix **uniquement à la fin du parcours**.

Ce n'est pas une vitrine de services : c'est un outil commercial. Le client
investit du temps dans son projet, voit le résultat, et devient un prospect
qualifié au moment où le prix apparaît.

- La **spécification produit** fait foi : [`CLAUDE.md`](CLAUDE.md) (58 sections).
- Le **fonctionnement détaillé** de ce qui existe aujourd'hui :
  [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit puis build de production
npm run typecheck
npm run smoke      # scénarios navigateur (voir scripts/README.md)
```

Node 18 requis (contrainte du poste) — d'où Vite 5 et Tailwind 3.4.

## Architecture

Il n'existe **qu'un seul moteur générique** (§48). Aucun métier n'a de builder
dédié : le comportement découle de `activity + objectives + modules + theme +
colors + content`. Ajouter un métier = ajouter une entrée dans
`src/engine/activities.ts`.

```
src/
  engine/            Moteur, sans dépendance à React
    types.ts         Modèle de données du projet
    activities.ts    31 métiers en 6 secteurs + squelettes de pages
    modules.ts       Objectifs → modules → sections
    themes.ts        Les 20 thèmes, sous forme de tokens
    color.ts         HEX/RGB/HSL, génération de palette, contraste WCAG
    imageBank.ts     Banque d'images, 10 catégories
    pricing.ts       Pricing engine + règle d'acompte, piloté par PricingRules
    status.ts        Cycle de vie d'un projet
    assistant.ts     Assistant de création (analyse locale, pas de modèle)
    project.ts       Fabrique de projet, application métier/thème
  renderer/          Rendu du site du client
    tokens.ts        Thème → styles concrets (le seul endroit où ça se produit)
    sectionDefs.ts   Catalogue déclaratif des 17 sections
    Sections.tsx     Rendu des sections
    SiteRenderer.tsx Navigation, sections, pied de page
    samples.ts       Contenu d'exemple tant que le client n'a rien saisi
    commerce.ts      Panier et commande du site du client
  store/
    reducer.ts       Toutes les mutations du projet
    ProjectStore.tsx Contexte + undo/redo + autosave
    db.ts            Persistance Dexie (projets, versions, leads)
  ui/                Primitives partagées de la plateforme
  features/          Un dossier par écran
    landing, onboarding, builder, preview, final, tv, admin
scripts/             Scénarios de test joués dans un vrai navigateur
```

Deux points d'architecture portent tout le reste :

- **`renderer/tokens.ts`** est le seul endroit où un thème devient du CSS. Les
  sections ne connaissent que ces helpers, jamais un `themeId`. C'est ce qui
  permet à 20 thèmes d'être réellement différents sans un seul composant dédié.
- **`renderer/sectionDefs.ts`** décrit chaque section et ses champs éditables.
  Le panneau de propriétés du builder est **généré** à partir de ce catalogue :
  ajouter une section ne demande aucun formulaire supplémentaire.

## Deux invariants à ne pas casser

1. **Aucun prix avant la page finale** (§56). Le devis est calculé en continu par
   `computeQuote()` et exposé via `useProject().quote`, mais il ne doit être rendu
   qu'une fois `project.priceRevealed` à `true`. Les libellés « Afficher mes
   tarifs » (§7) et « Afficher les prix » (§20) concernent le tarif **du client
   sur son propre site** et sont légitimes partout.
2. **Aucun tarif codé en dur** (§31, §38). Tout passe par `PricingRules`,
   destiné à devenir éditable depuis l'administration.

## État

Le tunnel complet fonctionne : un professionnel va de la landing jusqu'au
paiement de l'acompte, et son projet apparaît en administration.

| Phase | Contenu | État |
| --- | --- | --- |
| 1 — Expérience de création | Landing, activité, objectifs, fonctionnalités, thèmes, couleurs, pages, sections, aperçu, responsive, sauvegarde | Terminée |
| 2 — Contenu | Produits, services, galerie, images, formulaires | Terminée |
| 3 — Conversion | Lead, page finale, révélation du prix, acompte, checkout | Terminée, paiement simulé |
| 4 — Admin | Dashboard, projets, leads, paiements, pricing rules, statuts, versions | Terminée |
| 5 — Avancé | TV, QR, assistant, SEO, versioning | Terminée, assistant local |
| 6 — SaaS | Publication, hébergement, domaines, abonnements | À faire |

Deux réserves, détaillées dans [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md) :

- **Le paiement est simulé.** Le contrat de données est celui de Stripe, il
  manque la clé, l'appel serveur et le webhook. L'écran de paiement le dit au
  client.
- **Tout vit dans l'IndexedDB du navigateur.** Un client qui change d'appareil
  ne retrouve pas son projet, et l'administration ne voit que ce qui a été créé
  sur la même machine. C'est la première brique à poser pour passer au produit.

Et un point de sécurité : `/admin` n'est protégé par aucune authentification.
**À traiter avant toute mise en ligne.**
