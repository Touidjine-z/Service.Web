import type { CSSProperties } from 'react'
import type { ButtonStyle, CardStyle, ImageTreatment, SectionEdge, Theme } from '@/engine/themes'
import type { ColorScheme, Viewport } from '@/engine/types'
import { readableOn, withAlpha } from '@/engine/color'
import { themeWithFonts } from '@/engine/fonts'

/**
 * Traduit les tokens d'un theme (§10) en styles concrets. C'est le seul endroit
 * ou un theme devient du CSS : les sections ne connaissent que ces helpers, ce
 * qui garantit qu'aucun metier ni aucun theme n'a de composant dedie (§48).
 */
export interface SiteTokens {
  theme: Theme
  colors: ColorScheme
  viewport: Viewport
  /** Largeur max du contenu, en px, deja adaptee au viewport. */
  containerWidth: number
  /** Padding vertical des sections, en px. */
  sectionY: number
  radius: string
  /** Nombre de colonnes tenable pour une grille de `wanted` colonnes. */
  columns: (wanted: number) => number
  scale: (px: number) => number
  onPrimary: string
  onButton: string
  onFooter: string
  button: (variant?: 'primary' | 'secondary') => CSSProperties
  card: () => CSSProperties
  image: () => CSSProperties
  heading: (size: number) => CSSProperties
  container: () => CSSProperties
  section: (tone?: 'default' | 'alt' | 'accent') => CSSProperties
  divider: string
  muted: string
}

const CONTAINER: Record<Theme['containerWidth'], number> = {
  narrow: 760, normal: 1080, wide: 1280, full: 1600,
}

const PADDING: Record<Theme['sectionPadding'], number> = {
  compact: 44, normal: 72, airy: 104, vast: 136,
}

const LETTER: Record<Theme['letterSpacing'], string> = {
  tight: '-0.02em', normal: '0', wide: '0.08em',
}

/** Largeur reelle du viewport simule (§21, §23, §24). */
export const VIEWPORT_WIDTH: Record<Viewport, number> = {
  desktop: 1440, tablet: 834, mobile: 390, tv: 1920,
}

/** Facteur applique aux tailles pour que mobile et TV restent lisibles. */
const VIEWPORT_SCALE: Record<Viewport, number> = {
  desktop: 1, tablet: 0.92, mobile: 0.8, tv: 1.5,
}

/** Colonnes maximales tenables par viewport, quel que soit le reglage demande. */
const MAX_COLUMNS: Record<Viewport, number> = {
  desktop: 5, tablet: 3, mobile: 1, tv: 5,
}


/**
 * Tables de style des tokens.
 *
 * Ce sont des `Record` EXHAUSTIFS a dessein : ajouter une variante a
 * `CardStyle`, `ButtonStyle`, `ImageTreatment` ou `SectionEdge` sans ecrire son
 * rendu ici fait echouer la compilation. Sans cette contrainte, une variante
 * oubliee tombe silencieusement dans le `else` et le theme rend autre chose que
 * ce qu'il declare — c'est exactement ce qui est arrive a `nav: 'sidebar'` et a
 * `footer: 'large'`, qui ont longtemps rendu comme leurs voisins.
 */
interface StyleContext {
  theme: Theme
  colors: ColorScheme
  radius: string
  divider: string
  scale: (px: number) => number
  onButton: string
}

type Variant = 'primary' | 'secondary'

