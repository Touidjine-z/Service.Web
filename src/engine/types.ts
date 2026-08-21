/**
 * Modele generique de la plateforme.
 *
 * Regle d'architecture (cf. CLAUDE.md §48) : il n'existe qu'UN seul moteur.
 * Le comportement d'un projet decoule de la combinaison
 *   activity + objectives + modules + theme + colors + content
 * et jamais d'un builder specifique a un metier.
 */

export type ActivityId = string
export type ObjectiveId =
  | 'company' | 'services' | 'products' | 'portfolio' | 'gallery'
  | 'quote' | 'contact' | 'booking' | 'orders' | 'ecommerce'
  | 'menu' | 'promotions' | 'pricing' | 'reviews'

export type ModuleId =
  | 'about' | 'services' | 'products' | 'menu' | 'categories' | 'cart' | 'order'
  | 'portfolio' | 'gallery' | 'testimonials' | 'faq' | 'pricing' | 'hours'
  | 'location' | 'contact' | 'quote' | 'booking' | 'social' | 'tv' | 'qrcode'
  | 'stats' | 'process' | 'team' | 'logos' | 'beforeafter' | 'banner'
  /* Restauration et vente a emporter : modes de service, offres, formules,
     etablissements, allergenes, fidelite (cf. §15, §24, §52). */
  | 'ordermodes' | 'offers' | 'formulas' | 'venues' | 'allergens' | 'loyalty'
  /* Recherche guidee, programme detaille, financement : les briques des sites
     ou le visiteur precise son besoin, puis se fait expliquer une offre longue
     et la facon de la payer. Aucune n'est propre a un metier (§48). */
  | 'finder' | 'program' | 'funding'
  /* Vivre dans le temps, prouver, garder le contact : les sections qui
     manquaient a un site professionnel, tous metiers confondus. */
  | 'video' | 'news' | 'events' | 'jobs' | 'documents' | 'certifications'
  | 'coverage' | 'newsletter'
export type SectionKind =
  | 'hero' | 'about' | 'services' | 'products' | 'portfolio' | 'gallery'
  | 'testimonials' | 'faq' | 'pricing' | 'hours' | 'location' | 'contact'
  | 'quote' | 'booking' | 'cta' | 'social' | 'map'
  /* Sections « preuve » ajoutees pour rapprocher les maquettes des sites
     d'agence : chiffres, methode, equipe, references, avant/apres, bandeau. */
  | 'stats' | 'process' | 'team' | 'logos' | 'beforeafter' | 'banner'
  /* Sections de restauration : elles ne connaissent aucun metier, elles lisent
     le projet comme les autres (§48). */
  | 'ordermodes' | 'offers' | 'formulas' | 'venues' | 'allergens' | 'loyalty'
  /* Section libre : elle n'a aucun champ propre, son contenu est fait de blocs. */
  | 'content'
  /* Les memes briques, cote sections. */
  | 'finder' | 'program' | 'funding'
  /* Vivre dans le temps, prouver, garder le contact : les sections qui
     manquaient a un site professionnel, tous metiers confondus. */
  | 'video' | 'news' | 'events' | 'jobs' | 'documents' | 'certifications'
  | 'coverage' | 'newsletter'
export type ThemeId =
  | 'modern' | 'premium' | 'minimal' | 'elegant' | 'dark' | 'classic'
  | 'creative' | 'corporate' | 'luxury' | 'urban' | 'clean' | 'nature'
  | 'fresh' | 'vintage' | 'professional' | 'bold' | 'glass' | 'editorial'
  | 'dynamic'
  /* Douze themes ajoutes en 2026-08 : six pour les metiers de service et de
     soin, six pour le commerce, l'artisanat et la creation. */
  | 'cabinet' | 'serene' | 'tribune' | 'brief' | 'estate' | 'civic'
  | 'atelier' | 'marche' | 'neon' | 'studio' | 'affiche' | 'vitrine'
  /* Deux designs d'agence : la page d'offre commerciale et la grille de
     references. */
  | 'agence' | 'repere'
  | 'custom'

/** Formule retenue (§60). Deux valeurs, aucun ordre de prix implicite. */
export type PlanId = 'template' | 'website' | 'turnkey'

/**
 * Ce qu'une formule permet, dit dans le vocabulaire que le moteur parle deja :
 * des ModuleId et des nombres. Aucun comportement, aucun composant.
 */
