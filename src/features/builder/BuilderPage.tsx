import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Eye, FileText, Layers, Loader2, Monitor, Palette,
  Redo2, Smartphone, Tablet, Tv, Undo2, User,
} from 'lucide-react'
import type { Viewport } from '@/engine/types'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import PagesPanel from './PagesPanel'
import SectionsPanel from './SectionsPanel'
import IdentityPanel from './IdentityPanel'
import PropertiesPanel from './PropertiesPanel'

type Tab = 'pages' | 'sections' | 'identity'

const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'identity', label: 'Informations', icon: User },
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

  const [tab, setTab] = useState<Tab>('sections')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [pageId, setPageId] = useState(() => project.pages.find((p) => p.isHome)?.id ?? project.pages[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
        <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-surface">
          <div className="flex shrink-0 border-b border-line">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                  tab === id ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'pages' && <PagesPanel currentPageId={page.id} onSelect={(id) => { setPageId(id); setSelectedId(null) }} />}
            {tab === 'sections' && <SectionsPanel page={page} selectedId={selectedId} onSelect={setSelectedId} />}
            {tab === 'identity' && <IdentityPanel />}
          </div>

          <div className="shrink-0 border-t border-line p-3">
            <button type="button" className="btn-ghost w-full !justify-start !py-2 text-xs" onClick={() => navigate('/creer/theme')}>
              <Palette size={14} /> Changer de thème ou de couleurs
            </button>
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
        <button type="button" className="btn-primary" onClick={() => navigate('/apercu')}>
          Voir mon site <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  )
}
