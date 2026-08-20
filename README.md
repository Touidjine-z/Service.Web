# Studio — plateforme de création de sites professionnels

Configurateur visuel qui permet à un professionnel de construire gratuitement la
maquette de son futur site, de la tester comme un vrai visiteur, puis de
découvrir le prix **uniquement à la fin du parcours**.

Ce n'est pas une vitrine de services : c'est un outil commercial. Le client
investit du temps dans son projet, voit le résultat, et devient un prospect
qualifié au moment où le prix apparaît.

- La **spécification produit** fait foi : [`CLAUDE.md`](CLAUDE.md) (59 sections).
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

La vérification des noms de domaine est facultative : sans configuration, elle
tourne en mode simulé et l'écran le dit (voir plus bas).

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
    catalog.ts       Vocabulaire du catalogue : étiquettes produit, allergènes
    modules.ts       Objectifs → modules → sections
    themes.ts        Les 32 thèmes, sous forme de tokens
    fonts.ts         Les 12 appairages de polices (project.fontPair)
    color.ts         HEX/RGB/HSL, génération de palette, contraste WCAG
    imageBank.ts     Banque d'images, 10 catégories
    pricing.ts       Pricing engine + règle d'acompte, piloté par PricingRules
    status.ts        Cycle de vie d'un projet
    domain.ts        Noms de domaine : API GoDaddy, proposition, simulation
    assistant.ts     Assistant de création (analyse locale, pas de modèle)
    project.ts       Fabrique de projet, application métier/thème
  renderer/          Rendu du site du client
    tokens.ts        Thème → styles concrets (le seul endroit où ça se produit)
    sectionDefs.ts   Catalogue déclaratif des 30 sections, blocs acceptés, variantes
    blockDefs.ts     Catalogue déclaratif des 10 blocs et de leurs champs
    Blocks.tsx       Rendu des blocs, et regroupement en ligne ou en grille
    Motion.tsx       theme.motion → animations d'entrée des sections
    Sections.tsx     Rendu des sections
    SiteRenderer.tsx Navigation, sections, pied de page
    samples.ts       Contenu d'exemple tant que le client n'a rien saisi
    commerce.ts      Panier et commande du site du client
  store/
    reducer.ts       Toutes les mutations du projet
    ProjectStore.tsx Contexte + undo/redo + autosave
    db.ts            Persistance Dexie (projets, versions, leads)
  ui/                Primitives partagées de la plateforme
    motion.tsx       Apparitions, compteurs, bandeaux, parallaxe (sans dépendance)
  features/          Un dossier par écran
    landing          Vitrine : démonstration live, galerie, chat de qualification
    onboarding, builder, preview, final, tv, admin
scripts/             Scénarios de test joués dans un vrai navigateur
```

Trois points d'architecture portent tout le reste :

- **`renderer/tokens.ts`** est le seul endroit où un thème devient du CSS. Les
  sections ne connaissent que ces helpers, jamais un `themeId`. C'est ce qui
  permet à 32 thèmes d'être réellement différents sans un seul composant dédié.
- **`renderer/sectionDefs.ts`** décrit chaque section, ses champs éditables, les
  **blocs** qu'elle accepte et ses **variantes**. Le panneau de propriétés du
  builder est **généré** à partir de ce catalogue : ajouter une section ne
  demande aucun formulaire supplémentaire.
- **`renderer/blockDefs.ts`** fait la même chose à l'échelle du contenu. Un bloc
  — titre, paragraphe, chiffre clé, citation, pastille… — est un morceau typé que
  le client ajoute *dans* une section et déplace librement. Dix types partagés
  suffisent à donner à une trentaine de sections des milliers de rendus, sans
  qu'aucun composant supplémentaire soit écrit. La section « Contenu libre » est
  faite uniquement de blocs.
- **`renderer/Motion.tsx`** fait la même chose pour le token `theme.motion` :
  c'est le seul endroit où il devient du CSS. Les animations d'un site
  dépendent donc du thème choisi, et de rien d'autre.
- **`renderer/tokens.ts`** traduit les cartes, boutons, images et séparations de
  section par des `Record<…>` **exhaustifs**. Ajouter une variante de token sans
  écrire son rendu fait désormais échouer la compilation, au lieu de rendre
  silencieusement comme une autre variante — le défaut qui a fait passer
  `nav: 'sidebar'` pour `inline` pendant vingt thèmes.

La vitrine suit la même règle : sa démonstration n'est pas une capture, c'est un
projet construit par le moteur et rendu par `SiteRenderer`. Elle ne peut pas
montrer autre chose que le produit réel.

## Deux invariants à ne pas casser

1. **Aucun prix avant la page finale** (§56). Le devis est calculé en continu par
   `computeQuote()` et exposé via `useProject().quote`, mais il ne doit être rendu
   qu'une fois `project.priceRevealed` à `true`. Les libellés « Afficher mes
   tarifs » (§7) et « Afficher les prix » (§20) concernent le tarif **du client
   sur son propre site** et sont légitimes partout.
2. **Aucun tarif codé en dur** (§31, §38). Tout passe par `PricingRules`,
   destiné à devenir éditable depuis l'administration.

## Nom de domaine (GoDaddy)

Dernière étape du parcours, `/creer/domaine` (§59) : le client cherche son
adresse, voit sa disponibilité et son prix, puis la réserve avec nous, déclare
celle qu'il possède déjà, ou reporte le choix. `engine/domain.ts` parle à l'API
GoDaddy — `GET /v3/domains/check-availability` — dans l'un de trois modes.

```bash
cp .env.example .env

