import type { ActivitySector, Activity } from './types'

/**
 * Catalogue des metiers. Ajouter une activite = ajouter une entree ici,
 * aucun code de builder a ecrire (cf. §48).
 */

const RESTAURATION: Activity[] = [
  {
    // Un restaurant reserve ET prend des commandes : les deux tunnels coexistent,
    // comme sur les sites d'enseignes a table.
    id: 'restaurant', label: 'Restaurant', icon: '🍽️',
    suggestedObjectives: ['menu', 'company', 'gallery', 'contact', 'orders', 'booking'],
    defaultModules: [
      'menu', 'categories', 'products', 'cart', 'order', 'ordermodes', 'formulas', 'allergens',
      'gallery', 'booking', 'stats', 'hours', 'location', 'contact', 'about',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'ordermodes', 'about', 'formulas', 'products', 'gallery', 'hours', 'cta'] },
      { name: 'La carte', slug: 'carte', sections: ['products', 'allergens'] },
      { name: 'À propos', slug: 'a-propos', sections: ['about', 'stats', 'testimonials'] },
      { name: 'Réserver', slug: 'reserver', sections: ['booking', 'hours', 'location'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'hours', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    // Restauration rapide : le parcours commence par le mode de service, comme
    // sur les sites d'enseignes, et la carte est la page la plus travaillee.
    id: 'snack', label: 'Snack / Fast-food', icon: '🍔',
    suggestedObjectives: ['menu', 'orders', 'promotions', 'contact'],
    defaultModules: [
      'menu', 'categories', 'products', 'cart', 'order', 'ordermodes', 'formulas', 'offers',
      'venues', 'allergens', 'loyalty', 'banner', 'tv', 'qrcode', 'hours', 'location', 'contact',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['banner', 'hero', 'ordermodes', 'offers', 'products', 'loyalty', 'cta'] },
      { name: 'La carte', slug: 'carte', sections: ['products', 'formulas', 'allergens'] },
      { name: 'Nos restaurants', slug: 'restaurants', sections: ['venues', 'hours'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    id: 'cafe', label: 'Café / Salon de thé', icon: '☕',
    suggestedObjectives: ['menu', 'company', 'gallery', 'contact'],
    defaultModules: [
      'menu', 'categories', 'products', 'formulas', 'allergens', 'gallery',
      'hours', 'location', 'contact', 'about',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'gallery', 'hours'] },
      { name: 'Carte', slug: 'carte', sections: ['products', 'formulas', 'allergens'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
  {
    id: 'boulangerie', label: 'Boulangerie / Pâtisserie', icon: '🥐',
    suggestedObjectives: ['products', 'company', 'gallery', 'contact'],
    defaultModules: ['products', 'categories', 'allergens', 'gallery', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'about', 'products', 'gallery', 'hours'] },
      { name: 'Nos produits', slug: 'produits', sections: ['products', 'allergens'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'food', catalogKind: 'products',
  },
  {
    id: 'traiteur', label: 'Traiteur', icon: '🥗',
    suggestedObjectives: ['services', 'products', 'quote', 'gallery', 'contact'],
    defaultModules: ['services', 'products', 'formulas', 'allergens', 'gallery', 'quote', 'contact', 'location'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'formulas', 'gallery', 'cta'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'products', 'allergens'] },
      { name: 'Devis', slug: 'devis', sections: ['quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'food', catalogKind: 'services',
  },
  {
    // Le food truck n'a pas d'adresse fixe : « Etablissements » devient la
    // tournee de la semaine.
    id: 'food-truck', label: 'Food truck', icon: '🚚',
    suggestedObjectives: ['menu', 'contact', 'promotions'],
    defaultModules: [
      'menu', 'products', 'formulas', 'allergens', 'offers', 'venues', 'loyalty',
      'banner', 'tv', 'qrcode', 'hours', 'location', 'contact', 'social',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['banner', 'hero', 'venues', 'products', 'offers', 'social'] },
      { name: 'Menu', slug: 'menu', sections: ['products', 'formulas', 'allergens'] },
      { name: 'Où nous trouver', slug: 'ou-nous-trouver', sections: ['venues', 'hours', 'location', 'contact'] },
      { name: 'Fidélité', slug: 'fidelite', sections: ['loyalty'] },
    ],
    imageCategory: 'food', catalogKind: 'menu',
  },
]

const COMMERCE: Activity[] = [
  {
    id: 'epicerie', label: 'Épicerie', icon: '🛒',
    suggestedObjectives: ['products', 'company', 'promotions', 'contact'],
    defaultModules: ['products', 'categories', 'offers', 'loyalty', 'banner', 'tv', 'qrcode', 'hours', 'location', 'contact', 'about'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['banner', 'hero', 'about', 'offers', 'products', 'hours'] },
      { name: 'Produits', slug: 'produits', sections: ['products'] },
      { name: 'Fidélité', slug: 'fidelite', sections: ['loyalty'] },
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
    defaultModules: ['products', 'categories', 'cart', 'order', 'ordermodes', 'gallery', 'hours', 'location', 'contact'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'ordermodes', 'products', 'gallery', 'hours'] },
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

/**
 * Automobile. Le secteur suit les usages des enseignes du domaine : on entre par
 * son vehicule (marque, modele, motorisation, ou plaque), on lit des forfaits
 * dont on sait ce qu'ils contiennent, on prend rendez-vous, et pour la
 * formation on veut le programme, les dates et le financement avant le prix.
 *
 * Tout cela n'est que de la donnee : aucune section ne connait l'automobile,
 * c'est `sectionDefaults` qui l'habille (§48).
 */
const AUTOMOBILE: Activity[] = [
  {
    id: 'garage', label: 'Garage / Mécanique générale', icon: '🔧',
    keywords: ['garage', 'mecanicien', 'mecanique', 'revision', 'vidange', 'embrayage', 'distribution', 'entretien', 'auto', 'voiture'],
    suggestedObjectives: ['services', 'pricing', 'gallery', 'booking', 'quote', 'contact', 'reviews'],
    defaultModules: [
      'services', 'process', 'finder', 'pricing', 'gallery', 'booking', 'quote', 'testimonials',
      'logos', 'hours', 'location', 'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'finder', 'services', 'certifications', 'process', 'testimonials', 'hours'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'pricing', 'gallery'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking', 'quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Vidange et filtres', "Huile adaptée à votre motorisation, filtre à huile, contrôle des niveaux."],
      ['Freinage', 'Plaquettes, disques, liquide de frein : contrôle et remplacement.'],
      ['Distribution', 'Courroie ou chaîne, galets et pompe à eau, selon les préconisations constructeur.'],
      ['Diagnostic électronique', 'Lecture des défauts, recherche de panne et remise à zéro des témoins.'],
      ['Climatisation', 'Contrôle du circuit, recharge et désinfection.'],
      ['Embrayage', "Kit complet, butée et volant moteur si nécessaire."],
      ['Pré-contrôle technique', 'Les points du contrôle vérifiés avant le passage, pour éviter la contre-visite.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Nos engagements',
        subtitle: 'Ce sur quoi vous pouvez compter à chaque passage à l’atelier.',
        items: [
          { name: 'Devis avant intervention', issuer: 'Engagement maison', text: 'Chiffré et validé par vous avant qu’une seule pièce soit commandée.', validity: 'À chaque passage' },
          { name: 'Pièces d’origine ou équivalentes', issuer: 'Fournisseurs agréés', text: 'Conformes aux préconisations du constructeur, et garanties.', validity: 'Garantie constructeur préservée' },
          { name: 'Techniciens qualifiés', issuer: 'Formation continue', text: 'Une équipe formée aux motorisations récentes, thermiques comme hybrides.', validity: 'Mise à jour chaque année' },
          { name: 'Véhicule de prêt', issuer: 'Sur réservation', text: 'Pour ne pas rester immobilisé pendant l’intervention.', validity: 'Selon disponibilité' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Prendre rendez-vous', ctaSecondaryLabel: 'Nos prestations' },
      finder: {
        title: 'Votre véhicule',
        subtitle: 'Indiquez votre véhicule : nous affichons les prestations et les pièces qui lui correspondent.',
        criteria: [
          { label: 'Marque', example: 'Renault, Peugeot, Volkswagen…' },
          { label: 'Modèle', example: 'Clio, 308, Golf…' },
          { label: 'Motorisation', example: '1.5 dCi, 1.2 PureTech…' },
          { label: 'Année', example: '2018' },
        ],
        directLabel: "Ou saisissez votre plaque d'immatriculation",
        directExample: 'AB-123-CD',
        ctaLabel: 'Voir les prestations',
      },
    },
  },
  {
    id: 'carrosserie', label: 'Carrossier / Peintre auto', icon: '🎨',
    keywords: ['carrosserie', 'carrossier', 'peinture', 'debosselage', 'tolerie', 'pare-chocs', 'sinistre', 'assurance'],
    suggestedObjectives: ['company', 'services', 'portfolio', 'gallery', 'quote', 'contact', 'reviews'],
    defaultModules: [
      'about', 'stats', 'services', 'process', 'portfolio', 'beforeafter', 'gallery', 'quote',
      'testimonials', 'logos', 'hours', 'location', 'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'beforeafter', 'certifications', 'stats', 'testimonials', 'cta'] },
      { name: 'Nos réparations', slug: 'reparations', sections: ['services', 'portfolio'] },
      { name: 'Réalisations', slug: 'realisations', sections: ['beforeafter', 'gallery'] },
      { name: 'Devis', slug: 'devis', sections: ['quote', 'process'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Débosselage sans peinture', 'Petits chocs et impacts de grêle, sans toucher à la peinture d’origine.'],
      ['Peinture et raccord', 'Teinte relevée au nuancier, raccord invisible sur l’élément voisin.'],
      ['Remplacement d’élément', 'Aile, portière, capot : dépose, ajustage et peinture.'],
      ['Pare-chocs', 'Réparation plastique ou remplacement, puis mise en peinture.'],
      ['Polissage et rénovation', 'Rayures superficielles, ternissement, optiques opacifiées.'],
      ['Dossier assurance', 'Constat, expertise et suivi du dossier avec votre assureur.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Nos garanties',
        subtitle: 'Un sinistre se règle aussi sur le papier : voilà ce que nous prenons en charge.',
        items: [
          { name: 'Agrément assurances', issuer: 'Compagnies partenaires', text: 'Nous montons le dossier et facturons directement votre assureur.', validity: 'Renouvelé chaque année' },
          { name: 'Peinture garantie', issuer: 'Fabricant de peinture', text: 'Teinte relevée au nuancier, tenue et brillance garanties dans le temps.', validity: 'Garantie longue durée' },
          { name: 'Véhicule de remplacement', issuer: 'Sur réservation', text: 'Pendant toute l’immobilisation du vôtre.', validity: 'Selon disponibilité' },
          { name: 'Délai annoncé au devis', issuer: 'Engagement maison', text: 'Une date de restitution donnée dès le devis, et tenue.', validity: 'À chaque dossier' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Demander un devis', ctaSecondaryLabel: 'Voir nos réparations' },
      quote: {
        title: 'Votre devis en trois photos',
        subtitle: "Envoyez une photo d'ensemble, une photo du dégât et une photo de la plaque : nous revenons vers vous sous 24 h.",
        ctaLabel: 'Envoyer mes photos',
      },
      beforeafter: {
        title: 'Avant / après réparation',
        subtitle: 'Faites glisser le curseur : le véhicule sort comme avant le choc.',
        beforeLabel: 'Après le choc', afterLabel: 'Après réparation',
      },
    },
  },
  {
    id: 'centre-auto', label: 'Centre auto', icon: '🛠️',
    keywords: ['centre auto', 'entretien', 'forfait', 'revision', 'atelier', 'montage', 'accessoires'],
    suggestedObjectives: ['services', 'pricing', 'booking', 'promotions', 'products', 'contact', 'reviews'],
    defaultModules: [
      'services', 'process', 'pricing', 'finder', 'booking', 'products', 'categories', 'offers',
      'loyalty', 'banner', 'tv', 'qrcode', 'testimonials', 'logos', 'hours', 'location',
      'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['banner', 'hero', 'finder', 'pricing', 'offers', 'services', 'certifications', 'testimonials'] },
      { name: 'Nos forfaits', slug: 'forfaits', sections: ['pricing', 'services', 'process'] },
      { name: 'Boutique', slug: 'boutique', sections: ['products'] },
      { name: 'Fidélité', slug: 'fidelite', sections: ['loyalty'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking', 'hours'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Forfait vidange', 'Huile, filtre à huile, contrôle des niveaux et main-d’œuvre.'],
      ['Révision constructeur', 'Le programme d’entretien prévu par votre constructeur, sans perte de garantie.'],
      ['Freinage', 'Plaquettes avant ou arrière, disques, purge du circuit.'],
      ['Climatisation', 'Recharge du gaz, contrôle d’étanchéité, filtre d’habitacle.'],
      ['Batterie et démarrage', 'Test de charge, remplacement et recyclage de l’ancienne batterie.'],
      ['Amortisseurs', 'Contrôle de la tenue de route, remplacement par paire.'],
      ['Montage de pneus', 'Montage, équilibrage, valves neuves et recyclage.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Nos engagements',
        subtitle: 'Un atelier, des prix affichés, et rien qui se décide sans vous.',
        items: [
          { name: 'Devis avant travaux', issuer: 'Engagement maison', text: 'Rien n’est engagé sans votre accord, même en cours d’intervention.', validity: 'À chaque passage' },
          { name: 'Garantie constructeur préservée', issuer: 'Réglementation européenne', text: 'Faire entretenir son véhicule chez nous n’annule pas la garantie d’origine.', validity: 'Tous véhicules' },
          { name: 'Rendez-vous rapide', issuer: 'Engagement maison', text: 'Un créneau sous 48 h, souvent le jour même pour les forfaits courts.', validity: 'Du lundi au samedi' },
          { name: 'Reprise et recyclage', issuer: 'Filière agréée', text: 'Huiles, batteries, filtres et pneus repris et retraités.', validity: 'Sans supplément' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Prendre rendez-vous', ctaSecondaryLabel: 'Voir les forfaits' },
      banner: { text: 'Rendez-vous en ligne en moins d’une minute — atelier ouvert du lundi au samedi' },
      offers: {
        title: 'Nos promotions du moment',
        subtitle: 'Valables en atelier, sur rendez-vous comme en passage libre.',
        items: [
          { name: 'Pack révision + freinage', text: 'Les deux forfaits réalisés dans la même immobilisation.', price: '', oldPrice: '', badge: 'Pack', code: '' },
          { name: 'Contrôle avant départ', text: 'Niveaux, pneus, freins et éclairage vérifiés avant les vacances.', price: '', oldPrice: '', badge: 'Offert', code: '' },
          { name: 'Montage de pneus', text: 'Équilibrage et valves neuves compris, reprise des anciens pneus.', price: '', oldPrice: '', badge: 'Atelier', code: '' },
        ],
        ctaLabel: 'Prendre rendez-vous',
      },
      loyalty: {
        title: 'Le carnet d’entretien fidélité',
        text: 'Chaque passage à l’atelier est enregistré : vous gardez l’historique complet de votre véhicule et vous cumulez des avantages.',
        items: [
          { name: 'Historique d’entretien conservé' },
          { name: 'Rappel automatique des échéances' },
          { name: 'Avantage à chaque forfait cumulé' },
        ],
        ctaLabel: 'Créer mon espace',
      },
      finder: {
        title: 'Sélectionnez votre véhicule',
        subtitle: 'Les forfaits et les pièces affichés correspondront à votre modèle.',
        criteria: [
          { label: 'Marque', example: 'Renault, Peugeot, Volkswagen…' },
          { label: 'Modèle', example: 'Clio, 308, Golf…' },
          { label: 'Motorisation', example: '1.5 dCi, 1.2 PureTech…' },
          { label: 'Année', example: '2018' },
        ],
        directLabel: 'Ou saisissez votre plaque',
        directExample: 'AB-123-CD',
        ctaLabel: 'Valider mon véhicule',
      },
      pricing: {
        title: 'Nos forfaits d’entretien',
        subtitle: 'Prestation, pièces et main-d’œuvre comprises. Remplacez les tarifs par les vôtres.',
        items: [
          { name: 'Forfait vidange', price: '—', description: 'Huile adaptée, filtre à huile, contrôle 20 points, main-d’œuvre.' },
          { name: 'Révision complète', price: '—', description: 'Vidange, filtres air, habitacle et carburant, contrôle 50 points.' },
          { name: 'Forfait freinage', price: '—', description: 'Plaquettes avant, contrôle des disques, purge du liquide.' },
          { name: 'Climatisation', price: '—', description: 'Recharge, contrôle d’étanchéité, désinfection du circuit.' },
        ],
      },
    },
  },
  {
    id: 'pneus', label: 'Pneus & jantes', icon: '🛞',
    keywords: ['pneu', 'pneus', 'jantes', 'montage', 'equilibrage', 'geometrie', 'parallelisme', 'hiver', 'ete'],
    suggestedObjectives: ['products', 'services', 'pricing', 'booking', 'promotions', 'contact'],
    defaultModules: [
      'products', 'categories', 'finder', 'services', 'process', 'pricing', 'booking', 'offers',
      'loyalty', 'banner', 'tv', 'qrcode', 'hours', 'location', 'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['banner', 'hero', 'finder', 'offers', 'products', 'services', 'loyalty'] },
      { name: 'Nos pneus', slug: 'pneus', sections: ['finder', 'products'] },
      { name: 'Montage', slug: 'montage', sections: ['services', 'certifications', 'pricing', 'process', 'booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'products',
    sampleCatalog: [
      ['Pneus été', 'Adhérence sur route sèche et mouillée, usure lente.'],
      ['Pneus hiver', 'Obligatoires en zone montagne, gomme efficace sous 7 °C.'],
      ['Pneus 4 saisons', 'Un seul train toute l’année, sans permutation.'],
      ['Jantes alu', 'Diamètres courants, montage et équilibrage compris.'],
      ['Montage et équilibrage', 'Valves neuves, équilibrage des quatre roues, reprise des anciens pneus.'],
      ['Géométrie', 'Parallélisme contrôlé au banc, usure irrégulière corrigée.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Montage et garanties',
        subtitle: 'Le pneu compte, la pose aussi.',
        items: [
          { name: 'Montage en atelier', issuer: 'Techniciens formés', text: 'Équilibrage des quatre roues, valves neuves, couple de serrage contrôlé.', validity: 'À chaque montage' },
          { name: 'Reprise des anciens pneus', issuer: 'Filière agréée', text: 'Vos pneus usagés sont repris et envoyés au recyclage.', validity: 'Sans supplément' },
          { name: 'Gardiennage saisonnier', issuer: 'Sur réservation', text: 'Nous stockons votre train de pneus entre deux saisons.', validity: 'Selon disponibilité' },
          { name: 'Contrôle de pression offert', issuer: 'Engagement maison', text: 'Quand vous passez, même sans rendez-vous.', validity: 'Toute l’année' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Trouver mes pneus', ctaSecondaryLabel: 'Prendre rendez-vous' },
      banner: { text: 'Montage possible le jour même — reprise et recyclage de vos anciens pneus' },
      offers: {
        title: 'Nos offres pneumatiques',
        subtitle: 'Montage possible le jour même, sur rendez-vous.',
        items: [
          { name: 'Train complet', text: 'Quatre pneus montés, équilibrés, valves neuves.', price: '', oldPrice: '', badge: 'Le plus demandé', code: '' },
          { name: 'Passage en pneus hiver', text: 'Montage, équilibrage et gardiennage de vos pneus été.', price: '', oldPrice: '', badge: 'Saison', code: '' },
          { name: 'Géométrie', text: 'Contrôle du parallélisme pour tout train de pneus posé en atelier.', price: '', oldPrice: '', badge: 'Atelier', code: '' },
        ],
        ctaLabel: 'Voir les pneus',
      },
      loyalty: {
        title: 'La carte fidélité',
        text: 'Vos passages sont enregistrés : contrôle de pression offert, gardiennage de vos pneus saison et avantages sur votre prochain train.',
        items: [
          { name: 'Contrôle de pression offert' },
          { name: 'Gardiennage de vos pneus saison' },
          { name: 'Avantage sur le prochain train de pneus' },
        ],
        ctaLabel: 'Créer mon espace',
      },
      finder: {
        title: 'Trouvez vos pneus',
        subtitle: 'La dimension est inscrite sur le flanc de votre pneu actuel.',
        criteria: [
          { label: 'Largeur', example: '205' },
          { label: 'Hauteur', example: '55' },
          { label: 'Diamètre', example: 'R16' },
          { label: 'Indice de charge et vitesse', example: '91V' },
        ],
        directLabel: 'Ou saisissez votre plaque, nous retrouvons la monte d’origine',
        directExample: 'AB-123-CD',
        ctaLabel: 'Voir les pneus compatibles',
      },
    },
  },
  {
    id: 'pare-brise', label: 'Vitrage / Pare-brise', icon: '🪟',
    keywords: ['pare-brise', 'parebrise', 'vitrage', 'impact', 'vitre', 'lunette', 'bris de glace'],
    suggestedObjectives: ['services', 'booking', 'quote', 'contact', 'reviews'],
    defaultModules: [
      'services', 'process', 'booking', 'quote', 'testimonials', 'logos', 'faq', 'hours',
      'location', 'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'certifications', 'process', 'testimonials', 'cta'] },
      { name: 'Interventions', slug: 'interventions', sections: ['services', 'faq'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking', 'quote'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Réparation d’impact', 'Un impact traité à temps évite le remplacement complet.'],
      ['Remplacement de pare-brise', 'Vitrage conforme aux normes constructeur, pose en atelier ou à domicile.'],
      ['Vitre latérale', 'Après effraction, remplacement et nettoyage complet de l’habitacle.'],
      ['Lunette arrière', 'Y compris le réseau dégivrant.'],
      ['Recalibrage des caméras', 'Obligatoire après remplacement sur les véhicules équipés d’aides à la conduite.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Assurance et garanties',
        subtitle: 'Un bris de glace se règle presque toujours sans avancer d’argent.',
        items: [
          { name: 'Agréé toutes assurances', issuer: 'Compagnies partenaires', text: 'Nous vérifions votre garantie bris de glace et facturons directement l’assureur.', validity: 'Renouvelé chaque année' },
          { name: 'Vitrage conforme', issuer: 'Normes constructeur', text: 'Un vitrage aux caractéristiques d’origine, pose et étanchéité garanties.', validity: 'Garantie à vie sur la pose' },
          { name: 'Recalibrage des caméras', issuer: 'Constructeurs équipés', text: 'Obligatoire après remplacement sur les véhicules à aides à la conduite.', validity: 'Systématique' },
          { name: 'Intervention rapide', issuer: 'Engagement maison', text: 'Réparation d’impact en moins d’une heure, à l’atelier ou chez vous.', validity: '7 j/7' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Faire réparer mon pare-brise', ctaSecondaryLabel: 'Nos interventions' },
      process: {
        title: 'Comment ça se passe',
        subtitle: 'De l’appel à la remise des clés.',
        items: [
          { title: 'Vous nous appelez', text: 'Photo de l’impact ou numéro de plaque, cela suffit pour vous répondre.' },
          { title: 'Nous voyons l’assurance', text: 'Nous vérifions votre garantie bris de glace et montons le dossier.' },
          { title: 'Intervention', text: 'En atelier ou sur place, avec un vitrage conforme.' },
          { title: 'Remise du véhicule', text: 'Séchage contrôlé, consignes de conduite pour les premières heures.' },
        ],
      },
    },
  },
  {
    id: 'controle-technique', label: 'Contrôle technique', icon: '✅',
    keywords: ['controle technique', 'contre-visite', 'antipollution', 'agree', 'visite'],
    suggestedObjectives: ['services', 'pricing', 'booking', 'contact'],
    defaultModules: [
      'services', 'process', 'pricing', 'booking', 'faq', 'hours', 'location', 'contact',
      'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'certifications', 'pricing', 'hours'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking', 'faq'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Contrôle technique périodique', 'Les 133 points réglementaires, procès-verbal remis immédiatement.'],
      ['Contre-visite', 'Vérification des seuls points signalés, dans le délai réglementaire.'],
      ['Contrôle volontaire', 'Avant un achat ou une vente, pour savoir où en est le véhicule.'],
      ['Contrôle antipollution', 'Mesure des émissions, obligatoire entre deux visites pour certains véhicules.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Agrément et cadre légal',
        subtitle: 'Un centre agréé, des règles identiques partout, un résultat opposable.',
        items: [
          { name: 'Centre agréé', issuer: 'Préfecture', text: 'Agrément délivré par l’État, contrôleurs qualifiés et audités.', validity: 'Agrément en cours de validité' },
          { name: 'Contrôleurs certifiés', issuer: 'Organisme technique central', text: 'Formation initiale et recyclage réglementaires.', validity: 'Recyclage périodique' },
          { name: 'Procès-verbal opposable', issuer: 'Réglementation', text: 'Remis à la fin du contrôle, valable auprès de tous.', validity: 'Deux ans, ou un an en cas de défaillance' },
          { name: 'Indépendance', issuer: 'Engagement maison', text: 'Nous contrôlons, nous ne réparons pas : aucun intérêt à trouver un défaut.', validity: 'Par principe' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Réserver mon contrôle', ctaSecondaryLabel: 'Nos horaires' },
      faq: {
        title: 'Questions fréquentes',
        items: [
          { question: 'Quels documents dois-je apporter ?', answer: 'La carte grise du véhicule suffit. Pensez à dégager le coffre et à retirer les enjoliveurs.' },
          { question: 'Combien de temps dure le contrôle ?', answer: 'Comptez environ trois quarts d’heure. Le procès-verbal vous est remis à la fin.' },
          { question: 'Quel délai pour la contre-visite ?', answer: 'Deux mois après la visite initiale. Au-delà, le contrôle complet est à refaire.' },
          { question: 'Mon véhicule est-il concerné ?', answer: 'Premier contrôle dans les six mois précédant les quatre ans du véhicule, puis tous les deux ans.' },
        ],
      },
    },
  },
  {
    id: 'depannage', label: 'Dépannage / Remorquage', icon: '🚨',
    keywords: ['depannage', 'remorquage', 'assistance', 'panne', 'urgence', 'plateau', 'fourriere'],
    suggestedObjectives: ['services', 'contact', 'reviews'],
    defaultModules: ['services', 'process', 'testimonials', 'logos', 'faq', 'hours', 'location', 'contact', 'certifications', 'coverage'],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'certifications', 'services', 'coverage', 'process', 'testimonials', 'cta'] },
      { name: 'Interventions', slug: 'interventions', sections: ['services', 'faq'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Dépannage sur route', 'Panne immobilisante : nous venons à vous et tentons la remise en route sur place.'],
      ['Remorquage', 'Vers le garage de votre choix, plateau ou attelage selon le véhicule.'],
      ['Batterie à plat', 'Démarrage assisté, test de la batterie et de l’alternateur.'],
      ['Erreur de carburant', 'Vidange du réservoir avant que le moteur ne souffre.'],
      ['Ouverture de véhicule', 'Clés enfermées à l’intérieur, ouverture sans dommage.'],
    ],
    sectionDefaults: {
      coverage: {
        title: 'Notre zone d’intervention',
        subtitle: 'Nous partons dès votre appel. Au-delà de la zone, nous vous orientons vers un confrère.',
        radius: 30,
        unit: 'min',
        delay: 'Sur place en moins de 30 minutes',
        items: [
          { name: 'Ville et première couronne', note: 'Sous 30 minutes, jour et nuit' },
          { name: 'Autoroutes et voies rapides', note: 'Sur appel de votre assistance' },
          { name: 'Communes périphériques', note: 'Sous 45 minutes' },
          { name: 'Zones d’activité', note: 'Utilitaires et véhicules de société' },
        ],
        showSearch: true,
        searchLabel: 'Où êtes-vous immobilisé ?',
        outsideText: 'Hors zone, appelez quand même : nous connaissons les dépanneurs du secteur et nous vous mettons en relation.',
      },
      certifications: {
        title: 'Nos engagements',
        subtitle: 'Une panne ne prévient pas : voilà ce qui est garanti quand vous appelez.',
        items: [
          { name: 'Disponible 24 h/24', issuer: 'Engagement maison', text: 'Nuits, dimanches et jours fériés compris, un humain décroche.', validity: '7 j/7' },
          { name: 'Agréé assistances', issuer: 'Assisteurs partenaires', text: 'Nous travaillons avec les principales assistances : souvent aucun frais à avancer.', validity: 'Renouvelé chaque année' },
          { name: 'Véhicules équipés', issuer: 'Contrôle réglementaire', text: 'Plateau et attelage, adaptés aux véhicules récents comme aux utilitaires.', validity: 'Contrôlés chaque année' },
          { name: 'Paiement sur place', issuer: 'Engagement maison', text: 'Carte bancaire acceptée dans le camion, facture remise immédiatement.', validity: 'À chaque intervention' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Appeler maintenant', ctaSecondaryLabel: 'Notre zone d’intervention' },
      banner: { text: 'Dépannage 24 h/24 et 7 j/7 — appelez, nous partons' },
    },
  },
  {
    id: 'preparation', label: 'Lavage / Préparation esthétique', icon: '✨',
    keywords: ['lavage', 'nettoyage', 'detailing', 'preparation', 'ceramique', 'polissage', 'covering'],
    suggestedObjectives: ['services', 'pricing', 'gallery', 'portfolio', 'booking', 'contact'],
    defaultModules: [
      'services', 'process', 'pricing', 'gallery', 'portfolio', 'beforeafter', 'booking',
      'hours', 'location', 'contact',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'beforeafter', 'gallery', 'pricing', 'cta'] },
      { name: 'Nos formules', slug: 'formules', sections: ['pricing', 'services', 'process'] },
      { name: 'Réalisations', slug: 'realisations', sections: ['gallery', 'portfolio'] },
      { name: 'Réserver', slug: 'reserver', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Lavage intérieur et extérieur', 'Carrosserie, jantes, vitres, aspiration complète de l’habitacle.'],
      ['Nettoyage des sièges', 'Injection-extraction sur tissu, nourrissage du cuir.'],
      ['Traitement céramique', 'Protection durable de la peinture, brillance et entretien facilité.'],
      ['Rénovation des optiques', 'Phares ternis poncés, polis et protégés.'],
      ['Préparation avant vente', 'Le véhicule remis dans l’état qui justifie son prix.'],
    ],
    sectionDefaults: {
      hero: { ctaLabel: 'Réserver un créneau', ctaSecondaryLabel: 'Voir nos formules' },
      beforeafter: { title: 'Avant / après', subtitle: 'Le même véhicule, le même jour.', beforeLabel: 'À l’arrivée', afterLabel: 'À la restitution' },
    },
  },
  {
    id: 'moto', label: 'Garage moto / scooter', icon: '🏍️',
    keywords: ['moto', 'scooter', 'deux roues', 'motocycle', 'quad', 'entretien moto'],
    suggestedObjectives: ['services', 'pricing', 'booking', 'contact', 'reviews'],
    defaultModules: [
      'services', 'process', 'pricing', 'booking', 'testimonials', 'logos', 'hours', 'location',
      'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'services', 'testimonials', 'hours'] },
      { name: 'Prestations', slug: 'prestations', sections: ['services', 'certifications', 'pricing', 'process'] },
      { name: 'Rendez-vous', slug: 'rendez-vous', sections: ['booking'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['Révision', 'Vidange, filtres, bougies, contrôle des jeux selon le carnet.'],
      ['Pneus moto', 'Montage, équilibrage et contrôle de la pression.'],
      ['Chaîne et couronne', 'Kit complet, tension et graissage.'],
      ['Freinage', 'Plaquettes, disques, purge du liquide.'],
      ['Préparation contrôle technique', 'Les points vérifiés avant le passage obligatoire.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Nos engagements',
        subtitle: 'Un atelier deux-roues, et des règles claires.',
        items: [
          { name: 'Devis avant intervention', issuer: 'Engagement maison', text: 'Chiffré et validé avant toute commande de pièce.', validity: 'À chaque passage' },
          { name: 'Mécaniciens deux-roues', issuer: 'Formation constructeur', text: 'Moto, scooter et 125 : des gestes spécifiques, pas de l’automobile adaptée.', validity: 'Mise à jour chaque année' },
          { name: 'Pièces garanties', issuer: 'Fournisseurs agréés', text: 'Pièces d’origine ou équivalentes, tracées sur votre facture.', validity: 'Garantie fournisseur' },
          { name: 'Préparation au contrôle technique', issuer: 'Réglementation deux-roues', text: 'Les points vérifiés avant le passage obligatoire.', validity: 'Sur rendez-vous' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Prendre rendez-vous', ctaSecondaryLabel: 'Nos prestations' },
    },
  },
  {
    id: 'vente-auto', label: 'Vente de véhicules d’occasion', icon: '🔑',
    keywords: ['occasion', 'vente', 'concession', 'vehicule', 'reprise', 'mandataire', 'automobile'],
    suggestedObjectives: ['products', 'company', 'quote', 'contact', 'reviews'],
    defaultModules: [
      'products', 'categories', 'finder', 'about', 'stats', 'quote', 'testimonials', 'logos',
      'hours', 'location', 'contact', 'certifications',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'finder', 'products', 'certifications', 'stats', 'testimonials'] },
      { name: 'Nos véhicules', slug: 'vehicules', sections: ['finder', 'products'] },
      { name: 'Reprise', slug: 'reprise', sections: ['quote'] },
      { name: 'Le garage', slug: 'garage', sections: ['about', 'stats'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location', 'hours'] },
    ],
    imageCategory: 'automotive', catalogKind: 'products',
    sampleCatalog: [
      ['Citadine essence', 'Faible kilométrage, entretien suivi, idéale pour la ville.'],
      ['Berline diesel', 'Grand rouleur, historique complet, distribution faite.'],
      ['SUV compact', 'Boîte automatique, aides à la conduite, première main.'],
      ['Utilitaire', 'TVA récupérable, carnet à jour, prêt à travailler.'],
    ],
    sectionDefaults: {
      certifications: {
        title: 'Nos garanties',
        subtitle: 'Une occasion se juge sur ce qu’on peut vérifier.',
        items: [
          { name: 'Véhicules contrôlés', issuer: 'Atelier intégré', text: 'Contrôle complet avant mise en vente, points de sécurité repris si nécessaire.', validity: 'Chaque véhicule' },
          { name: 'Historique fourni', issuer: 'Rapport d’historique', text: 'Carnet d’entretien et relevé des propriétaires successifs remis avec le véhicule.', validity: 'Systématique' },
          { name: 'Garantie incluse', issuer: 'Assureur partenaire', text: 'Une garantie sur chaque véhicule vendu, extensible sur demande.', validity: 'À partir de la livraison' },
          { name: 'Reprise de votre véhicule', issuer: 'Engagement maison', text: 'Nous reprenons l’ancien, même non roulant, et le déduisons.', validity: 'Estimation gratuite' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: { ctaLabel: 'Voir les véhicules', ctaSecondaryLabel: 'Faire estimer ma reprise' },
      finder: {
        title: 'Trouvez votre véhicule',
        subtitle: 'Affinez selon ce qui compte pour vous.',
        criteria: [
          { label: 'Marque', example: 'Renault, Peugeot, Toyota…' },
          { label: 'Carburant', example: 'Essence, diesel, hybride…' },
          { label: 'Boîte de vitesses', example: 'Manuelle ou automatique' },
          { label: 'Budget', example: 'Votre fourchette' },
        ],
        directLabel: '',
        ctaLabel: 'Voir les véhicules correspondants',
      },
      quote: {
        title: 'Estimation de reprise',
        subtitle: 'Décrivez votre véhicule actuel : nous vous proposons une reprise, déduite du véhicule que vous choisirez.',
        ctaLabel: 'Faire estimer mon véhicule',
      },
    },
  },
  {
    id: 'formation-auto', label: 'Centre de formation automobile', icon: '🎓',
    keywords: ['formation', 'cap', 'mecanique', 'apprentissage', 'reconversion', 'cpf', 'alternance', 'titre professionnel'],
    suggestedObjectives: ['services', 'company', 'booking', 'contact', 'reviews'],
    defaultModules: [
      'services', 'process', 'program', 'funding', 'about', 'stats', 'booking', 'testimonials',
      'logos', 'faq', 'team', 'location', 'contact', 'certifications', 'events', 'documents',
    ],
    defaultPages: [
      { name: 'Accueil', slug: '', sections: ['hero', 'stats', 'services', 'funding', 'testimonials', 'cta'] },
      { name: 'Nos formations', slug: 'formations', sections: ['services', 'program', 'documents'] },
      { name: 'Financement', slug: 'financement', sections: ['funding', 'faq'] },
      { name: 'Sessions', slug: 'sessions', sections: ['events', 'booking', 'process'] },
      { name: 'Le centre', slug: 'centre', sections: ['about', 'certifications', 'team'] },
      { name: 'Contact', slug: 'contact', sections: ['contact', 'location'] },
    ],
    imageCategory: 'automotive', catalogKind: 'services',
    sampleCatalog: [
      ['CAP Maintenance des véhicules', 'Option voitures particulières. Diplôme d’État, accessible en un an aux adultes.'],
      ['Titre professionnel mécanicien', 'Qualification reconnue, centrée sur l’atelier et l’employabilité immédiate.'],
      ['Attestation climatisation', 'Manipulation des fluides frigorigènes, obligatoire en atelier.'],
      ['Habilitation véhicules électriques', 'Intervenir en sécurité sur les véhicules hybrides et électriques.'],
      ['Remise à niveau technique', 'Quelques jours pour reprendre pied sur les motorisations récentes.'],
      ['Validation des acquis', 'Faire reconnaître par un diplôme ce que vous savez déjà faire.'],
    ],
    sectionDefaults: {
      events: {
        title: 'Prochaines sessions',
        subtitle: 'Les groupes restent en effectif réduit : douze apprenants pour un atelier.',
        layout: 'agenda',
        items: [
          { day: '01', month: 'SEPT.', name: 'CAP Maintenance des véhicules', time: 'Rentrée à 8 h 30', place: 'Centre de formation', text: 'Temps plein, 9 mois, période en entreprise incluse.', status: 'Places limitées' },
          { day: '06', month: 'JANV.', name: 'CAP Maintenance des véhicules', time: 'Rentrée à 8 h 30', place: 'Centre de formation', text: 'En alternance, 12 mois, et vous êtes rémunéré.', status: 'Inscriptions ouvertes' },
          { day: '10', month: 'MARS', name: 'Habilitation véhicules électriques', time: '5 jours', place: 'Atelier haute tension', text: 'Module court, accessible aux mécaniciens déjà en poste.', status: 'Sur inscription' },
          { day: '18', month: 'AVR.', name: 'Portes ouvertes', time: '10 h – 17 h', place: 'Centre de formation', text: 'Visite de l’atelier, rencontre avec les formateurs et les apprentis.', status: 'Entrée libre' },
        ],
        ctaLabel: 'Demander une place',
      },
      documents: {
        title: 'À télécharger',
        subtitle: 'Le détail du parcours et les pièces à préparer, à lire tranquillement.',
        items: [
          { name: 'Programme détaillé du CAP', format: 'PDF', size: '', text: 'Modules, volumes horaires, épreuves et calendrier de la session.', updated: 'Mis à jour à chaque rentrée' },
          { name: 'Dossier de candidature', format: 'PDF', size: '', text: 'À remplir et à renvoyer avant l’entretien de motivation.', updated: '' },
          { name: 'Règlement intérieur', format: 'PDF', size: '', text: 'Fonctionnement du centre, règles d’atelier et consignes de sécurité.', updated: '' },
          { name: 'Guide du financement', format: 'PDF', size: '', text: 'CPF, France Travail, OPCO, alternance : qui finance quoi, et comment.', updated: '' },
        ],
        ctaLabel: 'Télécharger',
      },
      certifications: {
        title: 'Nos certifications',
        subtitle: 'Un centre contrôlé, des diplômes reconnus par l’État.',
        items: [
          { name: 'Certification qualité', issuer: 'Organisme certificateur', text: 'Le centre est audité sur la qualité de ses formations ; c’est ce qui rend le financement public possible.', validity: 'Audit de surveillance périodique' },
          { name: 'Titres enregistrés au RNCP', issuer: 'France Compétences', text: 'Nos parcours diplômants sont inscrits au répertoire national des certifications professionnelles.', validity: 'Enregistrement en cours de validité' },
          { name: 'Formateurs issus de l’atelier', issuer: 'Expérience professionnelle', text: 'Des mécaniciens qui ont exercé, et qui exercent encore.', validity: 'Formation de formateurs continue' },
          { name: 'Habilitations délivrées', issuer: 'Réglementation', text: 'Manipulation des fluides frigorigènes et intervention sur véhicules électriques.', validity: 'À l’issue du module' },
        ],
        // La mention par defaut est une consigne au client : elle n'a rien a faire en ligne.
        note: '',
      },
      hero: {
        ctaLabel: 'Demander le programme',
        ctaSecondaryLabel: 'Voir les prochaines sessions',
        subtitle: 'Devenez mécanicien automobile : une formation d’atelier, un diplôme reconnu, un accompagnement au financement.',
      },
      services: { title: 'Nos formations', subtitle: 'Diplômantes, qualifiantes ou courtes, en présentiel comme en alternance.' },
      program: {
        title: 'Le programme',
        subtitle: 'Ce que vous saurez faire à la sortie, module par module.',
        items: [
          { title: 'Moteur et périphériques', duration: '120 h', text: 'Dépose, contrôle et remontage, distribution, alimentation, refroidissement.' },
          { title: 'Liaison au sol', duration: '90 h', text: 'Freinage, suspension, direction, géométrie et pneumatiques.' },
          { title: 'Transmission', duration: '80 h', text: 'Embrayage, boîtes mécaniques et automatiques, transmissions.' },
          { title: 'Électricité et électronique', duration: '110 h', text: 'Circuits, capteurs, diagnostic à la valise, recherche de panne.' },
          { title: 'Climatisation et confort', duration: '40 h', text: 'Circuit frigorifique, contrôle d’étanchéité, attestation.' },
          { title: 'Relation client et atelier', duration: '60 h', text: 'Accueil, devis, ordre de réparation, sécurité et environnement.' },
          { title: 'Période en entreprise', duration: '12 semaines', text: 'En atelier, sur des véhicules clients, avec un tuteur.' },
        ],
      },
      funding: {
        title: 'Financer votre formation',
        subtitle: 'Nous montons le dossier avec vous. Presque personne ne paie tout seul.',
        items: [
          { name: 'Compte personnel de formation', detail: 'Mobilisez vos droits CPF directement en ligne ; nous vous guidons pas à pas.' },
          { name: 'France Travail', detail: 'Aide individuelle à la formation pour les demandeurs d’emploi, sous conditions.' },
          { name: 'OPCO et plan de développement', detail: 'Si vous êtes salarié, votre employeur peut faire prendre en charge la formation.' },
          { name: 'Alternance', detail: 'En apprentissage ou en contrat de professionnalisation, la formation ne vous coûte rien et vous êtes rémunéré.' },
          { name: 'Paiement en plusieurs fois', detail: 'Sans frais, échelonné sur la durée de la formation.' },
        ],
        note: 'Un conseiller vérifie votre éligibilité avant toute inscription.',
      },
      stats: {
        title: 'Le centre en quelques chiffres',
        items: [
          { value: '92', suffix: ' %', label: 'de réussite à l’examen' },
          { value: '8', suffix: ' sur 10', label: 'en emploi dans les six mois' },
          { value: '12', suffix: '', label: 'apprenants par groupe' },
          { value: '15', suffix: ' ans', label: 'de formation en atelier' },
        ],
        subtitle: 'Chiffres d’exemple : remplacez-les par vos résultats publiés.',
      },
      faq: {
        title: 'Questions fréquentes',
        items: [
          { question: 'Faut-il un diplôme pour entrer en formation ?', answer: 'Non. Un entretien de motivation et un test de positionnement suffisent pour la plupart de nos parcours.' },
          { question: 'La formation est-elle reconnue ?', answer: 'Oui, nos parcours diplômants sont enregistrés au répertoire national des certifications professionnelles.' },
          { question: 'Puis-je me former en travaillant ?', answer: 'Oui, en alternance ou sur des modules courts organisés hors temps de travail.' },
          { question: 'Que se passe-t-il en cas d’échec à l’examen ?', answer: 'Vous conservez le bénéfice des épreuves obtenues et pouvez repasser les autres à la session suivante.' },
        ],
      },
    },
  },
]

export const SECTORS: ActivitySector[] = [
  { id: 'restauration', label: 'Restauration', activities: RESTAURATION },
  { id: 'commerce', label: 'Commerce', activities: COMMERCE },
  { id: 'artisans', label: 'Artisans', activities: ARTISANS },
  { id: 'automobile', label: 'Automobile', activities: AUTOMOBILE },
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

/** Minuscules, sans accents : « Mécanique » et « mecanique » sont le meme mot. */
export function normalizeQuery(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Le client tape ce qu'il fait, pas le libelle du catalogue : « carrosserie »
 * doit trouver « Carrossier / Peintre auto », « pneu » doit trouver
 * « Pneus & jantes ». On cherche donc aussi dans les mots-cles du metier, et
 * dans les deux sens — la saisie peut etre plus longue que le mot-cle.
 */
export function matchesActivity(activity: Activity, query: string): boolean {
  const q = normalizeQuery(query.trim())
  if (!q) return false
  return [activity.label, ...(activity.keywords ?? [])]
    .map(normalizeQuery)
    .some((word) => word.includes(q) || (word.length >= 4 && q.includes(word)))
}

export function searchActivities(query: string): Activity[] {
  if (!query.trim()) return []
  return ALL_ACTIVITIES.filter((a) => matchesActivity(a, query))
}
