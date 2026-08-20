import type { DomainSource, Project } from './types'
import { getActivity } from './activities'
import { slugify } from './project'

/**
 * Nom de domaine (§59) : disponibilite et prix, via l'API GoDaddy.
 *
 *   GET https://api.godaddy.com/v3/domains/check-availability?domain=example.com
 *   Authorization: Bearer $GODADDY_PAT
 *
 * Trois modes, resolus a l'execution :
 *  - `proxy`      : VITE_DOMAIN_API_URL pointe un relais qui garde le PAT cote
 *                   serveur (`scripts/domain-proxy.mjs`). Mode recommande : la
 *                   cle ne descend jamais dans le navigateur, et le relais
 *                   regle au passage le probleme de CORS ;
 *  - `godaddy`    : appel direct avec VITE_GODADDY_PAT. Pratique pour essayer,
 *                   mais la cle finit dans le bundle : jamais en production ;
 *  - `simulation` : rien n'est configure. La verification est simulee et
 *                   annoncee comme telle a l'ecran, exactement comme le
 *                   paiement (§32).
 *
 * Regle §56 : cet ecran affiche des montants, il n'existe donc qu'apres la
 * revelation du prix.
 */

const GODADDY_ENDPOINT = 'https://api.godaddy.com/v3/domains/check-availability'

/** Extensions proposees par defaut, dans l'ordre d'affichage. */
export const DEFAULT_TLDS = ['fr', 'com', 'net', 'eu', 'shop', 'pro']

/** Nombre d'appels menes de front : l'API limite les rafales. */
const CONCURRENCY = 3

export type DomainApiMode = 'proxy' | 'godaddy' | 'simulation'

export interface DomainOffer {
  domain: string
  status: 'available' | 'taken' | 'error'
  /** Prix de la premiere periode, dans l'unite principale (11.99, pas 1199). */
  price: number | null
  /** Prix de renouvellement annonce pour la meme periode. */
  renewalPrice: number | null
  currency: string
  /** Duree couverte par `price`, en annees. */
  years: number
  source: DomainSource
  /** Renseigne uniquement quand `status === 'error'`. */
  error?: string
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function env(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function domainApiMode(): DomainApiMode {
  if (env('VITE_DOMAIN_API_URL')) return 'proxy'
  if (env('VITE_GODADDY_PAT')) return 'godaddy'
  return 'simulation'
}

/** Phrase affichee sous le champ de recherche : le client sait d'ou vient l'info. */
export function modeNote(mode: DomainApiMode = domainApiMode()): string {
  if (mode === 'simulation') {
    return "Vérification simulée : la clé GoDaddy n'est pas branchée. Les disponibilités et les prix affichés sont indicatifs."
  }
  return 'Disponibilités et tarifs fournis en direct par GoDaddy.'
}

// ---------------------------------------------------------------------------
// Nettoyage des noms
// ---------------------------------------------------------------------------

/** Partie gauche d'un domaine : ascii, minuscules, tirets, 63 caracteres max. */
export function domainLabel(input: string): string {
  return slugify(input.replace(/&/g, ' et ')).slice(0, 63).replace(/-+$/, '')
}

/** `  WWW.Mon-Site.FR/contact ` -> `mon-site.fr` */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .replace(/\.$/, '')
}

export function isValidDomain(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,24})+$/.test(value)
}

export function splitDomain(domain: string): { label: string; tld: string } {
  const at = domain.indexOf('.')
  return at < 0 ? { label: domain, tld: '' } : { label: domain.slice(0, at), tld: domain.slice(at + 1) }
}

/**
 * Liste de domaines a tester pour une saisie. Le client peut taper un nom seul
 * (« menuiserie durand ») ou un domaine complet (« menuiserie-durand.fr ») :
 * dans les deux cas on teste son extension si elle est explicite, puis les
 * extensions courantes.
 */
