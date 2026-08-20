import type { ObjectiveDef, ModuleDef, ModuleId, ObjectiveId, SectionKind } from './types'

/** Objectifs proposes a l'etape 2 (§7). Ils pilotent les modules disponibles. */
export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'company', label: "Présenter mon entreprise", unlocks: ['about'] },
  { id: 'services', label: 'Présenter mes services', unlocks: ['services'] },
  { id: 'products', label: 'Présenter mes produits', unlocks: ['products', 'categories'] },
  { id: 'portfolio', label: 'Présenter mes réalisations', unlocks: ['portfolio'] },
  { id: 'gallery', label: 'Afficher une galerie', unlocks: ['gallery'] },
  { id: 'quote', label: 'Recevoir des demandes de devis', unlocks: ['quote'] },
  { id: 'contact', label: 'Recevoir des demandes de contact', unlocks: ['contact', 'location'] },
  { id: 'booking', label: 'Recevoir des rendez-vous', unlocks: ['booking'] },
  { id: 'orders', label: 'Recevoir des commandes', unlocks: ['cart', 'order', 'products'] },
  { id: 'ecommerce', label: 'Vendre des produits', unlocks: ['cart', 'order', 'products', 'categories'] },
  { id: 'menu', label: 'Présenter un menu', unlocks: ['menu', 'categories', 'products'] },
  { id: 'promotions', label: 'Afficher des promotions', unlocks: ['tv', 'qrcode'] },
  { id: 'pricing', label: 'Afficher mes tarifs', unlocks: ['pricing'] },
  { id: 'reviews', label: 'Présenter mes avis clients', unlocks: ['testimonials'] },
]

export const MODULES: ModuleDef[] = [
  { id: 'about', label: 'Présentation', description: "Qui vous etes, votre histoire, vos valeurs", icon: 'Building2', section: 'about' },
  { id: 'services', label: 'Services', description: 'Liste de vos prestations', icon: 'Wrench', section: 'services' },
  { id: 'products', label: 'Produits', description: 'Catalogue de produits avec images', icon: 'Package', section: 'products' },
  { id: 'menu', label: 'Menu', description: 'Carte organisee par categories', icon: 'UtensilsCrossed', section: 'products' },
  { id: 'categories', label: 'Catégories', description: 'Regroupement du catalogue', icon: 'Tags' },
  { id: 'cart', label: 'Panier', description: 'Ajout au panier et quantites', icon: 'ShoppingCart' },
  { id: 'order', label: 'Commande', description: 'Tunnel de commande en ligne', icon: 'ClipboardCheck' },
  { id: 'portfolio', label: 'Réalisations', description: 'Vos chantiers et projets termines', icon: 'Hammer', section: 'portfolio' },
  { id: 'gallery', label: 'Galerie', description: "Galerie d'images en grille", icon: 'Images', section: 'gallery' },
  { id: 'testimonials', label: 'Témoignages', description: 'Avis de vos clients', icon: 'Quote', section: 'testimonials' },
  { id: 'faq', label: 'FAQ', description: 'Questions frequentes', icon: 'HelpCircle', section: 'faq' },
  { id: 'pricing', label: 'Tarifs', description: 'Grille tarifaire publique', icon: 'Euro', section: 'pricing' },
  { id: 'hours', label: 'Horaires', description: "Horaires d'ouverture", icon: 'Clock', section: 'hours' },
  { id: 'location', label: 'Localisation', description: 'Adresse, plan et zone couverte', icon: 'MapPin', section: 'location' },
  { id: 'contact', label: 'Contact', description: 'Formulaire et coordonnees', icon: 'Mail', section: 'contact', required: true },
  { id: 'quote', label: 'Demande de devis', description: 'Formulaire de devis detaille', icon: 'FileText', section: 'quote' },
  { id: 'booking', label: 'Rendez-vous', description: 'Prise de rendez-vous', icon: 'CalendarCheck', section: 'booking' },
  { id: 'social', label: 'Réseaux sociaux', description: 'Liens vers vos reseaux', icon: 'Share2', section: 'social' },
  { id: 'tv', label: 'Affichage TV', description: 'Ecran 16:9 pour vitrine ou salle', icon: 'Tv' },
  { id: 'qrcode', label: 'QR Code', description: 'Acces rapide au menu ou au site', icon: 'QrCode' },
]

export const MODULE_BY_ID = new Map<ModuleId, ModuleDef>(MODULES.map((m) => [m.id, m]))

/** Modules pertinents pour les objectifs retenus, dedupliques et ordonnes. */
export function modulesForObjectives(objectives: ObjectiveId[]): ModuleId[] {
  const set = new Set<ModuleId>()
  for (const def of OBJECTIVES) {
    if (objectives.includes(def.id)) def.unlocks.forEach((m) => set.add(m))
  }
  for (const m of MODULES) if (m.required) set.add(m.id)
  return MODULES.filter((m) => set.has(m.id)).map((m) => m.id)
}

/** Modules qu'au moins un objectif peut activer ou desactiver. */
export const OBJECTIVE_GOVERNED_MODULES = new Set<ModuleId>(OBJECTIVES.flatMap((o) => o.unlocks))

/** Remet une liste de modules dans l'ordre du catalogue, sans doublon. */
export function orderModules(ids: ModuleId[]): ModuleId[] {
  const set = new Set(ids)
  return MODULES.filter((m) => set.has(m.id)).map((m) => m.id)
}

/** Sections rendues pour un jeu de modules actifs. */
export function sectionsForModules(modules: ModuleId[]): SectionKind[] {
  const out: SectionKind[] = []
  for (const id of modules) {
    const section = MODULE_BY_ID.get(id)?.section
    if (section && !out.includes(section)) out.push(section)
  }
  return out
}

/** Une section n'est rendue que si le module qui la porte est actif. */
export function isSectionAvailable(kind: SectionKind, modules: ModuleId[]): boolean {
  if (kind === 'hero' || kind === 'cta' || kind === 'map') return true
  return MODULES.some((m) => m.section === kind && modules.includes(m.id))
}
