import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, Check, Eye, FileText, Images, Layers, Loader2,
  Monitor, Package, Palette, QrCode, Redo2, Search, Settings, Smartphone, Tablet, Tv,
  Undo2, User, Wrench,
} from 'lucide-react'
import type { ModuleId, Viewport } from '@/engine/types'
import SiteRenderer from '@/renderer/SiteRenderer'
import { FluidEditContext, ROWS_KEY, breakpointOf, type FluidEdit } from '@/renderer/fluid'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import PagesPanel from './PagesPanel'
import SectionsPanel from './SectionsPanel'
import IdentityPanel from './IdentityPanel'
import CatalogPanel from './CatalogPanel'
import SettingsPanel from './SettingsPanel'
import DesignPanel from './DesignPanel'
import SeoPanel from './SeoPanel'

/** La generation de QR embarque sa propre librairie : chargee a la demande. */
const QrPanel = lazy(() => import('./QrPanel'))
import PropertiesPanel from './PropertiesPanel'
import SaveProjectDialog from '@/features/final/SaveProjectDialog'

type Tab = 'design' | 'pages' | 'sections' | 'products' | 'services' | 'gallery' | 'identity' | 'seo' | 'qr' | 'settings'

/** Onglets de la sidebar (§9). Un onglet catalogue n'apparait que si le module
 *  correspondant est actif : la sidebar reste courte pour un metier simple. */
const TABS: { id: Tab; label: string; icon: typeof Layers; requires?: ModuleId[] }[] = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'products', label: 'Produits', icon: Package, requires: ['products', 'menu'] },
  { id: 'services', label: 'Services', icon: Wrench, requires: ['services'] },
  { id: 'gallery', label: 'Galerie', icon: Images, requires: ['gallery', 'portfolio'] },
  { id: 'identity', label: 'Informations', icon: User },
  { id: 'seo', label: 'Référencement', icon: Search },
  { id: 'qr', label: 'QR Code', icon: QrCode, requires: ['qrcode'] },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

/** Formats d'apercu. Comme les onglets, un format peut dependre d'un module :
 *  l'apercu TV ne veut rien dire tant que l'ecran de salle n'est pas au projet. */
const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor; requires?: ModuleId[] }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'tablet', label: 'Tablette', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'TV', icon: Tv, requires: ['tv'] },
]

/**
 * Le builder (§9) : sidebar, apercu en direct au centre, proprietes a droite.
 * Aucun prix n'apparait ici — le devis n'est revele qu'a la page finale (§56).
 */
