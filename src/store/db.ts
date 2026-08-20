import Dexie, { type Table } from 'dexie'
import type { Project, Lead, Order, Payment } from '@/engine/types'
import type { PricingRules } from '@/engine/pricing'

/**
 * Persistance locale. Le client construit gratuitement, sans compte ni
 * paiement (§27) ; l'email n'est demande qu'a la sauvegarde definitive.
 * Le backend viendra doubler ce store, il n'a pas a le remplacer.
 */

export interface StoredProject {
  id: string
  updatedAt: string
  data: Project
}

export interface ProjectVersion {
  id?: number
  projectId: string
  createdAt: string
  label: string
  data: Project
}

export interface StoredLead extends Lead {
  id?: number
  projectId: string
}

/** Reglages d'administration, stockes par cle (§38). */
export interface Setting {
  key: string
  value: unknown
}

/** Historique des changements de tarification (§38). */
export interface PricingChange {
  id?: number
  changedAt: string
  field: string
  before: number | null
  after: number | null
}

class ServiceWebDB extends Dexie {
  projects!: Table<StoredProject, string>
  versions!: Table<ProjectVersion, number>
  leads!: Table<StoredLead, number>
  payments!: Table<Payment, string>
  orders!: Table<Order, string>
  settings!: Table<Setting, string>
  pricingHistory!: Table<PricingChange, number>

  constructor() {
    super('service-web')
    this.version(1).stores({
      projects: 'id, updatedAt',
      versions: '++id, projectId, createdAt',
      leads: '++id, projectId, email',
    })
    // v2 : paiements (§32) et commandes passees sur le site du client.
    this.version(2).stores({
      projects: 'id, updatedAt',
      versions: '++id, projectId, createdAt',
      leads: '++id, projectId, email',
      payments: 'id, projectId, status, createdAt',
      orders: 'id, projectId, status, createdAt',
    })
    // v3 : administration des prix.
    this.version(3).stores({
      projects: 'id, updatedAt',
      versions: '++id, projectId, createdAt',
      leads: '++id, projectId, email',
      payments: 'id, projectId, status, createdAt',
      orders: 'id, projectId, status, createdAt',
      settings: 'key',
      pricingHistory: '++id, changedAt',
    })
  }
}

export const db = new ServiceWebDB()

export async function saveProject(project: Project): Promise<void> {
  await db.projects.put({ id: project.id, updatedAt: project.updatedAt, data: project })
}

export async function loadProject(id: string): Promise<Project | null> {
  const row = await db.projects.get(id)
  return row?.data ?? null
}

export async function loadLatestProject(): Promise<Project | null> {
  const rows = await db.projects.orderBy('updatedAt').reverse().limit(1).toArray()
  return rows[0]?.data ?? null
}

export async function listProjects(): Promise<StoredProject[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

/** Versioning (§45) : instantane manuel restaurable. */
export async function snapshotVersion(project: Project, label: string): Promise<void> {
  await db.versions.add({ projectId: project.id, createdAt: new Date().toISOString(), label, data: project })
}

export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  return db.versions.where('projectId').equals(projectId).reverse().toArray()
}

export async function saveLead(projectId: string, lead: Lead): Promise<void> {
  // Un projet = un lead (§36) : on remplace au lieu d'empiler les doublons.
  const existing = await db.leads.where('projectId').equals(projectId).primaryKeys()
  if (existing.length) await db.leads.bulkDelete(existing as number[])
  await db.leads.add({ ...lead, projectId })
}

export async function listLeads(): Promise<StoredLead[]> {
  return db.leads.toArray()
}

export async function savePayment(payment: Payment): Promise<void> {
  await db.payments.put(payment)
}

export async function listPayments(): Promise<Payment[]> {
  return db.payments.orderBy('createdAt').reverse().toArray()
}

export async function paymentsForProject(projectId: string): Promise<Payment[]> {
  return db.payments.where('projectId').equals(projectId).toArray()
}

export async function saveOrder(order: Order): Promise<void> {
  await db.orders.put(order)
}

export async function listOrders(projectId?: string): Promise<Order[]> {
  if (projectId) return db.orders.where('projectId').equals(projectId).toArray()
  return db.orders.orderBy('createdAt').reverse().toArray()
}

export async function deleteVersion(id: number): Promise<void> {
  await db.versions.delete(id)
}

const PRICING_KEY = 'pricingRules'

/** Regles de tarification en vigueur ; les defauts servent de repli (§38). */
export async function loadPricingRules(): Promise<PricingRules | null> {
  const row = await db.settings.get(PRICING_KEY)
  return (row?.value as PricingRules) ?? null
}

export async function savePricingRules(rules: PricingRules, changes: Omit<PricingChange, 'id'>[] = []): Promise<void> {
  await db.settings.put({ key: PRICING_KEY, value: rules })
  if (changes.length) await db.pricingHistory.bulkAdd(changes)
}

export async function listPricingHistory(): Promise<PricingChange[]> {
  return db.pricingHistory.orderBy('changedAt').reverse().toArray()
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id)
}
