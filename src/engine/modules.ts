import type { ObjectiveDef, ModuleDef, ModuleId, ObjectiveId, SectionKind } from './types'

/** Objectifs proposes a l'etape 2 (§7). Ils pilotent les modules disponibles. */
export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'company', label: "Présenter mon entreprise", unlocks: ['about', 'stats'] },
  { id: 'services', label: 'Présenter mes services', unlocks: ['services', 'process'] },
  { id: 'products', label: 'Présenter mes produits', unlocks: ['products', 'categories'] },
  { id: 'portfolio', label: 'Présenter mes réalisations', unlocks: ['portfolio', 'beforeafter'] },
  { id: 'gallery', label: 'Afficher une galerie', unlocks: ['gallery'] },
  { id: 'quote', label: 'Recevoir des demandes de devis', unlocks: ['quote'] },
  { id: 'contact', label: 'Recevoir des demandes de contact', unlocks: ['contact', 'location'] },
  { id: 'booking', label: 'Recevoir des rendez-vous', unlocks: ['booking'] },
  { id: 'orders', label: 'Recevoir des commandes', unlocks: ['cart', 'order', 'products', 'ordermodes'] },
  { id: 'ecommerce', label: 'Vendre des produits', unlocks: ['cart', 'order', 'products', 'categories'] },
  { id: 'menu', label: 'Présenter un menu', unlocks: ['menu', 'categories', 'products', 'formulas', 'allergens'] },
  { id: 'promotions', label: 'Afficher des promotions', unlocks: ['tv', 'qrcode', 'banner', 'offers', 'loyalty'] },
  { id: 'pricing', label: 'Afficher mes tarifs', unlocks: ['pricing'] },
  { id: 'reviews', label: 'Présenter mes avis clients', unlocks: ['testimonials', 'logos'] },
]

