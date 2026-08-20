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

export type SectionKind =
  | 'hero' | 'about' | 'services' | 'products' | 'portfolio' | 'gallery'
  | 'testimonials' | 'faq' | 'pricing' | 'hours' | 'location' | 'contact'
  | 'quote' | 'booking' | 'cta' | 'social' | 'map'

export type ThemeId =
  | 'modern' | 'premium' | 'minimal' | 'elegant' | 'dark' | 'classic'
  | 'creative' | 'corporate' | 'luxury' | 'urban' | 'clean' | 'nature'
  | 'fresh' | 'vintage' | 'professional' | 'bold' | 'glass' | 'editorial'
  | 'dynamic' | 'custom'

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD'
export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'tv'

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
  hidden?: boolean
}

export interface Category {
  id: string
  name: string
  order: number
}

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

  status: ProjectStatus

  lead: Lead | null
}

export type BuilderStep = 'activity' | 'objectives' | 'features' | 'design' | 'content' | 'preview' | 'final'

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
