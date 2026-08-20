import type { ActivitySector, Activity } from './types'

/**
 * Catalogue des metiers. Ajouter une activite = ajouter une entree ici,
 * aucun code de builder a ecrire (cf. §48).
 */

const RESTAURATION: Activity[] = [
  {
    id: 'restaurant', label: 'Restaurant', icon: '🍽️',
    suggestedObjectives: ['menu', 'company', 'gallery', 'contact', 'orders'],
    defaultModules: ['menu', 'categories', 'products', 'gallery', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'gallery', 'hours', 'cta'] },
      { name: 'Menu', slug: 'menu', sections: ['products'] },
      { name: 'À propos', slug: 'a-propos', sections: ['about', 'testimonials'] },
      { name: 'Galerie', slug: 'galerie', sections: ['gallery'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'hours', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    id: 'snack', label: 'Snack / Fast-food', icon: '🍔',
    suggestedObjectives: ['menu', 'orders', 'promotions', 'contact'],
    defaultModules: ['menu', 'categories', 'products', 'cart', 'order', 'hours', 'location', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'products', 'hours', 'cta'] },
      { name: 'Menu', slug: 'menu', sections: ['products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    id: 'cafe', label: 'Café / Salon de thé', icon: '☕',
    suggestedObjectives: ['menu', 'company', 'gallery', 'contact'],
    defaultModules: ['menu', 'categories', 'products', 'gallery', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'gallery', 'hours'] },
      { name: 'Carte', slug: 'carte', sections: ['products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    id: 'boulangerie', label: 'Boulangerie / Pâtisserie', icon: '🥐',
    suggestedObjectives: ['products', 'company', 'gallery', 'contact'],
    defaultModules: ['products', 'categories', 'gallery', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'gallery', 'hours'] },
      { name: 'Nos produits', slug: 'produits', sections: ['products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'food', catalogKind: 'products',
  },
  {
    id: 'traiteur', label: 'Traiteur', icon: '🥗',
    suggestedObjectives: ['services', 'products', 'quote', 'gallery', 'contact'],
    defaultModules: ['services', 'products', 'gallery', 'quote', 'contact', 'location'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'gallery', 'cta'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'products'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'services',
  },
  {
    id: 'food-truck', label: 'Food truck', icon: '🚚',
    suggestedObjectives: ['menu', 'contact', 'promotions'],
    defaultModules: ['menu', 'products', 'hours', 'location', 'contact', 'social'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'products', 'location', 'social'] },
      { name: 'Menu', slug: 'menu', sections: ['products'] },
      { name: 'Où nous trouver', slug: 'ou-nous-trouver', sections: ['location', 'hours', 'contact'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
]

const COMMERCE: Activity[] = [
  {
    id: 'epicerie', label: 'Épicerie', icon: '🛒',
    suggestedObjectives: ['products', 'company', 'promotions', 'contact'],
    defaultModules: ['products', 'categories', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'hours'] },
      { name: 'Produits', slug: 'produits', sections: ['products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'business', catalogKind: 'products',
  },
  {
    id: 'boutique', label: 'Boutique', icon: '👗',
    suggestedObjectives: ['products', 'ecommerce', 'gallery', 'contact'],
    defaultModules: ['products', 'categories', 'cart', 'gallery', 'hours', 'location', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'products', 'gallery', 'cta'] },
      { name: 'Boutique', slug: 'boutique', sections: ['products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'lifestyle', catalogKind: 'products',
  },
  {
    id: 'fleuriste', label: 'Fleuriste', icon: '💐',
    suggestedObjectives: ['products', 'gallery', 'orders', 'contact'],
    defaultModules: ['products', 'categories', 'gallery', 'hours', 'location', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'products', 'gallery', 'hours'] },
      { name: 'Créations', slug: 'creations', sections: ['gallery', 'products'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'lifestyle', catalogKind: 'products',
  },
  {
    id: 'opticien', label: 'Opticien', icon: '👓',
    suggestedObjectives: ['products', 'services', 'booking', 'contact'],
    defaultModules: ['products', 'services', 'booking', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'products'] },
      { name: 'Nos services', slug: 'services', sections: ['services'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'health', catalogKind: 'products',
  },
]

const ARTISANS: Activity[] = [
  {
    id: 'menuisier', label: 'Menuisier', icon: '🪚',
    suggestedObjectives: ['services', 'portfolio', 'gallery', 'quote', 'reviews'],
    defaultModules: ['services', 'portfolio', 'gallery', 'quote', 'testimonials', 'contact', 'location', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'portfolio', 'testimonials', 'cta'] },
      { name: 'Services', slug: 'services', sections: ['services'] },
      { name: 'Réalisations', slug: 'realisations', sections: ['portfolio', 'gallery'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'wood', catalogKind: 'services',
  },
  {
    id: 'plombier', label: 'Plombier', icon: '🔧',
    suggestedObjectives: ['services', 'quote', 'contact', 'reviews'],
    defaultModules: ['services', 'quote', 'testimonials', 'contact', 'location', 'about', 'hours'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'about', 'testimonials', 'cta'] },
      { name: 'Interventions', slug: 'interventions', sections: ['services'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'construction', catalogKind: 'services',
  },
  {
    id: 'electricien', label: 'Électricien', icon: '⚡',
    suggestedObjectives: ['services', 'quote', 'portfolio', 'contact'],
    defaultModules: ['services', 'portfolio', 'quote', 'testimonials', 'contact', 'location', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'portfolio', 'testimonials', 'cta'] },
      { name: 'Services', slug: 'services', sections: ['services'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'construction', catalogKind: 'services',
  },
  {
    id: 'peintre', label: 'Peintre', icon: '🎨',
    suggestedObjectives: ['services', 'portfolio', 'gallery', 'quote'],
    defaultModules: ['services', 'portfolio', 'gallery', 'quote', 'testimonials', 'contact', 'location'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'portfolio', 'cta'] },
      { name: 'Réalisations', slug: 'realisations', sections: ['portfolio', 'gallery'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'construction', catalogKind: 'services',
  },
  {
    id: 'macon', label: 'Maçon', icon: '🧱',
    suggestedObjectives: ['services', 'portfolio', 'quote', 'reviews'],
    defaultModules: ['services', 'portfolio', 'gallery', 'quote', 'testimonials', 'contact', 'location', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'portfolio', 'cta'] },
      { name: 'Réalisations', slug: 'realisations', sections: ['portfolio'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'construction', catalogKind: 'services',
  },
  {
    id: 'serrurier', label: 'Serrurier', icon: '🔑',
    suggestedObjectives: ['services', 'contact', 'quote'],
    defaultModules: ['services', 'quote', 'contact', 'location', 'hours', 'testimonials'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'testimonials', 'cta'] },
      { name: 'Services', slug: 'services', sections: ['services'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'construction', catalogKind: 'services',
  },
]

const SANTE: Activity[] = [
  {
    id: 'medecin', label: 'Médecin', icon: '🩺',
    suggestedObjectives: ['company', 'services', 'booking', 'contact'],
    defaultModules: ['about', 'services', 'booking', 'hours', 'location', 'contact', 'faq'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'hours'] },
      { name: 'Le cabinet', slug: 'cabinet', sections: ['about', 'gallery'] },
      { name: 'Spécialités', slug: 'specialites', sections: ['services', 'faq'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'health', catalogKind: 'services',
  },
  {
    id: 'dentiste', label: 'Dentiste', icon: '🦷',
    suggestedObjectives: ['company', 'services', 'booking', 'contact'],
    defaultModules: ['about', 'services', 'booking', 'hours', 'location', 'contact', 'faq', 'gallery'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'hours'] },
      { name: 'Soins', slug: 'soins', sections: ['services', 'faq'] },
      { name: 'Le cabinet', slug: 'cabinet', sections: ['about', 'gallery'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'health', catalogKind: 'services',
  },
  {
    id: 'kine', label: 'Kinésithérapeute / Ostéopathe', icon: '💪',
    suggestedObjectives: ['company', 'services', 'booking', 'contact'],
    defaultModules: ['about', 'services', 'booking', 'hours', 'location', 'contact', 'faq'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services'] },
      { name: 'Soins', slug: 'soins', sections: ['services', 'faq'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'health', catalogKind: 'services',
  },
  {
    id: 'psychologue', label: 'Psychologue', icon: '🧠',
    suggestedObjectives: ['company', 'services', 'booking', 'contact'],
    defaultModules: ['about', 'services', 'booking', 'hours', 'location', 'contact', 'faq'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services'] },
      { name: 'Consultations', slug: 'consultations', sections: ['services', 'pricing', 'faq'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'health', catalogKind: 'services',
  },
]

const SERVICES: Activity[] = [
  {
    id: 'avocat', label: 'Avocat', icon: '⚖️',
    suggestedObjectives: ['company', 'services', 'contact', 'booking'],
    defaultModules: ['about', 'services', 'booking', 'contact', 'location', 'faq', 'testimonials'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'testimonials'] },
      { name: 'Domaines', slug: 'domaines', sections: ['services', 'faq'] },
      { name: 'Le cabinet', slug: 'cabinet', sections: ['about'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'booking'] },
    ],
    imageCategory: 'business', catalogKind: 'services',
  },
  {
    id: 'comptable', label: 'Comptable', icon: '📊',
    suggestedObjectives: ['company', 'services', 'pricing', 'contact'],
    defaultModules: ['about', 'services', 'pricing', 'contact', 'location', 'faq', 'testimonials'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'testimonials'] },
      { name: 'Services', slug: 'services', sections: ['services', 'pricing'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'business', catalogKind: 'services',
  },
  {
    id: 'consultant', label: 'Consultant', icon: '💼',
    suggestedObjectives: ['company', 'services', 'portfolio', 'contact', 'reviews'],
    defaultModules: ['about', 'services', 'portfolio', 'testimonials', 'contact', 'booking'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'testimonials', 'cta'] },
      { name: 'Expertise', slug: 'expertise', sections: ['services'] },
      { name: 'Références', slug: 'references', sections: ['portfolio', 'testimonials'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'booking'] },
    ],
    imageCategory: 'business', catalogKind: 'services',
  },
  {
    id: 'coach', label: 'Coach / Formateur', icon: '🎯',
    suggestedObjectives: ['company', 'services', 'pricing', 'booking', 'reviews'],
    defaultModules: ['about', 'services', 'pricing', 'booking', 'testimonials', 'contact', 'faq'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'testimonials', 'cta'] },
      { name: 'Programmes', slug: 'programmes', sections: ['services', 'pricing', 'faq'] },
      { name: 'Réserver', slug: 'reserver', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact'] },
    ],
    imageCategory: 'business', catalogKind: 'services',
  },
  {
    id: 'agence', label: 'Agence / Freelance', icon: '🚀',
    suggestedObjectives: ['company', 'services', 'portfolio', 'quote', 'reviews'],
    defaultModules: ['about', 'services', 'portfolio', 'gallery', 'quote', 'testimonials', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'portfolio', 'testimonials', 'cta'] },
      { name: 'Services', slug: 'services', sections: ['services'] },
      { name: 'Projets', slug: 'projets', sections: ['portfolio', 'gallery'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'quote'] },
    ],
    imageCategory: 'technology', catalogKind: 'services',
  },
]

const AUTRES: Activity[] = [
  {
    id: 'photographe', label: 'Photographe', icon: '📸',
    suggestedObjectives: ['portfolio', 'gallery', 'services', 'quote', 'contact'],
    defaultModules: ['portfolio', 'gallery', 'services', 'quote', 'contact', 'about', 'pricing'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'portfolio', 'services', 'cta'] },
      { name: 'Portfolio', slug: 'portfolio', sections: ['gallery', 'portfolio'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'pricing'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'quote'] },
    ],
    imageCategory: 'lifestyle', catalogKind: 'services',
  },
  {
    id: 'garage', label: 'Garage automobile', icon: '🚗',
    suggestedObjectives: ['services', 'booking', 'quote', 'contact', 'reviews'],
    defaultModules: ['services', 'booking', 'quote', 'testimonials', 'contact', 'location', 'hours', 'gallery'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'testimonials', 'hours'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'pricing'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
  },
  {
    id: 'immobilier', label: 'Agent immobilier', icon: '🏠',
    suggestedObjectives: ['products', 'services', 'company', 'contact'],
    defaultModules: ['products', 'categories', 'services', 'about', 'contact', 'location', 'testimonials'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'services'] },
      { name: 'Biens', slug: 'biens', sections: ['products'] },
      { name: 'Services', slug: 'services', sections: ['services', 'testimonials'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'real-estate', catalogKind: 'products',
  },
  {
    id: 'coiffeur', label: 'Coiffeur / Institut', icon: '💇',
    suggestedObjectives: ['services', 'pricing', 'booking', 'gallery'],
    defaultModules: ['services', 'pricing', 'booking', 'gallery', 'hours', 'location', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'gallery', 'hours'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'pricing'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'beauty', catalogKind: 'services',
  },
  {
    id: 'architecte', label: 'Architecte', icon: '📐',
    suggestedObjectives: ['portfolio', 'services', 'company', 'contact'],
    defaultModules: ['portfolio', 'gallery', 'services', 'about', 'contact', 'quote'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'portfolio', 'services'] },
      { name: 'Projets', slug: 'projets', sections: ['portfolio', 'gallery'] },
      { name: 'Agence', slug: 'agence', sections: ['about'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'quote'] },
    ],
    imageCategory: 'real-estate', catalogKind: 'services',
  },
  {
    id: 'association', label: 'Association', icon: '🤝',
    suggestedObjectives: ['company', 'services', 'gallery', 'contact'],
    defaultModules: ['about', 'services', 'gallery', 'contact', 'location', 'social', 'faq'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'gallery'] },
      { name: 'Nos actions', slug: 'actions', sections: ['services', 'gallery'] },
      { name: 'Nous rejoindre', slug: 'nous-rejoindre', sections: ['cta', 'faq'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'social'] },
    ],
    imageCategory: 'lifestyle', catalogKind: 'services',
  },
]

export const SECTORS: ActivitySector[] = [
  { id: 'restauration', label: 'Restauration', activities: RESTAURATION },
  { id: 'commerce', label: 'Commerce', activities: COMMERCE },
  { id: 'artisans', label: 'Artisans', activities: ARTISANS },
  { id: 'sante', label: 'Santé', activities: SANTE },
  { id: 'services', label: 'Services', activities: SERVICES },
  { id: 'autres', label: 'Autres', activities: AUTRES },
]

export const ALL_ACTIVITIES: Activity[] = SECTORS.flatMap((s) => s.activities)

/** Activite generique utilisee pour « Je ne trouve pas mon activite » (§6). */
export const CUSTOM_ACTIVITY: Activity = {
  id: 'custom', label: 'Autre activité', icon: '✨',
  suggestedObjectives: ['company', 'services', 'contact'],
  defaultModules: ['about', 'services', 'gallery', 'contact', 'location', 'testimonials'],
  defaultPages: [
    { name: 'Accueil', slug: '', sections: ['hero', 'about', 'services', 'testimonials', 'cta'] },
    { name: 'À propos', slug: 'a-propos', sections: ['about'] },
    { name: 'Services', slug: 'services', sections: ['services'] },
    { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
  ],
  imageCategory: 'business', catalogKind: 'services',
}

export function getActivity(id: string | null): Activity | null {
  if (!id) return null
  if (id === 'custom') return CUSTOM_ACTIVITY
  return ALL_ACTIVITIES.find((a) => a.id === id) ?? null
}

export function searchActivities(query: string): Activity[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ALL_ACTIVITIES.filter((a) => a.label.toLowerCase().includes(q))
}
