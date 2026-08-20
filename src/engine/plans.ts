import type { ModuleId, ObjectiveDef, PlanDef, PlanId, PlanLimits, Project } from './types'
import { MODULE_BY_ID, MODULES } from './modules'

/**
 * Catalogue des formules (§60).
 *
 * Meme rang que activities.ts, modules.ts et themes.ts : c'est de la DONNEE.
 * Aucune formule n'a de composant dedie, et aucun `if (plan === 'template')`
 * n'existe hors de ce fichier (§48). Une formule ne pose pas un axe de plus au
 * moteur : elle pose un PLAFOND sur un axe existant, les modules. Verrouiller
 * un module verrouille par transitivite ses sections, son onglet de builder et
 * son entree du catalogue d'ajout, puisque tout ce monde s'indexe deja sur
 * `project.modules`.
 *
 * GARDE §56, STRUCTURELLE : `PlanDef` ne declare aucun champ monetaire, et ce
 * fichier n'importe RIEN de pricing.ts — la dependance ne va que dans l'autre
 * sens. Un ecran qui rend ce catalogue est donc dans l'incapacite TYPEE
 * d'afficher un montant : la regle commerciale cesse d'etre une consigne pour
 * devenir une propriete du graphe d'imports.
 */

/**
 * La frontiere, en une phrase qui se tient au telephone :
 * le modele MONTRE ; le sur-mesure ENCAISSE, PREND RENDEZ-VOUS et COLLECTE.
 *
 * Sont fermes au modele : tout ce par quoi un visiteur envoie de l'argent ou une
 * donnee structuree, et tout ce qui demande une logique metier, une donnee
 * reglementee ou un second support.
 */
const TEMPLATE_BLOCKED: ModuleId[] = [
  // Le visiteur envoie de l'argent, une candidature ou une donnee personnelle.
  'cart', 'order', 'ordermodes', 'booking', 'quote', 'jobs', 'newsletter', 'loyalty', 'finder',
  // Logique metier, donnee reglementee, second support.
  'venues', 'allergens', 'program', 'funding', 'beforeafter', 'tv', 'qrcode',
]

export const PLANS: PlanDef[] = [
  {
    id: 'template',
    label: 'Site modèle',
    tagline: 'Le site type de votre métier, monté avec vos textes, vos photos et vos couleurs.',
    audience: "Vous voulez être trouvé sur internet, montrer ce que vous faites, et qu'on vous appelle.",
    highlights: [
      'Le design de votre choix, à vos couleurs',
      "Jusqu'à 6 pages",
      "Présentation, services, catalogue, galerie, avis, horaires, plan d'accès",
      "Jusqu'à 20 produits, services ou photos",
      'Formulaire de contact, lisible sur téléphone',
    ],
    excludes: [
      'La commande et le paiement en ligne',
      'La prise de rendez-vous',
      'La demande de devis détaillée',
      "L'écran TV et le QR code",
      'Le design entièrement sur mesure',
    ],
    limits: {
      blockedModules: TEMPLATE_BLOCKED,
      maxPages: 6,
      maxCatalogItems: 20,
      customTheme: false,
    },
    upgradeTo: 'website',
  },
  {
    id: 'website',
    label: 'Site sur mesure',
    tagline: 'Le moteur entier : commande, rendez-vous, devis, pages et catalogue illimités.',
    audience: 'Vous vendez, vous prenez des commandes ou des rendez-vous.',
    highlights: [
      'Tout ce que contient le site modèle',
      'Commande en ligne, panier, modes de service',
      'Prise de rendez-vous et demande de devis détaillée',
      'Pages et catalogue illimités',
      "Écran TV, QR code, recrutement, lettre d'information",
      'Design entièrement sur mesure',
    ],
    excludes: [],
    limits: {
      blockedModules: [],
      maxPages: Number.POSITIVE_INFINITY,
      maxCatalogItems: Number.POSITIVE_INFINITY,
      customTheme: true,
    },
    recommended: true,
  },
]

export const PLAN_BY_ID = new Map<PlanId, PlanDef>(PLANS.map((p) => [p.id, p]))

/**
 * Formule des projets d'avant les formules : la PERMISSIVE, jamais l'inverse.
 * C'est la decision la plus importante du patch et elle tient dans une
 * constante : par defaut a 'template', tous les projets deja construits
 * seraient amputes de leurs modules au premier rechargement.
 */
export const DEFAULT_PLAN_ID: PlanId = 'website'

/** Regle unique de resolution. Ne jamais recopier un `?? 'website'` ailleurs. */
export function getPlan(project: Pick<Project, 'plan'>): PlanId {
  return project.plan ?? DEFAULT_PLAN_ID
}