export interface PlanLimits {
  /** Modules que la formule n'ouvre pas. Verrouille les sections par transitivite. */
  blockedModules: ModuleId[]
  /** Plafond de pages creables. POSITIVE_INFINITY = illimite. */
  maxPages: number
  /** Plafond cumule produits + services + galerie. */
  maxCatalogItems: number
  /** Droit au theme « custom » (design reellement dessine). */
  customTheme: boolean
}

/**
 * Ce que NOUS faisons pour le client dans cette formule. Ce ne sont pas des
 * fonctionnalites du logiciel mais du travail humain : c'est ce qui separe
 * vraiment une formule de la suivante, comme chez les agences.
 *
 * Des quantites, jamais des montants (§56) : le prix des unites au-dela du
 * quota vit dans PricingRules, pas ici.
 */
export interface PlanServices {
  /** Pages dont nous redigeons le contenu. */
  writtenPages: number
  /** Images d'illustration achetees et integrees pour le client. */
  stockImages: number
  /** Liens entrants poses pour le referencement. Jamais factures a l'unite. */
  backlinks: number
}

/**
 * Definition d'une formule. INVARIANT §56 : aucun champ monetaire ici, jamais.
 * Ajouter `price` ou `from` a cette interface tuerait la regle commerciale, qui
 * n'est pas une consigne mais une propriete du graphe d'imports : `plans.ts`
 * n'importe rien de `pricing.ts`, c'est `pricing.ts` qui lit `plans.ts`.
 */
export interface PlanDef {
  id: PlanId
  label: string
  tagline: string
  /** « Pour qui » : une phrase en situation, jamais en budget. */
  audience: string
  /** Puces « Ce que vous avez », en fonctionnalites. */
  highlights: string[]
  /** Puces « Pas dans cette formule ». Vide sur la formule haute. */
  excludes: string[]
  limits: PlanLimits
  /** Ce que nous prenons en charge : redaction, images, referencement. */
  services: PlanServices
  /**
   * Pastille de la carte (« Le plus simple », « Le plus choisi »). Elle vit dans
   * le catalogue et non dans l'ecran : sans cela, ajouter une troisieme formule
   * obligerait a rouvrir PlanStep pour arbitrer laquelle porte quel libelle.
   */
  badge?: string
  /** Formule vers laquelle on pousse. Absente = formule haute, on ne descend pas. */
  upgradeTo?: PlanId
  recommended?: boolean
}

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD'
export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'tv'

// ---------------------------------------------------------------------------
// Schema d'edition : ce qui rend le builder generique
// ---------------------------------------------------------------------------

/** Champ d'un element de liste (le type `list` d'un `FieldDef`). */
export interface ItemFieldDef {
  key: string
  label: string
  type: 'text' | 'textarea'
}

/**
 * Un champ editable. Le panneau de proprietes du builder est genere a partir de
 * ces declarations : aucun formulaire n'est ecrit a la main (§48).
 */
export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea'; placeholder?: string }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'number'; min: number; max: number }
  | { key: string; label: string; type: 'list'; itemLabel: string; itemFields: ItemFieldDef[] }
  | { key: string; label: string; type: 'image' }

/**
 * Vocabulaire commun des blocs. Un bloc est un morceau de contenu type,
 * deplacable, que le client ajoute DANS une section. C'est ce qui permet a une
 * trentaine de sections de produire des milliers de pages differentes sans
 * qu'aucun composant supplementaire soit ecrit : la section decide ou ses blocs
 * s'affichent, le bloc decide de quoi il est fait.
 */
export type BlockType =
  | 'heading' | 'text' | 'bullets' | 'button' | 'image'
  | 'stat' | 'quote' | 'feature' | 'badge' | 'spacer'

/**
 * Position d'un bloc sur la grille fluide, exprimee en CELLULES et jamais en
 * pixels : `x`/`y` sont l'angle haut-gauche, `w`/`h` le nombre de colonnes et de
 * lignes occupees. C'est la meme unite que la grille CSS qui la rend, donc la
 * disposition du client survit a tout changement de theme, de largeur de
 * conteneur ou d'appareil (cf. `renderer/fluid.ts`).
 */
