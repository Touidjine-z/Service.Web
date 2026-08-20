import type { ReactNode } from 'react'
import type { Product, Project, Section } from '@/engine/types'
import { withAlpha } from '@/engine/color'
import type { SiteTokens } from './tokens'
import { resolveProps } from './sectionDefs'
import { catalogItems, formatPrice } from './samples'

/**
 * Rendu des 17 sections (§14). Aucune section ne connait de metier : elle lit
 * le projet et les tokens du theme, ce qui suffit a produire un rendu different
 * pour chaque combinaison (§48).
 */

interface Props {
  section: Section
  project: Project
  tokens: SiteTokens
  /** Fourni quand le site accepte les commandes (modules cart / order). */
  onAddToCart?: (product: Product) => void
}

type Bag = Record<string, unknown>
const str = (bag: Bag, key: string) => String(bag[key] ?? '')
const bool = (bag: Bag, key: string) => bag[key] !== false
const num = (bag: Bag, key: string, fallback: number) => Number(bag[key] ?? fallback) || fallback
const list = (bag: Bag, key: string) => (Array.isArray(bag[key]) ? (bag[key] as Bag[]) : [])

// --- briques communes ------------------------------------------------------

function Media({ tokens, ratio = '4 / 3', seed = 0, src, alt = '' }: {
  tokens: SiteTokens; ratio?: string; seed?: number; src?: string | null; alt?: string
}) {
  const { colors } = tokens
  const tints = [colors.primary, colors.accent, colors.secondary]
  const a = tints[seed % tints.length]
  const b = tints[(seed + 1) % tints.length]
  const frame: React.CSSProperties = { ...tokens.image(), aspectRatio: ratio, width: '100%' }

  if (src) {
    return (
      <div style={frame}>
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }
  return (
    <div
      style={{ ...frame, background: `linear-gradient(135deg, ${withAlpha(a, 0.55)}, ${withAlpha(b, 0.28)})` }}
      aria-hidden
    />
  )
}

function Head({ tokens, title, subtitle, align = 'left' }: {
  tokens: SiteTokens; title: string; subtitle?: string; align?: 'left' | 'center'
}) {
  if (!title && !subtitle) return null
  return (
    <div style={{ textAlign: align, marginBottom: `${tokens.scale(36)}px`, maxWidth: align === 'center' ? '640px' : undefined, marginInline: align === 'center' ? 'auto' : undefined }}>
      {title && <h2 style={tokens.heading(32)}>{title}</h2>}
      {subtitle && (
        <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(16)}px`, color: tokens.muted, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

const GAP: Record<string, number> = { tight: 12, normal: 24, loose: 40 }

function Grid({ tokens, columns, gap = 'normal', children }: {
  tokens: SiteTokens; columns: number; gap?: string; children: ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tokens.columns(columns)}, minmax(0, 1fr))`,
        gap: `${tokens.scale(GAP[gap] ?? 24)}px`,
      }}
    >
      {children}
    </div>
  )
}

function Btn({ tokens, label, variant = 'primary' }: { tokens: SiteTokens; label: string; variant?: 'primary' | 'secondary' }) {
  if (!label) return null
  return <span style={tokens.button(variant)}>{label}</span>
}

function Field({ tokens, label, lines = 1 }: { tokens: SiteTokens; label: string; lines?: number }) {
  return (
    <label style={{ display: 'block', fontSize: `${tokens.scale(13)}px`, color: tokens.muted }}>
      {label}
      <div
        style={{
          marginTop: '6px',
          height: `${tokens.scale(lines > 1 ? 92 : 42)}px`,
          borderRadius: tokens.radius,
          border: `1px solid ${tokens.divider}`,
          background: withAlpha(tokens.colors.card, 0.9),
        }}
      />
    </label>
  )
}

// --- sections --------------------------------------------------------------

