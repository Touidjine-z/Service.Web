import type { ProductTag } from './types'

/**
 * Vocabulaire du catalogue, partage par le builder et par le rendu du site.
 * Ce sont des donnees, pas du code metier : la restauration s'en sert beaucoup,
 * les autres metiers peuvent l'ignorer sans qu'aucune branche n'existe (§48).
 */

export const PRODUCT_TAGS: { id: ProductTag; label: string }[] = [
  { id: 'new', label: 'Nouveau' },
  { id: 'bestseller', label: 'Le plus commandé' },
  { id: 'promo', label: 'Offre' },
  { id: 'vegetarian', label: 'Végétarien' },
  { id: 'spicy', label: 'Épicé' },
]

export const PRODUCT_TAG_LABEL = Object.fromEntries(
  PRODUCT_TAGS.map((t) => [t.id, t.label]),
) as Record<ProductTag, string>

/**
 * Les quatorze allergenes a declaration obligatoire (reglement INCO 1169/2011).
 * Un restaurant doit pouvoir les cocher plat par plat.
 */
export const ALLERGENS = [
  'Gluten', 'Crustacés', 'Œufs', 'Poissons', 'Arachides', 'Soja', 'Lait',
  'Fruits à coque', 'Céleri', 'Moutarde', 'Sésame', 'Sulfites', 'Lupin', 'Mollusques',
]
