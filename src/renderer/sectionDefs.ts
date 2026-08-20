import type {
  Block, BlockSeed, BlockType, FieldDef, Project, Section, SectionKind,
} from '@/engine/types'
import { getActivity } from '@/engine/activities'

/**
 * Catalogue declaratif des sections (§14). Chaque section decrit ses champs
 * editables : le panneau de proprietes du builder est genere a partir d'ici, il
 * n'existe aucun formulaire specifique a un type de section (§48).
 *
 * Une section declare aussi, facultativement :
 *  - les BLOCS qu'elle accepte (`blocks`), c'est-a-dire le contenu que le client
 *    peut y ajouter et deplacer librement — voir `blockDefs.ts` ;
 *  - ses VARIANTES (`presets`), des points de depart nommes proposes au moment
 *    d'ajouter la section. Une variante ne fait que pre-remplir des champs
 *    declares et des blocs : elle n'introduit jamais de mise en page a elle, qui
 *    reste la propriete du theme (§10, §48).
 */

export type { FieldDef, ItemFieldDef } from '@/engine/types'

/** Point de depart propose dans le catalogue « Ajouter une section ». */
export interface SectionPreset {
  id: string
  label: string
  description: string
  props?: Record<string, unknown>
  blocks?: BlockSeed[]
}

