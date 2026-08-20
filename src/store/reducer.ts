import type { Block, Project, Page, Product, Section, Service, GalleryItem } from '@/engine/types'
import type { Action } from './actions'
import {
  addSectionsForModules, applyActivity, applyObjectives, applyPlan, applyTheme, createBlock,
  createEmptyProject, createSection, enforcePlan, slugify, syncPagesWithModules, uid,
} from '@/engine/project'
import { catalogSize, planLimits, planLoss } from '@/engine/plans'
import { resolveBlocks } from '@/renderer/sectionDefs'
import { resolveAreas, shiftLayout } from '@/renderer/fluid'
import { MODULE_BY_ID } from '@/engine/modules'
import { buildExpressProject } from '@/engine/express'

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() }
}

function mapPage(project: Project, pageId: string, fn: (page: Page) => Page): Project {
  return { ...project, pages: project.pages.map((p) => (p.id === pageId ? fn(p) : p)) }
}

/**
 * Applique une transformation aux blocs d'une section. Les blocs fournis par le
 * catalogue sont d'abord materialises : des que le client touche a un bloc, la
 * section cesse de dependre des valeurs par defaut (cf. `resolveBlocks`).
 */
function mapBlocks(
  project: Project, pageId: string, sectionId: string, fn: (blocks: Block[]) => Block[],
): Project {
  return mapPage(project, pageId, (page) => ({
    ...page,
    sections: page.sections.map((s) => (s.id === sectionId ? { ...s, blocks: fn(resolveBlocks(s)) } : s)),
  }))
}

function move<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