# Mode recommandé : le relais garde le PAT côté serveur et règle CORS.
GODADDY_PAT=xxxxx node scripts/domain-proxy.mjs
# .env → VITE_DOMAIN_API_URL=http://localhost:5310/check
```

| Mode | Déclencheur | Remarque |
| --- | --- | --- |
| `proxy` | `VITE_DOMAIN_API_URL` | À utiliser. La clé ne descend jamais dans le navigateur. |
| `godaddy` | `VITE_GODADDY_PAT` | Appel direct. Tout ce qui est préfixé `VITE_` finit dans le bundle : **développement uniquement**. |
| `simulation` | rien de configuré | Disponibilités déterministes, prix indicatifs, annoncés comme tels à l'écran. |

Le domaine ajoute au devis la ligne « Nom de domaine » — notre travail de
réservation et de configuration, réglé par `domainSetupFee` et éditable en
administration. Le prix du registrar est affiché à part : il est dans **sa**
devise et n'a rien à faire dans le total de réalisation.

## État

Le tunnel complet fonctionne : un professionnel va de la landing jusqu'au
paiement de l'acompte, et son projet apparaît en administration.

| Phase | Contenu | État |
| --- | --- | --- |
| 1 — Expérience de création | Landing, activité, objectifs, fonctionnalités, thèmes, couleurs, pages, sections, aperçu, responsive, sauvegarde | Terminée |
| 2 — Contenu | Produits, services, galerie, images, formulaires | Terminée |
| 3 — Conversion | Lead, page finale, révélation du prix, nom de domaine, acompte, checkout | Terminée, paiement simulé |
| 4 — Admin | Dashboard, projets, leads, paiements, pricing rules, statuts, versions | Terminée |
| 5 — Avancé | TV, QR, assistant, SEO, versioning | Terminée, assistant local |
| 5 bis — Vitrine et animations | Démonstration live, galerie de designs, chat de qualification, animations pilotées par le thème, 6 sections de réassurance | Terminée |
| 5 ter — Restauration | Modes de service, offres, formules, établissements, allergènes, fidélité, carte à onglets, commande avec créneau | Terminée |
| 5 quater — Blocs et variantes | Blocs typés dans les sections, catalogue d'ajout rangé par intention, variantes, section « Contenu libre », duplication | Terminée |
| 6 — SaaS | Publication, hébergement, achat effectif des domaines, abonnements | À faire |

Trois réserves, détaillées dans [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md) :

- **Le paiement est simulé.** Le contrat de données est celui de Stripe, il
  manque la clé, l'appel serveur et le webhook. L'écran de paiement le dit au
  client.
- **La réservation du domaine reste manuelle.** GoDaddy fournit la
  disponibilité et les prix ; l'achat se fait ensuite côté administration, à
  partir du domaine retenu par le client.
- **Tout vit dans l'IndexedDB du navigateur.** Un client qui change d'appareil
  ne retrouve pas son projet, et l'administration ne voit que ce qui a été créé
  sur la même machine. C'est la première brique à poser pour passer au produit.

Et un point de sécurité : `/admin` n'est protégé par aucune authentification.
**À traiter avant toute mise en ligne.**
