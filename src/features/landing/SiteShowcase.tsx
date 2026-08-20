import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Monitor, Pause, Play, Smartphone, Tablet } from 'lucide-react'
import type { Project, ThemeId, Viewport } from '@/engine/types'
import { applyActivity, applyTheme, createEmptyProject } from '@/engine/project'
import { getTheme } from '@/engine/themes'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { Reveal, useReducedMotion } from '@/ui/motion'

/**
 * Demonstration du hero (§4).
 *
 * Ce n'est ni une capture d'ecran ni une maquette dessinee : le moteur
 * construit un vrai projet — metier, modules, pages, contenu d'exemple — et
 * `SiteRenderer` le rend exactement comme dans le parcours, a l'echelle. Le
 * visiteur voit donc le produit, pas une promesse, et la vitrine ne peut pas
 * mentir sur ce que la plateforme sait faire.
 */

interface Demo {
  activityId: string
  themeId: ThemeId
  businessName: string
  tagline: string
  city: string
}

const DEMOS: Demo[] = [
  { activityId: 'restaurant', themeId: 'fresh', businessName: "La Table d'Ambre", tagline: 'Cuisine de saison, produits du marché', city: 'Bordeaux' },
  { activityId: 'snack', themeId: 'bold', businessName: 'Braise & Co', tagline: 'Burgers grillés, frites maison, livraison en 30 min', city: 'Marseille' },
  { activityId: 'menuisier', themeId: 'nature', businessName: 'Atelier Verrier', tagline: 'Meubles et agencements sur mesure', city: 'Blois' },
  { activityId: 'coiffeur', themeId: 'luxury', businessName: 'Studio Neuf', tagline: 'Coupe, couleur et soin du cheveu', city: 'Lyon' },
  { activityId: 'photographe', themeId: 'minimal', businessName: 'Claire Vidal', tagline: 'Portraits, mariages et reportages', city: 'Nantes' },
  { activityId: 'garage', themeId: 'urban', businessName: 'Garage Central', tagline: 'Entretien, réparation et carrosserie', city: 'Lille' },
  { activityId: 'avocat', themeId: 'classic', businessName: 'Cabinet Merle', tagline: 'Droit des affaires et du travail', city: 'Paris' },
]

const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'tablet', label: 'Tablette', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

/** Projet complet construit par le moteur, comme si un client venait de le creer. */
function buildDemo(demo: Demo): Project {
  const base = applyActivity(createEmptyProject(), demo.activityId)
  const themed = applyTheme(base, demo.themeId, false)
  return {
    ...themed,
    identity: {
      ...themed.identity,
      businessName: demo.businessName,
      tagline: demo.tagline,
      city: demo.city,
      phone: '01 23 45 67 89',
      email: `contact@${demo.businessName.toLowerCase().replace(/[^a-z]+/g, '')}.fr`,
    },
  }
}

const ROTATION_MS = 5200

export default function SiteShowcase() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % DEMOS.length), ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [playing, reduced])

  const demo = DEMOS[index]
  const project = useMemo(() => buildDemo(demo), [demo])
  const page = project.pages.find((p) => p.isHome) ?? project.pages[0]
  const theme = getTheme(demo.themeId)

  return (
    <Reveal delay={380} zoom>
      <div className="mx-auto mt-14 max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
          {VIEWPORTS.map((item) => {
            const active = item.id === viewport
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewport(item.id)}
                aria-pressed={active}
                className={[
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  active ? 'bg-ink text-white' : 'text-subtle hover:bg-canvas hover:text-ink',
                ].join(' ')}
              >
                <item.icon size={13} /> {item.label}
              </button>
            )
          })}
          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-subtle transition hover:bg-canvas hover:text-ink"
            aria-label={playing ? 'Mettre en pause la démonstration' : 'Reprendre la démonstration'}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause' : 'Lecture'}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 flex-1 truncate rounded-md bg-surface px-3 py-1 text-[11px] text-subtle">
              {demo.businessName.toLowerCase().replace(/[^a-z]+/g, '-')}.fr
            </span>
            <span className="hidden shrink-0 text-[11px] font-medium text-subtle sm:block">
              Design {theme.name}
            </span>
          </div>

          <ScaledSite project={project} page={page} viewport={viewport} demoKey={`${demo.activityId}-${viewport}`} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {DEMOS.map((item, i) => (
            <button
              key={item.activityId}
              type="button"
              onClick={() => { setIndex(i); setPlaying(false) }}
              className={[
                'text-xs font-medium transition',
                i === index ? 'text-ink' : 'text-subtle hover:text-muted',
              ].join(' ')}
            >
              <span className={`mr-1.5 inline-block h-1.5 rounded-full align-middle transition-all duration-300 ${i === index ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`} />
              {item.businessName}
            </button>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

/**
 * Rend le site a sa vraie largeur puis le met a l'echelle du cadre. Une capture
 * a la bonne taille serait floue ou tronquee : ici, chaque texte reste net et
 * la mise en page est celle qu'obtiendra le client.
 */
function ScaledSite({ project, page, viewport, demoKey }: {
  project: Project; page: Project['pages'][number]; viewport: Viewport; demoKey: string
}) {
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const siteRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [siteHeight, setSiteHeight] = useState(0)

  const deviceWidth = VIEWPORT_WIDTH[viewport]
  // Sur mobile et tablette l'appareil est centre dans le cadre plutot qu'etire.
  const targetWidth = viewport === 'desktop' ? width : Math.min(width, viewport === 'tablet' ? width * 0.7 : width * 0.32)
  const scale = targetWidth ? targetWidth / deviceWidth : 0
  const mounted = scale > 0

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // `mounted` fait partie des dependances : le site n'est monte qu'une fois la
  // largeur du cadre connue, sinon l'observateur s'attacherait a un ref vide.
  useLayoutEffect(() => {
    const site = siteRef.current
    if (!site) return
    const observer = new ResizeObserver(([entry]) => setSiteHeight(entry.contentRect.height))
    observer.observe(site)
    return () => observer.disconnect()
  }, [demoKey, mounted])

  const frameHeight = width ? Math.round((width * 10) / 16) : 420

  // Hauteur visible ramenee a l'echelle du site, puis course restante : le
  // balayage s'arrete exactement en bas de page, sans zone vide.
  const visibleHeight = scale ? frameHeight / scale : 0
  const pan = Math.max(0, Math.round(siteHeight - visibleHeight))

  return (
    <div ref={stageRef} className="relative overflow-hidden bg-canvas" style={{ height: frameHeight }}>
      {scale > 0 && (
        <div
          key={demoKey}
          className="absolute left-1/2 top-0 animate-fade-in"
          style={{ width: deviceWidth, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}
        >
          {/* Balayage lent de la page : le visiteur voit le site entier sans
              avoir a defiler, et l'animation s'arrete si le systeme le demande. */}
          <div
            ref={siteRef}
            style={pan > 0 && !reduced ? {
              animation: 'showcase-pan 11s ease-in-out infinite alternate',
              ['--showcase-pan' as string]: `-${pan}px`,
            } : undefined}
          >
            {/* Animations d'entree coupees : la vignette doit etre lisible des la
                premiere image, sans dependre du defilement de la page. */}
            <SiteRenderer project={project} page={page} viewport={viewport} animate={false} />
          </div>
        </div>
      )}
    </div>
  )
}
