import type { Order, OrderLine, Product, Project } from '@/engine/types'
import { resolveProps } from './sectionDefs'

/**
 * Panier du site du client (modules `cart` / `order`). Le panier vit dans le
 * mode visiteur : c'est le futur visiteur du client qui commande, pas le
 * professionnel en train de construire son site.
 */

export interface CartLine extends OrderLine {
  key: string
}

export function lineKey(productId: string, variant: string | null): string {
  return `${productId}::${variant ?? ''}`
}

export function addLine(lines: CartLine[], product: Product, variant: string | null): CartLine[] {
  const key = lineKey(product.id, variant)
  const existing = lines.find((l) => l.key === key)
  if (existing) {
    return lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l))
  }
  const unitPrice = variant
    ? product.variants.find((v) => v.name === variant)?.price ?? product.price
    : product.price
  return [...lines, { key, productId: product.id, name: product.name, variant, unitPrice, quantity: 1 }]
}

export function setQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((l) => l.key !== key)
  return lines.map((l) => (l.key === key ? { ...l, quantity } : l))
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.quantity, 0)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}

/** Toutes les lignes ont-elles un prix ? Sinon la commande vaut demande de devis. */
export function isPriced(lines: CartLine[]): boolean {
  return lines.length > 0 && lines.every((l) => l.unitPrice !== null)
}

/**
 * Modes de service proposes par le site du client (livraison, a emporter, sur
 * place...). Ils sont lus dans la section « Modes de service » telle que le
 * client l'a reglee : le tunnel de commande ne reinvente aucun libelle.
 */
export function serviceModes(project: Project): string[] {
  if (!project.modules.includes('ordermodes')) return []
  for (const page of project.pages) {
    for (const section of page.sections) {
      if (section.kind !== 'ordermodes' || section.hidden) continue
      const items = resolveProps(section, project).items
      if (!Array.isArray(items)) continue
      const names = items
        .map((item) => String((item as Record<string, unknown>).name ?? '').trim())
        .filter(Boolean)
      if (names.length) return names
    }
  }
  return []
}

export function buildOrder(
  project: Project,
  lines: CartLine[],
  customer: Order['customer'],
  id: string,
  service = '',
  slot = '',
): Order {
  return {
    id,
    projectId: project.id,
    createdAt: new Date().toISOString(),
    customer,
    ...(service ? { service } : {}),
    ...(slot ? { slot } : {}),
    lines: lines.map(({ key: _key, ...line }) => line),
    total: cartTotal(lines),
    currency: project.currency,
    status: 'new',
  }
}

/** Le site accepte-t-il les commandes ? */
export function commerceEnabled(project: Project): boolean {
  return project.modules.includes('cart') || project.modules.includes('order')
}
