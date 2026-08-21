import type {
  Activity, Block, BlockSeed, ColorScheme, Identity, Page, Project, Section, SectionKind, ModuleId,
} from './types'
import { getActivity, CUSTOM_ACTIVITY } from './activities'
import { getTheme } from './themes'
import {
  isSectionAvailable, MODULE_BY_ID, modulesForObjectives,
  OBJECTIVE_GOVERNED_MODULES, orderModules,
} from './modules'
import { allowedModules, getPlan, planLimits, DEFAULT_PLAN_ID } from './plans'

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

const EMPTY_IDENTITY: Identity = {
  businessName: '',
  tagline: '',
  logoUrl: null,
  faviconUrl: null,
  phone: '',
  email: '',
  address: '',
  city: '',
  serviceArea: '',
  hours: [
    { day: 'lun', closed: false, open: '09:00', close: '18:00' },
    { day: 'mar', closed: false, open: '09:00', close: '18:00' },
    { day: 'mer', closed: false, open: '09:00', close: '18:00' },
    { day: 'jeu', closed: false, open: '09:00', close: '18:00' },
    { day: 'ven', closed: false, open: '09:00', close: '18:00' },
    { day: 'sam', closed: false, open: '09:00', close: '12:00' },
    { day: 'dim', closed: true, open: '09:00', close: '18:00' },
  ],
  social: {},
}

export function createBlock(seed: BlockSeed): Block {
  const block: Block = { id: uid('blk'), type: seed.type, props: { ...seed.props } }
  // Une variante peut livrer une mise en page toute faite sur la grille fluide.
  if (seed.layout) block.layout = { ...seed.layout }
  return block
}

/**
 * Cree une section. La graine vient d'une variante du catalogue (§14) : elle
 * ne fait que pre-remplir des champs declares et des blocs, jamais du style.
 */
export function createSection(
  kind: SectionKind,
  seed?: { props?: Record<string, unknown>; blocks?: BlockSeed[] },
): Section {
  const section: Section = { id: uid('sec'), kind, props: { ...seed?.props } }
  if (seed?.blocks) section.blocks = seed.blocks.map(createBlock)
  return section
}