function Hero({ project, tokens, bag }: Props & { bag: Bag }) {
  const { theme, colors } = tokens
  const layout = theme.hero
  const title = str(bag, 'title')
  const subtitle = str(bag, 'subtitle')
  const showImage = bool(bag, 'showImage')
  const overlaid = layout === 'fullbleed' || layout === 'overlay'
  const centered = layout === 'centered' || layout === 'overlay' || layout === 'stacked'

  const background =
    layout === 'fullbleed' ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
    : layout === 'overlay' ? `linear-gradient(${withAlpha(colors.text, 0.55)}, ${withAlpha(colors.text, 0.6)}), linear-gradient(120deg, ${colors.primary}, ${colors.accent})`
    : layout === 'boxed' ? colors.card
    : 'transparent'

  const copy = (
    <div style={{ maxWidth: centered ? '720px' : undefined, marginInline: centered ? 'auto' : undefined, textAlign: centered ? 'center' : 'left' }}>
      {layout === 'editorial' && (
        <p style={{ fontSize: `${tokens.scale(13)}px`, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.7, marginBottom: `${tokens.scale(14)}px` }}>
          {project.identity.city || 'Votre ville'}
        </p>
      )}
      <h1 style={tokens.heading(layout === 'editorial' ? 56 : 46)}>{title}</h1>
      <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(17)}px`, lineHeight: 1.6, opacity: overlaid ? 0.92 : 0.75 }}>
        {subtitle}
      </p>
      <div style={{ marginTop: `${tokens.scale(26)}px`, display: 'flex', gap: '12px', justifyContent: centered ? 'center' : undefined, flexWrap: 'wrap' }}>
        <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
        <Btn tokens={tokens} label={str(bag, 'ctaSecondaryLabel')} variant="secondary" />
      </div>
    </div>
  )

  return (
    <section style={{ background, color: overlaid ? tokens.onPrimary : colors.text, paddingBlock: `${tokens.sectionY}px` }}>
      <div style={tokens.container()}>
        {layout === 'split' && showImage ? (
          <div style={{ display: 'grid', gridTemplateColumns: tokens.viewport === 'mobile' ? '1fr' : '1.1fr 1fr', gap: `${tokens.scale(40)}px`, alignItems: 'center' }}>
            {copy}
            <Media tokens={tokens} ratio="5 / 4" src={str(bag, 'imageUrl') || null} />
          </div>
        ) : layout === 'stacked' && showImage ? (
          <div style={{ display: 'grid', gap: `${tokens.scale(32)}px` }}>
            {copy}
            <Media tokens={tokens} ratio="16 / 7" src={str(bag, 'imageUrl') || null} />
          </div>
        ) : (
          copy
        )}
      </div>
    </section>
  )
}

function Shell({ tokens, bag, children }: { tokens: SiteTokens; bag: Bag; children: ReactNode }) {
  const tone = (str(bag, 'tone') || 'default') as 'default' | 'alt' | 'accent'
  return (
    <section style={tokens.section(tone)}>
      <div style={tokens.container()}>{children}</div>
    </section>
  )
}

function About({ tokens, bag }: Props & { bag: Bag }) {
  const twoCols = bool(bag, 'showImage') && tokens.viewport !== 'mobile'
  return (
    <Shell tokens={tokens} bag={bag}>
      <div style={{ display: 'grid', gridTemplateColumns: twoCols ? '1fr 1fr' : '1fr', gap: `${tokens.scale(40)}px`, alignItems: 'center' }}>
        <div>
          <h2 style={tokens.heading(32)}>{str(bag, 'title')}</h2>
          <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(16)}px`, lineHeight: 1.75, color: tokens.muted }}>
            {str(bag, 'text')}
          </p>
        </div>
        {twoCols && <Media tokens={tokens} ratio="4 / 3" seed={1} src={str(bag, 'imageUrl') || null} />}
      </div>
    </Shell>
  )
}

const RATIO: Record<string, string> = { square: '1 / 1', landscape: '4 / 3', portrait: '3 / 4' }
const CARD_PADDING: Record<string, number> = { sm: 14, md: 18, lg: 26 }
const CARD_TITLE: Record<string, number> = { sm: 16, md: 18, lg: 22 }

