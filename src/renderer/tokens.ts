import type { CSSProperties } from 'react'
import type { Theme } from '@/engine/themes'
import type { ColorScheme, Viewport } from '@/engine/types'
import { readableOn, withAlpha } from '@/engine/color'

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

export function createTokens(theme: Theme, colors: ColorScheme, viewport: Viewport = 'desktop'): SiteTokens {
  const ratio = VIEWPORT_SCALE[viewport]
  const scale = (px: number) => Math.round(px * ratio)
  const radius = `${theme.radius}px`
  const onPrimary = readableOn(colors.primary)
  const onButton = readableOn(colors.button)
  const divider = withAlpha(colors.text, 0.12)
  const muted = withAlpha(colors.text, 0.68)

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

    section: (tone = 'default') => ({
      paddingBlock: `${scale(PADDING[theme.sectionPadding])}px`,
      background:
        tone === 'alt' ? withAlpha(colors.secondary, theme.dark ? 0.16 : 0.05)
        : tone === 'accent' ? colors.primary
        : 'transparent',
      color: tone === 'accent' ? onPrimary : colors.text,
    }),

    heading: (size) => ({
      fontFamily: theme.headingFont,
      fontWeight: theme.headingWeight,
      textTransform: theme.headingTransform,
      letterSpacing: LETTER[theme.letterSpacing],
      fontSize: `${scale(size)}px`,
      lineHeight: size > 30 ? 1.12 : 1.28,
    }),

    button: (variant = 'primary') => {
      const hollow = theme.button === 'outline' || theme.button === 'underline'
      const base = variant === 'primary' ? colors.button : 'transparent'
      const tint = variant === 'primary' ? colors.primary : colors.text
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        paddingInline: `${scale(theme.button === 'underline' ? 0 : 22)}px`,
        paddingBlock: `${scale(theme.button === 'underline' ? 6 : 13)}px`,
        fontSize: `${scale(15)}px`,
        fontWeight: 600,
        cursor: 'default',
        background: hollow || variant === 'secondary' ? 'transparent' : base,
        backgroundImage:
          theme.button === 'gradient' && variant === 'primary'
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
            : undefined,
        color: hollow || variant === 'secondary' ? tint : onButton,
        border:
          theme.button === 'outline' || variant === 'secondary' ? `1px solid ${withAlpha(tint, 0.45)}` : 'none',
        borderBottom: theme.button === 'underline' ? `2px solid ${tint}` : undefined,
        borderRadius:
          theme.button === 'pill' ? '999px'
          : theme.button === 'sharp' || theme.button === 'underline' ? '0'
          : radius,
      }
    },

    card: () => ({
      background: theme.card === 'glass' ? withAlpha(colors.card, 0.6) : colors.card,
      backdropFilter: theme.card === 'glass' ? 'blur(10px)' : undefined,
      border:
        theme.card === 'outlined' ? `1px solid ${divider}`
        : theme.card === 'bordered-heavy' ? `2px solid ${colors.text}`
        : theme.card === 'glass' ? `1px solid ${withAlpha(colors.text, 0.18)}`
        : 'none',
      boxShadow:
        theme.card === 'elevated' ? '0 18px 40px -28px rgba(0,0,0,.55)'
        : theme.card === 'overlap' ? '0 26px 50px -30px rgba(0,0,0,.6)'
        : 'none',
      borderRadius: theme.card === 'flat' && theme.radius === 0 ? '0' : radius,
      overflow: 'hidden',
      transform: theme.card === 'overlap' ? 'translateY(-6px)' : undefined,
    }),

    image: () => ({
      borderRadius:
        theme.image === 'circle' ? '999px'
        : theme.image === 'arch' ? `999px 999px ${radius} ${radius}`
        : theme.image === 'sharp' ? '0'
        : radius,
      border: theme.image === 'framed' ? `1px solid ${withAlpha(colors.text, 0.25)}` : undefined,
      padding: theme.image === 'framed' ? '6px' : undefined,
      filter: theme.image === 'duotone' ? 'saturate(0.2)' : undefined,
      overflow: 'hidden',
    }),
  }
}

/** Variables CSS injectees sur `.site-root` (cf. styles/index.css). */
export function siteCssVars(theme: Theme, colors: ColorScheme): Record<string, string> {
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
