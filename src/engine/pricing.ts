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
  /**
   * Travail humain facture a l'unite AU-DELA du quota de la formule (§60).
   * Les quotas eux-memes vivent dans `plans.ts`, qui n'a pas le droit de
   * connaitre un montant.
   */
  servicePrices?: { writtenPage: number; stockImage: number }
  /** Tarif par formule (§60). ABSENT des regles enregistrees avant cette option. */
  plans?: Record<PlanId, PlanPricing>
}

/** Valeurs par defaut ; l'admin les remplacera via l'API de configuration. */
export const DEFAULT_PRICING_RULES: PricingRules = {
  basePrice: 400,
  includedPages: 5,
  pricePerExtraPage: 50,
  modulePrices: {
    cart: 240,
    order: 300,
    ordermodes: 140,
    formulas: 80,
    offers: 80,
    venues: 180,
    allergens: 80,
    loyalty: 120,
    finder: 160,
    program: 80,
    funding: 60,
    booking: 240,
    quote: 120,
    gallery: 80,
    portfolio: 120,
    products: 120,
    menu: 120,
    testimonials: 60,
    faq: 60,
    pricing: 60,
    tv: 100,
    qrcode: 100,
    social: 40,
    location: 60,
    hours: 40,
    categories: 60,
    about: 0,
    services: 80,
    contact: 0,
    stats: 60,
    process: 60,
    team: 80,
    logos: 60,
    beforeafter: 120,
    banner: 40,
    video: 120,
    news: 140,
    events: 120,
    jobs: 140,
    documents: 80,
    certifications: 80,
    coverage: 80,
    newsletter: 60,
  },
  catalogTiers: [
    { upTo: 20, price: 0 },
    { upTo: 60, price: 160 },
    { upTo: 150, price: 360 },
    { upTo: Number.POSITIVE_INFINITY, price: 640 },
  ],
  customThemeSurcharge: 160,
  domainSetupFee: 30,
  depositRate: 0.1,
  depositMinimum: 50,
  currency: 'EUR',
  servicePrices: { writtenPage: 60, stockImage: 15 },
  plans: {
    // Le modele : `includedPages` colle au plafond de la formule (6) et
    // `pricePerExtraPage` vaut 0, donc aucune ligne « pages supplementaires » ne
    // peut apparaitre sur un devis modele. Un module assemble sur un site type
    // coute la moitie d'un module construit — c'est la phrase a dire au client,
    // et elle est vraie.
    template: { basePrice: 550, includedPages: 6, pricePerExtraPage: 0, moduleRate: 0.5 },
    website: { basePrice: 1100, includedPages: 10, pricePerExtraPage: 90, moduleRate: 1 },
    // Le cle en main n'ouvre aucun logiciel de plus : sa base paie le travail
    // humain — redaction, images, liens entrants — que les quotas de `plans.ts`
    // decrivent. L'ecart de base est calibre pour que sa bande ne recouvre pas
    // celle du sur-mesure, meme sur un projet charge de modules.
    turnkey: { basePrice: 2800, includedPages: 20, pricePerExtraPage: 90, moduleRate: 1 },
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

/**
 * Famille d'une ligne de devis. Neuf lignes a la file se lisent mal : groupees,
 * elles disent ce que le client ACHETE et plus seulement ce qu'il paie. C'est le
 * moteur qui range, parce que c'est lui qui sait ce qu'est chaque ligne.
 */
export type PriceGroup = 'base' | 'features' | 'content' | 'human'

export const PRICE_GROUPS: { id: PriceGroup; label: string }[] = [
  { id: 'base', label: 'Votre formule' },
  { id: 'features', label: 'Fonctionnalités' },
  { id: 'content', label: 'Votre contenu' },
  { id: 'human', label: 'Notre travail' },
]

export interface PriceLine {
  label: string
  detail?: string
  amount: number
  /** Absente sur les devis calcules avant le regroupement : traitee comme 'base'. */
  group?: PriceGroup
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

  lines.push({ label: plan.label, detail: `Base, ${p.includedPages} pages incluses`, amount: p.basePrice, group: 'base' })

  const extraPages = Math.max(0, project.pages.length - p.includedPages)
  if (extraPages > 0 && p.pricePerExtraPage > 0) {
    lines.push({
      label: 'Pages supplémentaires',
      detail: `${extraPages} × ${p.pricePerExtraPage} ${rules.currency === 'EUR' ? '€' : rules.currency}`,
      amount: extraPages * p.pricePerExtraPage,
      group: 'base',
    })
  }

  for (const moduleId of project.modules) {
    const price = Math.round((rules.modulePrices[moduleId] ?? 0) * p.moduleRate)
    if (price > 0) {
      lines.push({ label: moduleLabel(moduleId), amount: price, group: 'features' })
    }
  }

  const catalogSize = project.products.length + project.services.length + project.gallery.length
  const tier = rules.catalogTiers.find((t) => catalogSize <= t.upTo)
  if (tier && tier.price > 0) {
    lines.push({ label: 'Intégration du catalogue', detail: `${catalogSize} éléments`, amount: tier.price, group: 'content' })
  }

  // Travail humain (§60). Le quota de la formule est inclus ; on ne facture que
  // ce qui le depasse, et seulement ce que le projet demande reellement — le
  // nombre de pages ecrites, le nombre d'images distinctes a acheter.
  const services = plan.services
  const prices = rules.servicePrices ?? DEFAULT_PRICING_RULES.servicePrices!

  const extraPagesToWrite = Math.max(0, project.pages.length - services.writtenPages)
  if (extraPagesToWrite > 0 && prices.writtenPage > 0) {
    lines.push({
      label: 'Rédaction de pages',
      detail: `${extraPagesToWrite} au-delà des ${services.writtenPages} incluses`,
      amount: extraPagesToWrite * prices.writtenPage,
      group: 'human',
    })
  }

  const extraImages = Math.max(0, illustrationCount(project) - services.stockImages)
  if (extraImages > 0 && prices.stockImage > 0) {
    lines.push({
      label: "Images d'illustration",
      detail: `${extraImages} au-delà des ${services.stockImages} incluses`,
      amount: extraImages * prices.stockImage,
      group: 'human',
    })
  }

  if (project.themeId === 'custom') {
    lines.push({ label: 'Design sur mesure', amount: rules.customThemeSurcharge, group: 'human' })
  }

  // Nom de domaine (§59). Seul notre travail — reservation, configuration DNS,
  // certificat — entre dans le devis. Le prix du domaine lui-meme reste chez le
  // registrar, dans SA devise : le melanger au total le fausserait.
  // `?? DEFAULT` : les regles enregistrees avant cette option n'ont pas le champ.
  const domainFee = rules.domainSetupFee ?? DEFAULT_PRICING_RULES.domainSetupFee
  if (project.domain?.status === 'wanted' && project.domain.name && domainFee > 0) {
    lines.push({ label: 'Nom de domaine', detail: `${project.domain.name} — réservation et configuration`, amount: domainFee, group: 'human' })
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const deposit = computeDeposit(total, rules)
  return { lines, total, deposit, balance: total - deposit, currency: rules.currency }
}

/** Devis range par famille, dans l'ordre de PRICE_GROUPS, sans famille vide. */
export function groupQuote(quote: Quote): { id: PriceGroup; label: string; lines: PriceLine[]; subtotal: number }[] {
  return PRICE_GROUPS
    .map((g) => {
      const lines = quote.lines.filter((l) => (l.group ?? 'base') === g.id)
      return { ...g, lines, subtotal: lines.reduce((sum, l) => sum + l.amount, 0) }
    })
    .filter((g) => g.lines.length > 0)
}

/**
 * Images d'illustration que le projet demande reellement. On compte des URL
 * DISTINCTES : une meme photo posee sur deux pages ne s'achete qu'une fois.
 */
function illustrationCount(project: Project): number {
  const used = new Set<string>()
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) used.add(value)
  }

  add(project.identity.logoUrl)
  project.gallery.forEach((item) => add(item.imageUrl))
  project.products.forEach((item) => add(item.imageUrl))
  project.services.forEach((item) => add(item.imageUrl))
  for (const page of project.pages) {
    for (const section of page.sections) {
      add(section.props.imageUrl)
      for (const block of section.blocks ?? []) add(block.props.imageUrl)
    }
  }
  return used.size
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