function CatalogGrid({ project, tokens, bag, kind, onAddToCart }: Props & { bag: Bag; kind: 'services' | 'products' | 'portfolio' | 'gallery' }) {
  const grid = project.grid
  const items = catalogItems(project, kind)
  const columns = num(bag, 'columns', grid.columns)
  const align = grid.align === 'center' ? 'center' : 'left'
  const showPrice = project.showPrices && (kind === 'products' || kind === 'services')
  const ratio = kind === 'gallery' ? RATIO[grid.imageRatio] ?? '1 / 1' : RATIO[grid.imageRatio] ?? '4 / 3'

  // Regroupement par categorie (§15) : seulement si le client a defini des
  // categories et que la section le demande.
  const grouped =
    kind === 'products' && bool(bag, 'groupByCategory') && project.categories.length > 0 && project.products.length > 0

  const card = (item: ReturnType<typeof catalogItems>[number], i: number) => (
    <article key={item.id} style={{ ...tokens.card(), display: 'flex', flexDirection: 'column', textAlign: align }}>
      <Media tokens={tokens} ratio={ratio} seed={i} src={item.imageUrl} alt={item.name} />
      {kind !== 'gallery' && (
        <div style={{ padding: `${tokens.scale(CARD_PADDING[grid.cardSize] ?? 18)}px` }}>
          <h3 style={tokens.heading(CARD_TITLE[grid.cardSize] ?? 18)}>{item.name}</h3>
          {item.description && (
            <p style={{ marginTop: '6px', fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: tokens.muted }}>
              {item.description}
            </p>
          )}
          {showPrice && item.price !== null && (
            <p style={{ marginTop: `${tokens.scale(12)}px`, fontWeight: 700, color: tokens.colors.primary, fontSize: `${tokens.scale(16)}px` }}>
              {formatPrice(item.price, project.currency)}
            </p>
          )}
          {kind === 'products' && onAddToCart && !item.sample && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                const product = project.products.find((p) => p.id === item.id)
                if (product) onAddToCart(product)
              }}
              style={{ ...tokens.button(), marginTop: `${tokens.scale(14)}px`, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Ajouter
            </button>
          )}
        </div>
      )}
      {kind === 'gallery' && item.name && (
        <div style={{ padding: `${tokens.scale(12)}px` }}>
          <p style={{ fontSize: `${tokens.scale(14)}px`, fontWeight: 600 }}>{item.name}</p>
        </div>
      )}
    </article>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align={align} />

      {grouped ? (
        <div style={{ display: 'grid', gap: `${tokens.scale(44)}px` }}>
          {project.categories.map((category) => {
            const inCategory = project.products.filter((p) => !p.hidden && p.categoryId === category.id)
            if (!inCategory.length) return null
            return (
              <div key={category.id}>
                <h3 style={{ ...tokens.heading(22), marginBottom: `${tokens.scale(18)}px` }}>{category.name}</h3>
                <Grid tokens={tokens} columns={columns} gap={grid.gap}>
                  {inCategory.map((p, i) =>
                    card({ id: p.id, name: p.name, description: p.description, price: p.price, imageUrl: p.imageUrl, sample: false }, i),
                  )}
                </Grid>
              </div>
            )
          })}
        </div>
      ) : (
        <Grid tokens={tokens} columns={columns} gap={grid.gap}>
          {items.map(card)}
        </Grid>
      )}
    </Shell>
  )
}