export interface SectionDef {
  kind: SectionKind
  label: string
  description: string
  icon: string
  fields: FieldDef[]
  /** Valeurs de depart, calculees a partir du projet pour ne jamais afficher de vide. */
  defaults: (project: Project) => Record<string, unknown>
  /** Types de blocs acceptes. Absent = section sans blocs. */
  blocks?: BlockType[]
  /**
   * La zone de blocs de cette section est-elle une GRILLE FLUIDE (§14) ? Une
   * section « dessinable » offre au client la pleine largeur et les 24 colonnes
   * ou il place ce qu'il veut ; les autres gardent la mise en page que le theme
   * leur donne, et leurs blocs restent un complement empile. Le client peut
   * toujours revenir a l'empilement (prop `fluid`).
   */
  fluid?: boolean
  /** Garde-fou : au-dela, la section perd sa lisibilite. */
  maxBlocks?: number
  /** Blocs presents des l'ajout de la section, si elle en veut. */
  defaultBlocks?: BlockSeed[]
  /** Variantes proposees a l'ajout. La premiere est le point de depart neutre. */
  presets?: SectionPreset[]
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
const cityOf = (p: Project) => p.identity.city.trim() || 'votre ville'

/**
 * Mise en page du catalogue. « Carte a onglets » et « ardoise » viennent des
 * sites de restauration ; elles restent disponibles pour tous les metiers, le
 * defaut se deduit simplement du `catalogKind` de l'activite (§48).
 */
const LAYOUT: FieldDef = {
  key: 'layout', label: 'Mise en page', type: 'select',
  options: [
    { value: 'grid', label: 'Grille' },
    { value: 'board', label: 'Carte à onglets' },
    { value: 'list', label: 'Ardoise (liste)' },
  ],
}

const defaultLayout = (p: Project) => (isTableService(p) ? 'board' : 'grid')

/** Le metier sert-il une carte ? (restauration, au sens du catalogue metier) */
export function isTableService(p: Project): boolean {
  return Boolean(p.activityId && getActivity(p.activityId)?.catalogKind === 'menu')
}

/** Le site prend-il des commandes en ligne ? */
const takesOrders = (p: Project) => p.modules.includes('cart') || p.modules.includes('order')

/** Le site prend-il des reservations ? En restauration, une table prime sur le panier. */
const takesBookings = (p: Project) => p.modules.includes('booking')

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
    // Les libelles suivent le metier : on ne « contacte » pas un fast-food, on
    // y commande. Toujours pilote par le catalogue metier, jamais par un `if`
    // sur un identifiant d'activite (§48).
    defaults: (p) => ({
      title: businessName(p),
      subtitle: p.identity.tagline.trim() || (isTableService(p)
        ? 'Produits frais, cuisine maison, service rapide.'
        : 'Un savoir-faire à votre service, près de chez vous.'),
      ctaLabel: isTableService(p)
        ? (takesBookings(p) ? 'Réserver une table' : takesOrders(p) ? 'Commander' : 'Voir la carte')
        : 'Nous contacter',
      ctaSecondaryLabel: isTableService(p) ? 'Voir la carte' : 'Découvrir',
      showImage: true,
      imageUrl: '',
    }),
    blocks: ['badge', 'bullets', 'stat', 'button', 'text'],
    maxBlocks: 6,
    presets: [
      { id: 'simple', label: 'Hero', description: "Titre, accroche et appel a l'action" },
      {
        id: 'reassurance', label: 'Hero — avec réassurance',
        description: 'Trois pastilles sous les boutons',
        blocks: [
          { type: 'badge', props: { label: 'Devis gratuit' } },
          { type: 'badge', props: { label: 'Intervention sous 48 h' } },
          { type: 'badge', props: { label: 'Travail garanti' } },
        ],
      },
      {
        id: 'points', label: 'Hero — avec points forts',
        description: 'Les arguments listes sous l\'accroche',
        blocks: [
          {
            type: 'bullets',
            props: { items: [{ text: 'Devis gratuit sous 24 h' }, { text: 'Déplacement offert' }, { text: 'Garantie 2 ans' }] },
          },
        ],
      },
      {
        id: 'chiffres', label: 'Hero — avec chiffres',
        description: 'Trois chiffres cles, animes a l\'affichage',
        blocks: [
          { type: 'stat', props: { value: '15', suffix: ' ans', label: "d'expérience" } },
          { type: 'stat', props: { value: '480', suffix: '', label: 'clients accompagnés' } },
          { type: 'stat', props: { value: '4,9', suffix: '/5', label: 'note moyenne' } },
        ],
      },
    ],
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
    blocks: ['text', 'bullets', 'stat', 'quote', 'badge', 'button', 'heading'],
    maxBlocks: 8,
    presets: [
      { id: 'simple', label: 'Présentation', description: 'Un texte et une image' },
      {
        id: 'chiffres', label: 'Présentation — avec chiffres',
        description: 'Le texte, puis trois chiffres qui rassurent',
        blocks: [
          { type: 'stat', props: { value: '15', suffix: ' ans', label: "d'expérience" } },
          { type: 'stat', props: { value: '480', suffix: '', label: 'chantiers réalisés' } },
          { type: 'stat', props: { value: '4,9', suffix: '/5', label: 'note moyenne' } },
        ],
      },
      {
        id: 'valeurs', label: 'Présentation — avec valeurs',
        description: 'Le texte, puis vos engagements en liste',
        blocks: [
          {
            type: 'bullets',
            props: { items: [{ text: 'Un interlocuteur unique' }, { text: 'Des délais tenus' }, { text: 'Un chantier laissé propre' }] },
          },
        ],
      },
      {
        id: 'citation', label: 'Présentation — avec citation',
        description: 'Le texte, puis une phrase mise en avant',
        blocks: [{ type: 'quote', props: {} }],
      },
    ],
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
      LAYOUT,
      { key: 'groupByCategory', label: 'Grouper par catégorie', type: 'boolean' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: p.modules.includes('menu') ? 'Notre carte' : 'Nos produits',
      subtitle: '',
      layout: defaultLayout(p),
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

  finder: {
    kind: 'finder', label: 'Recherche guidée', icon: 'Filter',
    description: 'Le visiteur precise ses criteres avant de voir votre offre',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'criteria', label: 'Critères', type: 'list', itemLabel: 'Critère',
        itemFields: [
          { key: 'label', label: 'Critère', type: 'text' },
          { key: 'example', label: 'Exemple affiché', type: 'text' },
        ],
      },
      { key: 'directLabel', label: 'Saisie directe (vide = masquée)', type: 'text' },
      { key: 'directExample', label: 'Exemple de saisie directe', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Trouvez ce qu\u2019il vous faut',
      subtitle: 'Pr\u00e9cisez votre besoin, nous affichons ce qui correspond.',
      criteria: [
        { label: 'Crit\u00e8re 1', example: 'Premi\u00e8re pr\u00e9cision' },
        { label: 'Crit\u00e8re 2', example: 'Deuxi\u00e8me pr\u00e9cision' },
        { label: 'Crit\u00e8re 3', example: 'Troisi\u00e8me pr\u00e9cision' },
      ],
      directLabel: '',
      directExample: '',
      ctaLabel: 'Rechercher',
      tone: 'alt',
    }),
  },

  program: {
    kind: 'program', label: 'Programme', icon: 'ListOrdered',
    description: 'Le detail d\'un parcours, module par module, avec les durees',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Modules', type: 'list', itemLabel: 'Module',
        itemFields: [
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'duration', label: 'Dur\u00e9e', type: 'text' },
          { key: 'text', label: 'Contenu', type: 'textarea' },
        ],
      },
      { key: 'totalLabel', label: 'Volume total affich\u00e9', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Le programme',
      subtitle: 'Ce que couvre le parcours, module par module.',
      items: [
        { title: 'Premier module', duration: '\u2014', text: 'D\u00e9crivez ce que la personne saura faire \u00e0 la fin de ce module.' },
        { title: 'Deuxi\u00e8me module', duration: '\u2014', text: 'Les notions abord\u00e9es et la place de la pratique.' },
        { title: 'Troisi\u00e8me module', duration: '\u2014', text: 'La mise en situation r\u00e9elle.' },
      ],
      totalLabel: '',
      tone: 'default',
    }),
  },

  funding: {
    kind: 'funding', label: 'Financement', icon: 'HandCoins',
    description: 'Dispositifs de prise en charge et facilites de paiement',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Dispositifs', type: 'list', itemLabel: 'Dispositif',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'detail', label: 'Explication', type: 'textarea' },
        ],
      },
      { key: 'note', label: 'Pr\u00e9cision sous la liste', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: 'Financer votre projet',
      subtitle: 'Plusieurs solutions existent, nous montons le dossier avec vous.',
      items: [
        { name: 'Premier dispositif', detail: 'Qui peut en b\u00e9n\u00e9ficier, et pour quelle part.' },
        { name: 'Deuxi\u00e8me dispositif', detail: 'Les conditions, en une phrase claire.' },
        { name: 'Paiement en plusieurs fois', detail: '\u00c9chelonn\u00e9, sans frais.' },
      ],
      note: '',
      columns: Math.min(3, p.grid.columns),
      tone: 'alt',
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
    // En restauration, un rendez-vous est une table : le libelle suit le
    // `catalogKind` du metier, pas une branche par activite (§48).
    defaults: (p) => (isTableService(p)
      ? {
          title: 'Réserver une table', subtitle: 'Indiquez le jour, l\'heure et le nombre de couverts : nous confirmons par SMS.',
          ctaLabel: 'Réserver', tone: 'default',
        }
      : {
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
    defaults: (p) => (isTableService(p)
      ? {
          title: 'Une petite faim ?',
          subtitle: takesBookings(p)
            ? 'Réservez votre table en quelques secondes.'
            : 'Commandez en ligne, en livraison ou à emporter.',
          ctaLabel: takesBookings(p) ? 'Réserver une table' : 'Commander',
          tone: 'accent',
        }
      : {
          title: 'Parlons de votre projet', subtitle: 'Un premier échange, sans engagement.',
          ctaLabel: 'Nous appeler', tone: 'accent',
        }),
    blocks: ['badge', 'button', 'text', 'bullets'],
    maxBlocks: 5,
    presets: [
      { id: 'simple', label: "Appel à l'action", description: 'Un bandeau et un bouton' },
      {
        id: 'rassurant', label: "Appel à l'action — rassurant",
        description: 'Le bandeau, avec les arguments qui levent le doute',
        blocks: [
          { type: 'badge', props: { label: 'Réponse sous 24 h' } },
          { type: 'badge', props: { label: 'Sans engagement' } },
        ],
      },
      {
        id: 'double', label: "Appel à l'action — deux choix",
        description: 'Appeler ou demander un devis, au choix du visiteur',
        blocks: [{ type: 'button', props: { label: 'Demander un devis', variant: 'secondary' } }],
      },
    ],
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

  // --- sections « preuve », inspirees des sites d'agence -------------------

  stats: {
    kind: 'stats', label: 'Chiffres clés', icon: 'TrendingUp',
    description: 'Vos chiffres qui rassurent, comptes a l\'ecran',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Chiffres', type: 'list', itemLabel: 'Chiffre',
        itemFields: [
          { key: 'value', label: 'Valeur (nombre)', type: 'text' },
          { key: 'suffix', label: 'Unité (+, %, ans…)', type: 'text' },
          { key: 'label', label: 'Libellé', type: 'text' },
        ],
      },
      TONE,
    ],
    defaults: () => ({
      title: 'En quelques chiffres',
      subtitle: '',
      // Valeurs d'exemple : le client remplace par les siennes des la premiere edition.
      items: [
        { value: '12', suffix: ' ans', label: "d'expérience" },
        { value: '450', suffix: '+', label: 'clients accompagnés' },
        { value: '24', suffix: ' h', label: 'délai de réponse' },
        { value: '98', suffix: ' %', label: 'de clients satisfaits' },
      ],
      tone: 'alt',
    }),
  },

  process: {
    kind: 'process', label: 'Méthode', icon: 'Route',
    description: "Les etapes d'une collaboration, en frise",
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Étapes', type: 'list', itemLabel: 'Étape',
        itemFields: [
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea' },
        ],
      },
      TONE,
    ],
    defaults: () => ({
      title: 'Comment ça se passe',
      subtitle: 'Un déroulé clair, du premier appel à la fin du chantier.',
      items: [
        { title: 'Premier échange', text: 'Vous nous décrivez votre besoin, par téléphone ou par mail.' },
        { title: 'Étude et devis', text: 'Nous évaluons, puis nous vous envoyons une proposition détaillée.' },
        { title: 'Intervention', text: 'Nous intervenons aux dates convenues, dans le respect du devis.' },
        { title: 'Suivi', text: 'Nous restons disponibles après l\'intervention, en cas de besoin.' },
      ],
      tone: 'default',
    }),
  },

  team: {
    kind: 'team', label: 'Équipe', icon: 'Users',
    description: 'Les visages derriere votre entreprise',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Membres', type: 'list', itemLabel: 'Membre',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'role', label: 'Rôle', type: 'text' },
          { key: 'bio', label: 'En une phrase', type: 'textarea' },
        ],
      },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: 'Notre équipe',
      subtitle: 'Des interlocuteurs identifiés, du début à la fin.',
      items: [
        { name: 'Prénom Nom', role: 'Fondateur', bio: 'Présentez son parcours en une phrase.' },
        { name: 'Prénom Nom', role: 'Responsable technique', bio: 'Ce dont cette personne s\'occupe au quotidien.' },
        { name: 'Prénom Nom', role: 'Relation client', bio: 'Le premier contact de vos clients.' },
      ],
      columns: Math.min(4, p.grid.columns),
      tone: 'default',
    }),
  },

  logos: {
    kind: 'logos', label: 'Références', icon: 'BadgeCheck',
    description: 'Bandeau defilant de vos clients ou partenaires',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      {
        key: 'items', label: 'Références', type: 'list', itemLabel: 'Référence',
        itemFields: [{ key: 'name', label: 'Nom', type: 'text' }],
      },
      { key: 'scroll', label: 'Faire défiler', type: 'boolean' },
      TONE,
    ],
    defaults: () => ({
      title: 'Nos références',
      items: [
        { name: 'Client 1' }, { name: 'Client 2' }, { name: 'Client 3' },
        { name: 'Client 4' }, { name: 'Client 5' }, { name: 'Client 6' },
      ],
      scroll: true,
      tone: 'alt',
    }),
  },

  beforeafter: {
    kind: 'beforeafter', label: 'Avant / Après', icon: 'SlidersHorizontal',
    description: 'Comparateur glissant entre deux photos',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'beforeUrl', label: 'Photo avant', type: 'image' },
      { key: 'afterUrl', label: 'Photo après', type: 'image' },
      { key: 'beforeLabel', label: 'Étiquette gauche', type: 'text' },
      { key: 'afterLabel', label: 'Étiquette droite', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Avant / après',
      subtitle: 'Faites glisser le curseur pour voir le résultat.',
      beforeUrl: '', afterUrl: '',
      beforeLabel: 'Avant', afterLabel: 'Après',
      tone: 'default',
    }),
  },

  banner: {
    kind: 'banner', label: "Bandeau d'annonce", icon: 'Megaphone',
    description: 'Message court en bandeau, defilant si besoin',
    fields: [
      { key: 'text', label: 'Message', type: 'text' },
      { key: 'scroll', label: 'Faire défiler', type: 'boolean' },
      { key: 'tone', label: 'Fond', type: 'select', options: [
        { value: 'accent', label: 'Couleur principale' },
        { value: 'alt', label: 'Contrasté' },
        { value: 'default', label: 'Neutre' },
      ] },
    ],
    defaults: (p) => ({
      text: isTableService(p)
        ? 'Commandez en ligne : livraison à domicile ou retrait en 10 minutes'
        : 'Nouveau : prise de rendez-vous en ligne — réponse sous 24 h',
      scroll: true,
      tone: 'accent',
    }),
  },

  // --- restauration et vente a emporter -----------------------------------
  // Briques observees sur les grandes enseignes : choix du mode de service en
  // tete de page, offres, formules a prix fixe, liste d'etablissements,
  // allergenes et fidelite. Aucune n'est reservee a un metier : elles suivent
  // le module actif, comme les autres (§48).

  ordermodes: {
    kind: 'ordermodes', label: 'Modes de service', icon: 'Bike',
    description: 'Livraison, a emporter, sur place : le choix des le haut de page',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Modes', type: 'list', itemLabel: 'Mode',
        itemFields: [
          { key: 'name', label: 'Mode', type: 'text' },
          { key: 'text', label: 'Précision', type: 'text' },
          { key: 'delay', label: 'Délai affiché', type: 'text' },
        ],
      },
      { key: 'showAddress', label: "Champ d'adresse", type: 'boolean' },
      { key: 'addressLabel', label: 'Invite du champ', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    // Par defaut, des libelles que n'importe quel commerce peut assumer : un
    // fleuriste ne livre pas « encore chaud ». La variante restauration n'est
    // servie qu'aux metiers qui servent une carte.
    defaults: (p) => (isTableService(p)
      ? {
          title: 'Comment souhaitez-vous être servi ?',
          subtitle: 'Choisissez votre mode de service, le reste suit.',
          items: [
            { name: 'Livraison', text: 'Chez vous, encore chaud', delay: '30 min' },
            { name: 'À emporter', text: 'Vous passez le chercher', delay: '10 min' },
            { name: 'Sur place', text: 'On vous garde une table', delay: '' },
          ],
          showAddress: true,
          addressLabel: 'Votre adresse ou code postal',
          ctaLabel: 'Commander',
          tone: 'alt',
        }
      : {
          title: 'Comment souhaitez-vous être livré ?',
          subtitle: 'Choisissez votre mode de retrait, le reste suit.',
          items: [
            { name: 'Livraison', text: 'À l\'adresse de votre choix', delay: '' },
            { name: 'Retrait sur place', text: 'Vous passez le chercher', delay: '' },
          ],
          showAddress: true,
          addressLabel: 'Votre adresse ou code postal',
          ctaLabel: 'Commander',
          tone: 'alt',
        }),
  },

  offers: {
    kind: 'offers', label: 'Offres', icon: 'Percent',
    description: 'Vos promotions du moment, en cartes',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Offres', type: 'list', itemLabel: 'Offre',
        itemFields: [
          { key: 'name', label: 'Titre', type: 'text' },
          { key: 'text', label: 'Détail', type: 'textarea' },
          { key: 'price', label: 'Prix affiché', type: 'text' },
          { key: 'oldPrice', label: 'Prix barré', type: 'text' },
          { key: 'badge', label: 'Pastille', type: 'text' },
          { key: 'code', label: 'Code promo', type: 'text' },
        ],
      },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      COLUMNS, TONE,
    ],
    // « Afficher des promotions » est un objectif de tous les metiers : les
    // valeurs par defaut restent donc neutres et SANS montant — une epicerie ne
    // doit pas heriter d'un menu du midi. Le restaurant, lui, a besoin de voir
    // un prix barre pour juger de la maquette.
    defaults: (p) => (isTableService(p)
      ? {
          title: 'Nos offres du moment',
          subtitle: 'Valables en commande en ligne comme sur place.',
          items: [
            { name: 'Le menu du midi', text: 'Un plat, une boisson, un dessert.', price: '12,90 €', oldPrice: '16,50 €', badge: '-20 %', code: 'MIDI' },
            { name: '2 achetés, 1 offert', text: 'Sur toute la gamme, à emporter.', price: '', oldPrice: '', badge: 'Duo', code: 'DUO3' },
            { name: 'Menu enfant', text: 'Plat, boisson et surprise.', price: '', oldPrice: '', badge: 'Famille', code: '' },
          ],
          ctaLabel: "J'en profite",
          columns: 3,
          tone: 'default',
        }
      : {
          title: 'Nos offres du moment',
          subtitle: 'Valables sur présentation du code, dans la limite des stocks.',
          items: [
            { name: 'Offre de bienvenue', text: 'Pour une première commande chez vous.', price: '', oldPrice: '', badge: '-10 %', code: 'BIENVENUE' },
            { name: 'Offre du moment', text: 'Décrivez ici votre promotion et sa durée.', price: '', oldPrice: '', badge: '', code: '' },
            { name: 'Offre fidélité', text: 'Réservée à vos clients réguliers.', price: '', oldPrice: '', badge: '', code: '' },
          ],
          ctaLabel: "J'en profite",
          columns: 3,
          tone: 'default',
        }),
  },

  formulas: {
    kind: 'formulas', label: 'Formules', icon: 'ChefHat',
    description: 'Menus a prix fixe : entree, plat, dessert',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Formules', type: 'list', itemLabel: 'Formule',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'price', label: 'Prix affiché', type: 'text' },
          { key: 'includes', label: 'Composition (une ligne par élément)', type: 'textarea' },
          { key: 'note', label: 'Précision', type: 'text' },
          { key: 'badge', label: 'Pastille', type: 'text' },
        ],
      },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Nos formules',
      subtitle: 'Servies midi et soir, du lundi au samedi.',
      items: [
        { name: 'Express', price: '14,90 €', includes: 'Plat du jour\nBoisson\nCafé', note: 'Servie en 20 minutes.', badge: '' },
        { name: 'Complète', price: '19,90 €', includes: 'Entrée\nPlat\nDessert', note: 'Le choix du chef, renouvelé chaque semaine.', badge: 'La plus commandée' },
        { name: 'Découverte', price: '28,00 €', includes: 'Entrée\nPlat\nDessert\nVerre de vin', note: 'À partager, sur réservation.', badge: '' },
      ],
      ctaLabel: 'Réserver une table',
      tone: 'alt',
    }),
  },

  venues: {
    kind: 'venues', label: 'Établissements', icon: 'Store',
    description: 'Vos adresses, avec recherche par ville',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'showSearch', label: 'Champ de recherche', type: 'boolean' },
      { key: 'searchLabel', label: 'Invite du champ', type: 'text' },
      {
        key: 'items', label: 'Établissements', type: 'list', itemLabel: 'Établissement',
        itemFields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'address', label: 'Adresse', type: 'text' },
          { key: 'hours', label: 'Horaires', type: 'text' },
          { key: 'services', label: 'Services (séparés par ·)', type: 'text' },
        ],
      },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Nos établissements',
      subtitle: 'Trouvez le plus proche de chez vous.',
      showSearch: true,
      searchLabel: 'Ville ou code postal',
      items: [
        { name: `${businessName(p)} — Centre`, address: `12 rue de la République, ${cityOf(p)}`, hours: "Ouvert jusqu'à 23 h", services: 'Livraison · À emporter · Terrasse' },
        { name: `${businessName(p)} — Gare`, address: `4 place de la Gare, ${cityOf(p)}`, hours: 'Ouvert jusqu\'à 22 h', services: 'À emporter · Drive' },
        { name: `${businessName(p)} — Zone commerciale`, address: `Route de Paris, ${cityOf(p)}`, hours: 'Ouvert 7j/7', services: 'Drive · Parking · Aire de jeux' },
      ],
      ctaLabel: 'Voir la fiche',
      tone: 'default',
    }),
  },

  allergens: {
    kind: 'allergens', label: 'Allergènes', icon: 'Wheat',
    description: 'Allergenes et calories, repris directement du catalogue',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'text', label: 'Texte', type: 'textarea' },
      { key: 'showTable', label: 'Afficher le tableau', type: 'boolean' },
      { key: 'showList', label: 'Rappeler les 14 allergènes', type: 'boolean' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: () => ({
      title: 'Allergènes et informations nutritionnelles',
      text: "Nos préparations sont réalisées dans un atelier qui manipule les quatorze allergènes réglementaires. Signalez toute allergie avant de commander, notre équipe vous guidera.",
      showTable: true,
      showList: true,
      ctaLabel: 'Télécharger la fiche complète',
      tone: 'alt',
    }),
  },

  loyalty: {
    kind: 'loyalty', label: 'Fidélité', icon: 'Gift',
    description: 'Programme de fidelite et application mobile',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'text', label: 'Texte', type: 'textarea' },
      {
        key: 'items', label: 'Avantages', type: 'list', itemLabel: 'Avantage',
        itemFields: [{ key: 'name', label: 'Avantage', type: 'text' }],
      },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      { key: 'showApp', label: "Afficher l'application", type: 'boolean' },
      { key: 'stamps', label: 'Tampons de la carte', type: 'number', min: 4, max: 12 },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Le programme fidélité',
      text: isTableService(p)
        ? 'Cumulez des points à chaque commande et transformez-les en offres, sur place comme en livraison.'
        : 'Cumulez des points à chaque achat et transformez-les en avantages.',
      items: [
        { name: '1 € dépensé = 1 point' },
        { name: isTableService(p) ? '100 points = un menu offert' : '100 points = une remise sur votre prochain achat' },
        { name: 'Une surprise le jour de votre anniversaire' },
      ],
      ctaLabel: 'Créer mon compte',
      showApp: true,
      stamps: 8,
      tone: 'accent',
    }),
  },

  /**
   * La section libre. Elle n'a presque aucun champ : tout son contenu vient de
   * ses blocs. C'est la reponse a « je veux juste une page qui dit ceci » sans
   * qu'un type de section soit ajoute au moteur a chaque demande (§48).
   */
  content: {
    kind: 'content', label: 'Contenu libre', icon: 'LayoutTemplate',
    description: 'Une section que vous composez bloc par bloc',
    fluid: true,
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'align', label: 'Alignement', type: 'select',
        options: [
          { value: 'left', label: 'À gauche' },
          { value: 'center', label: 'Centré' },
        ],
      },
      TONE,
    ],
    defaults: () => ({ title: '', subtitle: '', align: 'left', tone: 'default' }),
    blocks: ['heading', 'text', 'bullets', 'quote', 'image', 'feature', 'stat', 'badge', 'button', 'spacer'],
    maxBlocks: 14,
    defaultBlocks: [{ type: 'heading', props: {} }, { type: 'text', props: {} }],
    presets: [
      {
        id: 'texte', label: 'Contenu libre',
        description: 'Un titre et un texte, a completer',
        blocks: [{ type: 'heading', props: {} }, { type: 'text', props: {} }],
      },
      {
        id: 'arguments', label: 'Contenu — trois arguments',
        description: 'Vos trois raisons de vous choisir, en colonnes',
        props: { title: 'Pourquoi nous confier votre projet', align: 'center', tone: 'alt' },
        blocks: [
          { type: 'feature', props: { title: 'Un interlocuteur unique', text: 'Vous parlez à la même personne du premier appel jusqu’à la livraison.' } },
          { type: 'feature', props: { title: 'Des délais tenus', text: 'Une date annoncée est une date respectée, et vous êtes prévenu au moindre écart.' } },
          { type: 'feature', props: { title: 'Un travail garanti', text: 'Nous revenons sans frais si quelque chose ne va pas.' } },
        ],
      },
      {
        id: 'texte-image', label: 'Contenu — texte et image',
        description: 'Un paragraphe suivi d\'une image',
        blocks: [{ type: 'text', props: {} }, { type: 'image', props: {} }],
      },
      {
        id: 'engagement', label: 'Contenu — engagement',
        description: 'Une citation forte et un bouton',
        props: { align: 'center', tone: 'alt' },
        blocks: [{ type: 'quote', props: {} }, { type: 'button', props: { label: 'Nous contacter', variant: 'primary' } }],
      },
    ],
  },

  // --- sections « le temps, la preuve, le lien » ---------------------------
  // Aucune n'est rattachee a un objectif : un module gouverne par un objectif
  // est injecte sur l'accueil de tous les metiers qui cochent cet objectif
  // (project.ts, addSectionsForModules). Elles s'activent donc a la main, dans
  // « Autres fonctionnalites disponibles ».

  video: {
    kind: 'video', label: 'Vidéo', icon: 'Video',
    description: 'Une video de presentation, en grand, avec son message',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'layout', label: 'Mise en page', type: 'select', options: [
        { value: 'cover', label: 'Pleine largeur' },
        { value: 'split', label: 'Côte à côte avec le texte' },
        { value: 'card', label: 'Encadrée' },
      ] },
      { key: 'posterUrl', label: 'Image de couverture', type: 'image' },
      { key: 'duration', label: 'Durée affichée', type: 'text' },
      { key: 'caption', label: 'Légende', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Nous découvrir en vidéo',
      subtitle: isTableService(p)
        ? 'Deux minutes en cuisine, avant de passer à table.'
        : 'Deux minutes pour comprendre comment nous travaillons.',
      layout: 'cover',
      posterUrl: '',
      duration: '',
      caption: 'Tournée chez nous, sans montage ni mise en scène.',
      ctaLabel: 'Voir la vidéo',
      tone: 'default',
    }),
  },

  news: {
    kind: 'news', label: 'Actualités', icon: 'Newspaper',
    description: 'Vos dernieres nouvelles, en cartes datees',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Actualités', type: 'list', itemLabel: 'Actualité',
        itemFields: [
          { key: 'date', label: 'Date affichée', type: 'text' },
          { key: 'category', label: 'Rubrique', type: 'text' },
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'excerpt', label: 'Chapeau', type: 'textarea' },
        ],
      },
      { key: 'showImages', label: 'Afficher une image par article', type: 'boolean' },
      { key: 'showFilter', label: 'Filtrer par rubrique', type: 'boolean' },
      { key: 'readLabel', label: 'Lien de lecture', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton sous la liste', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: 'Actualités',
      subtitle: 'Ce qui se passe chez nous en ce moment.',
      items: [
        {
          date: '12 mars', category: 'Nouveauté', title: "Notre équipe s'agrandit",
          excerpt: "Deux nouveaux collaborateurs nous rejoignent : de quoi raccourcir encore nos délais et rester joignables toute la semaine.",
        },
        {
          date: '28 février', category: 'Coulisses', title: 'Retour sur un projet peu ordinaire',
          excerpt: "Trois semaines de travail, une contrainte technique inhabituelle et un client ravi : on vous raconte comment on s'y est pris.",
        },
        {
          date: '5 février', category: 'Pratique', title: `Nos horaires à ${cityOf(p)} pendant les vacances`,
          excerpt: 'Nous restons joignables tout le mois : voici les créneaux à retenir et le numéro à composer en cas d’imprévu.',
        },
      ],
      showImages: true,
      showFilter: false,
      readLabel: 'Lire la suite',
      ctaLabel: '',
      columns: Math.min(3, p.grid.columns),
      tone: 'default',
    }),
  },

  events: {
    kind: 'events', label: 'Agenda', icon: 'CalendarDays',
    description: 'Vos prochaines dates : ateliers, portes ouvertes, temps forts',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'layout', label: 'Mise en page', type: 'select', options: [
        { value: 'agenda', label: 'Liste datée' },
        { value: 'cards', label: 'Cartes' },
      ] },
      {
        key: 'items', label: 'Événements', type: 'list', itemLabel: 'Événement',
        itemFields: [
          { key: 'day', label: 'Jour', type: 'text' },
          { key: 'month', label: 'Mois', type: 'text' },
          { key: 'name', label: 'Titre', type: 'text' },
          { key: 'time', label: 'Horaire', type: 'text' },
          { key: 'place', label: 'Lieu', type: 'text' },
          { key: 'text', label: 'Détail', type: 'textarea' },
          { key: 'status', label: 'Étiquette', type: 'text' },
        ],
      },
      { key: 'ctaLabel', label: 'Bouton par événement', type: 'text' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Nos prochains rendez-vous',
      subtitle: "Ateliers, portes ouvertes, temps forts : l'entrée est libre sauf mention contraire.",
      layout: 'agenda',
      items: [
        {
          day: '14', month: 'mars', name: 'Portes ouvertes', time: '10 h – 18 h', place: cityOf(p),
          text: 'Visite libre toute la journée, démonstrations en continu et réponses à toutes vos questions.',
          status: 'Entrée libre',
        },
        {
          day: '02', month: 'avril', name: 'Atelier découverte', time: '18 h 30 – 20 h', place: 'Sur inscription',
          text: "Un petit groupe, deux heures, et vous repartez avec l'essentiel bien en main.",
          status: 'Places limitées',
        },
        {
          day: '25', month: 'mai', name: 'Notre rendez-vous annuel', time: 'Toute la journée', place: cityOf(p),
          text: 'Une journée pour se retrouver, présenter les nouveautés et remercier ceux qui nous suivent.',
          status: '',
        },
      ],
      ctaLabel: '',
      tone: 'alt',
    }),
  },

  jobs: {
    kind: 'jobs', label: 'Recrutement', icon: 'Briefcase',
    description: "Vos offres d'emploi et la candidature spontanee",
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Offres', type: 'list', itemLabel: 'Offre',
        itemFields: [
          { key: 'name', label: 'Poste', type: 'text' },
          { key: 'contract', label: 'Contrat', type: 'text' },
          { key: 'place', label: 'Lieu', type: 'text' },
          { key: 'text', label: 'Missions', type: 'textarea' },
          { key: 'profile', label: 'Profil recherché', type: 'textarea' },
        ],
      },
      { key: 'ctaLabel', label: 'Bouton de candidature', type: 'text' },
      { key: 'showSpontaneous', label: 'Bloc candidature spontanée', type: 'boolean' },
      { key: 'spontaneousTitle', label: 'Titre du bloc', type: 'text' },
      { key: 'spontaneousText', label: 'Texte du bloc', type: 'textarea' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Nous rejoindre',
      subtitle: 'Nous recrutons toute l’année des personnes sérieuses, curieuses, et bien accompagnées.',
      items: isTableService(p)
        ? [
            {
              name: 'Équipier·ère polyvalent·e', contract: 'CDI · 35 h', place: cityOf(p),
              text: 'Vous tenez votre poste en salle comme en cuisine, dans une équipe soudée et un rythme soutenu.',
              profile: 'Débutant accepté : nous formons sur place. Ponctualité et esprit d’équipe indispensables.',
            },
            {
              name: 'Second de cuisine', contract: 'CDI · Temps plein', place: cityOf(p),
              text: 'Vous secondez le chef sur la production du jour, les commandes et le respect des normes d’hygiène.',
              profile: 'Deux ans d’expérience en cuisine et l’envie de faire progresser une équipe.',
            },
          ]
        : [
            {
              name: 'Poste à pourvoir', contract: 'CDI · Temps plein', place: cityOf(p),
              text: 'Décrivez ici les missions du poste, le quotidien de la personne et ce qu’elle apprendra chez vous.',
              profile: 'Précisez l’expérience attendue, les qualités qui comptent vraiment, et ce sur quoi vous êtes souple.',
            },
            {
              name: 'Apprenti·e', contract: 'Alternance', place: cityOf(p),
              text: 'Un accompagnement suivi, un tuteur identifié et de vraies responsabilités dès les premiers mois.',
              profile: 'Motivation et sérieux avant le diplôme : nous formons sur le terrain.',
            },
          ],
      ctaLabel: 'Postuler',
      showSpontaneous: true,
      spontaneousTitle: 'Aucune offre ne vous correspond ?',
      spontaneousText: 'Écrivez-nous quand même. Nous gardons les candidatures qui nous marquent, et nous rappelons dès qu’un poste s’ouvre.',
      tone: 'default',
    }),
  },

  documents: {
    kind: 'documents', label: 'Documents', icon: 'FileDown',
    description: 'Plaquette, tarifs, notices : vos fichiers a telecharger',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Documents', type: 'list', itemLabel: 'Document',
        itemFields: [
          { key: 'name', label: 'Nom du document', type: 'text' },
          { key: 'format', label: 'Format (PDF, DOC…)', type: 'text' },
          { key: 'size', label: 'Poids affiché', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea' },
          { key: 'updated', label: 'Mis à jour', type: 'text' },
        ],
      },
      { key: 'ctaLabel', label: 'Libellé du bouton', type: 'text' },
      COLUMNS, TONE,
    ],
    defaults: (p) => ({
      title: 'Documents à télécharger',
      subtitle: 'Tout ce qu’il vous faut pour préparer votre projet, à consulter tranquillement.',
      items: [
        {
          name: 'Notre plaquette de présentation', format: 'PDF', size: '',
          text: `Qui nous sommes, ce que nous faisons et quelques réalisations récentes autour de ${cityOf(p)}.`,
          updated: '',
        },
        {
          name: 'Grille tarifaire', format: 'PDF', size: '',
          text: 'Nos tarifs de référence, hors devis personnalisé. Valables jusqu’à nouvel ordre.',
          updated: '',
        },
        {
          name: 'Conditions générales', format: 'PDF', size: '',
          text: 'Nos engagements, les délais annoncés et les modalités de règlement.',
          updated: '',
        },
      ],
      ctaLabel: 'Télécharger',
      columns: Math.min(3, p.grid.columns),
      tone: 'alt',
    }),
  },

  certifications: {
    kind: 'certifications', label: 'Certifications et garanties', icon: 'ShieldCheck',
    description: 'Vos labels, assurances et engagements ecrits',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      {
        key: 'items', label: 'Garanties', type: 'list', itemLabel: 'Garantie',
        itemFields: [
          { key: 'name', label: 'Intitulé', type: 'text' },
          { key: 'issuer', label: 'Organisme ou assureur', type: 'text' },
          { key: 'text', label: 'Ce que cela couvre', type: 'textarea' },
          { key: 'validity', label: 'Validité ou référence', type: 'text' },
        ],
      },
      // La consigne est un PLACEHOLDER, jamais une valeur par defaut : un
      // client qui ajoute la section sans ouvrir le panneau publierait
      // « Remplacez ces exemples » en clair sur son site (§54).
      { key: 'note', label: 'Mention sous les cartes', type: 'text', placeholder: 'Remplacez ces exemples par vos propres labels, assurances et engagements' },
      COLUMNS, TONE,
    ],
    // Aucun label reel (RGE, Qualibat…) dans les defauts : on ne pre-remplit
    // jamais une certification que le client ne detient pas.
    defaults: (p) => ({
      title: 'Nos garanties',
      subtitle: 'Des engagements écrits, vérifiables, et une entreprise assurée pour chaque intervention.',
      items: [
        {
          name: 'Responsabilité civile professionnelle', issuer: 'Assurance en cours de validité',
          text: 'Chaque intervention est couverte, chez vous comme chez nos partenaires.',
          validity: 'Attestation fournie sur demande',
        },
        {
          name: 'Garantie de parfait achèvement', issuer: 'Engagement contractuel',
          text: 'Si quelque chose ne va pas dans l’année qui suit, nous revenons sans facturer.',
          validity: '12 mois',
        },
        {
          name: 'Devis gratuit et sans engagement', issuer: 'Engagement maison',
          text: 'Le prix annoncé est le prix payé : aucune ligne n’apparaît en cours de route.',
          validity: 'Toute l’année',
        },
        {
          name: 'Entreprise déclarée', issuer: 'Registre officiel',
          text: `Numéro d’immatriculation et attestations à jour, communiqués avec chaque devis à ${cityOf(p)} comme ailleurs.`,
          validity: 'Vérifiable à tout moment',
        },
      ],
      note: '',
      columns: 2,
      tone: 'alt',
    }),
  },

  coverage: {
    kind: 'coverage', label: 'Zone d’intervention', icon: 'MapPinned',
    description: 'Ou vous vous deplacez, et en combien de temps',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'text' },
      { key: 'radius', label: 'Rayon', type: 'number', min: 1, max: 300 },
      { key: 'unit', label: 'Unité', type: 'select', options: [
        { value: 'km', label: 'kilomètres' },
        { value: 'min', label: 'minutes de route' },
      ] },
      { key: 'delay', label: 'Délai affiché', type: 'text' },
      {
        key: 'items', label: 'Secteurs', type: 'list', itemLabel: 'Secteur',
        itemFields: [
          { key: 'name', label: 'Commune ou secteur', type: 'text' },
          { key: 'note', label: 'Précision (délai, jour de tournée…)', type: 'text' },
        ],
      },
      { key: 'showSearch', label: 'Champ « votre commune »', type: 'boolean' },
      { key: 'searchLabel', label: 'Invite du champ', type: 'text' },
      { key: 'showMap', label: 'Afficher le plan', type: 'boolean' },
      { key: 'outsideText', label: 'Message hors zone', type: 'textarea' },
      TONE,
    ],
    defaults: (p) => ({
      title: 'Notre zone d’intervention',
      subtitle: `Nous intervenons à ${cityOf(p)} et dans un large périmètre autour.`,
      radius: 30,
      unit: 'km',
      delay: 'Intervention sous 48 h',
      items: [
        { name: `${cityOf(p)} et son centre`, note: 'Intervention le jour même' },
        { name: 'Communes limitrophes', note: 'Sous 24 h' },
        { name: 'Périphérie', note: 'Sous 48 h' },
        { name: 'Zones d’activité et commerciales', note: 'Sur rendez-vous' },
        { name: 'Reste du département', note: 'Selon planning, nous consulter' },
        { name: 'Déplacements ponctuels hors zone', note: 'Sur devis, avec frais de route' },
      ],
      showSearch: true,
      searchLabel: 'Votre commune',
      showMap: true,
      outsideText: 'Vous êtes en dehors de cette zone ? Écrivez-nous : nous nous déplaçons au cas par cas.',
      tone: 'default',
    }),
  },

  newsletter: {
    kind: 'newsletter', label: 'Lettre d’information', icon: 'Mailbox',
    description: 'Capter une adresse e-mail, avec la promesse et la frequence',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
      {
        key: 'items', label: 'Arguments', type: 'list', itemLabel: 'Argument',
        itemFields: [{ key: 'name', label: 'Argument', type: 'text' }],
      },
      { key: 'placeholder', label: 'Invite du champ', type: 'text' },
      { key: 'ctaLabel', label: 'Bouton', type: 'text' },
      { key: 'frequency', label: 'Fréquence affichée', type: 'text' },
      { key: 'consent', label: 'Mention sur les données', type: 'textarea' },
      { key: 'showCount', label: 'Afficher le nombre d’abonnés', type: 'boolean' },
      { key: 'count', label: 'Nombre d’abonnés', type: 'number', min: 0, max: 100000 },
      TONE,
    ],
    defaults: () => ({
      title: 'Restons en contact',
      subtitle: 'Une lettre courte et utile : nos nouveautés, quelques conseils, et les dates à retenir. Rien d’autre.',
      items: [
        { name: 'Nos nouveautés en avant-première' },
        { name: 'Des conseils utiles, jamais de publicité' },
        { name: 'Désinscription en un clic' },
      ],
      placeholder: 'Votre adresse e-mail',
      ctaLabel: 'Je m’inscris',
      frequency: 'Une fois par mois, pas plus.',
      consent: 'Une adresse suffit. Vos données servent uniquement à vous envoyer cette lettre et ne sont jamais revendues.',
      showCount: false,
      count: 1200,
      tone: 'accent',
    }),
  },
}


