import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, Check, Eye, FileText, Images, Layers, Loader2,
  Monitor, Package, Palette, Redo2, Settings, Smartphone, Tablet, Tv, Undo2, User, Wrench,
} from 'lucide-react'
import type { ModuleId, Viewport } from '@/engine/types'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import PagesPanel from './PagesPanel'
import SectionsPanel from './SectionsPanel'
import IdentityPanel from './IdentityPanel'
import CatalogPanel from './CatalogPanel'
import SettingsPanel from './SettingsPanel'
import PropertiesPanel from './PropertiesPanel'
import SaveProjectDialog from '@/features/final/SaveProjectDialog'

type Tab = 'pages' | 'sections' | 'products' | 'services' | 'gallery' | 'identity' | 'settings'

/** Onglets de la sidebar (§9). Un onglet catalogue n'apparait que si le module
 *  correspondant est actif : la sidebar reste courte pour un metier simple. */
const TABS: { id: Tab; label: string; icon: typeof Layers; requires?: ModuleId[] }[] = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'products', label: 'Produits', icon: Package, requires: ['products', 'menu'] },
  { id: 'services', label: 'Services', icon: Wrench, requires: ['services'] },
  { id: 'gallery', label: 'Galerie', icon: Images, requires: ['gallery', 'portfolio'] },
  { id: 'identity', label: 'Informations', icon: User },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'tablet', label: 'Tablette', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'TV', icon: Tv },
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
  const [tab, setTab] = useState<Tab>('sections')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [pageId, setPageId] = useState(() => project.pages.find((p) => p.isHome)?.id ?? project.pages[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)

  // Un module retire peut faire disparaitre l'onglet ouvert.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('sections')
  }, [tabs, tab])

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
            <button
              type="button"
              title="Thème et couleurs"
              aria-label="Thème et couleurs"
              onClick={() => navigate('/creer/theme')}
              className="mt-auto rounded-xl p-2.5 text-subtle transition hover:bg-canvas hover:text-ink"
            >
              <Palette size={18} />
            </button>
          </nav>

          <div className="flex w-72 min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'pages' && <PagesPanel currentPageId={page.id} onSelect={(id) => { setPageId(id); setSelectedId(null) }} />}
              {tab === 'sections' && <SectionsPanel page={page} selectedId={selectedId} onSelect={setSelectedId} />}
              {tab === 'products' && <CatalogPanel catalog="products" />}
              {tab === 'services' && <CatalogPanel catalog="services" />}
              {tab === 'gallery' && <CatalogPanel catalog="gallery" />}
              {tab === 'identity' && <IdentityPanel />}
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
              {VIEWPORTS.map(({ id, label, icon: Icon }) => (
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
              <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => navigate('/apercu')}>
                <Eye size={14} /> Mode visiteur
              </button>
            </div>
          </div>

          <div ref={stageRef} className="min-h-0 flex-1 overflow-auto bg-canvas p-6" onClick={() => setSelectedId(null)}>
            <div style={{ width: deviceWidth * scale, height: frameHeight * scale, marginInline: 'auto' }}>
              <div
                ref={frameRef}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"
                style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <SiteRenderer
                  project={project}
                  page={page}
                  viewport={viewport}
                  editable
                  selectedSectionId={selectedId}
                  onSelectSection={setSelectedId}
                  onNavigate={(slug) => {
                    const target = project.pages.find((p) => p.slug === slug)
                    if (target) { setPageId(target.id); setSelectedId(null) }
                  }}
                />
              </div>
            </div>
          </div>
        </main>

        {/* PROPRIETES */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-line bg-surface">
          <PropertiesPanel page={page} section={section} />
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
