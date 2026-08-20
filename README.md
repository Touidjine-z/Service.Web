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
    project.ts       Fabrique de projet, application métier/thème
  renderer/          Rendu du site du client
    tokens.ts        Thème → styles concrets (le seul endroit où ça se produit)
    sectionDefs.ts   Catalogue déclaratif des 17 sections
    Sections.tsx     Rendu des sections
    SiteRenderer.tsx Navigation, sections, pied de page
    samples.ts       Contenu d'exemple tant que le client n'a rien saisi
  store/
    reducer.ts       Toutes les mutations du projet
    ProjectStore.tsx Contexte + undo/redo + autosave
    db.ts            Persistance Dexie (projets, versions, leads)
  ui/                Primitives partagées de la plateforme
  features/          Un dossier par écran
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

**Phases 1 et 2 terminées.** Le client peut aujourd'hui aller de la landing
jusqu'à un site complet, navigable et testé en mode visiteur, sans jamais voir
de prix de réalisation.

| Phase | Contenu | État |
| --- | --- | --- |
| 1 — Expérience de création | Landing, activité, objectifs, fonctionnalités, thèmes, couleurs, pages, sections, aperçu, responsive, sauvegarde | Terminée |
| 2 — Contenu | Produits, services, galerie, images, formulaires | Terminée |
| 3 — Conversion | Lead, page finale, révélation du prix, acompte, checkout | À faire |
| 4 — Admin | Dashboard, projets, leads, paiements, pricing rules, statuts | À faire |
| 5 — Avancé | TV, QR, IA, SEO, versioning | Socle posé (`db.ts`) |
| 6 — SaaS | Publication, hébergement, domaines, abonnements | À faire |

Le pricing engine et la persistance des leads et versions existent déjà côté
moteur ; il leur manque les écrans de la phase 3.