export const SECTION_LIST: SectionDef[] = Object.values(SECTION_DEFS)

/**
 * Rangement du catalogue « Ajouter une section ». Une liste de trente entrees
 * ne se lit pas : le client cherche une intention (« rassurer », « faire venir
 * en boutique »), pas un type technique.
 */
export const SECTION_CATEGORIES: { id: string; label: string; kinds: SectionKind[] }[] = [
  { id: 'essentiel', label: 'Essentielles', kinds: ['hero', 'about', 'content', 'cta'] },
  { id: 'offre', label: 'Votre offre', kinds: ['services', 'products', 'formulas', 'offers', 'pricing', 'portfolio', 'gallery'] },
  { id: 'preuve', label: 'Rassurer', kinds: ['testimonials', 'stats', 'process', 'team', 'logos', 'beforeafter', 'faq', 'allergens'] },
  { id: 'conversion', label: 'Faire agir', kinds: ['contact', 'quote', 'booking', 'ordermodes', 'loyalty', 'banner'] },
  { id: 'infos', label: 'Informations pratiques', kinds: ['hours', 'location', 'venues', 'map', 'social'] },
]

/**
 * Filet de securite : une section ajoutee au moteur et oubliee dans le rangement
 * ci-dessus reste proposee au client, dans un groupe « Autres », au lieu de
 * disparaitre silencieusement du catalogue.
 */