export interface GridArea {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Une disposition par point de rupture. Il n'y en a que deux, comme chez les
 * editeurs qui font reference : le client dessine sur la grille large, et le
 * mobile n'a sa propre position qu'a partir du moment ou il y touche. Tant
 * qu'un point de rupture est absent, la position est DEDUITE (§14) : un projet
 * enregistre avant la grille reste donc valide, et un bloc ajoute tombe a sa
 * place sans que personne ait rien a positionner.
 */
export interface BlockLayout {
  desktop?: GridArea
  mobile?: GridArea
}

export interface Block {
  id: string
  type: BlockType
  /** Reglages libres, interpretes par le renderer du type de bloc. */
  props: Record<string, unknown>
  /** Position dessinee par le client sur la grille fluide de sa section. */
  layout?: BlockLayout
  hidden?: boolean
}

/** Bloc decrit dans un catalogue (variante, blocs par defaut) : sans identifiant. */
export interface BlockSeed {
  type: BlockType
  props?: Record<string, unknown>
  /** Une variante peut livrer une mise en page toute faite. */
  layout?: BlockLayout
}

export interface ActivitySector {
  id: string
  label: string
  activities: Activity[]
}

export interface Activity {
  id: ActivityId
  label: string
  icon: string
  /** Objectifs pre-coches quand ce metier est choisi. */
  suggestedObjectives: ObjectiveId[]
  /** Modules actives par defaut ; l'utilisateur reste libre de les changer. */
  defaultModules: ModuleId[]
  /** Squelette de pages propose pour ce metier. */
  defaultPages: PageBlueprint[]
  /** Categorie de la banque d'images la plus pertinente. */
  imageCategory: string
  /** Le catalogue est-il un menu (restauration) plutot que des produits ? */
  catalogKind: 'products' | 'menu' | 'services' | 'none'
  /**
   * Mots que le client tape pour se reconnaitre, quand ils ne sont pas dans le
   * libelle : « carrosserie » doit trouver « Carrossier ». Sans accents.
   */
  keywords?: string[]
  /**
   * Catalogue d'exemple du metier — [nom, description]. Il remplace les
   * exemples generiques tant que le client n'a rien saisi (§54). Jamais de
   * prix : ils sont au client, et la maquette n'a pas a en inventer.
   */
  sampleCatalog?: [string, string][]
  /**
   * Valeurs de depart propres au metier pour certaines sections. C'est ce qui
   * fait qu'un centre auto voit « Selectionnez votre vehicule » la ou un centre
   * de formation voit son programme : de la donnee, pas un composant dedie.
   */
  sectionDefaults?: Partial<Record<SectionKind, Record<string, unknown>>>
}

export interface PageBlueprint {
  name: string
  slug: string
  sections: SectionKind[]
}

export interface ObjectiveDef {
  id: ObjectiveId
  label: string
  /** Modules debloques quand l'objectif est retenu. */
  unlocks: ModuleId[]
}

export interface ModuleDef {
  id: ModuleId
  label: string
  description: string
  icon: string
  /** Section injectee dans les pages lorsque le module est actif. */
  section?: SectionKind
  /** Module structurel : l'utilisateur ne peut pas le retirer. */
  required?: boolean
}

// ---------------------------------------------------------------------------
// Contenu du projet
// ---------------------------------------------------------------------------

export interface Identity {
  businessName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  phone: string
  email: string
  address: string
  city: string
  serviceArea: string
  hours: OpeningHour[]
  social: Partial<Record<'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube', string>>
}

export interface OpeningHour {
  day: 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim'
  closed: boolean
  open: string
  close: string
}

export interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  button: string
  card: string
  header: string
  footer: string
}

export interface Page {
  id: string
  name: string
  slug: string
  isHome: boolean
  sections: Section[]
  seo: { title: string; description: string }
}

export interface Section {
  id: string
  kind: SectionKind
  /** Reglages libres, interpretes par le renderer de chaque type de section. */
  props: Record<string, unknown>
  /**
   * Contenu compose de la section. Absent tant que le client n'y a pas touche :
   * le catalogue fournit alors les blocs de depart, exactement comme il fournit
   * les valeurs par defaut des champs (cf. `resolveBlocks`).
   */
  blocks?: Block[]
  hidden?: boolean
}

export interface Category {
  id: string
  name: string
  order: number
}

/** Etiquettes affichees sur une carte produit (nouveaute, vege, epice...). */
export type ProductTag = 'new' | 'bestseller' | 'promo' | 'vegetarian' | 'spicy'

export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string | null
  categoryId: string | null
  price: number | null
  available: boolean
  variants: { name: string; price: number | null }[]
  hidden?: boolean
  order: number
  /** Prix barre : le produit est en offre. Facultatif. */
  oldPrice?: number | null
  /** Pastilles affichees sur la carte. */
  tags?: ProductTag[]
  /** Valeur energetique, attendue en restauration. */
  kcal?: number | null
  /** Allergenes declares (reglement INCO), repris par la section Allergenes. */
  allergens?: string[]
}

