import type { ThemeId, ColorScheme } from './types'

/**
 * Les 20 themes (§10). Un theme n'est pas qu'une palette : il change la
 * structure, la navigation, la typographie, les boutons, les cartes, le hero,
 * le footer, les espacements, les animations et le traitement des images.
 * Le renderer lit ces tokens ; aucun theme n'a de composant dedie.
 */

export type NavLayout = 'inline' | 'centered' | 'split' | 'stacked' | 'sidebar' | 'minimal'
export type HeroLayout = 'centered' | 'split' | 'fullbleed' | 'overlay' | 'boxed' | 'editorial' | 'stacked'
export type CardStyle = 'flat' | 'outlined' | 'elevated' | 'glass' | 'bordered-heavy' | 'overlap'
export type ButtonStyle = 'solid' | 'pill' | 'outline' | 'sharp' | 'underline' | 'gradient'
export type ImageTreatment = 'rounded' | 'sharp' | 'circle' | 'arch' | 'duotone' | 'framed'
export type FooterLayout = 'columns' | 'compact' | 'centered' | 'large'
export type Motion = 'none' | 'subtle' | 'lively'

export interface Theme {
  id: ThemeId
  name: string
  tagline: string
  /** Palette de depart, entierement modifiable ensuite par l'utilisateur (§11). */
  colors: ColorScheme
  headingFont: string
  bodyFont: string
  headingWeight: 400 | 500 | 600 | 700 | 800 | 900
  headingTransform: 'none' | 'uppercase'
  letterSpacing: 'tight' | 'normal' | 'wide'
  nav: NavLayout
  hero: HeroLayout
  card: CardStyle
  button: ButtonStyle
  image: ImageTreatment
  footer: FooterLayout
  radius: number
  sectionPadding: 'compact' | 'normal' | 'airy' | 'vast'
  containerWidth: 'narrow' | 'normal' | 'wide' | 'full'
  motion: Motion
  /** Rendu sombre par defaut : influence les contrastes calcules. */
  dark?: boolean
}

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'Inter', system-ui, sans-serif"
const GROTESK = "'Space Grotesk', 'Inter', sans-serif"
const MONO = "'IBM Plex Mono', ui-monospace, monospace"
const SLAB = "'Roboto Slab', Georgia, serif"