export const SECTION_GROUPS: { id: string; label: string; kinds: SectionKind[] }[] = (() => {
  const cited = new Set(SECTION_CATEGORIES.flatMap((c) => c.kinds))
  const rest = SECTION_LIST.map((d) => d.kind).filter((kind) => !cited.has(kind))
  return rest.length > 0 ? [...SECTION_CATEGORIES, { id: 'autres', label: 'Autres', kinds: rest }] : SECTION_CATEGORIES
})()

/**
 * Variantes proposees pour une section. Une section qui n'en declare aucune est
 * son propre point de depart : le catalogue reste homogene sans que les
 * vingt-cinq autres definitions aient a repeter une variante « simple ».
 */
export function presetsOf(def: SectionDef): SectionPreset[] {
  return def.presets ?? [{ id: 'simple', label: def.label, description: def.description }]
}

/**
 * Props effectives d'une section, par couches successives :
 *   defauts du catalogue -> valeurs du metier choisi -> reglages du client.
 *
 * La couche du milieu est ce qui permet a un centre auto d'afficher d'emblee
 * « Selectionnez votre vehicule » la ou un centre de formation affiche son
 * programme, sans qu'aucune section ne connaisse le moindre metier (§48).
 */
export function resolveProps(section: Section, project: Project): Record<string, unknown> {
  const activity = project.activityId ? getActivity(project.activityId) : null
  const tuned = activity?.sectionDefaults?.[section.kind]
  return { ...SECTION_DEFS[section.kind].defaults(project), ...tuned, ...section.props }
}

