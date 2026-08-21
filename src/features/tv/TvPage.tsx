import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Maximize2 } from 'lucide-react'
import type { Product, Project } from '@/engine/types'
import { getTheme } from '@/engine/themes'
import { readableOn, withAlpha } from '@/engine/color'
import { PRODUCT_TAG_LABEL } from '@/engine/catalog'
import { getPlan, moduleAllowed, planDefOf, upgradeOf } from '@/engine/plans'
import { createTokens, siteCssVars, type SiteTokens } from '@/renderer/tokens'
import { formatPrice } from '@/renderer/samples'
import { PlanUpgradeDialog } from '@/ui/PlanLock'
import { useProject } from '@/store/ProjectStore'

/**
 * Affichage TV (§24). Ecran 16:9 destine a une vitrine ou une salle : il lit le
 * meme projet que le site, avec des mises en page pensees pour etre lues de
 * loin. Trois layouts, choisis par le professionnel.
 */
type TvLayout = 'menu' | 'grid' | 'promo'

const LAYOUTS: { id: TvLayout; label: string; hint: string }[] = [
  { id: 'menu', label: 'Carte', hint: 'Colonnes par catégorie, pour un restaurant' },
  { id: 'grid', label: 'Grille', hint: 'Vitrine de produits avec images' },
  { id: 'promo', label: 'Mise en avant', hint: 'Un produit à la fois, en rotation' },
]

