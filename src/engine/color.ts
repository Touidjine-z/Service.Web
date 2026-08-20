import type { ColorScheme } from './types'

/** Conversions et generation de palette (§11). */

export interface HSL { h: number; s: number; l: number }
export interface RGB { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(full.slice(0, 6), 16)
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0))
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = ln - c / 2
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 }
}

export function hexToHsl(hex: string): HSL { return rgbToHsl(hexToRgb(hex)) }
export function hslToHex(hsl: HSL): string { return rgbToHex(hslToRgb(hsl)) }

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

export function normalizeHex(value: string): string {
  const clean = value.trim().replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  return `#${full.toUpperCase()}`
}

/** Luminance relative WCAG, sert au choix automatique du texte sur fond colore. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const chan = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Texte lisible (noir ou blanc) sur une couleur de fond donnee. */
export function readableOn(background: string): string {
  return contrastRatio(background, '#FFFFFF') >= contrastRatio(background, '#111111') ? '#FFFFFF' : '#111111'
}

export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: Math.min(100, hsl.l + amount) })
}

export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: Math.max(0, hsl.l - amount) })
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`
}

export type HarmonyMode = 'analogous' | 'complementary' | 'triadic' | 'monochrome'

/**
 * « Generer une palette » : construit un jeu coherent a partir d'une couleur
 * principale. L'utilisateur peut ensuite modifier chaque couleur (§11).
 */
export function generatePalette(primary: string, mode: HarmonyMode = 'analogous', dark = false): ColorScheme {
  const base = hexToHsl(primary)
  const shift = (deg: number, satDelta = 0, lightDelta = 0): string =>
    hslToHex({
      h: base.h + deg,
      s: Math.max(8, Math.min(96, base.s + satDelta)),
      l: Math.max(6, Math.min(94, base.l + lightDelta)),
    })

  let secondary: string
  let accent: string
  switch (mode) {
    case 'complementary':
      secondary = shift(180, -14, dark ? 6 : -18)
      accent = shift(180, 10, 16)
      break
    case 'triadic':
      secondary = shift(120, -8, dark ? 4 : -12)
      accent = shift(240, 6, 12)
      break
    case 'monochrome':
      secondary = shift(0, -22, dark ? 10 : -24)
      accent = shift(0, 12, 18)
      break
    default:
      secondary = shift(-28, -12, dark ? 6 : -20)
      accent = shift(32, 12, 14)
  }

  const background = dark ? hslToHex({ h: base.h, s: 18, l: 7 }) : hslToHex({ h: base.h, s: 24, l: 98 })
  const text = dark ? hslToHex({ h: base.h, s: 12, l: 92 }) : hslToHex({ h: base.h, s: 22, l: 12 })
  const card = dark ? hslToHex({ h: base.h, s: 16, l: 12 }) : '#FFFFFF'

  return {
    primary: normalizeHex(primary),
    secondary,
    accent,
    background,
    text,
    button: normalizeHex(primary),
    card,
    header: background,
    footer: dark ? hslToHex({ h: base.h, s: 20, l: 4 }) : text,
  }
}

/** Signale les paires de couleurs dont le contraste est insuffisant. */
export function auditContrast(colors: ColorScheme): { pair: string; ratio: number }[] {
  const checks: [string, string, string][] = [
    ['Texte / fond', colors.text, colors.background],
    ['Texte / carte', colors.text, colors.card],
    ['Bouton / texte du bouton', colors.button, readableOn(colors.button)],
  ]
  return checks
    .map(([pair, a, b]) => ({ pair, ratio: contrastRatio(a, b) }))
    .filter((c) => c.ratio < 4.5)
}