export default function BuilderPage() {
  const navigate = useNavigate()
  const { project, dispatch, undo, redo, canUndo, canRedo, saving } = useProject()

  const tabs = useMemo(
    () => TABS.filter((t) => !t.requires || t.requires.some((m) => project.modules.includes(m))),
    [project.modules],
  )
  const viewports = useMemo(
    () => VIEWPORTS.filter((v) => !v.requires || v.requires.some((m) => project.modules.includes(m))),
    [project.modules],
  )
  const [tab, setTab] = useState<Tab>('sections')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [pageId, setPageId] = useState(() => project.pages.find((p) => p.isHome)?.id ?? project.pages[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Bloc attrape sur la grille fluide (§14) : partage entre l'apercu et le panneau. */
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)

  const selectSection = useCallback((sectionId: string | null) => {
    setSelectedId(sectionId)
    setSelectedBlockId(null)
  }, [])

  // Un module retire peut faire disparaitre l'onglet ouvert.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('sections')
  }, [tabs, tab])

  // Meme raison pour le format d'apercu : on retombe sur l'ordinateur.
  useEffect(() => {
    if (!viewports.some((v) => v.id === viewport)) setViewport('desktop')
  }, [viewports, viewport])

  const page = useMemo(
    () => project.pages.find((p) => p.id === pageId) ?? project.pages[0],
    [project.pages, pageId],
  )

  // Le projet peut changer sous nos pieds (undo, chargement) : on garde une page valide.
  useEffect(() => {
    if (page && page.id !== pageId) setPageId(page.id)
  }, [page, pageId])

  const section = useMemo(
    () => page?.sections.find((s) => s.id === selectedId) ?? null,
    [page, selectedId],
  )

  // Tenir compte de la place reelle pour choisir l'echelle de l'apercu (§21).
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)
  useLayoutEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Hauteur reelle du site rendu : sans elle, la mise a l'echelle laisserait
  // un grand vide sous l'apercu (le transform ne change pas le flux).
  const frameRef = useRef<HTMLDivElement>(null)
  const [frameHeight, setFrameHeight] = useState(0)
  useLayoutEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setFrameHeight(entry.contentRect.height))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const deviceWidth = VIEWPORT_WIDTH[viewport]
  const scale = stageWidth ? Math.min(1, (stageWidth - 48) / deviceWidth) : 1

  useEffect(() => { dispatch({ type: 'setStep', step: 'content' }) }, [dispatch])

  /**
   * Ce que le builder prete a la grille fluide. Le renderer ne connait ni le
   * store ni la page courante : il recoit ces cinq verbes, et redevient un
   * rendu inerte des qu'on le sort du builder (§22, §48).
   */
  const currentPageId = page?.id ?? ''
  const fluidEdit = useMemo<FluidEdit>(() => ({
    selectedBlockId,
    select: (sectionId, blockId) => {
      setSelectedId(sectionId)
      setSelectedBlockId(blockId)
    },
    move: (sectionId, blockId, area) => dispatch({
      type: 'setBlockLayout', pageId: currentPageId, sectionId, blockId, breakpoint: breakpointOf(viewport), area,
    }),
    setRows: (sectionId, rows) => dispatch({
      type: 'updateSection', pageId: currentPageId, sectionId, props: { [ROWS_KEY[breakpointOf(viewport)]]: rows },
    }),
    duplicate: (sectionId, blockId) => dispatch({ type: 'duplicateBlock', pageId: currentPageId, sectionId, blockId }),
    remove: (sectionId, blockId) => {
      setSelectedBlockId((id) => (id === blockId ? null : id))
      dispatch({ type: 'removeBlock', pageId: currentPageId, sectionId, blockId })
    },
  }), [selectedBlockId, currentPageId, viewport, dispatch])

  if (!page) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="text-sm text-muted">Aucun projet en cours.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate('/creer/activite')}>
            Commencer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <StepBar current="content" />

      <div className="flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <aside className="flex shrink-0 border-r border-line bg-surface">
          {/* Rail d'icones : la liste des onglets grandira avec les modules. */}
          <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line py-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`rounded-xl p-2.5 transition ${
                  tab === id ? 'bg-brand/10 text-brand' : 'text-subtle hover:bg-canvas hover:text-ink'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}

          </nav>

          <div className="flex w-72 min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'pages' && <PagesPanel currentPageId={page.id} onSelect={(id) => { setPageId(id); selectSection(null) }} />}
              {tab === 'sections' && <SectionsPanel page={page} selectedId={selectedId} onSelect={selectSection} />}
              {tab === 'products' && <CatalogPanel catalog="products" />}
              {tab === 'services' && <CatalogPanel catalog="services" />}
              {tab === 'gallery' && <CatalogPanel catalog="gallery" />}
              {tab === 'identity' && <IdentityPanel />}
              {tab === 'seo' && <SeoPanel pageId={page.id} />}
              {tab === 'qr' && (
                <Suspense fallback={<p className="p-4 text-xs text-subtle">Chargement…</p>}>
                  <QrPanel />
                </Suspense>
              )}
              {tab === 'design' && <DesignPanel />}
              {tab === 'settings' && <SettingsPanel />}
            </div>
          </div>
        </aside>

        {/* APERCU */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4 py-2.5">
            <div className="flex items-center gap-1">
              <button type="button" className="btn-ghost !px-2 !py-2" disabled={!canUndo} onClick={undo} title="Annuler">
                <Undo2 size={16} />
              </button>
              <button type="button" className="btn-ghost !px-2 !py-2" disabled={!canRedo} onClick={redo} title="Rétablir">
                <Redo2 size={16} />
              </button>
              <span className="ml-2 flex items-center gap-1.5 text-xs text-subtle">
                {saving ? <><Loader2 size={12} className="animate-spin" /> Enregistrement…</> : 'Enregistré'}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-canvas p-1">
              {viewports.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={viewport === id}
                  onClick={() => setViewport(id)}
                  className={`rounded-lg px-2.5 py-1.5 transition ${
                    viewport === id ? 'bg-surface text-ink shadow-sm' : 'text-subtle hover:text-ink'
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setSaveOpen(true)}>
                {project.lead ? <Check size={14} /> : <Bookmark size={14} />}
                {project.lead ? 'Projet enregistré' : 'Enregistrer mon projet'}
              </button>
              {project.modules.includes('tv') && (
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => navigate('/tv')}>
                  <Tv size={14} /> Écran TV
                </button>
              )}
              <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => navigate('/apercu')}>
                <Eye size={14} /> Mode visiteur
              </button>
            </div>
          </div>

          <div ref={stageRef} className="min-h-0 flex-1 overflow-auto bg-canvas p-6" onClick={() => selectSection(null)}>
            <div style={{ width: deviceWidth * scale, height: frameHeight * scale, marginInline: 'auto' }}>
              <div
                ref={frameRef}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"
                style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <FluidEditContext.Provider value={fluidEdit}>
                  <SiteRenderer
                    project={project}
                    page={page}
                    viewport={viewport}
                    editable
                    selectedSectionId={selectedId}
                    onSelectSection={selectSection}
                    onNavigate={(slug) => {
                      const target = project.pages.find((p) => p.slug === slug)
                      if (target) { setPageId(target.id); selectSection(null) }
                    }}
                  />
                </FluidEditContext.Provider>
              </div>
            </div>
          </div>
        </main>

        {/* PROPRIETES */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-line bg-surface">
          <PropertiesPanel
            page={page}
            section={section}
            viewport={viewport}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
          />
        </aside>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-line bg-surface px-4 py-3">
        <button type="button" className="btn-ghost" onClick={() => navigate('/creer/couleurs')}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/apercu')}>
            <Eye size={16} /> Voir mon site
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/creer/final')}>
            J'ai terminé <ArrowRight size={16} />
          </button>
        </div>
      </footer>

      {saveOpen && <SaveProjectDialog onClose={() => setSaveOpen(false)} />}
    </div>
  )
}
