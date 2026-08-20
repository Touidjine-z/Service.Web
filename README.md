# Studio — plateforme de création de sites professionnels

Configurateur visuel qui permet à un professionnel de construire gratuitement la
maquette de son futur site, de la tester, puis de découvrir le prix **uniquement
à la fin du parcours**.

La spécification produit fait foi : voir `CLAUDE.md`.

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
  engine/          Moteur, sans dépendance à React
    types.ts       Modèle de données du projet
    activities.ts  Catalogue des métiers (6 secteurs) + squelettes de pages
    modules.ts     Objectifs → modules → sections
    themes.ts      Les 20 thèmes, sous forme de tokens
    color.ts       HEX/RGB/HSL, génération de palette, contraste WCAG
    pricing.ts     Pricing engine + règle d'acompte, piloté par PricingRules
    project.ts     Fabrique de projet, application métier/thème
  store/
    reducer.ts     Toutes les mutations du projet
    ProjectStore.tsx  Contexte + undo/redo + autosave
    db.ts          Persistance Dexie (projets, versions, leads)
  ui/              Primitives partagées de la plateforme
  features/        Un dossier par écran
```

## Deux invariants à ne pas casser

1. **Aucun prix avant la page finale** (§56). Le devis est calculé en continu par
   `computeQuote()` et exposé via `useProject().quote`, mais il ne doit être rendu
   qu'une fois `project.priceRevealed` à `true`. Les libellés « Afficher mes
   tarifs » (§7) et « Afficher les prix » (§20) concernent le tarif **du client
   sur son propre site** et sont légitimes partout.
2. **Aucun tarif codé en dur** (§31, §38). Tout passe par `PricingRules`,
   destiné à devenir éditable depuis l'administration.

## État

Phase 1 partielle. Fait : landing, activité, objectifs, fonctionnalités, 20
thèmes, couleurs, moteur générique, pricing engine, undo/redo, autosave.
Reste : builder de pages/sections, produits/services, médias, aperçu navigable,
mode visiteur, responsive/TV, page finale et révélation du prix, checkout, admin.
