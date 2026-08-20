import type { Project, SectionKind, Section } from '@/engine/types'

/**
 * Catalogue declaratif des sections (§14). Chaque section decrit ses champs
 * editables : le panneau de proprietes du builder est genere a partir d'ici, il
 * n'existe aucun formulaire specifique a un type de section (§48).
 */

export interface ItemFieldDef {
  key: string
  label: string
  type: 'text' | 'textarea'
}

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea'; placeholder?: string }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'number'; min: number; max: number }
  | { key: string; label: string; type: 'list'; itemLabel: string; itemFields: ItemFieldDef[] }
  | { key: string; label: string; type: 'image' }

export interface SectionDef {
  kind: SectionKind
  label: string
  description: string
  icon: string
  fields: FieldDef[]
  /** Valeurs de depart, calculees a partir du projet pour ne jamais afficher de vide. */
  defaults: (project: Project) => Record<string, unknown>
}

const TONE: FieldDef = {
  key: 'tone', label: 'Fond', type: 'select',
  options: [
    { value: 'default', label: 'Neutre' },
    { value: 'alt', label: 'Contrasté' },
    { value: 'accent', label: 'Couleur principale' },
  ],
}

const COLUMNS: FieldDef = { key: 'columns', label: 'Colonnes', type: 'number', min: 1, max: 5 }

const businessName = (p: Project) => p.identity.businessName.trim() || 'Votre entreprise'

