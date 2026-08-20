import type { Activity, ColorScheme, Identity, Page, Project, Section, SectionKind, ModuleId } from './types'
import { getActivity, CUSTOM_ACTIVITY } from './activities'
import { getTheme } from './themes'
import { isSectionAvailable } from './modules'

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

export function createSection(kind: SectionKind): Section {
  return { id: uid('sec'), kind, props: {} }
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
    priceRevealed: false,
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
      .map(createSection),
    seo: { title: blueprint.name, description: '' },
  }))
}

/** Applique le choix du metier : objectifs suggeres, modules et pages par defaut. */
export function applyActivity(project: Project, activityId: string, customLabel = ''): Project {
  const activity = activityId === 'custom' ? CUSTOM_ACTIVITY : getActivity(activityId)
  if (!activity) return project
  const modules = [...activity.defaultModules]
  return {
    ...project,
    activityId: activity.id,
    customActivity: activityId === 'custom' ? customLabel : '',
    objectives: [...activity.suggestedObjectives],
    modules,
    pages: buildPages(activity, modules),
  }
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

/** Synchronise les pages apres un changement de modules : retire les sections
 *  orphelines, ajoute celles qui viennent d'etre debloquees sur l'accueil. */
export function syncPagesWithModules(project: Project): Project {
  const pages = project.pages.map((page) => ({
    ...page,
    sections: page.sections.filter((s) => isSectionAvailable(s.kind, project.modules)),
  }))
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