/** Garantit un slug unique ; l'accueil garde toujours le slug vide. */
function uniqueSlug(project: Project, name: string, excludeId?: string): string {
  const base = slugify(name) || 'page'
  const taken = new Set(project.pages.filter((p) => p.id !== excludeId).map((p) => p.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

function rawReducer(project: Project, action: Action): Project {
  switch (action.type) {
    case 'load':
      return action.project
    case 'reset':
      return createEmptyProject()

    case 'setActivity':
      return touch(applyActivity(project, action.activityId, action.customLabel ?? ''))

    case 'applyExpress':
      return touch(buildExpressProject(project, action.form))

    case 'toggleObjective': {
      const objectives = project.objectives.includes(action.objective)
        ? project.objectives.filter((o) => o !== action.objective)
        : [...project.objectives, action.objective]
      return touch(applyObjectives(project, objectives))
    }

    case 'setObjectives':
      return touch(applyObjectives(project, action.objectives))

    case 'toggleModule': {
      const def = MODULE_BY_ID.get(action.module)
      if (def?.required && project.modules.includes(action.module)) return project
      const removing = project.modules.includes(action.module)
      const modules = removing
        ? project.modules.filter((m) => m !== action.module)
        : [...project.modules, action.module]
      const next = syncPagesWithModules({ ...project, modules })
      return touch(removing ? next : addSectionsForModules(next, [action.module]))
    }

    case 'setTheme':
      return touch(applyTheme(project, action.themeId, action.keepColors))

    case 'setColors':
      return touch({ ...project, colors: { ...project.colors, ...action.colors } })

    case 'setFontPair':
      return touch({ ...project, fontPair: action.fontPair })

    case 'setIdentity':
      return touch({ ...project, identity: { ...project.identity, ...action.identity } })

    case 'setStep':
      return touch({ ...project, step: action.step })

    case 'addPage': {
      const page: Page = {
        id: uid('page'),
        name: action.name,
        slug: uniqueSlug(project, action.name),
        isHome: project.pages.length === 0,
        sections: [createSection('hero')],
        seo: { title: action.name, description: '' },
      }
      return touch({ ...project, pages: [...project.pages, page] })
    }

    case 'removePage': {
      const removed = project.pages.find((p) => p.id === action.pageId)
      const pages = project.pages.filter((p) => p.id !== action.pageId)
      // L'accueil ne peut pas disparaitre : la premiere page restante reprend le role.
      if (removed?.isHome && pages.length > 0) {
        pages[0] = { ...pages[0], isHome: true, slug: '' }
      }
      return touch({ ...project, pages })
    }

    case 'renamePage':
      return touch(
        mapPage(project, action.pageId, (p) => ({
          ...p,
          name: action.name,
          slug: p.isHome ? '' : uniqueSlug(project, action.name, p.id),
        })),
      )

    case 'duplicatePage': {
      const source = project.pages.find((p) => p.id === action.pageId)
      if (!source) return project
      const copy: Page = {
        ...source,
        id: uid('page'),
        name: `${source.name} (copie)`,
        slug: uniqueSlug(project, `${source.name} copie`),
        isHome: false,
        sections: source.sections.map((s) => ({ ...s, id: uid('sec'), props: { ...s.props } })),
        seo: { ...source.seo },
      }
      const at = project.pages.findIndex((p) => p.id === action.pageId)
      const pages = [...project.pages]
      pages.splice(at + 1, 0, copy)
      return touch({ ...project, pages })
    }

    case 'movePage':
      return touch({
        ...project,
        pages: move(project.pages, project.pages.findIndex((p) => p.id === action.pageId), action.direction),
      })

    case 'setHomePage':
      return touch({
        ...project,
        pages: project.pages.map((p) =>
          p.id === action.pageId
            ? { ...p, isHome: true, slug: '' }
            : p.isHome
              ? { ...p, isHome: false, slug: uniqueSlug(project, p.name, p.id) || slugify(p.name) }
              : p,
        ),
      })

    case 'updatePageSeo':
      return touch(mapPage(project, action.pageId, (p) => ({ ...p, seo: { ...p.seo, ...action.seo } })))

    case 'addSection':
      return touch(
        mapPage(project, action.pageId, (p) => {
          const sections = [...p.sections]
          const section = createSection(action.kind, { props: action.props, blocks: action.blocks })
          sections.splice(action.index ?? sections.length, 0, section)
          return { ...p, sections }
        }),
      )

    case 'duplicateSection':
      return touch(
        mapPage(project, action.pageId, (p) => {
          const index = p.sections.findIndex((s) => s.id === action.sectionId)
          if (index < 0) return p
          const source = p.sections[index]
          const copy: Section = {
            ...source,
            id: uid('sec'),
            props: { ...source.props },
            blocks: source.blocks?.map((b) => ({ ...b, id: uid('blk'), props: { ...b.props } })),
          }
          const sections = [...p.sections]
          sections.splice(index + 1, 0, copy)
          return { ...p, sections }
        }),
      )

    case 'removeSection':
      return touch(mapPage(project, action.pageId, (p) => ({ ...p, sections: p.sections.filter((s) => s.id !== action.sectionId) })))

    case 'moveSection':
      return touch(
        mapPage(project, action.pageId, (p) => ({
          ...p,
          sections: move(p.sections, p.sections.findIndex((s) => s.id === action.sectionId), action.direction),
        })),
      )

    case 'reorderSections':
      return touch(mapPage(project, action.pageId, (p) => ({ ...p, sections: action.sections })))

    case 'updateSection':
      return touch(
        mapPage(project, action.pageId, (p) => ({
          ...p,
          sections: p.sections.map((s) => (s.id === action.sectionId ? { ...s, props: { ...s.props, ...action.props } } : s)),
        })),
      )

    case 'toggleSectionHidden':
      return touch(
        mapPage(project, action.pageId, (p) => ({
          ...p,
          sections: p.sections.map((s) => (s.id === action.sectionId ? { ...s, hidden: !s.hidden } : s)),
        })),
      )

    case 'addBlock':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) => {
          const next = [...blocks]
          next.splice(action.index ?? next.length, 0, createBlock({ type: action.blockType }))
          return next
        }),
      )

    case 'removeBlock':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) => blocks.filter((b) => b.id !== action.blockId)),
      )

    case 'updateBlock':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) =>
          blocks.map((b) => (b.id === action.blockId ? { ...b, props: { ...b.props, ...action.props } } : b)),
        ),
      )

    case 'reorderBlocks':
      return touch(mapBlocks(project, action.pageId, action.sectionId, () => action.blocks))

    case 'toggleBlockHidden':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) =>
          blocks.map((b) => (b.id === action.blockId ? { ...b, hidden: !b.hidden } : b)),
        ),
      )

    case 'duplicateBlock':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) => {
          const index = blocks.findIndex((b) => b.id === action.blockId)
          if (index < 0) return blocks
          const source = blocks[index]
          // La copie descend d'une ligne : sur une grille fluide, une copie
          // posee au meme endroit serait invisible sous son original (§14).
          const copy: Block = {
            ...source,
            id: uid('blk'),
            props: { ...source.props },
            layout: shiftLayout(source.layout, 1),
          }
          return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]
        }),
      )

    case 'setBlockLayout':
      return touch(
        mapBlocks(project, action.pageId, action.sectionId, (blocks) => {
          if (action.area === null) {
            return blocks.map((b) => {
              if (action.blockId !== null && b.id !== action.blockId) return b
              const layout = { ...b.layout }
              delete layout[action.breakpoint]
              // Un bloc sans aucune position dessinee redevient un bloc deduit :
              // on ne laisse pas trainer d'objet vide dans le projet enregistre.
              return { ...b, layout: Object.keys(layout).length > 0 ? layout : undefined }
            })
          }

          // Le premier bloc qu'on deplace FIGE la position deduite des autres.
          // Sans cela, bouger un bloc suffirait a faire glisser toute la section
          // sous les yeux du client, alors qu'il n'a touche qu'a celui-la (§14).
          const derived = new Map(resolveAreas(blocks, action.breakpoint).map((p) => [p.block.id, p.area]))
          return blocks.map((b) => {
            if (b.id === action.blockId) return { ...b, layout: { ...b.layout, [action.breakpoint]: action.area } }
            if (b.layout?.[action.breakpoint]) return b
            const area = derived.get(b.id)
            return area ? { ...b, layout: { ...b.layout, [action.breakpoint]: area } } : b
          })
        }),
      )

    case 'addCategory':
      return touch({
        ...project,
        categories: [...project.categories, { id: uid('cat'), name: action.name, order: project.categories.length }],
      })

    case 'removeCategory':
      return touch({
        ...project,
        categories: project.categories.filter((c) => c.id !== action.categoryId),
        // Les produits orphelins restent, sans categorie.
        products: project.products.map((p) => (p.categoryId === action.categoryId ? { ...p, categoryId: null } : p)),
      })

    case 'renameCategory':
      return touch({
        ...project,
        categories: project.categories.map((c) => (c.id === action.categoryId ? { ...c, name: action.name } : c)),
      })

    case 'addProduct': {
      const product: Product = {
        id: uid('prod'),
        name: 'Nouveau produit',
        description: '',
        imageUrl: null,
        categoryId: project.categories[0]?.id ?? null,
        price: null,
        available: true,
        variants: [],
        order: project.products.length,
        ...action.product,
      }
      return touch({ ...project, products: [...project.products, product] })
    }

    case 'updateProduct':
      return touch({
        ...project,
        products: project.products.map((p) => (p.id === action.productId ? { ...p, ...action.patch } : p)),
      })

    case 'removeProduct':
      return touch({ ...project, products: project.products.filter((p) => p.id !== action.productId) })

    case 'duplicateProduct': {
      const source = project.products.find((p) => p.id === action.productId)
      if (!source) return project
      const copy: Product = { ...source, id: uid('prod'), name: `${source.name} (copie)`, order: project.products.length }
      return touch({ ...project, products: [...project.products, copy] })
    }

    case 'duplicateService': {
      const source = project.services.find((s) => s.id === action.serviceId)
      if (!source) return project
      const copy: Service = { ...source, id: uid('svc'), name: `${source.name} (copie)`, order: project.services.length }
      return touch({ ...project, services: [...project.services, copy] })
    }

    /** L'ordre du tableau fait foi ; `order` est resynchronise pour rester lisible. */
    case 'moveCatalogItem': {
      const list: { id: string; order: number }[] = project[action.catalog]
      const index = list.findIndex((item) => item.id === action.itemId)
      const next = move(list, index, action.direction).map((item, i) => ({ ...item, order: i }))
      return touch({ ...project, [action.catalog]: next })
    }

    case 'addService': {
      const service: Service = {
        id: uid('svc'),
        name: 'Nouveau service',
        description: '',
        imageUrl: null,
        duration: '',
        price: null,
        order: project.services.length,
        ...action.service,
      }
      return touch({ ...project, services: [...project.services, service] })
    }

    case 'updateService':
      return touch({
        ...project,
        services: project.services.map((s) => (s.id === action.serviceId ? { ...s, ...action.patch } : s)),
      })

    case 'removeService':
      return touch({ ...project, services: project.services.filter((s) => s.id !== action.serviceId) })

    case 'addGalleryItem': {
      const item: GalleryItem = {
        id: uid('img'),
        title: '',
        description: '',
        category: '',
        order: project.gallery.length,
        ...action.item,
      }
      return touch({ ...project, gallery: [...project.gallery, item] })
    }

    case 'updateGalleryItem':
      return touch({
        ...project,
        gallery: project.gallery.map((g) => (g.id === action.itemId ? { ...g, ...action.patch } : g)),
      })

    case 'removeGalleryItem':
      return touch({ ...project, gallery: project.gallery.filter((g) => g.id !== action.itemId) })

    case 'setGrid':
      return touch({ ...project, grid: { ...project.grid, ...action.grid } })

    case 'setCurrency':
      return touch({ ...project, currency: action.currency })

    case 'setShowPrices':
      return touch({ ...project, showPrices: action.showPrices })

    /* Formule (§60). `applyPlan` ferme les modules que la formule n'ouvre pas et
       retire les pages devenues vides — nommees dans la confirmation en amont. */
    case 'setPlan':
      return project.plan === action.plan ? project : touch(applyPlan(project, action.plan))

    case 'revealPrice':
      return touch({ ...project, priceRevealed: true, step: 'final' })

    case 'setDomain':
      return touch({ ...project, domain: action.domain })

    case 'setStatus':
      return touch({ ...project, status: action.status })

    case 'setLead':
      // Enregistrer son projet suffit a en faire un lead (§28).
      return touch({ ...project, lead: action.lead, status: project.status === 'draft' ? 'saved' : project.status })

    default:
      return project
  }
}

