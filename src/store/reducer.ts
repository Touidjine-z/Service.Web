import type { Project, Page, Product, Service, GalleryItem } from '@/engine/types'
import type { Action } from './actions'
import { applyActivity, applyTheme, createEmptyProject, createSection, slugify, syncPagesWithModules, uid } from '@/engine/project'
import { MODULE_BY_ID } from '@/engine/modules'

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() }
}

function mapPage(project: Project, pageId: string, fn: (page: Page) => Page): Project {
  return { ...project, pages: project.pages.map((p) => (p.id === pageId ? fn(p) : p)) }
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

export function reducer(project: Project, action: Action): Project {
  switch (action.type) {
    case 'load':
      return action.project
    case 'reset':
      return createEmptyProject()

    case 'setActivity':
      return touch(applyActivity(project, action.activityId, action.customLabel ?? ''))

    case 'toggleObjective': {
      const objectives = project.objectives.includes(action.objective)
        ? project.objectives.filter((o) => o !== action.objective)
        : [...project.objectives, action.objective]
      return touch({ ...project, objectives })
    }

    case 'setObjectives':
      return touch({ ...project, objectives: action.objectives })

    case 'toggleModule': {
      const def = MODULE_BY_ID.get(action.module)
      if (def?.required && project.modules.includes(action.module)) return project
      const modules = project.modules.includes(action.module)
        ? project.modules.filter((m) => m !== action.module)
        : [...project.modules, action.module]
      return touch(syncPagesWithModules({ ...project, modules }))
    }

    case 'setTheme':
      return touch(applyTheme(project, action.themeId, action.keepColors))

    case 'setColors':
      return touch({ ...project, colors: { ...project.colors, ...action.colors } })

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
          sections.splice(action.index ?? sections.length, 0, createSection(action.kind))
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

    case 'revealPrice':
      return touch({ ...project, priceRevealed: true, step: 'final' })

    case 'setLead':
      return touch({ ...project, lead: action.lead })

    default:
      return project
  }
}