export default function TvPage() {
  const navigate = useNavigate()
  const { project } = useProject()
  const [layout, setLayout] = useState<TvLayout>(project.modules.includes('menu') ? 'menu' : 'grid')
  const [asking, setAsking] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  const theme = getTheme(project.themeId)
  const tokens = createTokens(theme, project.colors, 'tv', project.fontPair)
  // La formule (§60) peut fermer l'ecran TV. L'onglet et le format d'apercu
  // disparaissent alors du builder, mais /tv reste une route : sans cette garde,
  // il suffisait de la taper pour obtenir une fonctionnalite qu'on n'a pas
  // vendue. On n'affiche pas un mur : on explique et on propose la montee.
  const upgrade = upgradeOf(planDefOf(project))
  const closed = !moduleAllowed(getPlan(project), 'tv')

  function fullscreen() {
    shellRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  if (closed) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-8">
        <div className="card max-w-md p-6 text-center">
          <p className="text-lg font-bold text-ink">L'écran TV fait partie du {upgrade?.label.toLowerCase() ?? 'site sur mesure'}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Il affiche votre carte ou vos produits en 16:9, sur un écran de vitrine ou de salle.
            Votre formule actuelle ne le contient pas.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {upgrade && (
              <button type="button" className="btn-primary w-full" onClick={() => setAsking(true)}>
                Voir ce que change le {upgrade.label.toLowerCase()}
              </button>
            )}
            <button type="button" className="btn-ghost w-full" onClick={() => navigate('/creer/site')}>
              <ArrowLeft size={16} /> Retour au builder
            </button>
          </div>
        </div>
        {asking && (
          <PlanUpgradeDialog
            feature="L'écran TV"
            explain="Votre carte ou vos produits affichés en 16:9 sur un écran de vitrine ou de salle, mis à jour en même temps que votre site."
            onClose={() => setAsking(false)}
            onUpgraded={() => setAsking(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => navigate('/creer/site')}>
            <ArrowLeft size={14} /> Retour au builder
          </button>
          <div className="flex items-center gap-1 rounded-xl bg-canvas p-1">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                title={l.hint}
                onClick={() => setLayout(l.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  layout === l.id ? 'bg-surface text-ink shadow-sm' : 'text-subtle hover:text-ink'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary !py-2 text-xs" onClick={fullscreen}>
            <Maximize2 size={14} /> Plein écran
          </button>
        </div>
      </header>

      <main className="container-page py-6">
        <TvScreen screenRef={shellRef} project={project} tokens={tokens} layout={layout} />
        <p className="mt-3 text-xs text-subtle">
          Format 16:9. Sur place, cet écran s'affiche en plein écran sur une TV ou une tablette.
        </p>
      </main>
    </div>
  )
}

/** Ecran 16:9 mis a l'echelle pour tenir dans la page. */
function TvScreen({ screenRef, project, tokens, layout }: {
  screenRef: React.RefObject<HTMLDivElement>
  project: Project
  tokens: SiteTokens
  layout: TvLayout
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const BASE = 1920
  const scale = width ? width / BASE : 0.5

  return (
    <div ref={stageRef} style={{ height: (BASE * 9 / 16) * scale }} className="overflow-hidden rounded-2xl shadow-card">
      <div
        ref={screenRef}
        className="site-root"
        style={{
          ...siteCssVars(getThemeOf(project), project.colors, project.fontPair),
          width: BASE,
          height: BASE * 9 / 16,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: project.colors.background,
          overflow: 'hidden',
        }}
      >
        {layout === 'menu' && <MenuBoard project={project} tokens={tokens} />}
        {layout === 'grid' && <GridBoard project={project} tokens={tokens} />}
        {layout === 'promo' && <PromoBoard project={project} tokens={tokens} />}
      </div>
    </div>
  )
}

function getThemeOf(project: Project) {
  return getTheme(project.themeId)
}

function Header({ project, tokens, subtitle }: { project: Project; tokens: SiteTokens; subtitle: string }) {
  return (
    <header
      style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '40px 56px', background: project.colors.header,
        borderBottom: `2px solid ${withAlpha(project.colors.text, 0.1)}`,
      }}
    >
      <h1 style={{ ...tokens.heading(46), color: project.colors.primary }}>
        {project.identity.businessName || 'Votre entreprise'}
      </h1>
      <p style={{ fontSize: 24, color: withAlpha(project.colors.text, 0.6) }}>{subtitle}</p>
    </header>
  )
}

function visibleProducts(project: Project): Product[] {
  return project.products.filter((p) => !p.hidden)
}

/**
 * Pastille d'un produit sur l'ecran : lue de loin, elle ne garde que la
 * premiere etiquette — nouveaute ou offre en priorite.
 */
function TvTag({ project, item, size = 18 }: { project: Project; item: Product; size?: number }) {
  const tag = item.tags?.find((t) => t === 'new' || t === 'promo') ?? item.tags?.[0]
  if (!tag) return null
  return (
    <span
      style={{
        background: project.colors.accent, color: readableOn(project.colors.accent),
        fontSize: size, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
        padding: `${Math.round(size * 0.35)}px ${Math.round(size * 0.8)}px`, borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {PRODUCT_TAG_LABEL[tag]}
    </span>
  )
}

/** Prix courant et prix barre, a la taille demandee par la mise en page. */
function TvPrice({ project, item, size }: { project: Project; item: Product; size: number }) {
  if (!project.showPrices || item.price === null) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: Math.round(size * 0.4) }}>
      <span style={{ fontSize: size, fontWeight: 700, color: project.colors.primary }}>
        {formatPrice(item.price, project.currency)}
      </span>
      {item.oldPrice ? (
        <span style={{ fontSize: Math.round(size * 0.7), color: withAlpha(project.colors.text, 0.45), textDecoration: 'line-through' }}>
          {formatPrice(item.oldPrice, project.currency)}
        </span>
      ) : null}
    </span>
  )
}

function EmptyBoard({ tokens }: { tokens: SiteTokens }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: tokens.muted, fontSize: 28 }}>
      Ajoutez des produits pour alimenter cet écran.
    </div>
  )
}

