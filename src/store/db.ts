import Dexie, { type Table } from 'dexie'
import type { Project, Lead } from '@/engine/types'

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

class ServiceWebDB extends Dexie {
  projects!: Table<StoredProject, string>
  versions!: Table<ProjectVersion, number>
  leads!: Table<StoredLead, number>

  constructor() {
    super('service-web')
    this.version(1).stores({
      projects: 'id, updatedAt',
      versions: '++id, projectId, createdAt',
      leads: '++id, projectId, email',
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
  await db.leads.add({ ...lead, projectId })
}