const CARD: Record<CardStyle, (c: StyleContext) => CSSProperties> = {
  flat: ({ theme, colors, radius }) => ({
    background: colors.card,
    border: 'none',
    boxShadow: 'none',
    borderRadius: theme.radius === 0 ? '0' : radius,
  }),
  outlined: ({ colors, radius, divider }) => ({
    background: colors.card,
    border: `1px solid ${divider}`,
    boxShadow: 'none',
    borderRadius: radius,
  }),
  elevated: ({ colors, radius }) => ({
    background: colors.card,
    border: 'none',
    boxShadow: '0 18px 40px -28px rgba(0,0,0,.55)',
    borderRadius: radius,
  }),
  glass: ({ colors, radius }) => ({
    background: withAlpha(colors.card, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${withAlpha(colors.text, 0.18)}`,
    boxShadow: 'none',
    borderRadius: radius,
  }),
  'bordered-heavy': ({ colors, radius }) => ({
    background: colors.card,
    border: `2px solid ${colors.text}`,
    boxShadow: 'none',
    borderRadius: radius,
  }),
  overlap: ({ colors, radius }) => ({
    background: colors.card,
    border: 'none',
    boxShadow: '0 26px 50px -30px rgba(0,0,0,.6)',
    borderRadius: radius,
    transform: 'translateY(-6px)',
  }),
  // Filet de marque en tete : la seule carte qui fasse entrer la couleur
  // principale DANS le contenu plutot qu'autour.
  ribbon: ({ theme, colors, radius, scale }) => ({
    background: colors.card,
    border: 'none',
    borderTop: `${Math.max(2, scale(4))}px solid ${colors.primary}`,
    boxShadow: 'none',
    borderRadius: theme.radius === 0 ? '0' : `0 0 ${radius} ${radius}`,
  }),
  // Carte en creux : une teinte du TEXTE par-dessus le fond courant, pour que
  // le creux fonctionne aussi sur une section contrastee.
  inset: ({ theme, colors, radius, scale }) => {
    const line = Math.max(1, scale(1))
    return {
      background: withAlpha(colors.text, theme.dark ? 0.07 : 0.045),
      border: 'none',
      boxShadow: `inset 0 ${line}px 0 0 ${withAlpha(colors.text, theme.dark ? 0.16 : 0.1)}, inset 0 0 0 ${line}px ${withAlpha(colors.text, 0.06)}`,
      borderRadius: radius,
    }
  },
  // Ombre portee dure, sans flou, dans la couleur de marque : elle reste
  // visible sur une palette sombre, contrairement a une ombre noire.
  stamp: ({ colors, radius, scale }) => ({
    background: colors.card,
    border: `${Math.max(2, scale(2))}px solid ${colors.text}`,
    boxShadow: `${scale(6)}px ${scale(6)}px 0 0 ${colors.primary}`,
    borderRadius: radius,
  }),
}

/**
 * Bouton secondaire. Il se pose sur des fonds que le token ne connait pas — un
 * hero plein, une section « couleur principale ». `currentColor` herite de la
 * couleur de texte deja posee par la section : c'est le seul moyen d'etre
 * lisible partout sans qu'un bouton ait a connaitre la palette.
 */
function secondaryButton(shape: CSSProperties): CSSProperties {
  return {
    ...shape,
    background: 'transparent',
    backgroundImage: undefined,
    color: 'currentColor',
    border: '1px solid currentColor',
    opacity: 0.85,
  }
}

const BUTTON: Record<ButtonStyle, (c: StyleContext, variant: Variant) => CSSProperties> = {
  solid: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: c.radius }
    return v === 'secondary' ? secondaryButton(shape) : { ...shape, background: c.colors.button, color: c.onButton, border: 'none' }
  },
  pill: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: '999px' }
    return v === 'secondary' ? secondaryButton(shape) : { ...shape, background: c.colors.button, color: c.onButton, border: 'none' }
  },
  sharp: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: '0' }
    return v === 'secondary' ? secondaryButton(shape) : { ...shape, background: c.colors.button, color: c.onButton, border: 'none' }
  },
  gradient: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: c.radius }
    return v === 'secondary'
      ? secondaryButton(shape)
      : { ...shape, backgroundImage: `linear-gradient(135deg, ${c.colors.primary}, ${c.colors.accent})`, color: c.onButton, border: 'none' }
  },
  outline: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: c.radius }
    return v === 'secondary'
      ? secondaryButton(shape)
      : { ...shape, background: 'transparent', color: c.colors.primary, border: `1px solid ${withAlpha(c.colors.primary, 0.45)}` }
  },
  underline: (c, v) => {
    const shape = { paddingInline: '0', paddingBlock: `${c.scale(6)}px`, borderRadius: '0' }
    return v === 'secondary'
      ? { ...shape, background: 'transparent', color: 'currentColor', border: 'none', borderBottom: '2px solid currentColor', opacity: 0.85 }
      : { ...shape, background: 'transparent', color: c.colors.primary, border: 'none', borderBottom: `2px solid ${c.colors.primary}` }
  },
  // Lavis teinte : le registre des interfaces sobres, absent des six variantes
  // d'origine (trois pleines, trois creuses a filet).
  soft: (c, v) => {
    const shape = { paddingInline: `${c.scale(22)}px`, paddingBlock: `${c.scale(13)}px`, borderRadius: c.radius }
    return v === 'secondary'
      ? secondaryButton(shape)
      : {
          ...shape,
          background: withAlpha(c.colors.primary, c.theme.dark ? 0.22 : 0.12),
          color: c.colors.primary,
          border: 'none',
        }
  },
  // La seule variante qui agisse sur la TYPOGRAPHIE du bouton, et non sur son
  // fond ou son rayon.
  block: (c, v) => {
    const shape: CSSProperties = {
      paddingInline: `${c.scale(30)}px`,
      paddingBlock: `${c.scale(16)}px`,
      borderRadius: '0',
      fontSize: `${c.scale(13)}px`,
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
    }
    return v === 'secondary' ? secondaryButton(shape) : { ...shape, background: c.colors.button, color: c.onButton, border: 'none' }
  },
}

const IMAGE: Record<ImageTreatment, (c: StyleContext) => CSSProperties> = {
  rounded: ({ radius }) => ({ borderRadius: radius }),
  sharp: () => ({ borderRadius: '0' }),
  circle: () => ({ borderRadius: '999px' }),
  arch: ({ radius }) => ({ borderRadius: `999px 999px ${radius} ${radius}` }),
  duotone: ({ radius }) => ({ borderRadius: radius, filter: 'saturate(0.2)' }),
  framed: ({ colors, radius }) => ({
    borderRadius: radius,
    border: `1px solid ${withAlpha(colors.text, 0.25)}`,
    padding: '6px',
  }),
  // Rayons opposes : la seule silhouette d'image qui ne soit ni symetrique ni
  // simplement verticale.
  leaf: ({ theme, scale }) => ({ borderRadius: `${scale(34)}px ${theme.radius}px ${scale(34)}px ${theme.radius}px` }),
}

const SECTION_EDGE: Record<SectionEdge, (c: StyleContext, toneBackground: string) => CSSProperties> = {
  none: (_c, background) => ({ background }),
  rule: ({ divider, scale }, background) => ({ background, borderTop: `${Math.max(1, scale(1))}px solid ${divider}` }),
  accent: ({ colors, scale }, background) => ({ background, borderTop: `${Math.max(2, scale(3))}px solid ${colors.primary}` }),
  // Une seule valeur `background` composee : ajouter un `backgroundImage` a
  // cote se ferait ecraser par le raccourci selon l'ordre des cles.
  fade: ({ theme, colors, scale }, background) => ({
    background: `linear-gradient(180deg, ${withAlpha(colors.secondary, theme.dark ? 0.2 : 0.07)}, transparent ${scale(180)}px), ${background}`,
  }),
  // La diagonale mord dans le padding haut de la section : aucun texte n'est
  // rogne, et les sections qui reecrivent `paddingBlock` restent intactes.
  wedge: ({ scale }, background) => ({
    background,
    clipPath: `polygon(0 0, 100% ${scale(26)}px, 100% 100%, 0 100%)`,
  }),
}

export function createTokens(
  rawTheme: Theme,
  colors: ColorScheme,
  viewport: Viewport = 'desktop',
  /** Appairage de polices choisi par le client ; le theme decide si absent. */
  fontPair?: string,
): SiteTokens {
  // Les polices sont resolues sur le THEME lui-meme, pas seulement dans
  // `heading()` : plusieurs sections lisent `tokens.theme.headingFont`
  // directement, et doivent suivre le choix du client (cf. engine/fonts.ts).
  const theme = themeWithFonts(rawTheme, fontPair)
  const ratio = VIEWPORT_SCALE[viewport]
  const scale = (px: number) => Math.round(px * ratio)
  const radius = `${theme.radius}px`
  const onPrimary = readableOn(colors.primary)
  const onButton = readableOn(colors.button)
  const divider = withAlpha(colors.text, 0.12)
  const muted = withAlpha(colors.text, 0.68)
  const style: StyleContext = { theme, colors, radius, divider, scale, onButton }

  return {
    theme,
    colors,
    viewport,
    containerWidth: CONTAINER[theme.containerWidth],
    sectionY: scale(PADDING[theme.sectionPadding]),
    radius,
    scale,
    onPrimary,
    onButton,
    onFooter: readableOn(colors.footer),
    divider,
    muted,

    columns: (wanted) => Math.max(1, Math.min(wanted, MAX_COLUMNS[viewport])),

    container: () => ({
      width: '100%',
      maxWidth: theme.containerWidth === 'full' ? '100%' : `${CONTAINER[theme.containerWidth]}px`,
      marginInline: 'auto',
      paddingInline: `${scale(viewport === 'mobile' ? 20 : 32)}px`,
    }),

    section: (tone = 'default') => {
      const toneBackground =
        tone === 'alt' ? withAlpha(colors.secondary, theme.dark ? 0.16 : 0.05)
        : tone === 'accent' ? colors.primary
        : 'transparent'
      return {
        paddingBlock: `${scale(PADDING[theme.sectionPadding])}px`,
        color: tone === 'accent' ? onPrimary : colors.text,
        ...SECTION_EDGE[theme.sectionEdge ?? 'none'](style, toneBackground),
      }
    },

    heading: (size) => ({
      fontFamily: theme.headingFont,
      fontWeight: theme.headingWeight,
      textTransform: theme.headingTransform,
      letterSpacing: LETTER[theme.letterSpacing],
      fontSize: `${scale(size)}px`,
      lineHeight: size > 30 ? 1.12 : 1.28,
    }),

    button: (variant = 'primary') => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: `${scale(15)}px`,
      fontWeight: 600,
      cursor: 'default',
      ...BUTTON[theme.button](style, variant),
    }),

    card: () => ({ overflow: 'hidden', ...CARD[theme.card](style) }),

    image: () => ({ overflow: 'hidden', ...IMAGE[theme.image](style) }),
  }
}

/** Variables CSS injectees sur `.site-root` (cf. styles/index.css). */
export function siteCssVars(rawTheme: Theme, colors: ColorScheme, fontPair?: string): Record<string, string> {
  const theme = themeWithFonts(rawTheme, fontPair)
  return {
    '--site-primary': colors.primary,
    '--site-secondary': colors.secondary,
    '--site-accent': colors.accent,
    '--site-background': colors.background,
    '--site-text': colors.text,
    '--site-button': colors.button,
    '--site-card': colors.card,
    '--site-header': colors.header,
    '--site-footer': colors.footer,
    '--site-heading-font': theme.headingFont,
    '--site-body-font': theme.bodyFont,
    '--site-heading-weight': String(theme.headingWeight),
    '--site-heading-transform': theme.headingTransform,
    '--site-letter-spacing': LETTER[theme.letterSpacing],
  }
}