export interface Service {
  id: string
  name: string
  description: string
  imageUrl: string | null
  duration: string
  price: number | null
  order: number
}

export interface GalleryItem {
  id: string
  imageUrl: string
  title: string
  description: string
  category: string
  order: number
}

export interface GridSettings {
  columns: 2 | 3 | 4 | 5
  cardSize: 'sm' | 'md' | 'lg'
  imageRatio: 'square' | 'landscape' | 'portrait'
  gap: 'tight' | 'normal' | 'loose'
  align: 'left' | 'center'
}

export interface Project {
  id: string
  createdAt: string
  updatedAt: string

  activityId: ActivityId | null
  /** Saisie libre quand le metier n'est pas au catalogue. */
  customActivity: string

  objectives: ObjectiveId[]
  modules: ModuleId[]

  themeId: ThemeId
  colors: ColorScheme
  fontPair: string

  identity: Identity
  pages: Page[]
  categories: Category[]
  products: Product[]
  services: Service[]
  gallery: GalleryItem[]

  currency: Currency
  showPrices: boolean
  grid: GridSettings

  /** Progression du parcours, sert a la barre d'etapes (cf. §49). */
  step: BuilderStep
  /** Le prix n'est revele qu'apres passage explicite par la page finale (§56). */
  priceRevealed: boolean
  /** Nom de domaine retenu a la derniere etape (§59) ; null tant qu'aucun choix. */
  domain: DomainChoice | null
  /**
   * Formule retenue (§60). ABSENTE des projets enregistres avant cette option :
   * `getPlan()` les resout alors en « sur mesure », et rien ne leur est retire.
   */
  plan?: PlanId

  status: ProjectStatus

  lead: Lead | null
}

export type BuilderStep =
  | 'activity' | 'plan' | 'objectives' | 'features' | 'design' | 'content' | 'preview' | 'final'

/**
 * Statuts du projet (§34). L'ordre du tableau est l'ordre du cycle de vie :
 * l'administration s'en sert pour proposer l'etape suivante.
 */
export type ProjectStatus =
  | 'draft'
  | 'saved'
  | 'requested'
  | 'payment-pending'
  | 'deposit-paid'
  | 'client-contacted'
  | 'quote-confirmed'
  | 'preparing'
  | 'developing'
  | 'reviewing'
  | 'delivered'
  | 'done'

/** Trace d'un paiement (§32). */
export interface Payment {
  id: string
  projectId: string
  total: number
  deposit: number
  balance: number
  currency: string
  /** Reference de transaction ; fournie par Stripe une fois branche. */
  transactionRef: string
  createdAt: string
  paidAt: string | null
  status: 'pending' | 'paid' | 'failed'
  method: 'simulated' | 'stripe'
}

/** Commande passee par un visiteur sur le site du client (modules cart/order). */
export interface OrderLine {
  productId: string
  name: string
  variant: string | null
  unitPrice: number | null
  quantity: number
}

export interface Order {
  id: string
  projectId: string
  createdAt: string
  customer: { name: string; email: string; phone: string; note: string }
  /** Mode de service retenu quand le site en propose (livraison, a emporter...). */
  service?: string
  /** Creneau souhaite par le visiteur. */
  slot?: string
  lines: OrderLine[]
  total: number
  currency: Currency
  status: 'new' | 'accepted' | 'done' | 'cancelled'
}

export interface Lead {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  savedAt: string
}

/**
 * D'ou vient l'information de disponibilite d'un domaine : de GoDaddy, de la
 * simulation utilisee tant qu'aucune cle n'est branchee, ou du client lui-meme
 * quand il declare un domaine qu'il possede deja.
 */
export type DomainSource = 'godaddy' | 'simulation' | 'declared'

/**
 * Nom de domaine choisi a la fin du parcours (§59).
 *
 *  - `wanted` : le client veut ce domaine, nous le reservons pour lui ;
 *  - `owned`  : il en possede deja un, il faudra le raccorder ;
 *  - `later`  : il decidera plus tard, la realisation n'attend pas.
 *
 * Les prix sont ceux du registrar, dans la devise qu'il a renvoyee : ils ne
 * sont pas comptes dans le devis de realisation, qui a sa propre devise.
 */
export interface DomainChoice {
  name: string
  status: 'wanted' | 'owned' | 'later'
  /** Prix de la premiere annee chez le registrar, unite principale. */
  price: number | null
  renewalPrice: number | null
  currency: string
  source: DomainSource
  checkedAt: string
}
