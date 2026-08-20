import type { PlanId, Project, ModuleId } from './types'
import { DEFAULT_PLAN_ID, planDefOf } from './plans'

/**
 * Pricing engine (§37, §38).
 *
 * Deux invariants :
 *  1. Le calcul tourne en arriere-plan des le debut, mais le resultat ne doit
 *     JAMAIS etre rendu avant la page finale (garde `project.priceRevealed`).
 *  2. Aucune valeur n'est codee en dur dans les composants : tout vient des
 *     PricingRules, destinees a etre editables depuis l'administration.
 *
 * La dependance aux formules (§60) va dans CE sens uniquement : le tarif connait
 * le catalogue, le catalogue ignore le tarif. C'est ce qui rend §56 structurel.
 */

/**
 * Tarif d'une formule. Le catalogue `modulePrices` reste UNIQUE et partage :
 * chaque formule n'en facture qu'une part (`moduleRate`). Deux tableaux a tenir
 * dans l'administration, ce sont deux tableaux qui divergent (§38).
 */
export interface PlanPricing {
  basePrice: number
  includedPages: number
  pricePerExtraPage: number
  /** Part du tarif catalogue d'un module facturee ici. 1 = plein tarif. */
  moduleRate: number
}

export interface PricingRules {
  /** @deprecated depuis §60 — repli du sur-mesure pour les regles deja enregistrees. */
  basePrice: number
  /** @deprecated depuis §60 — voir `plans`. */
  includedPages: number
  /** @deprecated depuis §60 — voir `plans`. */
  pricePerExtraPage: number
  modulePrices: Partial<Record<ModuleId, number>>
  /** Palier applique au-dela d'un certain volume de catalogue. */
  catalogTiers: { upTo: number; price: number }[]
  customThemeSurcharge: number
  /** Reservation et configuration du nom de domaine choisi a la fin (§59). */
  domainSetupFee: number
  depositRate: number
  depositMinimum: number
  currency: string
  /** Tarif par formule (§60). ABSENT des regles enregistrees avant cette option. */
  plans?: Record<PlanId, PlanPricing>
}

/** Valeurs par defaut ; l'admin les remplacera via l'API de configuration. */
export const DEFAULT_PRICING_RULES: PricingRules = {
  basePrice: 400,
  includedPages: 5,
  pricePerExtraPage: 50,
  modulePrices: {
    cart: 120,
    order: 150,
    ordermodes: 70,
    formulas: 40,
    offers: 40,
    venues: 90,
    allergens: 40,
    loyalty: 60,
    finder: 80,
    program: 40,
    funding: 30,
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
    stats: 30,
    process: 30,
    team: 40,
    logos: 30,
    beforeafter: 60,
    banner: 20,
    video: 60,
    news: 70,
    events: 60,
    jobs: 70,
    documents: 40,
    certifications: 40,
    coverage: 40,
    newsletter: 30,
  },
  catalogTiers: [
    { upTo: 20, price: 0 },
    { upTo: 60, price: 80 },
    { upTo: 150, price: 180 },
    { upTo: Number.POSITIVE_INFINITY, price: 320 },
  ],
  customThemeSurcharge: 80,
  domainSetupFee: 30,
  depositRate: 0.1,
  depositMinimum: 50,
  currency: 'EUR',
  plans: {
    // Le sur-mesure reprend au centime les valeurs d'avant les formules : aucun
    // devis deja sorti ne bouge.
    website: { basePrice: 400, includedPages: 5, pricePerExtraPage: 50, moduleRate: 1 },
    // Le modele : une base plus basse, et un module assemble sur un site type
    // coute la moitie d'un module construit. `includedPages` colle au plafond de
    // la formule (6) et `pricePerExtraPage` a 0 : aucune ligne « pages
    // supplementaires » ne peut apparaitre sur un devis modele.
    template: { basePrice: 250, includedPages: 6, pricePerExtraPage: 0, moduleRate: 0.5 },
  },
}