export const SECTION_DEFS: Record<SectionKind, SectionDef> = {
  hero: {
    kind: 'hero', label: 'Hero', icon: 'Sparkles',
    description: "Premiere impression : titre, accroche et appel a l'action",
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Accroche', type: 'textarea' },
      { key: 'ctaLabel', label: 'Bouton principal', type: 'text' },
      { key: 'ctaSecondaryLabel', label: 'Bouton secondaire', type: 'text' },
      { key: 'showImage', label: 'Afficher une image', type: 'boolean' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
    ],
    defaults: (p) => ({
      title: businessName(p),
      subtitle: p.identity.tagline.trim() || 'Un savoir-faire à votre service, près de chez vous.',
      ctaLabel: 'Nous contacter',
      ctaSecondaryLabel: 'Découvrir',
      showImage: true,
      imageUrl: '',
    }),
  },

  about: {
    kind: 'about', label: 'Présentation', icon: 'Building2',
    description: 'Qui vous etes, votre histoire, vos valeurs',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'text', label: 'Texte', type: 'textarea' },
      { key: 'showImage', label: 'Afficher une image', type: 'boolean' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'À propos',
      text: `${businessName(p)} accompagne ses clients avec exigence et proximité. Présentez ici votre parcours, votre équipe et ce qui vous distingue.`,
      showImage: true,
      imageUrl: '',
      tone: 'default',
    }),
  },

  services: {
    kind: 'services', label: 'Services', icon: 'Wrench',
    description: 'Vos prestations, en grille',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({ title: 'Nos services', subtitle: 'Ce que nous réalisons pour vous', columns: p.grid.columns, tone: 'alt' }),
  },

  products: {
    kind: 'products', label: 'Produits', icon: 'Package',
    description: 'Catalogue ou carte, organise par categories',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'groupByCategory', label: 'Grouper par catégorie', type: 'boolean' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: p.modules.includes('menu') ? 'Notre carte' : 'Nos produits',
      subtitle: '',
      groupByCategory: true,
      columns: p.grid.columns,
      tone: 'default',
    }),
  },

  portfolio: {
    kind: 'portfolio', label: 'Réalisations', icon: 'Hammer',
    description: 'Vos chantiers et projets termines',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({ title: 'Nos réalisations', subtitle: 'Quelques projets récents', columns: p.grid.columns, tone: 'default' }),
  },

  gallery: {
    kind: 'gallery', label: 'Galerie', icon: 'Images',
    description: "Galerie d'images en grille",
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({ title: 'Galerie', columns: Math.min(5, p.grid.columns + 1), tone: 'alt' }),
  },

  testimonials: {
    kind: 'testimonials', label: 'Témoignages', icon: 'Quote',
    description: 'Les avis de vos clients',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      {
        key: 'items', label: 'Avis', type: 'list', itemLabel: 'Avis',
        itemFields: [
          { key: 'quote', label: 'Témoignage', type: 'textarea' },
          { key: 'author', label: 'Nom', type: 'text' },
          { key: 'role', label: 'Précision', type: 'text' },
        ],
      },
      TONE,
    ],
    defaults: () => ({
      title: 'Ils nous font confiance',
      items: [
        { quote: 'Travail soigné et délais respectés. Je recommande sans hésiter.', author: 'Claire M.', role: 'Cliente' },
        { quote: "Une équipe à l'écoute, de bons conseils du début à la fin.", author: 'Ahmed B.', role: 'Client' },
        { quote: 'Rapport qualité-prix excellent, je ferai de nouveau appel à eux.', author: 'Sophie L.', role: 'Cliente' },
      ],
      tone: 'alt',
    }),
  },

  faq: {
    kind: 'faq', label: 'FAQ', icon: 'HelpCircle',
    description: 'Les questions que vos clients posent le plus souvent',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      {
        key: 'items', label: 'Questions', type: 'list', itemLabel: 'Question',
        itemFields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Réponse', type: 'textarea' },
        ],
      },
      TONE,
    ],
    defaults: () => ({
      title: 'Questions fréquentes',
      items: [
        { question: 'Quels sont vos délais ?', answer: 'Nous répondons sous 24 h et intervenons généralement sous une semaine.' },
        { question: 'Intervenez-vous dans ma commune ?', answer: 'Nous couvrons la ville et ses environs. Contactez-nous pour vérifier.' },
        { question: 'Le devis est-il gratuit ?', answer: 'Oui, chaque devis est gratuit et sans engagement.' },
      ],
      tone: 'default',
    }),
  },

  pricing: {
    kind: 'pricing', label: 'Tarifs', icon: 'Euro',
    description: 'Votre grille tarifaire publique',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Formules', type: 'list', itemLabel: 'Formule',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'price', label: 'Prix affiché', type: 'text' },
          { key: 'description', label: 'Détail', type: 'textarea' },
        ],
      },
      TONE,
    ],
    defaults: () => ({
      title: 'Nos tarifs',
      subtitle: '',
      items: [
        { name: 'Essentiel', price: '—', description: 'Décrivez ici votre première formule.' },
        { name: 'Confort', price: '—', description: 'La formule la plus demandée.' },
        { name: 'Sur mesure', price: 'Sur devis', description: 'Une réponse adaptée à votre besoin.' },
      ],
      tone: 'alt',
    }),
  },

  hours: {
    kind: 'hours', label: 'Horaires', icon: 'Clock',
    description: "Vos horaires d'ouverture",
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'note', label: 'Précision', type: 'text' },
      TONE,
    ],
    defaults: () => ({ title: "Horaires d'ouverture", note: 'Fermé les jours fériés.', tone: 'default' }),
  },

  location: {
    kind: 'location', label: 'Localisation', icon: 'MapPin',
    description: 'Adresse, plan et zone couverte',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'note', label: 'Précision', type: 'text' },
      { key: 'showMap', label: 'Afficher le plan', type: 'boolean' },
      TONE,
    ],
    defaults: () => ({ title: 'Nous trouver', note: '', showMap: true, tone: 'alt' }),
  },

  contact: {
    kind: 'contact', label: 'Contact', icon: 'Mail',
    description: 'Formulaire et coordonnees',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'showForm', label: 'Afficher le formulaire', type: 'boolean' },
      { key: 'showDetails', label: 'Afficher les coordonnées', type: 'boolean' },
      TONE,
    ],
    defaults: () => ({
      title: 'Nous contacter', subtitle: 'Une question ? Écrivez-nous, nous répondons vite.',
      showForm: true, showDetails: true, tone: 'default',
    }),
  },

  quote: {
    kind: 'quote', label: 'Demande de devis', icon: 'FileText',
    description: 'Formulaire de devis detaille',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Demander un devis', subtitle: 'Décrivez votre projet, nous revenons vers vous sous 24 h.',
      ctaLabel: 'Envoyer ma demande', tone: 'alt',
    }),
  },

  booking: {
    kind: 'booking', label: 'Rendez-vous', icon: 'CalendarCheck',
    description: 'Prise de rendez-vous',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Prendre rendez-vous', subtitle: 'Choisissez un créneau, nous confirmons immédiatement.',
      ctaLabel: 'Réserver un créneau', tone: 'default',
    }),
  },

  cta: {
    kind: 'cta', label: 'Appel à l\'action', icon: 'Megaphone',
    description: 'Un bandeau qui pousse le visiteur a vous contacter',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Parlons de votre projet', subtitle: 'Un premier échange, sans engagement.',
      ctaLabel: 'Nous appeler', tone: 'accent',
    }),
  },

  social: {
    kind: 'social', label: 'Réseaux sociaux', icon: 'Share2',
    description: 'Liens vers vos reseaux',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      TONE,
    ],
    defaults: () => ({ title: 'Suivez-nous', tone: 'default' }),
  },

  map: {
    kind: 'map', label: 'Carte', icon: 'Map',
    description: 'Plan de votre adresse',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      TONE,
    ],
    defaults: () => ({ title: 'Plan d\'accès', tone: 'default' }),
  },
}

export const SECTION_LIST: SectionDef[] = Object.values(SECTION_DEFS)

/** Props effectives d'une section : defauts du catalogue + reglages du client. */
export function resolveProps(section: Section, project: Project): Record<string, unknown> {
  return { ...SECTION_DEFS[section.kind].defaults(project), ...section.props }
}

export function sectionLabel(kind: SectionKind): string {
  return SECTION_DEFS[kind].label
}