export const MODULES: ModuleDef[] = [
  { id: 'about', label: 'Présentation', description: "Qui vous etes, votre histoire, vos valeurs", icon: 'Building2', section: 'about' },
  { id: 'services', label: 'Services', description: 'Liste de vos prestations', icon: 'Wrench', section: 'services' },
  { id: 'products', label: 'Produits', description: 'Catalogue de produits avec images', icon: 'Package', section: 'products' },
  { id: 'menu', label: 'Menu', description: 'Carte organisee par categories', icon: 'UtensilsCrossed', section: 'products' },
  { id: 'categories', label: 'Catégories', description: 'Regroupement du catalogue', icon: 'Tags' },
  { id: 'cart', label: 'Panier', description: 'Ajout au panier et quantites', icon: 'ShoppingCart' },
  { id: 'order', label: 'Commande', description: 'Tunnel de commande en ligne', icon: 'ClipboardCheck' },
  // Restauration et vente a emporter. Comme toutes les autres, ces briques sont
  // generiques : un traiteur, une epicerie ou un garage peuvent les activer.
  { id: 'ordermodes', label: 'Modes de service', description: 'Livraison, à emporter, sur place : le choix en tete de page', icon: 'Bike', section: 'ordermodes' },
  { id: 'formulas', label: 'Formules', description: 'Menus a prix fixe : entree, plat, dessert', icon: 'ChefHat', section: 'formulas' },
  { id: 'offers', label: 'Offres', description: 'Vos promotions du moment, en cartes', icon: 'Percent', section: 'offers' },
  { id: 'venues', label: 'Établissements', description: 'Vos adresses, avec recherche par ville', icon: 'Store', section: 'venues' },
  { id: 'allergens', label: 'Allergènes', description: 'Tableau des allergenes et des calories, attendu en restauration', icon: 'Wheat', section: 'allergens' },
  { id: 'loyalty', label: 'Fidélité', description: 'Programme de fidelite et application mobile', icon: 'Gift', section: 'loyalty' },
  { id: 'portfolio', label: 'Réalisations', description: 'Vos chantiers et projets termines', icon: 'Hammer', section: 'portfolio' },
  { id: 'gallery', label: 'Galerie', description: "Galerie d'images en grille", icon: 'Images', section: 'gallery' },
  { id: 'testimonials', label: 'Témoignages', description: 'Avis de vos clients', icon: 'Quote', section: 'testimonials' },
  { id: 'faq', label: 'FAQ', description: 'Questions frequentes', icon: 'HelpCircle', section: 'faq' },
  { id: 'stats', label: 'Chiffres clés', description: 'Vos chiffres qui rassurent, animes a l\'ecran', icon: 'TrendingUp', section: 'stats' },
  { id: 'process', label: 'Méthode', description: 'Les etapes d\'une collaboration avec vous', icon: 'Route', section: 'process' },
  { id: 'team', label: 'Équipe', description: 'Les visages derriere votre entreprise', icon: 'Users', section: 'team' },
  { id: 'logos', label: 'Références', description: 'Bandeau defilant de vos clients', icon: 'BadgeCheck', section: 'logos' },
  { id: 'beforeafter', label: 'Avant / Après', description: 'Comparateur glissant sur vos chantiers', icon: 'SlidersHorizontal', section: 'beforeafter' },
  { id: 'banner', label: 'Bandeau d\'annonce', description: 'Message defilant en haut de page', icon: 'Megaphone', section: 'banner' },
  // Le visiteur precise son besoin avant de voir l'offre, on lui detaille un
  // parcours long, on lui explique comment le payer. Generiques : le garage y met
  // une plaque d'immatriculation, l'agence immobiliere un budget.
  { id: 'finder', label: 'Recherche guidée', description: 'Le visiteur precise ses criteres avant de voir votre offre', icon: 'Filter', section: 'finder' },
  { id: 'program', label: 'Programme', description: 'Le detail d\'un parcours, module par module, avec les durees', icon: 'ListOrdered', section: 'program' },
  { id: 'funding', label: 'Financement', description: 'Dispositifs de prise en charge et facilites de paiement', icon: 'HandCoins', section: 'funding' },
  { id: 'pricing', label: 'Tarifs', description: 'Grille tarifaire publique', icon: 'Euro', section: 'pricing' },
  { id: 'hours', label: 'Horaires', description: "Horaires d'ouverture", icon: 'Clock', section: 'hours' },
  { id: 'location', label: 'Localisation', description: 'Adresse, plan et zone couverte', icon: 'MapPin', section: 'location' },
  { id: 'contact', label: 'Contact', description: 'Formulaire et coordonnees', icon: 'Mail', section: 'contact', required: true },
  { id: 'quote', label: 'Demande de devis', description: 'Formulaire de devis detaille', icon: 'FileText', section: 'quote' },
  { id: 'booking', label: 'Rendez-vous', description: 'Prise de rendez-vous', icon: 'CalendarCheck', section: 'booking' },
  { id: 'social', label: 'Réseaux sociaux', description: 'Liens vers vos reseaux', icon: 'Share2', section: 'social' },
  // Aucune de ces huit entrees n'est debloquee par un objectif : un module
  // gouverne est injecte sur l'accueil de tous les metiers qui cochent
  // l'objectif (cf. addSectionsForModules). Elles s'activent a la main.
  { id: 'video', label: 'Vidéo', description: 'Une video de presentation, avec image de couverture', icon: 'Video', section: 'video' },
  { id: 'news', label: 'Actualités', description: "Un fil d'actualites date, tenu par vous", icon: 'Newspaper', section: 'news' },
  { id: 'events', label: 'Agenda', description: 'Vos dates a venir, en liste ou en cartes', icon: 'CalendarDays', section: 'events' },
  { id: 'jobs', label: 'Recrutement', description: "Vos offres d'emploi et la candidature spontanee", icon: 'Briefcase', section: 'jobs' },
  { id: 'documents', label: 'Documents', description: 'Vos fichiers a telecharger, ranges et dates', icon: 'FileDown', section: 'documents' },
  { id: 'certifications', label: 'Certifications et garanties', description: 'Labels, assurances et engagements ecrits', icon: 'ShieldCheck', section: 'certifications' },
  { id: 'coverage', label: "Zone d'intervention", description: 'Vos communes, votre rayon et vos delais', icon: 'MapPinned', section: 'coverage' },
  { id: 'newsletter', label: "Lettre d'information", description: 'Inscription par e-mail, avec la mention sur les donnees', icon: 'Mailbox', section: 'newsletter' },
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
  // Ces quatre-la ne dependent d'aucun module : elles ne montrent que du contenu
  // saisi dans la section elle-meme (« Contenu libre » n'est fait que de blocs).
  if (kind === 'hero' || kind === 'cta' || kind === 'map' || kind === 'content') return true
  return MODULES.some((m) => m.section === kind && modules.includes(m.id))
}