export function createEmptyProject(): Project {
  const theme = getTheme('modern')
  return {
    id: uid('proj'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityId: null,
    customActivity: '',
    objectives: [],
    modules: [],
    themeId: theme.id,
    colors: { ...theme.colors },
    fontPair: 'default',
    identity: { ...EMPTY_IDENTITY, hours: EMPTY_IDENTITY.hours.map((h) => ({ ...h })) },
    pages: [],
    categories: [],
    products: [],
    services: [],
    gallery: [],
    currency: 'EUR',
    showPrices: true,
    grid: { columns: 3, cardSize: 'md', imageRatio: 'landscape', gap: 'normal', align: 'left' },
    step: 'activity',
    plan: DEFAULT_PLAN_ID,
    priceRevealed: false,
    domain: null,
    status: 'draft',
    lead: null,
  }
}

/** Construit les pages a partir du squelette du metier, en filtrant les sections
 *  dont le module n'est pas actif. */
export function buildPages(activity: Activity, modules: ModuleId[]): Page[] {
  return activity.defaultPages.map((blueprint, index) => ({
    id: uid('page'),
    name: blueprint.name,
    slug: blueprint.slug,
    isHome: index === 0,
    sections: blueprint.sections
      .filter((kind) => isSectionAvailable(kind, modules))
      .map((kind) => createSection(kind)),
    seo: { title: blueprint.name, description: '' },
  }))
}

/**
 * Recalcule les modules apres un changement d'objectifs (§7 → §8).
 * Les modules debloques par les objectifs retenus sont actives ; ceux qui ne
 * sont plus justifies par aucun objectif sont retires, sauf les modules
 * structurels.
 */
export function applyObjectives(project: Project, objectives: Project['objectives']): Project {
  // La formule (§60) plafonne ce que les objectifs peuvent activer. Sans cette
  // ligne, cocher « recevoir des commandes » en formule modele ferait apparaitre
  // un panier que `enforcePlan` retirerait juste apres : le projet battrait.
  const wanted = allowedModules(getPlan(project), modulesForObjectives(objectives))
  // Un module qu'aucun objectif ne pilote (les horaires, par exemple) a ete
  // choisi par le metier ou par le client : les objectifs n'ont pas a le retirer.
  const kept = project.modules.filter((m) => !OBJECTIVE_GOVERNED_MODULES.has(m) || wanted.includes(m))
  const modules = orderModules([...kept, ...wanted])
  const added = modules.filter((m) => !project.modules.includes(m))
  const next = syncPagesWithModules({ ...project, objectives, modules })
  return addSectionsForModules(next, added)
}

/** Applique le choix du metier : objectifs suggeres, modules et pages par defaut. */
export function applyActivity(project: Project, activityId: string, customLabel = ''): Project {
  const activity = activityId === 'custom' ? CUSTOM_ACTIVITY : getActivity(activityId)
  if (!activity) return project
  const modules = allowedModules(getPlan(project), [...activity.defaultModules])
  const base: Project = {
    ...project,
    activityId: activity.id,
    customActivity: activityId === 'custom' ? customLabel : '',
    objectives: [...activity.suggestedObjectives],
    modules,
    pages: buildPages(activity, modules),
  }
  // Les objectifs suggeres doivent reellement activer leurs modules (§7 → §8) :
  // sans ce passage, un metier pouvait proposer « recevoir des commandes » sans
  // que le panier soit actif.
  return applyObjectives(base, base.objectives)
}

/** Change de theme sans ecraser les couleurs deja personnalisees par le client. */
export function applyTheme(project: Project, themeId: Project['themeId'], keepColors: boolean): Project {
  const theme = getTheme(themeId)
  return {
    ...project,
    themeId,
    colors: keepColors ? project.colors : { ...theme.colors },
  }
}

/** Retire des pages les sections dont le module n'est plus actif. */
export function syncPagesWithModules(project: Project): Project {
  const pages = project.pages.map((page) => ({
    ...page,
    sections: page.sections.filter((s) => isSectionAvailable(s.kind, project.modules)),
  }))
  return { ...project, pages }
}

/**
 * Projette le projet dans les limites de sa formule (§60). Pure et IDEMPOTENTE.
 *
 * NON DESTRUCTIVE, et c'est tout l'arbitrage : elle ne touche qu'aux MODULES et
 * au theme « custom ». Elle ne supprime jamais une page ni un produit — c'est du
 * contenu redige, et `Page` n'a pas de champ `hidden` pour le mettre de cote.
 * Les plafonds sont tenus ailleurs, par des gardes sur les actions d'ajout.
 */
export function enforcePlan(project: Project): Project {
  const limits = planLimits(project)
  const modules = project.modules.filter((m) => !limits.blockedModules.includes(m))
  const themeId = project.themeId === 'custom' && !limits.customTheme ? 'modern' : project.themeId
  // Cas de tres loin le plus frequent (sur-mesure, et tous les projets d'avant
  // les formules) : identite stricte, cout nul, et l'historique undo/redo
  // continue de voir un etat inchange.
  if (modules.length === project.modules.length && themeId === project.themeId) return project
  return syncPagesWithModules({ ...project, modules, themeId })
}

/**
 * Changement explicite de formule. Seul endroit autorise a retirer une page — et
 * uniquement une page NON-ACCUEIL devenue vide parce que tous ses modules
 * viennent d'etre fermes (la page « Reserver » d'un restaurant). Ces pages sont
 * NOMMEES dans la confirmation avant d'etre retirees, jamais en silence.
 */
export function applyPlan(project: Project, plan: Project['plan']): Project {
  const next = enforcePlan({ ...project, plan })
  // Une page deja vide AVANT le changement n'a pas ete videe par lui : elle
  // reste. Sans cette comparaison, une simple montee en gamme — qui promet de
  // ne rien retirer — emporterait la page blanche que le client venait de creer.
  const emptied = new Set(
    project.pages.filter((p) => !p.isHome && p.sections.length > 0).map((p) => p.id),
  )
  return { ...next, pages: next.pages.filter((p) => p.sections.length > 0 || !emptied.has(p.id)) }
}

/**
 * Ajoute sur l'accueil la section des modules qui viennent d'etre actives,
 * quand elle n'existe encore sur aucune page. Sans cela, activer une
 * fonctionnalite ne changerait rien de visible dans l'apercu.
 * Le client reste libre de la supprimer ensuite : rien ne la remettra.
 */
export function addSectionsForModules(project: Project, added: ModuleId[]): Project {
  const kinds = added
    .map((id) => MODULE_BY_ID.get(id)?.section)
    .filter((kind): kind is SectionKind => Boolean(kind))
  if (!kinds.length) return project

  const present = new Set(project.pages.flatMap((page) => page.sections.map((s) => s.kind)))
  const missing = kinds.filter((kind) => !present.has(kind))
  if (!missing.length) return project

  const homeIndex = Math.max(0, project.pages.findIndex((p) => p.isHome))
  if (!project.pages[homeIndex]) return project

  const pages = project.pages.map((page, i) =>
    i === homeIndex ? { ...page, sections: [...page.sections, ...missing.map((kind) => createSection(kind))] } : page,
  )
  return { ...project, pages }
}

export function colorSchemeToCssVars(colors: ColorScheme): Record<string, string> {
  return {
    '--site-primary': colors.primary,
    '--site-secondary': colors.secondary,
    '--site-accent': colors.accent,
    '--site-background': colors.background,
    '--site-text': colors.text,
    '--site-button': colors.button,
    '--site-card': colors.card,
    '--site-header': colors.header,
    '--site-footer': colors.footer,
  }
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Progression affichee dans la barre d'etapes (§49) — sans aucune mention de prix. */
export const STEPS: { id: Project['step']; label: string }[] = [
  { id: 'activity', label: 'Activité' },
  /* La formule (§60) se choisit avant les objectifs : on construit alors
     directement dans le bon perimetre, au lieu de construire puis d'amputer. */
  { id: 'plan', label: 'Formule' },
  { id: 'objectives', label: 'Objectifs' },
  { id: 'features', label: 'Fonctionnalités' },
  { id: 'design', label: 'Design' },
  { id: 'content', label: 'Contenu' },
  { id: 'preview', label: 'Aperçu' },
  { id: 'final', label: 'Finalisation' },
]

export function stepIndex(step: Project['step']): number {
  return Math.max(0, STEPS.findIndex((s) => s.id === step))
}