/**
 * Blocs effectifs d'une section. Tant que le client n'a touche a aucun bloc, la
 * section n'en stocke aucun et le catalogue fournit les siens : les projets
 * enregistres avant l'arrivee des blocs restent donc valides, et une section
 * ajoutee sans variante n'est jamais vide.
 */
export function resolveBlocks(section: Section): Block[] {
  if (section.blocks) return section.blocks
  const seeds = SECTION_DEFS[section.kind].defaultBlocks ?? []
  return seeds.map((seed, index) => ({
    id: `${section.id}-b${index}`,
    type: seed.type,
    props: { ...seed.props },
  }))
}

/**
 * La zone de blocs de cette section est-elle en grille fluide ? Le reglage du
 * client prime sur le catalogue : il peut liberer la grille d'une section
 * dessinable, ou revenir a l'empilement quand la composition lui echappe.
 */
export function isFluid(section: Section): boolean {
  const chosen = section.props.fluid
  if (typeof chosen === 'boolean') return chosen
  return SECTION_DEFS[section.kind].fluid === true
}

/** Types de blocs qu'une section accepte encore, compte tenu de son plafond. */
export function acceptsMoreBlocks(def: SectionDef, current: number): boolean {
  if (!def.blocks || def.blocks.length === 0) return false
  return current < (def.maxBlocks ?? 12)
}

export function sectionLabel(kind: SectionKind): string {
  return SECTION_DEFS[kind].label
}