function Testimonials({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} align="center" />
      <Grid tokens={tokens} columns={3}>
        {items.map((item, i) => (
          <blockquote key={i} style={{ ...tokens.card(), padding: `${tokens.scale(24)}px`, margin: 0 }}>
            <p style={{ fontSize: `${tokens.scale(16)}px`, lineHeight: 1.7 }}>« {String(item.quote ?? '')} »</p>
            <footer style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(14)}px`, color: tokens.muted }}>
              <strong style={{ color: tokens.colors.text }}>{String(item.author ?? '')}</strong>
              {item.role ? ` — ${String(item.role)}` : ''}
            </footer>
          </blockquote>
        ))}
      </Grid>
    </Shell>
  )
}

function Faq({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} align="center" />
      <div style={{ maxWidth: '760px', marginInline: 'auto', display: 'grid', gap: `${tokens.scale(14)}px` }}>
        {items.map((item, i) => (
          <div key={i} style={{ ...tokens.card(), padding: `${tokens.scale(18)}px` }}>
            <h3 style={tokens.heading(17)}>{String(item.question ?? '')}</h3>
            <p style={{ marginTop: '8px', fontSize: `${tokens.scale(15)}px`, lineHeight: 1.65, color: tokens.muted }}>
              {String(item.answer ?? '')}
            </p>
          </div>
        ))}
      </div>
    </Shell>
  )
}

function Pricing({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={items.length || 3}>
        {items.map((item, i) => (
          <div key={i} style={{ ...tokens.card(), padding: `${tokens.scale(26)}px`, textAlign: 'center' }}>
            <h3 style={tokens.heading(20)}>{String(item.name ?? '')}</h3>
            <p style={{ ...tokens.heading(30), marginTop: `${tokens.scale(12)}px`, color: tokens.colors.primary }}>
              {String(item.price ?? '')}
            </p>
            <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: tokens.muted }}>
              {String(item.description ?? '')}
            </p>
          </div>
        ))}
      </Grid>
    </Shell>
  )
}

const DAY_LABEL: Record<string, string> = {
  lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche',
}

function Hours({ project, tokens, bag }: Props & { bag: Bag }) {
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} align="center" />
      <div style={{ maxWidth: '520px', marginInline: 'auto', ...tokens.card(), padding: `${tokens.scale(22)}px` }}>
        {project.identity.hours.map((h) => (
          <div
            key={h.day}
            style={{
              display: 'flex', justifyContent: 'space-between', gap: '16px',
              padding: `${tokens.scale(9)}px 0`, borderBottom: `1px solid ${tokens.divider}`,
              fontSize: `${tokens.scale(15)}px`,
            }}
          >
            <span>{DAY_LABEL[h.day]}</span>
            <span style={{ color: h.closed ? tokens.muted : tokens.colors.text, fontWeight: h.closed ? 400 : 600 }}>
              {h.closed ? 'Fermé' : `${h.open} – ${h.close}`}
            </span>
          </div>
        ))}
        {str(bag, 'note') && (
          <p style={{ marginTop: `${tokens.scale(14)}px`, fontSize: `${tokens.scale(13)}px`, color: tokens.muted }}>{str(bag, 'note')}</p>
        )}
      </div>
    </Shell>
  )
}

function MapBlock({ project, tokens }: { project: Project; tokens: SiteTokens }) {
  return (
    <div
      style={{
        ...tokens.image(),
        aspectRatio: '16 / 9',
        display: 'grid',
        placeItems: 'center',
        background: `repeating-linear-gradient(45deg, ${withAlpha(tokens.colors.secondary, 0.12)} 0 12px, ${withAlpha(tokens.colors.secondary, 0.05)} 12px 24px)`,
        color: tokens.muted,
        fontSize: `${tokens.scale(14)}px`,
      }}
    >
      {project.identity.city || 'Plan de votre adresse'}
    </div>
  )
}

function Location({ project, tokens, bag }: Props & { bag: Bag }) {
  const { identity } = project
  const showMap = bool(bag, 'showMap')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} />
      <div style={{ display: 'grid', gridTemplateColumns: showMap && tokens.viewport !== 'mobile' ? '1fr 1.2fr' : '1fr', gap: `${tokens.scale(28)}px`, alignItems: 'center' }}>
        <div style={{ fontSize: `${tokens.scale(15)}px`, lineHeight: 1.9, color: tokens.muted }}>
          <p style={{ color: tokens.colors.text, fontWeight: 600 }}>{identity.businessName || 'Votre entreprise'}</p>
          <p>{identity.address || 'Votre adresse'}</p>
          <p>{identity.city || 'Votre ville'}</p>
          {identity.serviceArea && <p>Zone d'intervention : {identity.serviceArea}</p>}
          {identity.phone && <p>{identity.phone}</p>}
          {str(bag, 'note') && <p>{str(bag, 'note')}</p>}
        </div>
        {showMap && <MapBlock project={project} tokens={tokens} />}
      </div>
    </Shell>
  )
}

function Contact({ project, tokens, bag }: Props & { bag: Bag }) {
  const { identity } = project
  const showForm = bool(bag, 'showForm')
  const showDetails = bool(bag, 'showDetails')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} />
      <div style={{ display: 'grid', gridTemplateColumns: showForm && showDetails && tokens.viewport !== 'mobile' ? '1fr 1fr' : '1fr', gap: `${tokens.scale(32)}px` }}>
        {showForm && (
          <div style={{ ...tokens.card(), padding: `${tokens.scale(24)}px`, display: 'grid', gap: `${tokens.scale(14)}px` }}>
            <Field tokens={tokens} label="Nom" />
            <Field tokens={tokens} label="Email" />
            <Field tokens={tokens} label="Message" lines={3} />
            <Btn tokens={tokens} label="Envoyer" />
          </div>
        )}
        {showDetails && (
          <div style={{ fontSize: `${tokens.scale(15)}px`, lineHeight: 2, color: tokens.muted }}>
            {identity.phone && <p><strong style={{ color: tokens.colors.text }}>Téléphone</strong> — {identity.phone}</p>}
            {identity.email && <p><strong style={{ color: tokens.colors.text }}>Email</strong> — {identity.email}</p>}
            {identity.address && <p><strong style={{ color: tokens.colors.text }}>Adresse</strong> — {identity.address} {identity.city}</p>}
            {!identity.phone && !identity.email && <p>Renseignez vos coordonnées dans l'onglet Informations.</p>}
          </div>
        )}
      </div>
    </Shell>
  )
}

function FormSection({ tokens, bag, fields }: { tokens: SiteTokens; bag: Bag; fields: [string, number][] }) {
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <div style={{ maxWidth: '620px', marginInline: 'auto', ...tokens.card(), padding: `${tokens.scale(26)}px`, display: 'grid', gap: `${tokens.scale(14)}px` }}>
        {fields.map(([label, lines]) => (
          <Field key={label} tokens={tokens} label={label} lines={lines} />
        ))}
        <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
      </div>
    </Shell>
  )
}

function Cta({ tokens, bag }: Props & { bag: Bag }) {
  const tone = (str(bag, 'tone') || 'accent') as 'default' | 'alt' | 'accent'
  return (
    <section style={tokens.section(tone)}>
      <div style={{ ...tokens.container(), textAlign: 'center' }}>
        <h2 style={tokens.heading(30)}>{str(bag, 'title')}</h2>
        <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(16)}px`, opacity: 0.85 }}>{str(bag, 'subtitle')}</p>
        <div style={{ marginTop: `${tokens.scale(22)}px` }}>
          <span style={{ ...tokens.button(), ...(tone === 'accent' ? { background: tokens.colors.background, color: tokens.colors.primary, backgroundImage: undefined } : null) }}>
            {str(bag, 'ctaLabel')}
          </span>
        </div>
      </div>
    </section>
  )
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube',
}

