import type { ProjectStatus } from './types'

/**
 * Cycle de vie d'un projet (§34). L'ordre du tableau est l'ordre reel des
 * etapes : l'administration propose « passer a l'etape suivante » a partir de
 * cet ordre, sans logique en dur dans les composants.
 */
export interface StatusDef {
  id: ProjectStatus
  label: string
  /** Regroupement utilise par les filtres du dashboard (§33). */
  group: 'creation' | 'conversion' | 'production' | 'closed'
}

export const STATUSES: StatusDef[] = [
  { id: 'draft', label: 'Brouillon', group: 'creation' },
  { id: 'saved', label: 'Projet sauvegardé', group: 'creation' },
  { id: 'requested', label: 'Demande de réalisation', group: 'conversion' },
  { id: 'payment-pending', label: 'Paiement en attente', group: 'conversion' },
  { id: 'deposit-paid', label: 'Acompte payé', group: 'conversion' },
  { id: 'client-contacted', label: 'Contact client', group: 'production' },
  { id: 'quote-confirmed', label: 'Devis confirmé', group: 'production' },
  { id: 'preparing', label: 'En préparation', group: 'production' },
  { id: 'developing', label: 'En développement', group: 'production' },
  { id: 'reviewing', label: 'En validation', group: 'production' },
  { id: 'delivered', label: 'Livré', group: 'closed' },
  { id: 'done', label: 'Terminé', group: 'closed' },
]

export const STATUS_BY_ID = new Map<ProjectStatus, StatusDef>(STATUSES.map((s) => [s.id, s]))

export function statusLabel(id: ProjectStatus): string {
  return STATUS_BY_ID.get(id)?.label ?? id
}

export function statusIndex(id: ProjectStatus): number {
  return STATUSES.findIndex((s) => s.id === id)
}

export function nextStatus(id: ProjectStatus): ProjectStatus | null {
  const i = statusIndex(id)
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1].id : null
}

/** Un projet est-il deja arrive au moins jusqu'a ce statut ? */
export function hasReached(current: ProjectStatus, target: ProjectStatus): boolean {
  return statusIndex(current) >= statusIndex(target)
}
