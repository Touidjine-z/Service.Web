import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Monitor, Smartphone, Tablet, Tv } from 'lucide-react'
import type { Viewport } from '@/engine/types'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'

const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'tablet', label: 'Tablette', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'TV', icon: Tv },
]

/**
 * Mode visiteur (§22) : le client parcourt son site comme un vrai visiteur, sans
 * aucun repere d'edition. C'est le moment de projection du produit (§54) — donc
 * toujours sans le moindre prix de realisation (§56).
 */
export default function VisitorPage() {
  const navigate = useNavigate()
  const { project, dispatch } = useProject()
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [slug, setSlug] = useState(() => project.pages.find((p) => p.isHome)?.slug ?? project.pages[0]?.slug ?? '')

  const page = project.pages.find((p) => p.slug === slug) ?? project.pages[0]

  useEffect(() => { dispatch({ type: 'setStep', step: 'preview' }) }, [dispatch])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [slug])

  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)
  const [frameHeight, setFrameHeight] = useState(0)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const frame = frameRef.current
    if (!stage || !frame) return
    const onStage = new ResizeObserver(([e]) => setStageWidth(e.contentRect.width))
    const onFrame = new ResizeObserver(([e]) => setFrameHeight(e.contentRect.height))
    onStage.observe(stage)
    onFrame.observe(frame)
    return () => { onStage.disconnect(); onFrame.disconnect() }
  }, [])

  if (!page) {
    return (
      <div className="grid min-h-screen place-items-center">
        <button type="button" className="btn-primary" onClick={() => navigate('/creer/activite')}>
          Commencer mon site
        </button>
      </div>
    )
  }

  const deviceWidth = VIEWPORT_WIDTH[viewport]
  // Sur ordinateur on rend a la vraie largeur de l'ecran : le client doit voir
  // son site, pas une maquette dans un cadre.
  const framed = viewport !== 'desktop'
  const scale = framed && stageWidth ? Math.min(1, (stageWidth - 64) / deviceWidth) : 1

  return (
    <div className="min-h-screen bg-canvas">
      <div ref={stageRef} className={framed ? 'px-8 py-10' : ''}>
        {framed ? (
          <div style={{ width: deviceWidth * scale, height: frameHeight * scale, marginInline: 'auto' }}>
            <div
              ref={frameRef}
              className={`overflow-hidden bg-white shadow-card ${viewport === 'mobile' ? 'rounded-[2rem] border-8 border-slate-900' : 'rounded-2xl border border-line'}`}
              style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <SiteRenderer project={project} page={page} viewport={viewport} onNavigate={setSlug} />
            </div>
          </div>
        ) : (
          <div ref={frameRef}>
            <SiteRenderer project={project} page={page} viewport={viewport} onNavigate={setSlug} />
          </div>
        )}
      </div>

      {/* Barre flottante : le seul element de la plateforme visible ici. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur">
          <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => navigate('/creer/site')}>
            <ArrowLeft size={14} /> Modifier
          </button>

          <span className="h-6 w-px bg-line" />

          <div className="flex items-center gap-0.5">
            {VIEWPORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={viewport === id}
                onClick={() => setViewport(id)}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  viewport === id ? 'bg-canvas text-ink' : 'text-subtle hover:text-ink'
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <span className="h-6 w-px bg-line" />

          <button type="button" className="btn-primary !py-2 text-xs" onClick={() => navigate('/creer/final')}>
            J'ai terminé <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