export function planDefOf(project: Pick<Project, 'plan'>): PlanDef {
  return PLAN_BY_ID.get(getPlan(project)) ?? PLAN_BY_ID.get(DEFAULT_PLAN_ID)!
}

export function planLimits(project: Pick<Project, 'plan'>): PlanLimits {
  return planDefOf(project).limits
}

export function moduleAllowed(plan: PlanId, id: ModuleId): boolean {
  return !(PLAN_BY_ID.get(plan) ?? PLAN_BY_ID.get(DEFAULT_PLAN_ID)!).limits.blockedModules.includes(id)
}

export function allowedModules(plan: PlanId, ids: ModuleId[]): ModuleId[] {
  return ids.filter((id) => moduleAllowed(plan, id))
}

/** Formule superieure, ou null. Le sens est DECLARATIF : on ne descend pas un client. */
export function upgradeOf(plan: PlanDef): PlanDef | null {
  return plan.upgradeTo ? PLAN_BY_ID.get(plan.upgradeTo) ?? null : null
}

/**
 * Un objectif n'est reellement tenu que si son module FONDATEUR est ouvert.
 * Convention de modules.ts : c'est le premier de `unlocks` ('orders' → 'cart',
 * 'booking' → 'booking'). Sans cette regle, « Recevoir des commandes » resterait
 * cochable en modele et n'activerait que `products` : on mentirait au client.
 */
export function planAllowsObjective(plan: PlanId, def: ObjectiveDef): boolean {
  const [founding] = def.unlocks
  return !founding || moduleAllowed(plan, founding)
}

/** Modules fermes par la formule, dans l'ordre du catalogue. */
export function blockedModuleDefs(plan: PlanId) {
  const blocked = new Set((PLAN_BY_ID.get(plan) ?? PLAN_BY_ID.get(DEFAULT_PLAN_ID)!).limits.blockedModules)
  return MODULES.filter((m) => blocked.has(m.id))
}

export function pagesLeft(project: Project): number {
  return Math.max(0, planLimits(project).maxPages - project.pages.length)
}

export function catalogSize(project: Project): number {
  return project.products.length + project.services.length + project.gallery.length
}

export function catalogLeft(project: Project): number {
  return Math.max(0, planLimits(project).maxCatalogItems - catalogSize(project))
}

/**
 * Ce qu'un changement de formule COUTE au projet, calcule AVANT de l'appliquer.
 * `blockers` non vide = la descente est REFUSEE : elle detruirait du contenu
 * redige, et `Page` n'a pas de champ `hidden` pour le mettre de cote. `modules`
 * et `emptiedPages` sont NOMMES dans la confirmation, jamais subis.
 */
export function planLoss(
  project: Project,
  next: PlanId,
): { modules: ModuleId[]; emptiedPages: string[]; blockers: string[] } {
  const limits = (PLAN_BY_ID.get(next) ?? PLAN_BY_ID.get(DEFAULT_PLAN_ID)!).limits
  const modules = project.modules.filter((m) => limits.blockedModules.includes(m))

  // Une page dont TOUTES les sections appartiennent a des modules qui ferment
  // deviendrait une page blanche : elle part avec eux, et on le dit.
  const emptiedPages = project.pages
    .filter((p) => !p.isHome && p.sections.length > 0
      && p.sections.every((s) => modules.some((m) => MODULE_BY_ID.get(m)?.section === s.kind)))
    .map((p) => p.name)

  const blockers: string[] = []
  const pagesAfter = project.pages.length - emptiedPages.length
  if (pagesAfter > limits.maxPages) {
    blockers.push(`Votre site compte ${pagesAfter} pages ; cette formule en contient ${limits.maxPages}.`)
  }
  if (catalogSize(project) > limits.maxCatalogItems) {
    blockers.push(`Votre catalogue compte ${catalogSize(project)} éléments ; cette formule en intègre ${limits.maxCatalogItems}.`)
  }
  return { modules, emptiedPages, blockers }
}

/**
 * Invariant du catalogue : une formule ne peut pas fermer un module structurel
 * (`required`), sinon `enforcePlan` le retire, `applyObjectives` le remet, et le
 * projet bat a chaque bascule d'objectif. Verifie au chargement du module.
 */
if (import.meta.env?.DEV) {
  for (const plan of PLANS) {
    const wrong = MODULES.filter((m) => m.required && plan.limits.blockedModules.includes(m.id))
    if (wrong.length) {
      console.error(
        `plans.ts — la formule « ${plan.label} » ferme un module structurel :`,
        wrong.map((m) => m.id).join(', '),
      )
    }
  }
}
