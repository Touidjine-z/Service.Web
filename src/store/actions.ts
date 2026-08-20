import type {
  Project, ObjectiveId, ModuleId, ThemeId, ColorScheme, Identity,
  Page, Section, Product, Service, Category, GalleryItem, GridSettings,
  Currency, BuilderStep, Lead, PlanId, ProjectStatus, SectionKind, Block, BlockSeed, BlockType,
  DomainChoice, GridArea,
} from '@/engine/types'
import type { Breakpoint } from '@/renderer/fluid'
import type { ExpressForm } from '@/engine/express'

export type Action =
  | { type: 'load'; project: Project }
  | { type: 'reset' }
  | { type: 'setActivity'; activityId: string; customLabel?: string }
  /** Formulaire express : le projet complet est monte d'un seul coup. */
  | { type: 'applyExpress'; form: ExpressForm }
  | { type: 'toggleObjective'; objective: ObjectiveId }
  | { type: 'setObjectives'; objectives: ObjectiveId[] }
  | { type: 'toggleModule'; module: ModuleId }
  | { type: 'setTheme'; themeId: ThemeId; keepColors: boolean }
  | { type: 'setColors'; colors: Partial<ColorScheme> }
  /** Appairage de polices (§11) ; 'default' rend la main au theme. */
  | { type: 'setFontPair'; fontPair: string }
  | { type: 'setIdentity'; identity: Partial<Identity> }
  | { type: 'setStep'; step: BuilderStep }
  | { type: 'addPage'; name: string }
  | { type: 'removePage'; pageId: string }
  | { type: 'renamePage'; pageId: string; name: string }
  | { type: 'duplicatePage'; pageId: string }
  | { type: 'movePage'; pageId: string; direction: -1 | 1 }
  | { type: 'setHomePage'; pageId: string }
  | { type: 'updatePageSeo'; pageId: string; seo: Partial<Page['seo']> }
  /** `props` et `blocks` viennent de la variante choisie dans le catalogue (§14). */
  | { type: 'addSection'; pageId: string; kind: SectionKind; index?: number; props?: Record<string, unknown>; blocks?: BlockSeed[] }
  | { type: 'removeSection'; pageId: string; sectionId: string }
  | { type: 'duplicateSection'; pageId: string; sectionId: string }
  | { type: 'moveSection'; pageId: string; sectionId: string; direction: -1 | 1 }
  | { type: 'reorderSections'; pageId: string; sections: Section[] }
  | { type: 'updateSection'; pageId: string; sectionId: string; props: Record<string, unknown> }
  | { type: 'toggleSectionHidden'; pageId: string; sectionId: string }
  /* Blocs : le contenu compose d'une section (§14). */
  | { type: 'addBlock'; pageId: string; sectionId: string; blockType: BlockType; index?: number }
  | { type: 'removeBlock'; pageId: string; sectionId: string; blockId: string }
  | { type: 'updateBlock'; pageId: string; sectionId: string; blockId: string; props: Record<string, unknown> }
  | { type: 'reorderBlocks'; pageId: string; sectionId: string; blocks: Block[] }
  | { type: 'toggleBlockHidden'; pageId: string; sectionId: string; blockId: string }
  | { type: 'duplicateBlock'; pageId: string; sectionId: string; blockId: string }
  /**
   * Position d'un bloc sur la grille fluide (§14), pour un point de rupture.
   * `area: null` rend la main a la position deduite, et `blockId: null` vise
   * toute la section : c'est ce que fait « reinitialiser la disposition », en
   * une seule entree d'historique.
   */
  | { type: 'setBlockLayout'; pageId: string; sectionId: string; blockId: string | null; breakpoint: Breakpoint; area: GridArea | null }
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
  /** Changement de formule (§60) : refuse par le reducer s'il detruirait du contenu. */
  | { type: 'setPlan'; plan: PlanId }
  | { type: 'revealPrice' }
  /** Choix du nom de domaine a la derniere etape (§59) ; null efface le choix. */
  | { type: 'setDomain'; domain: DomainChoice | null }
  | { type: 'setLead'; lead: Lead }
  | { type: 'setStatus'; status: ProjectStatus }

export type { Category }