function Social({ project, tokens, bag }: Props & { bag: Bag }) {
  const entries = Object.entries(project.identity.social).filter(([, v]) => v)
  const shown = entries.length ? entries.map(([k]) => SOCIAL_LABELS[k] ?? k) : ['Facebook', 'Instagram']
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} align="center" />
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {shown.map((label) => (
          <span key={label} style={tokens.button('secondary')}>{label}</span>
        ))}
      </div>
    </Shell>
  )
}

function MapSection({ project, tokens, bag }: Props & { bag: Bag }) {
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} />
      <MapBlock project={project} tokens={tokens} />
    </Shell>
  )
}

export default function SectionView(props: Props) {
  const bag = resolveProps(props.section, props.project)
  switch (props.section.kind) {
    case 'hero': return <Hero {...props} bag={bag} />
    case 'about': return <About {...props} bag={bag} />
    case 'services': return <CatalogGrid {...props} bag={bag} kind="services" />
    case 'products': return <CatalogGrid {...props} bag={bag} kind="products" />
    case 'portfolio': return <CatalogGrid {...props} bag={bag} kind="portfolio" />
    case 'gallery': return <CatalogGrid {...props} bag={bag} kind="gallery" />
    case 'testimonials': return <Testimonials {...props} bag={bag} />
    case 'faq': return <Faq {...props} bag={bag} />
    case 'pricing': return <Pricing {...props} bag={bag} />
    case 'hours': return <Hours {...props} bag={bag} />
    case 'location': return <Location {...props} bag={bag} />
    case 'contact': return <Contact {...props} bag={bag} />
    case 'quote': return <FormSection tokens={props.tokens} bag={bag} fields={[['Nom', 1], ['Email', 1], ['Téléphone', 1], ['Votre projet', 3]]} />
    case 'booking': return <FormSection tokens={props.tokens} bag={bag} fields={[['Nom', 1], ['Téléphone', 1], ['Date souhaitée', 1], ['Précisions', 2]]} />
    case 'cta': return <Cta {...props} bag={bag} />
    case 'social': return <Social {...props} bag={bag} />
    case 'map': return <MapSection {...props} bag={bag} />
  }
}