export const THEMES: Theme[] = [
  {
    id: 'modern', name: 'Modern', tagline: 'Épuré, aéré, universel',
    colors: { primary: '#2563EB', secondary: '#0F172A', accent: '#38BDF8', background: '#FFFFFF', text: '#0F172A', button: '#2563EB', card: '#F8FAFC', header: '#FFFFFF', footer: '#0F172A' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'inline', hero: 'split', card: 'elevated', button: 'solid', image: 'rounded', footer: 'columns',
    radius: 12, sectionPadding: 'normal', containerWidth: 'normal', motion: 'subtle',
  },
  {
    id: 'premium', name: 'Premium', tagline: 'Haut de gamme et rassurant',
    colors: { primary: '#1E3A5F', secondary: '#C9A227', accent: '#C9A227', background: '#FCFBF8', text: '#1A1A1A', button: '#1E3A5F', card: '#FFFFFF', header: '#FCFBF8', footer: '#1E3A5F' },
    headingFont: SERIF, bodyFont: SANS, headingWeight: 600, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'centered', hero: 'overlay', card: 'outlined', button: 'outline', image: 'framed', footer: 'large',
    radius: 4, sectionPadding: 'airy', containerWidth: 'normal', motion: 'subtle',
  },
  {
    id: 'minimal', name: 'Minimal', tagline: 'Le contenu, rien d\'autre',
    colors: { primary: '#111111', secondary: '#666666', accent: '#111111', background: '#FFFFFF', text: '#111111', button: '#111111', card: '#FFFFFF', header: '#FFFFFF', footer: '#FFFFFF' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 500, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'minimal', hero: 'centered', card: 'flat', button: 'underline', image: 'sharp', footer: 'compact',
    radius: 0, sectionPadding: 'vast', containerWidth: 'narrow', motion: 'none',
  },
  {
    id: 'elegant', name: 'Elegant', tagline: 'Raffiné, typographie soignée',
    colors: { primary: '#7C3F58', secondary: '#3D2C3A', accent: '#D4A5A5', background: '#FDF9F7', text: '#2B2024', button: '#7C3F58', card: '#FFFFFF', header: '#FDF9F7', footer: '#3D2C3A' },
    headingFont: SERIF, bodyFont: SANS, headingWeight: 400, headingTransform: 'none', letterSpacing: 'wide',
    nav: 'centered', hero: 'centered', card: 'flat', button: 'outline', image: 'arch', footer: 'centered',
    radius: 2, sectionPadding: 'airy', containerWidth: 'narrow', motion: 'subtle',
  },
  {
    id: 'dark', name: 'Dark', tagline: 'Contraste fort, effet vitrine',
    colors: { primary: '#22D3EE', secondary: '#A855F7', accent: '#22D3EE', background: '#0B0F17', text: '#E6EDF7', button: '#22D3EE', card: '#141A24', header: '#0B0F17', footer: '#060910' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'split', hero: 'fullbleed', card: 'elevated', button: 'solid', image: 'rounded', footer: 'columns',
    radius: 14, sectionPadding: 'normal', containerWidth: 'normal', motion: 'lively', dark: true,
  },
  {
    id: 'classic', name: 'Classic', tagline: 'Intemporel et institutionnel',
    colors: { primary: '#1F4E5F', secondary: '#8C6A3F', accent: '#C08552', background: '#FFFDF9', text: '#22292F', button: '#1F4E5F', card: '#FFFFFF', header: '#FFFDF9', footer: '#22292F' },
    headingFont: SLAB, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'split', hero: 'boxed', card: 'bordered-heavy', button: 'sharp', image: 'framed', footer: 'columns',
    radius: 2, sectionPadding: 'normal', containerWidth: 'normal', motion: 'none',
  },
  {
    id: 'creative', name: 'Creative', tagline: 'Formes libres et couleurs vives',
    colors: { primary: '#F97316', secondary: '#7C3AED', accent: '#FACC15', background: '#FFFBF5', text: '#1B1B1F', button: '#F97316', card: '#FFFFFF', header: '#FFFBF5', footer: '#1B1B1F' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 800, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'inline', hero: 'stacked', card: 'overlap', button: 'pill', image: 'arch', footer: 'large',
    radius: 24, sectionPadding: 'airy', containerWidth: 'wide', motion: 'lively',
  },
  {
    id: 'corporate', name: 'Corporate', tagline: 'Structuré, orienté confiance',
    colors: { primary: '#0B5FFF', secondary: '#1E293B', accent: '#00B8A9', background: '#FFFFFF', text: '#1E293B', button: '#0B5FFF', card: '#F1F5F9', header: '#FFFFFF', footer: '#1E293B' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'split', hero: 'split', card: 'outlined', button: 'sharp', image: 'sharp', footer: 'columns',
    radius: 6, sectionPadding: 'normal', containerWidth: 'wide', motion: 'subtle',
  },
  {
    id: 'luxury', name: 'Luxury', tagline: 'Noir, or et grands espaces',
    colors: { primary: '#C5A059', secondary: '#0A0A0A', accent: '#C5A059', background: '#0A0A0A', text: '#F2EDE4', button: '#C5A059', card: '#141210', header: '#0A0A0A', footer: '#000000' },
    headingFont: SERIF, bodyFont: SANS, headingWeight: 400, headingTransform: 'uppercase', letterSpacing: 'wide',
    nav: 'centered', hero: 'overlay', card: 'flat', button: 'outline', image: 'duotone', footer: 'centered',
    radius: 0, sectionPadding: 'vast', containerWidth: 'narrow', motion: 'subtle', dark: true,
  },
  {
    id: 'urban', name: 'Urban', tagline: 'Street, dense et graphique',
    colors: { primary: '#EF4444', secondary: '#18181B', accent: '#FACC15', background: '#FAFAFA', text: '#18181B', button: '#18181B', card: '#FFFFFF', header: '#18181B', footer: '#18181B' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 900, headingTransform: 'uppercase', letterSpacing: 'tight',
    nav: 'split', hero: 'fullbleed', card: 'bordered-heavy', button: 'sharp', image: 'sharp', footer: 'compact',
    radius: 0, sectionPadding: 'compact', containerWidth: 'wide', motion: 'lively',
  },
  {
    id: 'clean', name: 'Clean', tagline: 'Lisible, doux, sans friction',
    colors: { primary: '#0EA5E9', secondary: '#475569', accent: '#6EE7B7', background: '#F8FAFC', text: '#334155', button: '#0EA5E9', card: '#FFFFFF', header: '#F8FAFC', footer: '#E2E8F0' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 600, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'inline', hero: 'centered', card: 'elevated', button: 'pill', image: 'rounded', footer: 'compact',
    radius: 16, sectionPadding: 'normal', containerWidth: 'normal', motion: 'subtle',
  },
  {
    id: 'nature', name: 'Nature', tagline: 'Végétal, chaleureux, artisanal',
    colors: { primary: '#3F6B4A', secondary: '#7A5C3E', accent: '#C6D8B0', background: '#FAF8F2', text: '#2C332B', button: '#3F6B4A', card: '#FFFFFF', header: '#FAF8F2', footer: '#2C332B' },
    headingFont: SLAB, bodyFont: SANS, headingWeight: 600, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'inline', hero: 'split', card: 'flat', button: 'pill', image: 'arch', footer: 'columns',
    radius: 20, sectionPadding: 'airy', containerWidth: 'normal', motion: 'subtle',
  },
  {
    id: 'fresh', name: 'Fresh', tagline: 'Coloré, gourmand, appétissant',
    colors: { primary: '#E23E3E', secondary: '#1F7A4C', accent: '#FFB703', background: '#FFFDF7', text: '#241F1C', button: '#E23E3E', card: '#FFFFFF', header: '#FFFDF7', footer: '#241F1C' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 800, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'centered', hero: 'fullbleed', card: 'elevated', button: 'pill', image: 'rounded', footer: 'large',
    radius: 18, sectionPadding: 'normal', containerWidth: 'wide', motion: 'lively',
  },
  {
    id: 'vintage', name: 'Vintage', tagline: 'Rétro, papier, authentique',
    colors: { primary: '#9C4221', secondary: '#4A3728', accent: '#D9A566', background: '#F5EEE1', text: '#3B2F26', button: '#9C4221', card: '#FBF6EC', header: '#F5EEE1', footer: '#3B2F26' },
    headingFont: SERIF, bodyFont: SLAB, headingWeight: 700, headingTransform: 'uppercase', letterSpacing: 'wide',
    nav: 'centered', hero: 'boxed', card: 'bordered-heavy', button: 'sharp', image: 'duotone', footer: 'centered',
    radius: 2, sectionPadding: 'normal', containerWidth: 'narrow', motion: 'none',
  },
  {
    id: 'professional', name: 'Professional', tagline: 'Sobre, sérieux, efficace',
    colors: { primary: '#334E68', secondary: '#627D98', accent: '#2BB0ED', background: '#FFFFFF', text: '#243B53', button: '#334E68', card: '#F0F4F8', header: '#FFFFFF', footer: '#243B53' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 600, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'split', hero: 'boxed', card: 'outlined', button: 'solid', image: 'sharp', footer: 'columns',
    radius: 8, sectionPadding: 'normal', containerWidth: 'normal', motion: 'none',
  },
  {
    id: 'bold', name: 'Bold', tagline: 'Titres énormes, impact immédiat',
    colors: { primary: '#7C3AED', secondary: '#111827', accent: '#F472B6', background: '#FFFFFF', text: '#111827', button: '#7C3AED', card: '#F5F3FF', header: '#FFFFFF', footer: '#111827' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 900, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'stacked', hero: 'stacked', card: 'overlap', button: 'gradient', image: 'rounded', footer: 'large',
    radius: 20, sectionPadding: 'airy', containerWidth: 'wide', motion: 'lively',
  },
  {
    id: 'glass', name: 'Glass', tagline: 'Transparences et profondeur',
    colors: { primary: '#6366F1', secondary: '#0F172A', accent: '#22D3EE', background: '#0F1424', text: '#E8ECF7', button: '#6366F1', card: '#1B2237', header: '#0F1424', footer: '#0A0E1A' },
    headingFont: SANS, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'centered', hero: 'overlay', card: 'glass', button: 'gradient', image: 'rounded', footer: 'compact',
    radius: 18, sectionPadding: 'airy', containerWidth: 'normal', motion: 'lively', dark: true,
  },
  {
    id: 'editorial', name: 'Editorial', tagline: 'Magazine, colonnes, lecture',
    colors: { primary: '#1A1A1A', secondary: '#B91C1C', accent: '#B91C1C', background: '#FFFFFF', text: '#1A1A1A', button: '#1A1A1A', card: '#FAFAFA', header: '#FFFFFF', footer: '#1A1A1A' },
    headingFont: SERIF, bodyFont: SANS, headingWeight: 700, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'stacked', hero: 'editorial', card: 'flat', button: 'underline', image: 'sharp', footer: 'columns',
    radius: 0, sectionPadding: 'normal', containerWidth: 'wide', motion: 'none',
  },
  {
    id: 'dynamic', name: 'Dynamic', tagline: 'Mouvement, diagonales, énergie',
    colors: { primary: '#06B6D4', secondary: '#1E1B4B', accent: '#F59E0B', background: '#FFFFFF', text: '#1E1B4B', button: '#06B6D4', card: '#ECFEFF', header: '#FFFFFF', footer: '#1E1B4B' },
    headingFont: GROTESK, bodyFont: SANS, headingWeight: 800, headingTransform: 'none', letterSpacing: 'tight',
    nav: 'sidebar', hero: 'split', card: 'elevated', button: 'gradient', image: 'rounded', footer: 'large',
    radius: 16, sectionPadding: 'normal', containerWidth: 'wide', motion: 'lively',
  },
  {
    id: 'custom', name: 'Custom', tagline: 'Base neutre à personnaliser entièrement',
    colors: { primary: '#4B5563', secondary: '#111827', accent: '#9CA3AF', background: '#FFFFFF', text: '#111827', button: '#111827', card: '#F9FAFB', header: '#FFFFFF', footer: '#111827' },
    headingFont: SANS, bodyFont: MONO, headingWeight: 600, headingTransform: 'none', letterSpacing: 'normal',
    nav: 'inline', hero: 'centered', card: 'outlined', button: 'solid', image: 'rounded', footer: 'compact',
    radius: 10, sectionPadding: 'normal', containerWidth: 'normal', motion: 'subtle',
  },
]

export const THEME_BY_ID = new Map<ThemeId, Theme>(THEMES.map((t) => [t.id, t]))

export function getTheme(id: ThemeId): Theme {
  return THEME_BY_ID.get(id) ?? THEMES[0]
}

export const SECTION_PADDING: Record<Theme['sectionPadding'], string> = {
  compact: '2.5rem', normal: '4.5rem', airy: '6.5rem', vast: '9rem',
}

export const CONTAINER_WIDTH: Record<Theme['containerWidth'], string> = {
  narrow: '52rem', normal: '68rem', wide: '80rem', full: '100%',
}

export const LETTER_SPACING: Record<Theme['letterSpacing'], string> = {
  tight: '-0.025em', normal: '0em', wide: '0.08em',
}