export function buildCandidates(input: string, tlds: string[] = DEFAULT_TLDS): string[] {
  const typed = normalizeDomain(input)
  const explicit = isValidDomain(typed) ? typed : ''
  const label = domainLabel(explicit ? splitDomain(explicit).label : typed)
  if (!label) return []

  const list = tlds.map((tld) => `${label}.${tld}`)
  if (explicit && !list.includes(explicit)) list.unshift(explicit)
  return list.slice(0, 8)
}

/** Nom propose au client : son enseigne, sinon son metier. */
export function suggestedLabel(project: Project): string {
  const fromName = domainLabel(project.identity.businessName)
  if (fromName) return fromName
  const activity = project.activityId ? getActivity(project.activityId) : undefined
  const fromActivity = domainLabel(project.customActivity || activity?.label || '')
  const city = domainLabel(project.identity.city)
  if (fromActivity && city) return `${fromActivity}-${city}`.slice(0, 63)
  return fromActivity
}

// ---------------------------------------------------------------------------
// Appel de l'API
// ---------------------------------------------------------------------------

/** Verifie un domaine. Leve en cas d'echec reseau ou de reponse refusee. */
export async function checkDomain(domain: string, signal?: AbortSignal): Promise<DomainOffer> {
  const name = normalizeDomain(domain)
  if (!isValidDomain(name)) throw new Error(`Nom de domaine invalide : ${domain}`)

  const mode = domainApiMode()
  if (mode === 'simulation') return simulateOffer(name)

  const base = mode === 'proxy' ? env('VITE_DOMAIN_API_URL') : env('VITE_GODADDY_API_URL') || GODADDY_ENDPOINT
  const url = `${base}${base.includes('?') ? '&' : '?'}domain=${encodeURIComponent(name)}`
  const headers: Record<string, string> = { accept: 'application/json' }
  if (mode === 'godaddy') headers.authorization = `Bearer ${env('VITE_GODADDY_PAT')}`

  const response = await fetch(url, { headers, signal })
  if (!response.ok) throw new Error(httpMessage(response.status))
  return parseCheckResponse(await response.json(), name)
}

/**
 * Verifie une liste de domaines. Un domaine qui echoue devient une offre en
 * erreur au lieu de faire tomber toute la recherche : une extension refusee ne
 * doit pas cacher les cinq autres reponses.
 */
export async function checkDomains(domains: string[], signal?: AbortSignal): Promise<DomainOffer[]> {
  const offers: DomainOffer[] = new Array(domains.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < domains.length) {
      const index = cursor
      cursor += 1
      try {
        offers[index] = await checkDomain(domains[index], signal)
      } catch (error) {
        offers[index] = errorOffer(normalizeDomain(domains[index]), message(error))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, domains.length) }, worker))
  return offers
}

/** Reponse GoDaddy -> offre. Fonction pure : c'est elle qui connait le contrat. */
export function parseCheckResponse(payload: unknown, fallbackDomain: string): DomainOffer {
  const data = (payload ?? {}) as { domain?: unknown; available?: unknown; prices?: unknown }
  const term = pickYearTerm(data.prices)
  return {
    domain: typeof data.domain === 'string' ? normalizeDomain(data.domain) : fallbackDomain,
    status: data.available === true ? 'available' : 'taken',
    price: term.price,
    renewalPrice: term.renewalPrice,
    currency: term.currency,
    years: term.years,
    source: 'godaddy',
  }
}

/**
 * `prices[]` liste les durees proposees. On retient la periode annuelle la plus
 * courte : c'est le prix d'appel que le client compare ailleurs.
 */
