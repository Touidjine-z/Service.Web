import type { Theme } from './themes'

/**
 * Appairages de polices (§10, §11).
 *
 * `project.fontPair` existait dans le modele depuis le debut sans etre lu nulle
 * part : le client heritait forcement des polices de son theme. Ce fichier lui
 * donne enfin un sens, sans casser la regle d'architecture — un appairage n'est
 * qu'un jeu de tokens de plus, traduit au meme endroit que les autres
 * (`renderer/tokens.ts`), et aucun theme ni aucun metier n'a de traitement
 * particulier (§48).
 *
 * Les familles sont chargees dans `styles/index.css`. Le navigateur ne
 * telecharge que les fichiers reellement utilises : un site n'en emploie que
 * deux, le reste ne coute que quelques octets de CSS.
 */

export interface FontPair {
  id: string
  label: string
  /** Ce que l'appairage raconte, en une ligne, pour aider a choisir. */
  description: string
  headingFont: string
  bodyFont: string
  /**
   * Graisse de titre imposee par l'appairage. Une display condensee a 800
   * devient illisible, une serif fine a 400 disparait : la graisse fait partie
   * du dessin. Absente, celle du theme est conservee.
   */
  headingWeight?: Theme['headingWeight']
  /** Metiers auxquels cet appairage parle le plus. */
  forWho: string
}

const INTER = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
const PLAYFAIR = "'Playfair Display', Georgia, 'Times New Roman', serif"
const GROTESK = "'Space Grotesk', 'Inter', system-ui, sans-serif"
const MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace"
const SLAB = "'Roboto Slab', Georgia, 'Times New Roman', serif"
const FRAUNCES = "'Fraunces', 'Playfair Display', Georgia, serif"
const BEBAS = "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif"
const OSWALD = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"
const OUTFIT = "'Outfit', 'Inter', system-ui, sans-serif"
const MANROPE = "'Manrope', 'Inter', system-ui, sans-serif"
const CORMORANT = "'Cormorant Garamond', 'Playfair Display', Garamond, serif"

/**
 * Le premier appairage est neutre : il laisse le theme decider, et reste la
 * valeur par defaut d'un projet (`createEmptyProject`).
 */
export const FONT_PAIRS: FontPair[] = [
  {
    id: 'default', label: 'Polices du thème',
    description: 'Chaque thème arrive avec sa propre typographie.',
    headingFont: '', bodyFont: '',
    forWho: 'Tous les métiers',
  },
  {
    id: 'neutre', label: 'Neutre et lisible',
    description: 'Une seule famille, du titre au paragraphe. Discret, jamais démodé.',
    headingFont: INTER, bodyFont: INTER, headingWeight: 700,
    forWho: 'Cabinets, services, artisans',
  },
  {
    id: 'classique', label: 'Classique',
    description: 'Titres en serif, texte en sans : le contraste le plus sûr.',
    headingFont: PLAYFAIR, bodyFont: INTER, headingWeight: 600,
    forWho: 'Avocats, notaires, immobilier',
  },
  {
    id: 'raffine', label: 'Raffiné',
    description: 'Une serif fine et large, pour un rendu de faire-part.',
    headingFont: CORMORANT, bodyFont: INTER, headingWeight: 600,
    forWho: 'Traiteurs, instituts, mariage',
  },
  {
    id: 'caractere', label: 'Du caractère',
    description: 'Une serif moderne, un peu ronde, qui se remarque sans crier.',
    headingFont: FRAUNCES, bodyFont: MANROPE, headingWeight: 700,
    forWho: 'Boulangeries, fleuristes, boutiques',
  },
  {
    id: 'affiche', label: 'Affiche',
    description: 'Titres condensés en capitales, très haute lisibilité de loin.',
    headingFont: BEBAS, bodyFont: INTER, headingWeight: 400,
    forWho: 'Restauration rapide, salles de sport, garages',
  },
  {
    id: 'robuste', label: 'Robuste',
    description: 'Condensé sans être criard : le vocabulaire du bâtiment.',
    headingFont: OSWALD, bodyFont: INTER, headingWeight: 600,
    forWho: 'Maçons, charpentiers, dépannage',
  },
  {
    id: 'geometrique', label: 'Géométrique',
    description: 'Formes rondes et régulières, tonalité jeune et rassurante.',
    headingFont: OUTFIT, bodyFont: OUTFIT, headingWeight: 700,
    forWho: 'Coachs, crèches, associations',
  },
  {
    id: 'technique', label: 'Technique',
    description: 'Titres en grotesque, texte en sans : sérieux et contemporain.',
    headingFont: GROTESK, bodyFont: INTER, headingWeight: 700,
    forWho: 'Agences, consultants, artisans du numérique',
  },
  {
    id: 'editorial', label: 'Éditorial',
    description: 'Une slab charpentée pour les titres, du confort de lecture dessous.',
    headingFont: SLAB, bodyFont: MANROPE, headingWeight: 700,
    forWho: 'Formations, cabinets de conseil, associations',
  },
  {
    id: 'atelier', label: 'Atelier',
    description: 'Titres à chasse fixe : le parti pris d’un carnet de commandes.',
    headingFont: MONO, bodyFont: INTER, headingWeight: 500,
    forWho: 'Menuisiers, photographes, ateliers',
  },
  {
    id: 'inverse', label: 'Contre-pied',
    description: 'Titres en sans très gras, texte en serif : l’inverse de l’habitude.',
    headingFont: MANROPE, bodyFont: PLAYFAIR, headingWeight: 800,
    forWho: 'Créatifs, galeries, studios',
  },
]

export const FONT_PAIR_BY_ID = new Map(FONT_PAIRS.map((p) => [p.id, p]))

export interface ResolvedFonts {
  headingFont: string
  bodyFont: string
  headingWeight: Theme['headingWeight']
}

/**
 * Polices effectives d'un projet : celles de l'appairage s'il en a choisi un,
 * celles du theme sinon. Un appairage inconnu — un projet enregistre avant que
 * la liste ne change — retombe silencieusement sur le theme.
 */
export function resolveFonts(theme: Theme, fontPair?: string): ResolvedFonts {
  const pair = fontPair ? FONT_PAIR_BY_ID.get(fontPair) : undefined
  if (!pair || !pair.headingFont) {
    return { headingFont: theme.headingFont, bodyFont: theme.bodyFont, headingWeight: theme.headingWeight }
  }
  return {
    headingFont: pair.headingFont,
    bodyFont: pair.bodyFont,
    headingWeight: pair.headingWeight ?? theme.headingWeight,
  }
}

/**
 * Theme dont les polices sont deja resolues. Indispensable : plusieurs sections
 * lisent `tokens.theme.headingFont` directement plutot que de passer par
 * `tokens.heading()`. Surcharger le theme lui-meme est le seul moyen que
 * l'appairage les atteigne toutes, y compris le code ecrit demain.
 */
export function themeWithFonts(theme: Theme, fontPair?: string): Theme {
  const fonts = resolveFonts(theme, fontPair)
  if (fonts.headingFont === theme.headingFont && fonts.bodyFont === theme.bodyFont && fonts.headingWeight === theme.headingWeight) {
    return theme
  }
  return { ...theme, ...fonts }
}