/**
 * Actions qu'une formule refuse (§60). Le projet est alors rendu INCHANGE :
 * l'historique undo/redo voit l'identite et n'ecrit rien. C'est un filet de
 * securite — l'interface a deja desactive le controle et propose la montee en
 * gamme ; ici, on garantit qu'aucun chemin detourne ne franchit le plafond.
 */
function refusedByPlan(project: Project, action: Action): boolean {
  const limits = planLimits(project)
  switch (action.type) {
    case 'addPage':
    case 'duplicatePage':
      return project.pages.length >= limits.maxPages
    case 'addProduct':
    case 'duplicateProduct':
    case 'addService':
    case 'duplicateService':
    case 'addGalleryItem':
      return catalogSize(project) >= limits.maxCatalogItems
    case 'toggleModule':
      // On n'empeche jamais de RETIRER un module, seulement d'en ouvrir un ferme.
      return !project.modules.includes(action.module) && limits.blockedModules.includes(action.module)
    case 'setTheme':
      return action.themeId === 'custom' && !limits.customTheme
    case 'setPlan':
      // Une descente qui detruirait des pages ou du catalogue est refusee : le
      // client supprime lui-meme, on ne tronque pas son travail.
      return planLoss(project, action.plan).blockers.length > 0
    default:
      return false
  }
}

/**
 * Le reducer du produit : la formule garde l'entree, puis projette la sortie.
 * `enforcePlan` est l'identite pour le sur-mesure et pour tous les projets
 * d'avant les formules — leur cout est donc nul.
 */
export function reducer(project: Project, action: Action): Project {
  if (refusedByPlan(project, action)) return project
  return enforcePlan(rawReducer(project, action))
}
