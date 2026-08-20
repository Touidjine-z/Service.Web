import type { Block, BlockType, FieldDef, Project } from '@/engine/types'

/**
 * Catalogue declaratif des blocs (§14). Un bloc est un morceau de contenu type
 * que le client ajoute a l'interieur d'une section, deplace et masque comme il
 * veut. Le vocabulaire est volontairement commun a toutes les sections : c'est
 * ce qui permet a une section d'accepter des blocs sans qu'aucun composant lui
 * soit dedie (§48).
 *
 * Comme pour les sections, l'editeur de blocs du builder est genere a partir
 * d'ici : ajouter un type de bloc ne demande aucun formulaire supplementaire.
 */
export interface BlockDef {
  type: BlockType
  label: string
  description: string
  icon: string
  fields: FieldDef[]
  /** Valeurs de depart, pour ne jamais afficher un bloc vide. */
  defaults: (project: Project) => Record<string, unknown>
  /** Champ dont la valeur resume le bloc dans la liste du builder. */
  summaryKey: string
}

const businessName = (p: Project) => p.identity.businessName.trim() || 'Votre entreprise'

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  heading: {
    type: 'heading', label: 'Titre', icon: 'Heading', summaryKey: 'title',
    description: 'Un intertitre dans la section',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      {
        key: 'size', label: 'Taille', type: 'select',
        options: [
          { value: 'sm', label: 'Discret' },
          { value: 'md', label: 'Normal' },
          { value: 'lg', label: 'Grand' },
        ],
      },
    ],
    defaults: () => ({ title: 'Un titre intermédiaire', size: 'md' }),
  },

  text: {
    type: 'text', label: 'Paragraphe', icon: 'AlignLeft', summaryKey: 'text',
    description: 'Un bloc de texte libre',
    fields: [{ key: 'text', label: 'Texte', type: 'textarea' }],
    defaults: (p) => ({
      text: `Racontez ici ce qui compte pour vos clients : votre méthode, vos garanties, ce qui distingue ${businessName(p)} des autres.`,
    }),
  },

  bullets: {
    type: 'bullets', label: 'Liste à puces', icon: 'List', summaryKey: 'items',
    description: 'Trois ou quatre points forts, en liste',
    fields: [
      {
        key: 'items', label: 'Points', type: 'list', itemLabel: 'Point',
        itemFields: [{ key: 'text', label: 'Point', type: 'text' }],
      },
    ],
    defaults: () => ({
      items: [
        { text: 'Devis gratuit sous 24 h' },
        { text: 'Intervention rapide' },
        { text: 'Travail garanti' },
      ],
    }),
  },

  button: {
    type: 'button', label: 'Bouton', icon: 'MousePointerClick', summaryKey: 'label',
    description: "Un appel a l'action supplementaire",
    fields: [
      { key: 'label', label: 'Libellé', type: 'text' },
      {
        key: 'variant', label: 'Style', type: 'select',
        options: [
          { value: 'primary', label: 'Principal' },
          { value: 'secondary', label: 'Secondaire' },
        ],
      },
    ],
    defaults: () => ({ label: 'En savoir plus', variant: 'secondary' }),
  },

  image: {
    type: 'image', label: 'Image', icon: 'Image', summaryKey: 'caption',
    description: 'Une image, avec legende facultative',
    fields: [
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'caption', label: 'Légende', type: 'text' },
      {
        key: 'ratio', label: 'Format', type: 'select',
        options: [
          { value: 'landscape', label: 'Paysage' },
          { value: 'square', label: 'Carré' },
          { value: 'portrait', label: 'Portrait' },
          { value: 'wide', label: 'Panoramique' },
        ],
      },
    ],
    defaults: () => ({ imageUrl: '', caption: '', ratio: 'landscape' }),
  },

  stat: {
    type: 'stat', label: 'Chiffre clé', icon: 'TrendingUp', summaryKey: 'label',
    description: 'Un chiffre qui rassure, anime a l\'affichage',
    fields: [
      { key: 'value', label: 'Valeur', type: 'text' },
      { key: 'suffix', label: 'Suffixe', type: 'text', placeholder: '+, %, ans...' },
      { key: 'label', label: 'Légende', type: 'text' },
    ],
    defaults: () => ({ value: '15', suffix: ' ans', label: "d'expérience" }),
  },

  quote: {
    type: 'quote', label: 'Citation', icon: 'Quote', summaryKey: 'text',
    description: 'Une phrase mise en avant, ou un avis',
    fields: [
      { key: 'text', label: 'Citation', type: 'textarea' },
      { key: 'author', label: 'Signature', type: 'text' },
    ],
    defaults: (p) => ({
      text: 'Un travail soigné, dans les délais annoncés. Je recommande sans hésiter.',
      author: `Client de ${businessName(p)}`,
    }),
  },

  feature: {
    type: 'feature', label: 'Argument', icon: 'BadgeCheck', summaryKey: 'title',
    description: 'Un argument numerote, avec titre et explication',
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'text', label: 'Explication', type: 'textarea' },
    ],
    defaults: () => ({
      title: 'Un interlocuteur unique',
      text: 'Vous parlez à la même personne du premier appel jusqu’à la fin du chantier.',
    }),
  },

  badge: {
    type: 'badge', label: 'Pastille', icon: 'Tag', summaryKey: 'label',
    description: 'Une pastille de reassurance, en ligne',
    fields: [{ key: 'label', label: 'Texte', type: 'text' }],
    defaults: () => ({ label: 'Devis gratuit' }),
  },

  spacer: {
    type: 'spacer', label: 'Espace', icon: 'MoveVertical', summaryKey: 'size',
    description: 'Un blanc, pour aerer la section',
    fields: [
      {
        key: 'size', label: 'Hauteur', type: 'select',
        options: [
          { value: 'sm', label: 'Petit' },
          { value: 'md', label: 'Moyen' },
          { value: 'lg', label: 'Grand' },
        ],
      },
    ],
    defaults: () => ({ size: 'md' }),
  },
}

export const BLOCK_LIST: BlockDef[] = Object.values(BLOCK_DEFS)

/** Props effectives d'un bloc : defauts du catalogue + reglages du client. */
export function resolveBlockProps(block: Block, project: Project): Record<string, unknown> {
  return { ...BLOCK_DEFS[block.type].defaults(project), ...block.props }
}

export function blockLabel(type: BlockType): string {
  return BLOCK_DEFS[type].label
}

/**
 * Resume d'un bloc pour la liste du builder : le client doit reconnaitre son
 * bloc sans l'ouvrir. On prend le champ designe par le catalogue, et on retombe
 * sur le libelle du type quand il est vide.
 */
export function blockSummary(block: Block, project: Project): string {
  const def = BLOCK_DEFS[block.type]
  const raw = resolveBlockProps(block, project)[def.summaryKey]
  const text = Array.isArray(raw)
    ? (raw as Record<string, unknown>[]).map((it) => String(it.text ?? '')).filter(Boolean).join(' · ')
    : String(raw ?? '')
  const clean = text.trim()
  if (!clean || block.type === 'spacer') return def.label
  return clean.length > 46 ? `${clean.slice(0, 46)}…` : clean
}