/** Carte par categories, sur plusieurs colonnes. */
function MenuBoard({ project, tokens }: { project: Project; tokens: SiteTokens }) {
  const products = visibleProducts(project)
  if (!products.length) return <EmptyBoard tokens={tokens} />

  const groups = project.categories.length
    ? project.categories
        .map((c) => ({ name: c.name, items: products.filter((p) => p.categoryId === c.id) }))
        .filter((g) => g.items.length)
    : [{ name: 'Notre carte', items: products }]

  return (
    <>
      <Header project={project} tokens={tokens} subtitle={project.identity.tagline || 'Notre carte'} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, groups.length || 1)}, 1fr)`, gap: 48, padding: '40px 56px' }}>
        {groups.slice(0, 3).map((group) => (
          <div key={group.name}>
            <h2 style={{ ...tokens.heading(32), color: project.colors.primary, marginBottom: 22 }}>{group.name}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16 }}>
              {group.items.slice(0, 8).map((item) => (
                <li key={item.id} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 26, fontWeight: 600 }}>{item.name}</span>
                  <TvTag project={project} item={item} size={15} />
                  {item.kcal ? (
                    <span style={{ fontSize: 18, color: withAlpha(project.colors.text, 0.5) }}>{item.kcal} kcal</span>
                  ) : null}
                  <span style={{ flex: 1, borderBottom: `2px dotted ${withAlpha(project.colors.text, 0.25)}` }} />
                  <TvPrice project={project} item={item} size={26} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

/** Vitrine : grille d'images. */
function GridBoard({ project, tokens }: { project: Project; tokens: SiteTokens }) {
  const products = visibleProducts(project)
  if (!products.length) return <EmptyBoard tokens={tokens} />

  return (
    <>
      <Header project={project} tokens={tokens} subtitle={project.identity.city || ''} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, padding: '36px 56px' }}>
        {products.slice(0, 8).map((item, i) => (
          <article key={item.id} style={{ ...tokens.card(), overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: '4 / 3', background: withAlpha(project.colors.accent, 0.3) }}>
              {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {!item.imageUrl && (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: 44, opacity: 0.35 }}>{i + 1}</div>
              )}
              <span style={{ position: 'absolute', top: 16, left: 16 }}>
                <TvTag project={project} item={item} size={16} />
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{item.name}</p>
              <p style={{ marginTop: 6 }}>
                <TvPrice project={project} item={item} size={24} />
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

/** Un produit a la fois, en rotation lente. */
function PromoBoard({ project, tokens }: { project: Project; tokens: SiteTokens }) {
  const products = visibleProducts(project)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (products.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % products.length), 5000)
    return () => clearInterval(timer)
  }, [products.length])

  if (!products.length) return <EmptyBoard tokens={tokens} />
  const item = products[index % products.length]
  const onPrimary = readableOn(project.colors.primary)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
      <div style={{ background: project.colors.primary, color: onPrimary, padding: 72, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <p style={{ fontSize: 22, letterSpacing: '.2em', textTransform: 'uppercase', opacity: 0.8 }}>
            {project.identity.businessName || 'Notre sélection'}
          </p>
          <TvTag project={project} item={item} size={18} />
        </div>
        <h2 style={{ ...tokens.heading(72), color: onPrimary, marginTop: 24 }}>{item.name}</h2>
        {item.description && <p style={{ marginTop: 24, fontSize: 28, lineHeight: 1.5, opacity: 0.9 }}>{item.description}</p>}
        {project.showPrices && item.price !== null && (
          <p style={{ marginTop: 36, display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <span style={{ fontSize: 64, fontWeight: 800 }}>{formatPrice(item.price, project.currency)}</span>
            {item.oldPrice ? (
              <span style={{ fontSize: 40, opacity: 0.6, textDecoration: 'line-through' }}>
                {formatPrice(item.oldPrice, project.currency)}
              </span>
            ) : null}
          </p>
        )}
        {item.kcal ? <p style={{ marginTop: 16, fontSize: 24, opacity: 0.75 }}>{item.kcal} kcal</p> : null}
        {products.length > 1 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 44 }}>
            {products.slice(0, 8).map((_, i) => (
              <span key={i} style={{ width: 40, height: 5, borderRadius: 3, background: withAlpha(onPrimary, i === index % products.length ? 1 : 0.35) }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ background: withAlpha(project.colors.accent, 0.25) }}>
        {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
    </div>
  )
}
