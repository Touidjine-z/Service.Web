import type { Project, ModuleId } from './types'

/**
 * Pricing engine (§37, §38).
 *
 * Deux invariants :
 *  1. Le calcul tourne en arriere-plan des le debut, mais le resultat ne doit
 *     JAMAIS etre rendu avant la page finale (garde `project.priceRevealed`).
 *  2. Aucune valeur n'est codee en dur dans les composants : tout vient des
 *     PricingRules, destinees a etre editables depuis l'administration.
 */

export interface PricingRules {
  basePrice: number
  includedPages: number
  pricePerExtraPage: number
  modulePrices: Partial<Record<ModuleId, number>>
  /** Palier applique au-dela d'un certain volume de catalogue. */
  catalogTiers: { upTo: number; price: number }[]
  customThemeSurcharge: number
  depositRate: number
  depositMinimum: number
  currency: string
}

/** Valeurs par defaut ; l'admin les remplacera via l'API de configuration. */
export const DEFAULT_PRICING_RULES: PricingRules = {
  basePrice: 400,
  includedPages: 5,
  pricePerExtraPage: 50,
  modulePrices: {
    cart: 120,
    order: 150,
    booking: 120,
    quote: 60,
    gallery: 40,
    portfolio: 60,
    products: 60,
    menu: 60,
    testimonials: 30,
    faq: 30,
    pricing: 30,
    tv: 50,
    qrcode: 50,
    social: 20,
    location: 30,
    hours: 20,
    categories: 30,
    about: 0,
    services: 40,
    contact: 0,
  },
  catalogTiers: [
    { upTo: 20, price: 0 },
    { upTo: 60, price: 80 },
    { upTo: 150, price: 180 },
    { upTo: Number.POSITIVE_INFINITY, price: 320 },
  ],
  customThemeSurcharge: 80,
  depositRate: 0.1,
  depositMinimum: 50,
  currency: 'EUR',
}

export interface PriceLine {
  label: string
  detail?: string
  amount: number
}

export interface Quote {
  lines: PriceLine[]
  total: number
  deposit: number
  balance: number
  currency: string
}

/** acompte = max(10 % du total, 50 €) — configurable (§31). */
export function computeDeposit(total: number, rules: PricingRules = DEFAULT_PRICING_RULES): number {
  return Math.max(Math.round(total * rules.depositRate), rules.depositMinimum)
}

export function computeQuote(project: Project, rules: PricingRules = DEFAULT_PRICING_RULES): Quote {
  const lines: PriceLine[] = []

  lines.push({ label: 'Site professionnel', detail: `Base, ${rules.includedPages} pages incluses`, amount: rules.basePrice })

  const extraPages = Math.max(0, project.pages.length - rules.includedPages)
  if (extraPages > 0) {
    lines.push({
      label: 'Pages supplémentaires',
      detail: `${extraPages} × ${rules.pricePerExtraPage} ${rules.currency === 'EUR' ? '€' : rules.currency}`,
      amount: extraPages * rules.pricePerExtraPage,
    })
  }

  for (const moduleId of project.modules) {
    const price = rules.modulePrices[moduleId]
    if (price && price > 0) {
      lines.push({ label: moduleLabel(moduleId), amount: price })
    }
  }

  const catalogSize = project.products.length + project.services.length + project.gallery.length
  const tier = rules.catalogTiers.find((t) => catalogSize <= t.upTo)
  if (tier && tier.price > 0) {
    lines.push({ label: 'Intégration du catalogue', detail: `${catalogSize} éléments`, amount: tier.price })
  }

  if (project.themeId === 'custom') {
    lines.push({ label: 'Design sur mesure', amount: rules.customThemeSurcharge })
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const deposit = computeDeposit(total, rules)
  return { lines, total, deposit, balance: total - deposit, currency: rules.currency }
}

const MODULE_LABELS: Partial<Record<ModuleId, string>> = {
  cart: 'Panier', order: 'Commande en ligne', booking: 'Prise de rendez-vous',
  quote: 'Formulaire de devis', gallery: 'Galerie', portfolio: 'Réalisations',
  products: 'Catalogue produits', menu: 'Menu', testimonials: 'Témoignages',
  faq: 'FAQ', pricing: 'Grille tarifaire', tv: 'Affichage TV', qrcode: 'QR Code',
  social: 'Réseaux sociaux', location: 'Localisation', hours: 'Horaires',
  categories: 'Catégories', services: 'Services',
}

function moduleLabel(id: ModuleId): string {
  return MODULE_LABELS[id] ?? id
}

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'CA$' }

export function formatMoney(amount: number, currency = 'EUR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
  return currency === 'USD' || currency === 'GBP' ? `${symbol}${value}` : `${value} ${symbol}`
}