/**
 * Seul acces au tarif d'une formule ; jamais d'indexation directe de `plans`
 * ailleurs, sinon toute machine ayant deja enregistre des tarifs casse. Un
 * administrateur qui avait porte le prix de base a 450 € garde 450 € sur le
 * sur-mesure, et herite des defauts sur le modele.
 */
export function planPricing(rules: PricingRules, plan: PlanId): PlanPricing {
  const stored = rules.plans?.[plan]
  if (stored) return stored
  if (plan === DEFAULT_PLAN_ID) {
    return {
      basePrice: rules.basePrice,
      includedPages: rules.includedPages,
      pricePerExtraPage: rules.pricePerExtraPage,
      moduleRate: 1,
    }
  }
  return DEFAULT_PRICING_RULES.plans![plan]
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
  // Le devis NOMME la formule (§60) : plus de « Site professionnel » en dur.
  const plan = planDefOf(project)
  const p = planPricing(rules, plan.id)

  lines.push({ label: plan.label, detail: `Base, ${p.includedPages} pages incluses`, amount: p.basePrice })

  const extraPages = Math.max(0, project.pages.length - p.includedPages)
  if (extraPages > 0 && p.pricePerExtraPage > 0) {
    lines.push({
      label: 'Pages supplémentaires',
      detail: `${extraPages} × ${p.pricePerExtraPage} ${rules.currency === 'EUR' ? '€' : rules.currency}`,
      amount: extraPages * p.pricePerExtraPage,
    })
  }

  for (const moduleId of project.modules) {
    const price = Math.round((rules.modulePrices[moduleId] ?? 0) * p.moduleRate)
    if (price > 0) {
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

  // Nom de domaine (§59). Seul notre travail — reservation, configuration DNS,
  // certificat — entre dans le devis. Le prix du domaine lui-meme reste chez le
  // registrar, dans SA devise : le melanger au total le fausserait.
  // `?? DEFAULT` : les regles enregistrees avant cette option n'ont pas le champ.
  const domainFee = rules.domainSetupFee ?? DEFAULT_PRICING_RULES.domainSetupFee
  if (project.domain?.status === 'wanted' && project.domain.name && domainFee > 0) {
    lines.push({ label: 'Nom de domaine', detail: `${project.domain.name} — réservation et configuration`, amount: domainFee })
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const deposit = computeDeposit(total, rules)
  return { lines, total, deposit, balance: total - deposit, currency: rules.currency }
}

const MODULE_LABELS: Partial<Record<ModuleId, string>> = {
  cart: 'Panier', order: 'Commande en ligne', booking: 'Prise de rendez-vous',
  ordermodes: 'Modes de service', formulas: 'Formules', offers: 'Offres',
  venues: 'Établissements', allergens: 'Allergènes et nutrition', loyalty: 'Fidélité',
  finder: 'Recherche guidée', program: 'Programme détaillé', funding: 'Financement',
  quote: 'Formulaire de devis', gallery: 'Galerie', portfolio: 'Réalisations',
  products: 'Catalogue produits', menu: 'Menu', testimonials: 'Témoignages',
  faq: 'FAQ', pricing: 'Grille tarifaire', tv: 'Affichage TV', qrcode: 'QR Code',
  social: 'Réseaux sociaux', location: 'Localisation', hours: 'Horaires',
  categories: 'Catégories', services: 'Services', stats: 'Chiffres clés',
  process: 'Méthode', team: 'Équipe', logos: 'Références clients',
  beforeafter: 'Comparateur avant / après', banner: "Bandeau d'annonce",
  video: 'Vidéo', news: 'Actualités', events: 'Agenda', jobs: 'Recrutement',
  documents: 'Documents', certifications: 'Certifications et garanties',
  coverage: "Zone d'intervention", newsletter: "Lettre d'information",
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
