import type { Payment, Project, ProjectStatus } from '@/engine/types'
import { computeQuote, type PricingRules, type Quote } from '@/engine/pricing'
import { getActivity } from '@/engine/activities'
import { planDefOf } from '@/engine/plans'
import { listPayments, listProjects, loadPricingRules, type StoredLead, listLeads } from '@/store/db'
import { DEFAULT_PRICING_RULES } from '@/engine/pricing'

/**
 * Vue administrateur : agrege ce que le client a construit, son devis et ses
 * paiements. Le devis est recalcule avec les regles EN VIGUEUR, pas avec celles
 * du jour de la creation — l'administration doit voir le prix courant.
 */
export interface AdminRow {
  project: Project
  quote: Quote
  payments: Payment[]
  paid: number
  activityLabel: string
  planLabel: string
  clientName: string
  updatedAt: string
}

export interface AdminData {
  rows: AdminRow[]
  leads: StoredLead[]
  payments: Payment[]
  rules: PricingRules
}

export function activityLabelOf(project: Project): string {
  if (project.activityId === 'custom') return project.customActivity || 'Autre activité'
  return getActivity(project.activityId)?.label ?? '—'
}

/**
 * Formule du projet (§60). Un projet enregistre AVANT les formules n'a pas de
 * champ `plan` : le moteur le sert en sur-mesure, mais son client n'a jamais
 * choisi. On le dit, sinon l'administration lit un choix la ou il n'y a qu'un
 * repli — et croit a tort que la formule haute a ete preferee a la basse.
 */
export function planLabelOf(project: Project): string {
  const { label } = planDefOf(project)
  return project.plan ? label : `${label} (avant les formules)`
}

export function clientNameOf(project: Project): string {
  const lead = project.lead
  if (lead) return `${lead.firstName} ${lead.lastName}`.trim()
  return '—'
}

export async function loadAdminData(): Promise<AdminData> {
  const [stored, payments, leads, rules] = await Promise.all([
    listProjects(),
    listPayments(),
    listLeads(),
    loadPricingRules(),
  ])
  const effective = rules ?? DEFAULT_PRICING_RULES

  const rows: AdminRow[] = stored.map((row) => {
    const project = row.data
    const own = payments.filter((p) => p.projectId === project.id)
    return {
      project,
      quote: computeQuote(project, effective),
      payments: own,
      paid: own.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.deposit, 0),
      activityLabel: activityLabelOf(project),
      planLabel: planLabelOf(project),
      clientName: clientNameOf(project),
      updatedAt: row.updatedAt,
    }
  })

  return { rows, leads, payments, rules: effective }
}

/** Filtres du dashboard (§33), exprimes en statuts (§34). */
export const PROJECT_FILTERS: { id: string; label: string; statuses: ProjectStatus[] | null }[] = [
  { id: 'all', label: 'Tous', statuses: null },
  { id: 'new', label: 'Nouveaux', statuses: ['draft'] },
  { id: 'saved', label: 'Sauvegardés', statuses: ['saved'] },
  { id: 'pending', label: 'Paiement en attente', statuses: ['requested', 'payment-pending'] },
  { id: 'paid', label: 'Acompte payé', statuses: ['deposit-paid', 'client-contacted', 'quote-confirmed'] },
  { id: 'dev', label: 'En développement', statuses: ['preparing', 'developing', 'reviewing'] },
  { id: 'done', label: 'Terminés', statuses: ['delivered', 'done'] },
]

export function matchesFilter(row: AdminRow, filterId: string): boolean {
  const filter = PROJECT_FILTERS.find((f) => f.id === filterId)
  if (!filter || !filter.statuses) return true
  return filter.statuses.includes(row.project.status)
}

export function matchesSearch(row: AdminRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    row.clientName,
    row.project.identity.businessName,
    row.project.lead?.email ?? '',
    row.project.lead?.phone ?? '',
    row.project.identity.city,
    row.activityLabel,
    row.planLabel,
  ].join(' ').toLowerCase()
  return haystack.includes(q)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