function pickYearTerm(prices: unknown): { price: number | null; renewalPrice: number | null; currency: string; years: number } {
  const empty = { price: null, renewalPrice: null, currency: 'EUR', years: 1 }
  if (!Array.isArray(prices)) return empty

  const years = prices
    .map((entry) => entry as { term?: unknown; period?: unknown; price?: unknown; renewalPrice?: unknown })
    .filter((entry) => String(entry.term ?? 'YEAR').toUpperCase() === 'YEAR')
    .sort((a, b) => Number(a.period ?? 1) - Number(b.period ?? 1))

  const best = years[0]
  if (!best) return empty

  const amount = money(best.price)
  const renewal = money(best.renewalPrice)
  return {
    price: amount.value,
    renewalPrice: renewal.value,
    currency: amount.currency ?? renewal.currency ?? 'EUR',
    years: Math.max(1, Number(best.period ?? 1) || 1),
  }
}

/** Les montants arrivent en unites mineures : 1199 USD = 11,99 $. */
function money(raw: unknown): { value: number | null; currency: string | null } {
  const entry = raw as { currencyCode?: unknown; value?: unknown } | null | undefined
  const value = Number(entry?.value)
  const currency = typeof entry?.currencyCode === 'string' ? entry.currencyCode.toUpperCase() : null
  if (!entry || !Number.isFinite(value)) return { value: null, currency }
  return { value: fromMinorUnits(value, currency ?? 'EUR'), currency }
}

/** Devises sans decimales : leur valeur mineure est deja la valeur affichee. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK'])

export function fromMinorUnits(value: number, currency: string): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(value) : Math.round(value) / 100
}

function httpMessage(status: number): string {
  if (status === 401 || status === 403) return "Clé GoDaddy refusée : la vérification n'est pas disponible."
  if (status === 404) return "Extension inconnue chez GoDaddy."
  if (status === 422) return 'Ce nom de domaine ne peut pas être vérifié.'
  if (status === 429) return 'Trop de vérifications à la suite. Réessayez dans un instant.'
  if (status >= 500) return 'GoDaddy ne répond pas pour le moment.'
  return `Vérification indisponible (HTTP ${status}).`
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Vérification impossible.'
}

function errorOffer(domain: string, error: string): DomainOffer {
  return { domain, status: 'error', price: null, renewalPrice: null, currency: 'EUR', years: 1, source: 'godaddy', error }
}

// ---------------------------------------------------------------------------
// Simulation (aucune cle configuree)
// ---------------------------------------------------------------------------

/** Tarifs indicatifs, en euros : premiere annee / renouvellement. */
const SIMULATED_PRICES: Record<string, [number, number]> = {
  fr: [9.99, 17.99],
  com: [11.99, 22.99],
  net: [13.99, 19.99],
  eu: [7.99, 14.99],
  shop: [3.99, 34.99],
  pro: [15.99, 25.99],
  be: [12.99, 19.99],
  ch: [14.99, 21.99],
  io: [39.99, 59.99],
  paris: [29.99, 39.99],
}

/** Noms toujours pris : ils rendraient la simulation absurde. */
const RESERVED = new Set(['example', 'test', 'google', 'apple', 'amazon', 'microsoft', 'facebook', 'site', 'web'])

/**
 * Disponibilite deterministe : le meme nom donne toujours la meme reponse,
 * sinon la page changerait d'avis d'un rendu a l'autre. Environ un nom sur
 * trois est annonce comme deja pris, pour que l'ecran reste realiste.
 */
export function simulateOffer(domain: string): DomainOffer {
  const { label, tld } = splitDomain(domain)
  const [price, renewalPrice] = SIMULATED_PRICES[tld] ?? [14.99, 24.99]
  const taken = RESERVED.has(label) || hash(domain) % 3 === 0
  return {
    domain,
    status: taken ? 'taken' : 'available',
    price: taken ? null : price,
    renewalPrice: taken ? null : renewalPrice,
    currency: 'EUR',
    years: 1,
    source: 'simulation',
  }
}

/** FNV-1a 32 bits : court, stable, suffisant pour repartir des disponibilites. */
function hash(value: string): number {
  let out = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    out ^= value.charCodeAt(i)
    out = Math.imul(out, 0x01000193) >>> 0
  }
  return out
}
