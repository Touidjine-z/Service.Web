import type {
  Project, ObjectiveId, ModuleId, ThemeId, ColorScheme, Identity,
  Page, Section, Product, Service, Category, GalleryItem, GridSettings,
  Currency, BuilderStep, Lead, ProjectStatus, SectionKind,
} from '@/engine/types'

export type Action =
  | { type: 'load'; project: Project }
  | { type: 'reset' }
  | { type: 'setActivity'; activityId: string; customLabel?: string }
  | { type: 'toggleObjective'; objective: ObjectiveId }
  | { type: 'setObjectives'; objectives: ObjectiveId[] }
  | { type: 'toggleModule'; module: ModuleId }
  | { type: 'setTheme'; themeId: ThemeId; keepColors: boolean }
  | { type: 'setColors'; colors: Partial<ColorScheme> }
  | { type: 'setIdentity'; identity: Partial<Identity> }
  | { type: 'setStep'; step: BuilderStep }
  | { type: 'addPage'; name: string }
  | { type: 'removePage'; pageId: string }
  | { type: 'renamePage'; pageId: string; name: string }
  | { type: 'duplicatePage'; pageId: string }
  | { type: 'movePage'; pageId: string; direction: -1 | 1 }
  | { type: 'setHomePage'; pageId: string }
  | { type: 'updatePageSeo'; pageId: string; seo: Partial<Page['seo']> }
  | { type: 'addSection'; pageId: string; kind: SectionKind; index?: number }
  | { type: 'removeSection'; pageId: string; sectionId: string }
  | { type: 'moveSection'; pageId: string; sectionId: string; direction: -1 | 1 }
  | { type: 'reorderSections'; pageId: string; sections: Section[] }
  | { type: 'updateSection'; pageId: string; sectionId: string; props: Record<string, unknown> }
  | { type: 'toggleSectionHidden'; pageId: string; sectionId: string }
  | { type: 'addCategory'; name: string }
  | { type: 'removeCategory'; categoryId: string }
  | { type: 'renameCategory'; categoryId: string; name: string }
  | { type: 'addProduct'; product?: Partial<Product> }
  | { type: 'updateProduct'; productId: string; patch: Partial<Product> }
  | { type: 'removeProduct'; productId: string }
  | { type: 'duplicateProduct'; productId: string }
  | { type: 'duplicateService'; serviceId: string }
  | { type: 'moveCatalogItem'; catalog: 'products' | 'services' | 'gallery'; itemId: string; direction: -1 | 1 }
  | { type: 'addService'; service?: Partial<Service> }
  | { type: 'updateService'; serviceId: string; patch: Partial<Service> }
  | { type: 'removeService'; serviceId: string }
  | { type: 'addGalleryItem'; item: Partial<GalleryItem> & { imageUrl: string } }
  | { type: 'updateGalleryItem'; itemId: string; patch: Partial<GalleryItem> }
  | { type: 'removeGalleryItem'; itemId: string }
  | { type: 'setGrid'; grid: Partial<GridSettings> }
  | { type: 'setCurrency'; currency: Currency }
  | { type: 'setShowPrices'; showPrices: boolean }
  | { type: 'revealPrice' }
  | { type: 'setLead'; lead: Lead }
  | { type: 'setStatus'; status: ProjectStatus }

export type { Category }
