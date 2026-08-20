import type { Project, ProductTag } from '@/engine/types'
import { getActivity } from '@/engine/activities'

/**
 * Contenu d'exemple affiche tant que le client n'a rien saisi. Le but est que
 * la maquette soit immediatement credible (§54) : une grille vide donnerait
 * l'impression d'un site inacheve et casserait le moment de projection.
 *
 * Le jeu d'exemples suit le `catalogKind` de l'activite : un restaurant voit
 * une carte, un artisan voit des prestations. C'est une donnee du catalogue
 * metier, pas une branche de code par metier (§48).
 */

/** Element de catalogue rendu par les sections : vrai contenu ou exemple. */
export interface CatalogEntry {
  id: string
  name: string
  description: string
  price: number | null
  imageUrl: string | null
  sample: boolean
  /** Nom de la categorie, quand le catalogue en definit. */
  category?: string
  /** Champs de restauration, facultatifs partout ailleurs. */
  oldPrice?: number | null
  tags?: ProductTag[]
  kcal?: number | null
  allergens?: string[]
}

function make(names: [string, string][], prefix: string): CatalogEntry[] {
  return names.map(([name, description], i) => ({
    id: `${prefix}_${i}`, name, description, price: null, imageUrl: null, sample: true,
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

/** Galerie d'exemple pour la restauration : la salle, la cuisine, l'assiette. */
export const SAMPLE_SCENES = make([
  ['Salle et terrasse', "L'ambiance de votre établissement, en une photo."],
  ['En cuisine', 'Vos produits, vos gestes, votre équipe.'],
  ['Nos assiettes', 'Une photo par plat signature suffit.'],
], 'scn')

/**
 * Carte d'exemple pour la restauration : prix, calories, allergenes et
 * pastilles sont remplis, parce que c'est exactement ce qu'affichent les sites
 * des enseignes et que la maquette doit en donner l'impression des la premiere
 * seconde. Tout disparait au premier plat ajoute par le client.
 */
export const SAMPLE_MENU: CatalogEntry[] = [
  {
    id: 'menu_0', name: 'Le Signature', description: 'Bœuf français, cheddar affiné, oignons confits, sauce maison.',
    price: 11.9, imageUrl: null, sample: true, category: 'Burgers', tags: ['bestseller'], kcal: 780,
    allergens: ['Gluten', 'Lait', 'Œufs', 'Moutarde'],
  },
  {
    id: 'menu_1', name: 'Le Poulet croustillant', description: 'Filet pané, salade croquante, sauce fromagère.',
    price: 10.5, imageUrl: null, sample: true, category: 'Burgers', tags: ['new'], kcal: 690,
    allergens: ['Gluten', 'Lait'],
  },
  {
    id: 'menu_2', name: 'Le Végétal', description: 'Galette de légumes, cheddar végétal, tomate fraîche.',
    price: 9.9, imageUrl: null, sample: true, category: 'Burgers', tags: ['vegetarian'], kcal: 540,
    allergens: ['Gluten', 'Soja'],
  },
  {
    id: 'menu_3', name: 'Le Braise', description: 'Double steak, bacon, sauce piquante, jalapeños.',
    price: 13.5, oldPrice: 15.9, imageUrl: null, sample: true, category: 'Burgers', tags: ['spicy', 'promo'], kcal: 910,
    allergens: ['Gluten', 'Lait', 'Moutarde'],
  },
  {
    id: 'menu_4', name: 'Frites maison', description: 'Pommes de terre fraîches, coupées et cuites sur place.',
    price: 3.5, imageUrl: null, sample: true, category: 'Accompagnements', kcal: 320, allergens: [],
  },
  {
    id: 'menu_5', name: 'Tiramisu du jour', description: 'Préparé chaque matin en cuisine.',
    price: 4.5, imageUrl: null, sample: true, category: 'Desserts', kcal: 380, allergens: ['Gluten', 'Lait', 'Œufs'],
  },
  {
    id: 'menu_6', name: 'Limonade artisanale', description: 'Pressée en Provence, peu sucrée.',
    price: 3.5, imageUrl: null, sample: true, category: 'Boissons', kcal: 90, allergens: [],
  },
  {
    id: 'menu_7', name: 'Café de spécialité', description: 'Torréfaction française, servi en salle ou à emporter.',
    price: 2.2, imageUrl: null, sample: true, category: 'Boissons', kcal: 5, allergens: [],
  },
]

/**
 * Catalogue d'exemple ecrit pour le metier, quand il en declare un. C'est ce qui
 * fait qu'un garage voit « Vidange et filtres » la ou un metier sans catalogue
 * propre voit « Premiere prestation » : la maquette est credible des la premiere
 * seconde (§54). Jamais de prix : ils appartiennent au client.
 */
function activitySamples(project: Project, kind: 'services' | 'products'): CatalogEntry[] | null {
  const activity = project.activityId ? getActivity(project.activityId) : null
  if (!activity?.sampleCatalog?.length) return null
  // Un metier de prestations remplit la grille des services, un metier de
  // catalogue remplit celle des produits.
  const wanted = activity.catalogKind === 'products' ? 'products' : 'services'
  if (wanted !== kind) return null
  return activity.sampleCatalog.map(([name, description], i) => ({
    id: `smp_${activity.id}_${i}`, name, description, price: null, imageUrl: null, sample: true,
  }))
}

/** Exemples de catalogue adaptes au metier choisi. */
function sampleProducts(project: Project): CatalogEntry[] {
  const activity = project.activityId ? getActivity(project.activityId) : null
  return activity?.catalogKind === 'menu' ? SAMPLE_MENU : SAMPLE_PRODUCTS
}

/** Vrai contenu du client si present, exemples sinon. */
export function catalogItems(project: Project, kind: 'services' | 'products' | 'gallery' | 'portfolio'): CatalogEntry[] {
  if (kind === 'services') {
    return project.services.length
      ? project.services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: s.price, imageUrl: s.imageUrl, sample: false }))
      : activitySamples(project, 'services') ?? SAMPLE_SERVICES
  }
  if (kind === 'products') {
    if (!project.products.length) return activitySamples(project, 'products') ?? sampleProducts(project)
    const categoryName = new Map(project.categories.map((c) => [c.id, c.name]))
    return project.products.filter((p) => !p.hidden).map((p) => ({
      id: p.id, name: p.name, description: p.description, price: p.price, imageUrl: p.imageUrl, sample: false,
      category: p.categoryId ? categoryName.get(p.categoryId) : undefined,
      oldPrice: p.oldPrice ?? null, tags: p.tags, kcal: p.kcal ?? null, allergens: p.allergens,
    }))
  }
  if (project.gallery.length) {
    return project.gallery.map((g) => ({ id: g.id, name: g.title, description: g.description, price: null, imageUrl: g.imageUrl || null, sample: false }))
  }
  return sampleProducts(project) === SAMPLE_MENU ? SAMPLE_SCENES : SAMPLE_WORKS
}

/**
 * Regroupement par categorie, dans l'ordre d'apparition. Les elements sans
 * categorie forment un dernier groupe sans titre : rien ne doit disparaitre de
 * la carte parce qu'un plat n'a pas ete range.
 */
export function groupByCategory(items: CatalogEntry[]): { name: string; items: CatalogEntry[] }[] {
  const order: string[] = []
  const groups = new Map<string, CatalogEntry[]>()
  for (const item of items) {
    const name = item.category?.trim() || ''
    if (!groups.has(name)) { groups.set(name, []); order.push(name) }
    groups.get(name)?.push(item)
  }
  // Le groupe sans titre passe en dernier.
  return order
    .sort((a, b) => (a === '' ? 1 : 0) - (b === '' ? 1 : 0))
    .map((name) => ({ name, items: groups.get(name) ?? [] }))
}

export const CURRENCY_SYMBOL: Record<Project['currency'], string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: '$',
}

/** Separateur decimal francais pour les devises ecrites a la francaise. */
const COMMA_DECIMAL = new Set<Project['currency']>(['EUR', 'CHF'])

export function formatPrice(value: number | null, currency: Project['currency']): string {
  if (value === null) return ''
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(2)
  const amount = COMMA_DECIMAL.has(currency) ? fixed.replace('.', ',') : fixed
  return currency === 'CHF' ? `${amount} CHF` : `${amount} ${CURRENCY_SYMBOL[currency]}`
}
