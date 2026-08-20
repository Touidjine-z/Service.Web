import type { Project } from '@/engine/types'

/**
 * Contenu d'exemple affiche tant que le client n'a rien saisi. Le but est que
 * la maquette soit immediatement credible (§54) : une grille vide donnerait
 * l'impression d'un site inacheve et casserait le moment de projection.
 */

export interface SampleItem {
  id: string
  name: string
  description: string
  price: number | null
  sample: true
}

function make(names: [string, string][], prefix: string): SampleItem[] {
  return names.map(([name, description], i) => ({
    id: `${prefix}_${i}`, name, description, price: null, sample: true,
  }))
}

export const SAMPLE_SERVICES = make([
  ['Première prestation', 'Décrivez ici ce que vous proposez et pour qui.'],
  ['Deuxième prestation', 'Un service complémentaire, expliqué en une phrase.'],
  ['Troisième prestation', 'Votre savoir-faire, présenté simplement.'],
], 'svc')

export const SAMPLE_PRODUCTS = make([
  ['Premier article', 'Une courte description qui donne envie.'],
  ['Deuxième article', 'Matières, format, ce qui le rend unique.'],
  ['Troisième article', 'Un incontournable de votre catalogue.'],
  ['Quatrième article', 'Ajoutez vos propres produits pour remplacer cet exemple.'],
], 'prd')

export const SAMPLE_WORKS = make([
  ['Projet récent', 'Le contexte, votre intervention, le résultat.'],
  ['Chantier terminé', 'Quelques lignes suffisent à rassurer un futur client.'],
  ['Réalisation phare', 'Mettez en avant ce dont vous êtes le plus fier.'],
], 'wrk')

/** Vrai contenu du client si present, exemples sinon. */
export function catalogItems(project: Project, kind: 'services' | 'products' | 'gallery' | 'portfolio') {
  if (kind === 'services') {
    return project.services.length
      ? project.services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: s.price, sample: false as const }))
      : SAMPLE_SERVICES
  }
  if (kind === 'products') {
    return project.products.length
      ? project.products.filter((p) => !p.hidden).map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price, sample: false as const }))
      : SAMPLE_PRODUCTS
  }
  if (project.gallery.length) {
    return project.gallery.map((g) => ({ id: g.id, name: g.title, description: g.description, price: null, sample: false as const }))
  }
  return SAMPLE_WORKS
}

export const CURRENCY_SYMBOL: Record<Project['currency'], string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: '$',
}

export function formatPrice(value: number | null, currency: Project['currency']): string {
  if (value === null) return ''
  const amount = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return currency === 'CHF' ? `${amount} CHF` : `${amount} ${CURRENCY_SYMBOL[currency]}`
}
