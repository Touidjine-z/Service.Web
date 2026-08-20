import { useRef, useState, type ReactNode } from 'react'
import type { Product, ProductTag, Project, Section } from '@/engine/types'
import { readableOn, withAlpha } from '@/engine/color'
import { ALLERGENS, PRODUCT_TAG_LABEL } from '@/engine/catalog'
import type { SiteTokens } from './tokens'
import { isFluid, isTableService, resolveBlocks, resolveProps } from './sectionDefs'
import { BlockStack } from './Blocks'
import BlockGrid from './BlockGrid'
import { catalogItems, formatPrice, groupByCategory, type CatalogEntry } from './samples'
import { Appear, Count, useSiteMotion } from './Motion'

/**
 * Rendu des 30 sections (§14). Aucune section ne connait de metier : elle lit
 * le projet et les tokens du theme, ce qui suffit a produire un rendu different
 * pour chaque combinaison (§48).
 *
 * Les six dernieres — chiffres, methode, equipe, references, avant/apres,
 * bandeau — sont les briques de reassurance qu'on trouve sur les sites
 * d'agence. Elles suivent exactement les memes regles : aucun style en dur,
 * tout passe par les tokens, et l'animation par `theme.motion`.
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
        <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(16)}px`, color: 'currentColor', opacity: 0.68, lineHeight: 1.6 }}>
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
    <label style={{ display: 'block', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
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

function Hero({ section, project, tokens, bag }: Props & { bag: Bag }) {
  const { theme, colors } = tokens
  const layout = theme.hero
  const title = str(bag, 'title')
  const subtitle = str(bag, 'subtitle')
  const showImage = bool(bag, 'showImage')
  const overlaid = layout === 'fullbleed' || layout === 'overlay'
  // Le voile doit toujours ASSOMBRIR : sur un theme sombre, la couleur du
  // texte est claire et l'ancien voile eclaircissait le hero.
  const veil = theme.dark ? colors.background : colors.text
  const centered = layout === 'centered' || layout === 'overlay' || layout === 'stacked'

  const background =
    layout === 'fullbleed' ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
    : layout === 'overlay' ? `linear-gradient(${withAlpha(veil, 0.55)}, ${withAlpha(veil, 0.6)}), linear-gradient(120deg, ${colors.primary}, ${colors.accent})`
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
      <BlockStack
        blocks={resolveBlocks(section)}
        project={project}
        tokens={tokens}
        align={centered ? 'center' : 'left'}
        accent={overlaid ? 'currentColor' : undefined}
        style={{ marginTop: `${tokens.scale(28)}px` }}
      />
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

function About({ section, project, tokens, bag }: Props & { bag: Bag }) {
  const twoCols = bool(bag, 'showImage') && tokens.viewport !== 'mobile'
  const onAccent = str(bag, 'tone') === 'accent'
  return (
    <Shell tokens={tokens} bag={bag}>
      <div style={{ display: 'grid', gridTemplateColumns: twoCols ? '1fr 1fr' : '1fr', gap: `${tokens.scale(40)}px`, alignItems: 'center' }}>
        <div>
          <h2 style={tokens.heading(32)}>{str(bag, 'title')}</h2>
          <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(16)}px`, lineHeight: 1.75, color: 'currentColor', opacity: 0.68 }}>
            {str(bag, 'text')}
          </p>
          <BlockStack
            blocks={resolveBlocks(section)}
            project={project}
            tokens={tokens}
            accent={onAccent ? 'currentColor' : undefined}
            style={{ marginTop: `${tokens.scale(24)}px` }}
          />
        </div>
        {twoCols && <Media tokens={tokens} ratio="4 / 3" seed={1} src={str(bag, 'imageUrl') || null} />}
      </div>
    </Shell>
  )
}

const RATIO: Record<string, string> = { square: '1 / 1', landscape: '4 / 3', portrait: '3 / 4' }
const CARD_PADDING: Record<string, number> = { sm: 14, md: 18, lg: 26 }
const CARD_TITLE: Record<string, number> = { sm: 16, md: 18, lg: 22 }

/** Pastilles d'un produit, comme sur les cartes des enseignes. */
function TagPills({ tokens, tags }: { tokens: SiteTokens; tags?: ProductTag[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: `${tokens.scale(8)}px` }}>
      {tags.map((tag) => {
        const strong = tag === 'new' || tag === 'promo'
        return (
          <span
            key={tag}
            style={{
              fontSize: `${tokens.scale(10)}px`, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              padding: `${tokens.scale(4)}px ${tokens.scale(9)}px`, borderRadius: '999px',
              background: strong ? tokens.colors.accent : withAlpha(tokens.colors.primary, 0.12),
              color: strong ? readableOn(tokens.colors.accent) : tokens.colors.primary,
            }}
          >
            {PRODUCT_TAG_LABEL[tag]}
          </span>
        )
      })}
    </div>
  )
}

/** Prix courant, prix barre et calories : la ligne d'information d'une carte. */
function PriceLine({ project, tokens, item, size = 16 }: {
  project: Project; tokens: SiteTokens; item: CatalogEntry; size?: number
}) {
  if (!project.showPrices || item.price === null) return null
  return (
    <p style={{ marginTop: `${tokens.scale(12)}px`, display: 'flex', alignItems: 'baseline', gap: `${tokens.scale(10)}px`, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, color: tokens.colors.primary, fontSize: `${tokens.scale(size)}px` }}>
        {formatPrice(item.price, project.currency)}
      </span>
      {item.oldPrice ? (
        <span style={{ fontSize: `${tokens.scale(size - 3)}px`, color: 'currentColor', opacity: 0.68, textDecoration: 'line-through' }}>
          {formatPrice(item.oldPrice, project.currency)}
        </span>
      ) : null}
      {item.kcal ? (
        <span style={{ fontSize: `${tokens.scale(size - 4)}px`, color: 'currentColor', opacity: 0.68 }}>{item.kcal} kcal</span>
      ) : null}
    </p>
  )
}

function AddButton({ project, tokens, item, onAddToCart }: {
  project: Project; tokens: SiteTokens; item: CatalogEntry; onAddToCart?: (product: Product) => void
}) {
  if (!onAddToCart || item.sample) return null
  return (
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
  )
}

function CatalogCard({ project, tokens, item, index, kind, align, ratio, onAddToCart }: {
  project: Project; tokens: SiteTokens; item: CatalogEntry; index: number
  kind: 'services' | 'products' | 'portfolio' | 'gallery'
  align: 'left' | 'center'; ratio: string; onAddToCart?: (product: Product) => void
}) {
  const { grid } = project
  return (
    <Appear index={index} as="article" style={{ ...tokens.card(), display: 'flex', flexDirection: 'column', textAlign: align }}>
      <Media tokens={tokens} ratio={ratio} seed={index} src={item.imageUrl} alt={item.name} />
      {kind !== 'gallery' && (
        <div style={{ padding: `${tokens.scale(CARD_PADDING[grid.cardSize] ?? 18)}px` }}>
          <TagPills tokens={tokens} tags={item.tags} />
          <h3 style={tokens.heading(CARD_TITLE[grid.cardSize] ?? 18)}>{item.name}</h3>
          {item.description && (
            <p style={{ marginTop: '6px', fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
              {item.description}
            </p>
          )}
          <PriceLine project={project} tokens={tokens} item={item} />
          {kind === 'products' && <AddButton project={project} tokens={tokens} item={item} onAddToCart={onAddToCart} />}
        </div>
      )}
      {kind === 'gallery' && item.name && (
        <div style={{ padding: `${tokens.scale(12)}px` }}>
          <p style={{ fontSize: `${tokens.scale(14)}px`, fontWeight: 600 }}>{item.name}</p>
        </div>
      )}
    </Appear>
  )
}

/**
 * Carte a onglets : barre de categories collante puis grandes cartes produit,
 * la mise en page des sites de restauration rapide. Elle reste generique — une
 * boutique ou une epicerie peuvent la choisir.
 */
function MenuTabs({ project, tokens, items, columns, renderCard }: {
  project: Project; tokens: SiteTokens; items: CatalogEntry[]; columns: number
  renderCard: (item: CatalogEntry, index: number) => ReactNode
}) {
  const [active, setActive] = useState('')
  // La barre d'onglets est une commande de navigation : elle prend la forme des
  // boutons du theme (pilule, arrondi ou franc) plutot qu'une valeur en dur.
  const shape = String(tokens.button().borderRadius ?? tokens.radius)
  const names = groupByCategory(items).map((group) => group.name).filter(Boolean)
  const tabs = ['', ...names]
  const current = tabs.includes(active) ? active : ''
  const shown = current ? items.filter((item) => (item.category?.trim() || '') === current) : items

  return (
    <>
      {tabs.length > 1 && (
        <div
          style={{
            position: 'sticky', top: 0, zIndex: 1,
            marginBottom: `${tokens.scale(28)}px`, padding: `${tokens.scale(7)}px`,
            display: 'flex', gap: `${tokens.scale(6)}px`, overflowX: 'auto',
            background: tokens.colors.card, border: `1px solid ${tokens.divider}`, borderRadius: shape,
          }}
        >
          {tabs.map((tab) => {
            const on = tab === current
            return (
              <button
                key={tab || 'all'}
                type="button"
                onClick={(event) => { event.stopPropagation(); setActive(tab) }}
                style={{
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  padding: `${tokens.scale(9)}px ${tokens.scale(18)}px`, borderRadius: shape,
                  background: on ? tokens.colors.primary : 'transparent',
                  color: on ? tokens.onPrimary : tokens.muted,
                  fontWeight: 600, fontSize: `${tokens.scale(14)}px`,
                }}
              >
                {tab || 'Tout'}
              </button>
            )
          })}
        </div>
      )}
      <Grid tokens={tokens} columns={columns} gap={project.grid.gap}>
        {shown.map(renderCard)}
      </Grid>
    </>
  )
}

/** Ardoise : la carte en liste, prix aligne a droite, comme au restaurant. */
function Slate({ project, tokens, groups }: {
  project: Project; tokens: SiteTokens; groups: { name: string; items: CatalogEntry[] }[]
}) {
  return (
    <div style={{ display: 'grid', gap: `${tokens.scale(40)}px` }}>
      {groups.map((group, g) => (
        <div key={group.name || g}>
          {group.name && (
            <h3 style={{ ...tokens.heading(22), marginBottom: `${tokens.scale(18)}px` }}>{group.name}</h3>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: tokens.viewport === 'mobile' ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              columnGap: `${tokens.scale(48)}px`, rowGap: `${tokens.scale(22)}px`,
            }}
          >
            {group.items.map((item, i) => (
              <Appear key={item.id} index={i}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: `${tokens.scale(10)}px` }}>
                  <span style={{ ...tokens.heading(17) }}>{item.name}</span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${tokens.divider}`, transform: 'translateY(-5px)' }} />
                  {project.showPrices && item.price !== null && (
                    <span style={{ fontWeight: 700, color: tokens.colors.primary, fontSize: `${tokens.scale(16)}px` }}>
                      {formatPrice(item.price, project.currency)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p style={{ marginTop: '4px', fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
                    {item.description}
                  </p>
                )}
                {(item.tags?.length || item.kcal) && (
                  <div style={{ marginTop: `${tokens.scale(8)}px`, display: 'flex', alignItems: 'center', gap: `${tokens.scale(10)}px`, flexWrap: 'wrap' }}>
                    <TagPills tokens={tokens} tags={item.tags} />
                    {item.kcal ? (
                      <span style={{ fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68, marginBottom: `${tokens.scale(8)}px` }}>
                        {item.kcal} kcal
                      </span>
                    ) : null}
                  </div>
                )}
              </Appear>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CatalogGrid({ project, tokens, bag, kind, onAddToCart }: Props & { bag: Bag; kind: 'services' | 'products' | 'portfolio' | 'gallery' }) {
  const grid = project.grid
  const items = catalogItems(project, kind)
  const columns = num(bag, 'columns', grid.columns)
  const align = grid.align === 'center' ? 'center' : 'left'
  const ratio = kind === 'gallery' ? RATIO[grid.imageRatio] ?? '1 / 1' : RATIO[grid.imageRatio] ?? '4 / 3'

  // Mise en page du catalogue (§19) : grille, carte a onglets ou ardoise.
  const layout = kind === 'products' ? str(bag, 'layout') || 'grid' : 'grid'

  // Regroupement par categorie (§15) : des que le catalogue en porte une et que
  // la section le demande.
  const byCategory = kind === 'products' ? groupByCategory(items) : []
  const grouped = kind === 'products' && bool(bag, 'groupByCategory') && byCategory.some((group) => group.name)

  const card = (item: CatalogEntry, i: number) => (
    <CatalogCard
      key={item.id} project={project} tokens={tokens} item={item} index={i}
      kind={kind} align={align} ratio={ratio} onAddToCart={onAddToCart}
    />
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align={align} />

      {layout === 'board' ? (
        <MenuTabs project={project} tokens={tokens} items={items} columns={columns} renderCard={card} />
      ) : layout === 'list' ? (
        <Slate
          project={project}
          tokens={tokens}
          groups={grouped && byCategory.length ? byCategory : [{ name: '', items }]}
        />
      ) : grouped ? (
        <div style={{ display: 'grid', gap: `${tokens.scale(44)}px` }}>
          {byCategory.map((group) => (
            <div key={group.name || 'autres'}>
              {group.name && (
                <h3 style={{ ...tokens.heading(22), marginBottom: `${tokens.scale(18)}px` }}>{group.name}</h3>
              )}
              <Grid tokens={tokens} columns={columns} gap={grid.gap}>
                {group.items.map(card)}
              </Grid>
            </div>
          ))}
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
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(24)}px` }}>
            <p style={{ fontSize: `${tokens.scale(16)}px`, lineHeight: 1.7 }}>« {String(item.quote ?? '')} »</p>
            <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(14)}px`, color: 'currentColor', opacity: 0.68 }}>
              <strong style={{ color: tokens.colors.text }}>{String(item.author ?? '')}</strong>
              {item.role ? ` — ${String(item.role)}` : ''}
            </p>
          </Appear>
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
            <p style={{ marginTop: '8px', fontSize: `${tokens.scale(15)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
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
            <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
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
          <p style={{ marginTop: `${tokens.scale(14)}px`, fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>{str(bag, 'note')}</p>
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
        color: 'currentColor', opacity: 0.68,
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
        <div style={{ fontSize: `${tokens.scale(15)}px`, lineHeight: 1.9, color: 'currentColor', opacity: 0.68 }}>
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
          <div style={{ fontSize: `${tokens.scale(15)}px`, lineHeight: 2, color: 'currentColor', opacity: 0.68 }}>
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

function Cta({ section, project, tokens, bag }: Props & { bag: Bag }) {
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
        <BlockStack
          blocks={resolveBlocks(section)}
          project={project}
          tokens={tokens}
          align="center"
          accent={tone === 'accent' ? 'currentColor' : undefined}
          style={{ marginTop: `${tokens.scale(22)}px` }}
        />
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


// --- sections « preuve » ----------------------------------------------------

/** Chiffres cles : chaque valeur numerique est comptee a l'entree a l'ecran. */
function Stats({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const accent = (str(bag, 'tone') || 'alt') === 'accent'
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={Math.min(4, items.length || 4)}>
        {items.map((item, i) => {
          const raw = String(item.value ?? '')
          const numeric = Number(raw.replace(',', '.'))
          const decimals = raw.includes(',') || raw.includes('.') ? 1 : 0
          return (
            <Appear key={i} index={i} style={{ textAlign: 'center' }}>
              <p style={{ ...tokens.heading(44), color: accent ? 'inherit' : tokens.colors.primary }}>
                {Number.isFinite(numeric) && raw.trim() !== '' ? <Count to={numeric} decimals={decimals} /> : raw}
                {String(item.suffix ?? '')}
              </p>
              <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(15)}px`, color: accent ? 'inherit' : tokens.muted, opacity: accent ? 0.85 : 1 }}>
                {String(item.label ?? '')}
              </p>
            </Appear>
          )
        })}
      </Grid>
    </Shell>
  )
}

/** Methode : frise numerotee, horizontale sur grand ecran, verticale sur mobile. */
function Process({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const vertical = tokens.viewport === 'mobile'
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: vertical ? '1fr' : `repeat(${tokens.columns(items.length || 4)}, minmax(0, 1fr))`,
          gap: `${tokens.scale(vertical ? 22 : 28)}px`,
        }}
      >
        {items.map((item, i) => (
          <Appear key={i} index={i} style={{ position: 'relative', display: 'flex', gap: `${tokens.scale(14)}px`, flexDirection: vertical ? 'row' : 'column' }}>
            <span
              style={{
                display: 'grid', placeItems: 'center', flexShrink: 0,
                width: `${tokens.scale(44)}px`, height: `${tokens.scale(44)}px`,
                borderRadius: '999px',
                background: withAlpha(tokens.colors.primary, 0.12),
                color: tokens.colors.primary,
                fontFamily: tokens.theme.headingFont,
                fontWeight: 700,
                fontSize: `${tokens.scale(17)}px`,
              }}
            >
              {i + 1}
            </span>
            <div>
              <h3 style={tokens.heading(19)}>{String(item.title ?? '')}</h3>
              <p style={{ marginTop: '6px', fontSize: `${tokens.scale(15)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
                {String(item.text ?? '')}
              </p>
            </div>
            {/* Trait de liaison vers l'etape suivante, jamais apres la derniere. */}
            {!vertical && i < items.length - 1 && (
              <span
                aria-hidden
                style={{
                  position: 'absolute', top: `${tokens.scale(22)}px`,
                  left: `calc(${tokens.scale(44)}px + ${tokens.scale(10)}px)`,
                  right: `-${tokens.scale(18)}px`,
                  height: '1px',
                  background: `linear-gradient(90deg, ${withAlpha(tokens.colors.primary, 0.45)}, transparent)`,
                }}
              />
            )}
          </Appear>
        ))}
      </div>
    </Shell>
  )
}

/** Equipe : initiales en pastille tant qu'aucune photo n'est fournie. */
function Team({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={num(bag, 'columns', 3)}>
        {items.map((item, i) => {
          const name = String(item.name ?? '')
          const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
          return (
            <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(22)}px`, textAlign: 'center' }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center', marginInline: 'auto',
                  width: `${tokens.scale(64)}px`, height: `${tokens.scale(64)}px`,
                  borderRadius: '999px',
                  background: `linear-gradient(135deg, ${withAlpha(tokens.colors.primary, 0.85)}, ${withAlpha(tokens.colors.accent, 0.7)})`,
                  color: readableOn(tokens.colors.primary),
                  fontFamily: tokens.theme.headingFont, fontWeight: 700, fontSize: `${tokens.scale(20)}px`,
                }}
                aria-hidden
              >
                {initials || '—'}
              </span>
              <h3 style={{ ...tokens.heading(18), marginTop: `${tokens.scale(14)}px` }}>{name}</h3>
              <p style={{ marginTop: '4px', fontSize: `${tokens.scale(13)}px`, color: tokens.colors.primary, fontWeight: 600 }}>
                {String(item.role ?? '')}
              </p>
              <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
                {String(item.bio ?? '')}
              </p>
            </Appear>
          )
        })}
      </Grid>
    </Shell>
  )
}

/** References : bandeau defilant, ou grille figee si le client coupe le defilement. */
function Logos({ tokens, bag }: Props & { bag: Bag }) {
  const { enabled, level } = useSiteMotion()
  const items = list(bag, 'items')
  const scrolling = bool(bag, 'scroll') && enabled && level !== 'none' && items.length > 2

  const chip = (label: string, key: string) => (
    <span
      key={key}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: `${tokens.scale(10)}px ${tokens.scale(20)}px`,
        border: `1px solid ${tokens.divider}`,
        borderRadius: tokens.radius,
        fontFamily: tokens.theme.headingFont,
        fontWeight: 600,
        fontSize: `${tokens.scale(15)}px`,
        color: 'currentColor', opacity: 0.68,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )

  const group = (copy: number) => (
    <div style={{ display: 'flex', gap: `${tokens.scale(18)}px`, paddingRight: `${tokens.scale(18)}px` }}>
      {items.map((item, i) => chip(String(item.name ?? ''), `${copy}-${i}`))}
    </div>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} align="center" />
      {scrolling ? (
        <div
          style={{
            overflow: 'hidden',
            // Le degrade evite que les references soient coupees net sur les bords.
            maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
            ['--site-marquee-duration' as string]: level === 'lively' ? '26s' : '40s',
          }}
        >
          <div className="site-marquee">
            {group(0)}
            {group(1)}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${tokens.scale(14)}px`, justifyContent: 'center' }}>
          {items.map((item, i) => chip(String(item.name ?? ''), String(i)))}
        </div>
      )}
    </Shell>
  )
}

/**
 * Avant / apres : le visiteur fait glisser la poignee. Le suivi se fait au
 * pointeur (souris et tactile) et `stopPropagation` empeche le clic de
 * remonter au builder quand la section est en cours d'edition.
 */
function BeforeAfter({ tokens, bag }: Props & { bag: Bag }) {
  const [position, setPosition] = useState(50)
  const frameRef = useRef<HTMLDivElement | null>(null)

  function moveTo(clientX: number) {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }

  const labelStyle: React.CSSProperties = {
    position: 'absolute', bottom: `${tokens.scale(12)}px`,
    padding: `${tokens.scale(5)}px ${tokens.scale(11)}px`,
    borderRadius: tokens.radius,
    background: withAlpha(tokens.colors.text, 0.72),
    color: tokens.colors.background,
    fontSize: `${tokens.scale(12)}px`, fontWeight: 600,
  }

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <div
        ref={frameRef}
        onPointerDown={(event) => {
          event.stopPropagation()
          event.currentTarget.setPointerCapture(event.pointerId)
          moveTo(event.clientX)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX)
        }}
        onClick={(event) => event.stopPropagation()}
        style={{
          ...tokens.image(),
          position: 'relative', maxWidth: '900px', marginInline: 'auto',
          aspectRatio: '16 / 9', cursor: 'ew-resize', touchAction: 'none', userSelect: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <Media tokens={tokens} ratio="16 / 9" seed={1} src={str(bag, 'afterUrl') || null} alt={str(bag, 'afterLabel')} />
        </div>
        {/* La photo « avant » est rognee a la position de la poignee. */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Media tokens={tokens} ratio="16 / 9" seed={0} src={str(bag, 'beforeUrl') || null} alt={str(bag, 'beforeLabel')} />
        </div>

        <span style={{ ...labelStyle, left: `${tokens.scale(12)}px` }}>{str(bag, 'beforeLabel')}</span>
        <span style={{ ...labelStyle, right: `${tokens.scale(12)}px` }}>{str(bag, 'afterLabel')}</span>

        <div
          aria-hidden
          style={{
            position: 'absolute', top: 0, bottom: 0, left: `${position}%`,
            width: '2px', background: tokens.colors.background, transform: 'translateX(-1px)',
          }}
        >
          <span
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: `${tokens.scale(38)}px`, height: `${tokens.scale(38)}px`, borderRadius: '999px',
              background: tokens.colors.background, color: tokens.colors.primary,
              display: 'grid', placeItems: 'center', fontSize: `${tokens.scale(15)}px`, fontWeight: 700,
              boxShadow: '0 6px 18px -6px rgba(0,0,0,.45)',
            }}
          >
            ‹ ›
          </span>
        </div>
      </div>
    </Shell>
  )
}

/** Bandeau d'annonce : une ligne, defilante si le theme anime. */
function Banner({ tokens, bag }: Props & { bag: Bag }) {
  const { enabled, level } = useSiteMotion()
  const tone = (str(bag, 'tone') || 'accent') as 'default' | 'alt' | 'accent'
  const text = str(bag, 'text')
  const scrolling = bool(bag, 'scroll') && enabled && level !== 'none'

  const base = tokens.section(tone)
  const line = (
    <span style={{ fontSize: `${tokens.scale(14)}px`, fontWeight: 600, letterSpacing: '.02em', paddingRight: `${tokens.scale(48)}px`, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )

  return (
    <section style={{ ...base, paddingBlock: `${tokens.scale(11)}px`, overflow: 'hidden' }}>
      {scrolling ? (
        <div style={{ overflow: 'hidden', ['--site-marquee-duration' as string]: level === 'lively' ? '18s' : '28s' }}>
          <div className="site-marquee">
            <span style={{ display: 'flex' }}>{line}{line}{line}</span>
            <span style={{ display: 'flex' }} aria-hidden>{line}{line}{line}</span>
          </div>
        </div>
      ) : (
        <div style={{ ...tokens.container(), textAlign: 'center' }}>{line}</div>
      )}
    </section>
  )
}

// --- restauration et vente a emporter --------------------------------------
// Les six sections ci-dessous reprennent les briques des sites d'enseignes :
// choix du mode de service, offres, formules, etablissements, allergenes et
// fidelite. Elles n'ont aucune connaissance du metier : comme les autres, elles
// lisent le projet et les tokens du theme (§48).

function ModeCard({ tokens, item, index }: { tokens: SiteTokens; item: Bag; index: number }) {
  const base = tokens.card()
  const active = index === 0
  const delay = String(item.delay ?? '')
  return (
    <Appear
      index={index}
      as="article"
      style={{
        ...base,
        background: active ? withAlpha(tokens.colors.primary, 0.08) : base.background,
        borderTop: `${tokens.scale(4)}px solid ${active ? tokens.colors.primary : withAlpha(tokens.colors.text, 0.12)}`,
        padding: `${tokens.scale(26)}px`,
        textAlign: 'center',
      }}
    >
      <h3 style={tokens.heading(21)}>{String(item.name ?? '')}</h3>
      <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, color: 'currentColor', opacity: 0.68, lineHeight: 1.6 }}>
        {String(item.text ?? '')}
      </p>
      {delay && (
        <span
          style={{
            display: 'inline-block', marginTop: `${tokens.scale(16)}px`,
            padding: `${tokens.scale(5)}px ${tokens.scale(13)}px`, borderRadius: '999px',
            background: withAlpha(tokens.colors.accent, 0.2), color: tokens.colors.text,
            fontSize: `${tokens.scale(12)}px`, fontWeight: 700,
          }}
        >
          {delay}
        </span>
      )}
    </Appear>
  )
}

/** Champ de saisie simule + bouton : adresse de livraison, recherche de ville. */
function SearchRow({ tokens, label, cta }: { tokens: SiteTokens; label: string; cta: string }) {
  return (
    <div style={{ marginTop: `${tokens.scale(30)}px`, maxWidth: '640px', marginInline: 'auto', display: 'flex', gap: `${tokens.scale(10)}px`, flexWrap: 'wrap' }}>
      <div
        style={{
          flex: '1 1 240px', minWidth: 0, height: `${tokens.scale(46)}px`,
          borderRadius: tokens.radius, border: `1px solid ${tokens.divider}`,
          background: withAlpha(tokens.colors.card, 0.9), display: 'flex', alignItems: 'center',
          paddingInline: `${tokens.scale(16)}px`, color: 'currentColor', opacity: 0.68, fontSize: `${tokens.scale(14)}px`,
        }}
      >
        {label}
      </div>
      <Btn tokens={tokens} label={cta} />
    </div>
  )
}

function OrderModes({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={items.length || 3}>
        {items.map((item, i) => <ModeCard key={i} tokens={tokens} item={item} index={i} />)}
      </Grid>
      {bool(bag, 'showAddress') && (
        <SearchRow tokens={tokens} label={str(bag, 'addressLabel')} cta={str(bag, 'ctaLabel')} />
      )}
    </Shell>
  )
}

function Offers({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const cta = str(bag, 'ctaLabel')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={num(bag, 'columns', 3)}>
        {items.map((item, i) => {
          const badge = String(item.badge ?? '')
          const code = String(item.code ?? '')
          const price = String(item.price ?? '')
          const oldPrice = String(item.oldPrice ?? '')
          return (
            <Appear key={i} index={i} as="article" style={{ ...tokens.card(), display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative' }}>
                <Media tokens={tokens} ratio="16 / 9" seed={i + 1} />
                {badge && (
                  <span
                    style={{
                      position: 'absolute', top: `${tokens.scale(12)}px`, left: `${tokens.scale(12)}px`,
                      background: tokens.colors.accent, color: readableOn(tokens.colors.accent),
                      fontSize: `${tokens.scale(12)}px`, fontWeight: 800, letterSpacing: '.04em',
                      padding: `${tokens.scale(6)}px ${tokens.scale(12)}px`, borderRadius: '999px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div style={{ padding: `${tokens.scale(20)}px`, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={tokens.heading(20)}>{String(item.name ?? '')}</h3>
                <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
                  {String(item.text ?? '')}
                </p>
                {(price || oldPrice) && (
                  <div style={{ marginTop: `${tokens.scale(16)}px`, display: 'flex', alignItems: 'baseline', gap: `${tokens.scale(10)}px`, flexWrap: 'wrap' }}>
                    {price && <span style={{ ...tokens.heading(26), color: tokens.colors.primary }}>{price}</span>}
                    {oldPrice && (
                      <span style={{ fontSize: `${tokens.scale(15)}px`, color: 'currentColor', opacity: 0.68, textDecoration: 'line-through' }}>{oldPrice}</span>
                    )}
                  </div>
                )}
                {code && (
                  <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68, letterSpacing: '.06em' }}>
                    CODE <span style={{ color: tokens.colors.text, fontWeight: 700 }}>{code}</span>
                  </p>
                )}
                {cta && (
                  <span style={{ ...tokens.button(), marginTop: 'auto', paddingTop: `${tokens.scale(13)}px`, alignSelf: 'flex-start' }}>{cta}</span>
                )}
              </div>
            </Appear>
          )
        })}
      </Grid>
    </Shell>
  )
}

function Formulas({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const cta = str(bag, 'ctaLabel')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={items.length || 3}>
        {items.map((item, i) => {
          const base = tokens.card()
          const badge = String(item.badge ?? '')
          const note = String(item.note ?? '')
          const lines = String(item.includes ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
          return (
            <Appear
              key={i}
              index={i}
              as="article"
              style={{
                ...base,
                border: badge ? `2px solid ${tokens.colors.primary}` : base.border,
                padding: `${tokens.scale(28)}px`,
                textAlign: 'center',
              }}
            >
              {badge && (
                <span
                  style={{
                    display: 'inline-block', marginBottom: `${tokens.scale(12)}px`,
                    padding: `${tokens.scale(5)}px ${tokens.scale(13)}px`, borderRadius: '999px',
                    background: tokens.colors.primary, color: tokens.onPrimary,
                    fontSize: `${tokens.scale(11)}px`, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  }}
                >
                  {badge}
                </span>
              )}
              <h3 style={tokens.heading(21)}>{String(item.name ?? '')}</h3>
              <p style={{ ...tokens.heading(34), marginTop: `${tokens.scale(10)}px`, color: tokens.colors.primary }}>
                {String(item.price ?? '')}
              </p>
              {lines.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: `${tokens.scale(18)}px 0 0` }}>
                  {lines.map((line, j) => (
                    <li
                      key={j}
                      style={{
                        fontSize: `${tokens.scale(15)}px`, paddingBlock: `${tokens.scale(9)}px`,
                        borderTop: j === 0 ? 'none' : `1px solid ${tokens.divider}`,
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {note && (
                <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68, lineHeight: 1.6 }}>
                  {note}
                </p>
              )}
            </Appear>
          )
        })}
      </Grid>
      {cta && (
        <div style={{ marginTop: `${tokens.scale(30)}px`, textAlign: 'center' }}>
          <Btn tokens={tokens} label={cta} />
        </div>
      )}
    </Shell>
  )
}

function Venues({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const cta = str(bag, 'ctaLabel')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      {bool(bag, 'showSearch') && (
        <div style={{ marginBottom: `${tokens.scale(30)}px` }}>
          <SearchRow tokens={tokens} label={str(bag, 'searchLabel')} cta="Rechercher" />
        </div>
      )}
      <Grid tokens={tokens} columns={Math.min(3, items.length || 3)}>
        {items.map((item, i) => {
          const services = String(item.services ?? '').split('·').map((v) => v.trim()).filter(Boolean)
          const hours = String(item.hours ?? '')
          return (
            <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(22)}px`, display: 'flex', flexDirection: 'column', gap: `${tokens.scale(9)}px` }}>
              <h3 style={tokens.heading(19)}>{String(item.name ?? '')}</h3>
              <p style={{ fontSize: `${tokens.scale(14)}px`, color: 'currentColor', opacity: 0.68, lineHeight: 1.6 }}>{String(item.address ?? '')}</p>
              {hours && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: `${tokens.scale(13)}px`, fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: tokens.colors.accent, display: 'inline-block' }} />
                  {hours}
                </p>
              )}
              {services.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {services.map((service) => (
                    <span
                      key={service}
                      style={{
                        fontSize: `${tokens.scale(11)}px`, fontWeight: 600,
                        padding: `${tokens.scale(4)}px ${tokens.scale(10)}px`, borderRadius: '999px',
                        background: withAlpha(tokens.colors.primary, 0.1), color: tokens.colors.primary,
                      }}
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}
              {cta && (
                <span style={{ ...tokens.button('secondary'), marginTop: 'auto', alignSelf: 'flex-start' }}>{cta}</span>
              )}
            </Appear>
          )
        })}
      </Grid>
    </Shell>
  )
}

function Allergens({ project, tokens, bag }: Props & { bag: Bag }) {
  const all = catalogItems(project, 'products')
  const rows = all.slice(0, 12)
  const hidden = all.length - rows.length
  const showTable = bool(bag, 'showTable')
  const cell: React.CSSProperties = {
    padding: `${tokens.scale(11)}px ${tokens.scale(12)}px`,
    borderTop: `1px solid ${tokens.divider}`,
    fontSize: `${tokens.scale(14)}px`,
    verticalAlign: 'top',
  }

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showTable && tokens.viewport !== 'mobile' ? '1fr 1.3fr' : '1fr',
          gap: `${tokens.scale(32)}px`, alignItems: 'start',
        }}
      >
        <div>
          <p style={{ fontSize: `${tokens.scale(15)}px`, lineHeight: 1.75, color: 'currentColor', opacity: 0.68 }}>{str(bag, 'text')}</p>
          {bool(bag, 'showList') && (
            <div style={{ marginTop: `${tokens.scale(18)}px`, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ALLERGENS.map((name) => (
                <span
                  key={name}
                  style={{
                    fontSize: `${tokens.scale(12)}px`, padding: `${tokens.scale(5)}px ${tokens.scale(11)}px`,
                    borderRadius: '999px', border: `1px solid ${tokens.divider}`, color: 'currentColor', opacity: 0.68,
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          {str(bag, 'ctaLabel') && (
            <div style={{ marginTop: `${tokens.scale(22)}px` }}>
              <Btn tokens={tokens} label={str(bag, 'ctaLabel')} variant="secondary" />
            </div>
          )}
        </div>

        {showTable && (
          <div style={{ ...tokens.card(), padding: `${tokens.scale(6)}px ${tokens.scale(14)}px ${tokens.scale(14)}px` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Produit', 'Calories', 'Allergènes'].map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: 'left', padding: `${tokens.scale(12)}px`,
                        fontSize: `${tokens.scale(11)}px`, textTransform: 'uppercase',
                        letterSpacing: '.08em', color: 'currentColor', opacity: 0.68, fontWeight: 700,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ ...cell, fontWeight: 600 }}>{row.name}</td>
                    <td style={{ ...cell, color: 'currentColor', opacity: 0.68, whiteSpace: 'nowrap' }}>{row.kcal ? `${row.kcal} kcal` : '—'}</td>
                    <td style={{ ...cell, color: 'currentColor', opacity: 0.68 }}>{row.allergens && row.allergens.length ? row.allergens.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hidden > 0 && (
              <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
                … et {hidden} autres produits dans la fiche complète.
              </p>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}

function Loyalty({ project, tokens, bag }: Props & { bag: Bag }) {
  const accent = (str(bag, 'tone') || 'accent') === 'accent'
  const items = list(bag, 'items')
  const stamps = Math.max(4, Math.min(12, Math.round(num(bag, 'stamps', 8))))
  const filled = Math.ceil(stamps / 2)
  const ink = accent ? tokens.onPrimary : tokens.colors.text
  const soft = accent ? withAlpha(tokens.onPrimary, 0.78) : tokens.muted
  const cta = str(bag, 'ctaLabel')

  return (
    <Shell tokens={tokens} bag={bag}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: tokens.viewport === 'mobile' ? '1fr' : '1fr 1fr',
          gap: `${tokens.scale(40)}px`, alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ ...tokens.heading(32), color: ink }}>{str(bag, 'title')}</h2>
          <p style={{ marginTop: `${tokens.scale(14)}px`, fontSize: `${tokens.scale(16)}px`, lineHeight: 1.7, color: soft }}>
            {str(bag, 'text')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: `${tokens.scale(22)}px 0 0`, display: 'grid', gap: `${tokens.scale(11)}px` }}>
            {items.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: ink, fontSize: `${tokens.scale(15)}px` }}>
                <span
                  style={{
                    width: `${tokens.scale(24)}px`, height: `${tokens.scale(24)}px`, borderRadius: '999px',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: accent ? withAlpha(tokens.onPrimary, 0.22) : withAlpha(tokens.colors.primary, 0.12),
                    fontSize: `${tokens.scale(12)}px`, fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                {String(item.name ?? '')}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: `${tokens.scale(26)}px`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {cta && (
              <span
                style={
                  accent
                    ? {
                        ...tokens.button(), background: tokens.colors.background, backgroundImage: undefined,
                        color: tokens.colors.text, border: 'none',
                      }
                    : tokens.button()
                }
              >
                {cta}
              </span>
            )}
            {bool(bag, 'showApp') && ['App Store', 'Google Play'].map((store) => (
              <span
                key={store}
                style={{
                  border: `1px solid ${withAlpha(ink, 0.4)}`, borderRadius: tokens.radius,
                  padding: `${tokens.scale(9)}px ${tokens.scale(14)}px`, fontSize: `${tokens.scale(12)}px`, color: ink,
                }}
              >
                Télécharger sur {store}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: tokens.radius, padding: `${tokens.scale(26)}px`,
            background: accent ? withAlpha(tokens.onPrimary, 0.12) : tokens.colors.card,
            border: `1px solid ${withAlpha(ink, 0.18)}`,
          }}
        >
          <p style={{ fontSize: `${tokens.scale(11)}px`, letterSpacing: '.14em', textTransform: 'uppercase', color: soft }}>
            Carte de fidélité
          </p>
          <p style={{ ...tokens.heading(22), color: ink, marginTop: `${tokens.scale(6)}px` }}>
            {project.identity.businessName.trim() || 'Votre entreprise'}
          </p>
          <div
            style={{
              marginTop: `${tokens.scale(20)}px`, display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(stamps, 6)}, minmax(0, 1fr))`, gap: `${tokens.scale(10)}px`,
            }}
          >
            {Array.from({ length: stamps }).map((_, i) => (
              <span
                key={i}
                style={{
                  aspectRatio: '1 / 1', borderRadius: '999px', display: 'grid', placeItems: 'center',
                  border: `1px dashed ${withAlpha(ink, 0.35)}`,
                  background: i < filled ? (accent ? withAlpha(tokens.onPrimary, 0.3) : withAlpha(tokens.colors.primary, 0.16)) : 'transparent',
                  color: ink, fontSize: `${tokens.scale(13)}px`,
                }}
              >
                {i < filled ? '★' : ''}
              </span>
            ))}
          </div>
          <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(13)}px`, color: soft }}>
            {filled} / {stamps} — encore {stamps - filled} {isTableService(project) ? 'commandes' : 'achats'} avant votre récompense.
          </p>
        </div>
      </div>
    </Shell>
  )
}

/** Champs du formulaire de reservation : couverts et horaire en restauration. */
/**
 * Section libre. Elle ne rend rien d'autre que ses blocs : c'est la section qui
 * evite d'ajouter un type au moteur chaque fois qu'un client veut « juste un
 * paragraphe de plus » (§48).
 *
 * C'est aussi la seule section DESSINABLE : ses blocs sont poses sur la grille
 * fluide (§14), ou le client les deplace et les etire a la souris. Les sections
 * qui portent une mise en page propre — hero, catalogue, avis — gardent leur
 * empilement, sinon le theme cesserait de garantir quoi que ce soit (§10).
 */
function Content({ section, project, tokens, bag }: Props & { bag: Bag }) {
  const align = str(bag, 'align') === 'center' ? 'center' : 'left'
  const onAccent = str(bag, 'tone') === 'accent'
  const blocks = resolveBlocks(section)
  const accent = onAccent ? 'currentColor' : undefined
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align={align} />
      {isFluid(section) ? (
        <BlockGrid section={section} blocks={blocks} project={project} tokens={tokens} align={align} accent={accent} />
      ) : (
        <BlockStack blocks={blocks} project={project} tokens={tokens} align={align} accent={accent} />
      )}
    </Shell>
  )
}

function bookingFields(project: Project): [string, number][] {
  return isTableService(project)
    ? [['Nom', 1], ['Téléphone', 1], ['Date et heure', 1], ['Nombre de couverts', 1], ['Précisions', 2]]
    : [['Nom', 1], ['Téléphone', 1], ['Date souhaitée', 1], ['Précisions', 2]]
}

/**
 * Recherche guidee : la barre de selection qu'on trouve en tete des sites de
 * pieces detachees, de vehicules ou d'annonces. Elle est simulee comme les
 * autres formulaires de la maquette — son role est de montrer au client
 * l'entonnoir qu'aura son site, pas de filtrer quoi que ce soit.
 */
function Finder({ tokens, bag }: Props & { bag: Bag }) {
  const criteria = list(bag, 'criteria')
  const directLabel = str(bag, 'directLabel')

  const select = (label: string, example: string, key: string | number) => (
    <label key={key} style={{ display: 'block', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68, fontWeight: 600 }}>
      {label}
      <span
        style={{
          marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', height: `${tokens.scale(44)}px`, paddingInline: `${tokens.scale(14)}px`,
          borderRadius: tokens.radius, border: `1px solid ${tokens.divider}`,
          background: withAlpha(tokens.colors.card, 0.9),
          fontSize: `${tokens.scale(14)}px`, fontWeight: 400,
          color: withAlpha(tokens.colors.text, 0.45),
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{example}</span>
        <span aria-hidden style={{ color: tokens.colors.primary }}>&#9662;</span>
      </span>
    </label>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <div style={{ ...tokens.card(), padding: `${tokens.scale(24)}px`, maxWidth: '980px', marginInline: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tokens.columns(Math.min(4, Math.max(1, criteria.length)))}, minmax(0, 1fr))`,
            gap: `${tokens.scale(14)}px`,
          }}
        >
          {criteria.map((item, i) => select(String(item.label ?? ''), String(item.example ?? ''), i))}
        </div>

        <div style={{ marginTop: `${tokens.scale(18)}px`, display: 'flex', justifyContent: 'center' }}>
          <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
        </div>

        {/* Raccourci pour qui connait deja sa reference : plaque, dimension, numero. */}
        {directLabel !== '' && (
          <div
            style={{
              marginTop: `${tokens.scale(20)}px`, paddingTop: `${tokens.scale(18)}px`,
              borderTop: `1px solid ${tokens.divider}`,
              display: 'grid', gap: `${tokens.scale(10)}px`,
              gridTemplateColumns: tokens.viewport === 'mobile' ? '1fr' : '1fr auto',
              alignItems: 'end',
            }}
          >
            {select(directLabel, str(bag, 'directExample'), 'direct')}
            <Btn tokens={tokens} label="Valider" variant="secondary" />
          </div>
        )}
      </div>
    </Shell>
  )
}

/** Programme : modules numerotes, duree a droite, volume total en pied de liste. */
function Program({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const total = str(bag, 'totalLabel')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <div style={{ display: 'grid', gap: `${tokens.scale(12)}px`, maxWidth: '880px', marginInline: 'auto' }}>
        {items.map((item, i) => {
          const duration = String(item.duration ?? '')
          return (
            <Appear
              key={i} index={i} as="article"
              style={{
                ...tokens.card(), padding: `${tokens.scale(20)}px`,
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: `${tokens.scale(16)}px`, alignItems: 'start',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'grid', placeItems: 'center',
                  width: `${tokens.scale(34)}px`, height: `${tokens.scale(34)}px`, borderRadius: '999px',
                  background: withAlpha(tokens.colors.primary, 0.14), color: tokens.colors.primary,
                  fontFamily: tokens.theme.headingFont, fontWeight: 700, fontSize: `${tokens.scale(15)}px`,
                }}
              >
                {i + 1}
              </span>
              <div>
                <h3 style={tokens.heading(18)}>{String(item.title ?? '')}</h3>
                <p style={{ marginTop: '6px', fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
                  {String(item.text ?? '')}
                </p>
              </div>
              {duration !== '' && (
                <span
                  style={{
                    whiteSpace: 'nowrap', fontSize: `${tokens.scale(12)}px`, fontWeight: 700,
                    padding: `${tokens.scale(5)}px ${tokens.scale(10)}px`, borderRadius: tokens.radius,
                    background: withAlpha(tokens.colors.accent, 0.16), color: tokens.colors.text,
                  }}
                >
                  {duration}
                </span>
              )}
            </Appear>
          )
        })}
      </div>
      {total !== '' && (
        <p style={{ marginTop: `${tokens.scale(18)}px`, textAlign: 'center', fontSize: `${tokens.scale(14)}px`, fontWeight: 600, color: tokens.colors.primary }}>
          {total}
        </p>
      )}
    </Shell>
  )
}

/**
 * Financement : une carte par dispositif. Aucun montant n'y figure par defaut —
 * ce sont des conditions d'acces, pas un tarif.
 */
function Funding({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const note = str(bag, 'note')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={num(bag, 'columns', 3)}>
        {items.map((item, i) => (
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(22)}px` }}>
            <span
              aria-hidden
              style={{
                display: 'block', width: `${tokens.scale(34)}px`, height: '3px', borderRadius: '999px',
                background: tokens.colors.primary, marginBottom: `${tokens.scale(14)}px`,
              }}
            />
            <h3 style={tokens.heading(18)}>{String(item.name ?? '')}</h3>
            <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.7, color: 'currentColor', opacity: 0.68 }}>
              {String(item.detail ?? '')}
            </p>
          </Appear>
        ))}
      </Grid>
      {note !== '' && (
        <p style={{ marginTop: `${tokens.scale(20)}px`, textAlign: 'center', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
          {note}
        </p>
      )}
    </Shell>
  )
}

// --- sections « vivre dans le temps, prouver, garder le contact » ----------

/**
 * Glyphes en CSS pur. `Sections.tsx` n'importe aucune icone : le rendu du site
 * du client ne doit dependre que des tokens, jamais d'une bibliotheque de la
 * plateforme (§48).
 */
function Check({ tokens, color }: { tokens: SiteTokens; color: string }) {
  const size = tokens.scale(10)
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block', flexShrink: 0,
        width: `${size}px`, height: `${size * 1.8}px`,
        borderRight: `${Math.max(2, tokens.scale(2))}px solid ${color}`,
        borderBottom: `${Math.max(2, tokens.scale(2))}px solid ${color}`,
        transform: 'rotate(45deg)',
        marginRight: `${tokens.scale(10)}px`,
      }}
    />
  )
}

function Video({ tokens, bag }: Props & { bag: Bag }) {
  const layout = str(bag, 'layout') || 'cover'
  const poster = str(bag, 'posterUrl')
  const split = layout === 'split' && tokens.viewport !== 'mobile'

  const player = (
    <figure style={{ margin: 0, position: 'relative', ...tokens.image(), aspectRatio: '16 / 9', width: '100%' }}>
      {poster
        ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <Media tokens={tokens} ratio="16 / 9" seed={2} />}

      <span aria-hidden style={{ position: 'absolute', inset: 0, background: withAlpha(tokens.colors.text, 0.32) }} />

      <span
        aria-hidden
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: `${tokens.scale(74)}px`, height: `${tokens.scale(74)}px`, borderRadius: '999px',
          background: tokens.colors.button, color: tokens.onButton,
          display: 'grid', placeItems: 'center',
        }}
      >
        {/* Triangle de lecture : trois bordures, aucune image. */}
        <span
          style={{
            width: 0, height: 0,
            borderLeft: `${tokens.scale(20)}px solid currentColor`,
            borderTop: `${tokens.scale(13)}px solid transparent`,
            borderBottom: `${tokens.scale(13)}px solid transparent`,
            marginLeft: `${tokens.scale(5)}px`,
          }}
        />
      </span>

      {str(bag, 'duration') && (
        <span
          style={{
            position: 'absolute', right: `${tokens.scale(12)}px`, bottom: `${tokens.scale(12)}px`,
            background: withAlpha(tokens.colors.text, 0.62), color: readableOn(tokens.colors.text),
            borderRadius: '999px', padding: `${tokens.scale(4)}px ${tokens.scale(10)}px`,
            fontSize: `${tokens.scale(12)}px`, fontWeight: 700,
          }}
        >
          {str(bag, 'duration')}
        </span>
      )}
    </figure>
  )

  const aside = (
    <div>
      <h2 style={tokens.heading(30)}>{str(bag, 'title')}</h2>
      <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(16)}px`, lineHeight: 1.7, color: 'currentColor', opacity: 0.68 }}>
        {str(bag, 'subtitle')}
      </p>
      {str(bag, 'caption') && (
        <p style={{ marginTop: `${tokens.scale(14)}px`, fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
          {str(bag, 'caption')}
        </p>
      )}
      <div style={{ marginTop: `${tokens.scale(20)}px` }}>
        <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
      </div>
    </div>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      {split ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${tokens.scale(40)}px`, alignItems: 'center' }}>
          {aside}
          {player}
        </div>
      ) : (
        <>
          <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
          <div style={layout === 'card' ? { ...tokens.card(), padding: `${tokens.scale(18)}px` } : undefined}>{player}</div>
          {str(bag, 'caption') && (
            <p style={{ marginTop: `${tokens.scale(14)}px`, textAlign: 'center', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
              {str(bag, 'caption')}
            </p>
          )}
          {str(bag, 'ctaLabel') && (
            <div style={{ marginTop: `${tokens.scale(20)}px`, textAlign: 'center' }}>
              <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

function News({ project, tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const showFilter = bag.showFilter === true
  const categories = [...new Set(items.map((i) => String(i.category ?? '')).filter(Boolean))]
  const [active, setActive] = useState<string>('')
  const shown = active ? items.filter((i) => String(i.category ?? '') === active) : items

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align={project.grid.align === 'center' ? 'center' : 'left'} />

      {showFilter && categories.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${tokens.scale(8)}px`, marginBottom: `${tokens.scale(24)}px` }}>
          {['', ...categories].map((category) => {
            const on = category === active
            return (
              <button
                key={category || 'all'}
                type="button"
                onClick={(event) => { event.stopPropagation(); setActive(category) }}
                style={{
                  ...tokens.button(on ? 'primary' : 'secondary'),
                  paddingInline: `${tokens.scale(14)}px`,
                  paddingBlock: `${tokens.scale(7)}px`,
                  fontSize: `${tokens.scale(13)}px`,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {category || 'Tout'}
              </button>
            )
          })}
        </div>
      )}

      <Grid tokens={tokens} columns={num(bag, 'columns', 3)} gap={project.grid.gap}>
        {shown.map((item, i) => (
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), display: 'flex', flexDirection: 'column' }}>
            {bool(bag, 'showImages') && <Media tokens={tokens} ratio="16 / 9" seed={i} />}
            <div style={{ padding: `${tokens.scale(18)}px`, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ fontSize: `${tokens.scale(12)}px`, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: tokens.colors.primary }}>
                {String(item.category ?? '')}
                {item.date ? <span style={{ color: 'currentColor', opacity: 0.68, fontWeight: 500 }}>{item.category ? ' · ' : ''}{String(item.date)}</span> : null}
              </p>
              <h3 style={{ ...tokens.heading(19), marginTop: `${tokens.scale(8)}px` }}>{String(item.title ?? '')}</h3>
              <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68, flex: 1 }}>
                {String(item.excerpt ?? '')}
              </p>
              {str(bag, 'readLabel') && (
                <p style={{ marginTop: `${tokens.scale(14)}px`, fontSize: `${tokens.scale(13)}px`, fontWeight: 700, color: tokens.colors.primary }}>
                  {str(bag, 'readLabel')} →
                </p>
              )}
            </div>
          </Appear>
        ))}
      </Grid>

      {str(bag, 'ctaLabel') && (
        <div style={{ marginTop: `${tokens.scale(26)}px`, textAlign: 'center' }}>
          <Btn tokens={tokens} label={str(bag, 'ctaLabel')} variant="secondary" />
        </div>
      )}
    </Shell>
  )
}

function Events({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const cards = str(bag, 'layout') === 'cards'

  const dateBlock = (item: Bag) => (
    <div
      style={{
        display: 'grid', placeItems: 'center', flexShrink: 0,
        width: `${tokens.scale(72)}px`, paddingBlock: `${tokens.scale(10)}px`,
        background: withAlpha(tokens.colors.primary, 0.1), color: tokens.colors.primary,
        borderRadius: tokens.radius,
      }}
    >
      <span style={{ ...tokens.heading(26), color: tokens.colors.primary, lineHeight: 1 }}>{String(item.day ?? '')}</span>
      <span style={{ fontSize: `${tokens.scale(12)}px`, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '2px' }}>
        {String(item.month ?? '')}
      </span>
    </div>
  )

  const detail = (item: Bag) => (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: `${tokens.scale(10)}px` }}>
        <h3 style={tokens.heading(19)}>{String(item.name ?? '')}</h3>
        {item.status ? (
          <span
            style={{
              fontSize: `${tokens.scale(11)}px`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
              padding: `${tokens.scale(3)}px ${tokens.scale(9)}px`, borderRadius: '999px',
              border: `1px solid ${tokens.divider}`, color: 'currentColor', opacity: 0.68,
            }}
          >
            {String(item.status)}
          </span>
        ) : null}
      </div>
      <p style={{ marginTop: `${tokens.scale(6)}px`, fontSize: `${tokens.scale(13)}px`, fontWeight: 600, color: tokens.colors.primary }}>
        {[item.time, item.place].filter(Boolean).map(String).join(' · ')}
      </p>
      <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
        {String(item.text ?? '')}
      </p>
      {str(bag, 'ctaLabel') && (
        <div style={{ marginTop: `${tokens.scale(12)}px` }}>
          <Btn tokens={tokens} label={str(bag, 'ctaLabel')} variant="secondary" />
        </div>
      )}
    </div>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />

      {cards ? (
        <Grid tokens={tokens} columns={3}>
          {items.map((item, i) => (
            <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(20)}px`, display: 'flex', gap: `${tokens.scale(16)}px`, flexDirection: 'column' }}>
              {dateBlock(item)}
              {detail(item)}
            </Appear>
          ))}
        </Grid>
      ) : (
        <div style={{ display: 'grid', gap: `${tokens.scale(14)}px`, maxWidth: '820px', marginInline: 'auto' }}>
          {items.map((item, i) => (
            <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(18)}px`, display: 'flex', gap: `${tokens.scale(18)}px`, alignItems: 'flex-start' }}>
              {dateBlock(item)}
              {detail(item)}
            </Appear>
          ))}
        </div>
      )}
    </Shell>
  )
}

function Jobs({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />

      <div style={{ display: 'grid', gap: `${tokens.scale(14)}px`, maxWidth: '860px', marginInline: 'auto' }}>
        {items.map((item, i) => (
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(22)}px` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: `${tokens.scale(12)}px` }}>
              <h3 style={tokens.heading(20)}>{String(item.name ?? '')}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${tokens.scale(6)}px` }}>
                {[item.contract, item.place].filter(Boolean).map((chip, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: `${tokens.scale(12)}px`, fontWeight: 600,
                      padding: `${tokens.scale(4)}px ${tokens.scale(10)}px`, borderRadius: '999px',
                      background: withAlpha(tokens.colors.primary, 0.1), color: tokens.colors.primary,
                    }}
                  >
                    {String(chip)}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(15)}px`, lineHeight: 1.7, color: 'currentColor', opacity: 0.68 }}>
              {String(item.text ?? '')}
            </p>
            {item.profile ? (
              <p style={{ marginTop: `${tokens.scale(10)}px`, paddingTop: `${tokens.scale(10)}px`, borderTop: `1px solid ${tokens.divider}`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
                <strong style={{ opacity: 1 }}>Profil — </strong>{String(item.profile)}
              </p>
            ) : null}
            <div style={{ marginTop: `${tokens.scale(16)}px` }}>
              <Btn tokens={tokens} label={str(bag, 'ctaLabel')} />
            </div>
          </Appear>
        ))}
      </div>

      {bool(bag, 'showSpontaneous') && (
        <div
          style={{
            maxWidth: '860px', marginInline: 'auto', marginTop: `${tokens.scale(20)}px`,
            padding: `${tokens.scale(22)}px`, borderRadius: tokens.radius,
            border: `1px dashed ${tokens.divider}`, textAlign: 'center',
          }}
        >
          <h3 style={tokens.heading(18)}>{str(bag, 'spontaneousTitle')}</h3>
          <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
            {str(bag, 'spontaneousText')}
          </p>
        </div>
      )}
    </Shell>
  )
}

function Documents({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={num(bag, 'columns', 3)}>
        {items.map((item, i) => (
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(20)}px`, display: 'flex', gap: `${tokens.scale(14)}px` }}>
            {/* Le format est saisi librement : on n'en montre que le debut,
                sinon « application/pdf » ferait exploser la pastille. */}
            <span
              style={{
                display: 'grid', placeItems: 'center', flexShrink: 0,
                width: `${tokens.scale(46)}px`, height: `${tokens.scale(56)}px`,
                borderRadius: `${Math.min(6, tokens.theme.radius)}px`,
                background: withAlpha(tokens.colors.primary, 0.12), color: tokens.colors.primary,
                fontSize: `${tokens.scale(12)}px`, fontWeight: 800, letterSpacing: '.04em',
              }}
              aria-hidden
            >
              {String(item.format ?? '').slice(0, 4).toUpperCase()}
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={tokens.heading(17)}>{String(item.name ?? '')}</h3>
              <p style={{ marginTop: `${tokens.scale(6)}px`, fontSize: `${tokens.scale(13)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
                {String(item.text ?? '')}
              </p>
              {[item.size, item.updated].some(Boolean) && (
                <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68 }}>
                  {[item.size, item.updated].filter(Boolean).map(String).join(' · ')}
                </p>
              )}
              <div style={{ marginTop: `${tokens.scale(12)}px` }}>
                <Btn tokens={tokens} label={str(bag, 'ctaLabel')} variant="secondary" />
              </div>
            </div>
          </Appear>
        ))}
      </Grid>
    </Shell>
  )
}

function Certifications({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} align="center" />
      <Grid tokens={tokens} columns={num(bag, 'columns', 2)}>
        {items.map((item, i) => (
          <Appear key={i} index={i} as="article" style={{ ...tokens.card(), padding: `${tokens.scale(20)}px`, display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: `${tokens.scale(38)}px`, height: `${tokens.scale(38)}px`, borderRadius: '999px', background: withAlpha(tokens.colors.primary, 0.12), flexShrink: 0, marginRight: `${tokens.scale(14)}px` }}>
              <Check tokens={tokens} color={tokens.colors.primary} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={tokens.heading(17)}>{String(item.name ?? '')}</h3>
              {item.issuer ? (
                <p style={{ marginTop: '2px', fontSize: `${tokens.scale(12)}px`, fontWeight: 600, color: tokens.colors.primary }}>{String(item.issuer)}</p>
              ) : null}
              <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, color: 'currentColor', opacity: 0.68 }}>
                {String(item.text ?? '')}
              </p>
              {item.validity ? (
                <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68 }}>{String(item.validity)}</p>
              ) : null}
            </div>
          </Appear>
        ))}
      </Grid>
      {str(bag, 'note') && (
        <p style={{ marginTop: `${tokens.scale(20)}px`, textAlign: 'center', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>
          {str(bag, 'note')}
        </p>
      )}
    </Shell>
  )
}

function Coverage({ project, tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const radius = Number(bag.radius ?? 30)
  const unit = str(bag, 'unit') === 'min' ? 'minutes de route' : 'km autour de nous'
  const showMap = bool(bag, 'showMap')

  const left = (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${tokens.scale(24)}px`, marginBottom: `${tokens.scale(20)}px` }}>
        <div>
          <p style={{ ...tokens.heading(40), color: tokens.colors.primary, lineHeight: 1 }}>
            <Count to={radius} />
          </p>
          <p style={{ marginTop: '4px', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>{unit}</p>
        </div>
        {str(bag, 'delay') && (
          <div>
            <p style={{ ...tokens.heading(20), lineHeight: 1.2 }}>{str(bag, 'delay')}</p>
            <p style={{ marginTop: '4px', fontSize: `${tokens.scale(13)}px`, color: 'currentColor', opacity: 0.68 }}>Délai habituel</p>
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: tokens.viewport === 'mobile' ? '1fr' : '1fr 1fr', gap: `${tokens.scale(10)}px` }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', fontSize: `${tokens.scale(14)}px`, lineHeight: 1.5 }}>
            <Check tokens={tokens} color={tokens.colors.primary} />
            <span style={{ minWidth: 0 }}>
              {String(item.name ?? '')}
              {item.note ? <span style={{ display: 'block', fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68 }}>{String(item.note)}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {bool(bag, 'showSearch') && (
        <div style={{ marginTop: `${tokens.scale(20)}px`, display: 'flex', gap: `${tokens.scale(10)}px`, flexWrap: 'wrap' }}>
          <span
            style={{
              flex: 1, minWidth: `${tokens.scale(180)}px`,
              padding: `${tokens.scale(12)}px ${tokens.scale(14)}px`,
              border: `1px solid ${tokens.divider}`, borderRadius: tokens.radius,
              color: withAlpha(tokens.colors.text, 0.45), fontSize: `${tokens.scale(14)}px`,
            }}
          >
            {str(bag, 'searchLabel') || 'Votre commune'}
          </span>
          <Btn tokens={tokens} label="Vérifier" />
        </div>
      )}

      {str(bag, 'outsideText') && (
        <p style={{ marginTop: `${tokens.scale(16)}px`, fontSize: `${tokens.scale(13)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
          {str(bag, 'outsideText')}
        </p>
      )}
    </div>
  )

  return (
    <Shell tokens={tokens} bag={bag}>
      <Head tokens={tokens} title={str(bag, 'title')} subtitle={str(bag, 'subtitle')} />
      {showMap && tokens.viewport !== 'mobile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${tokens.scale(32)}px`, alignItems: 'center' }}>
          {left}
          <MapBlock project={project} tokens={tokens} />
        </div>
      ) : (
        left
      )}
    </Shell>
  )
}

function Newsletter({ tokens, bag }: Props & { bag: Bag }) {
  const items = list(bag, 'items')
  const accent = (str(bag, 'tone') || 'accent') === 'accent'
  const count = Number(bag.count ?? 0)

  return (
    <Shell tokens={tokens} bag={bag}>
      <div style={{ maxWidth: '660px', marginInline: 'auto', textAlign: 'center' }}>
        <h2 style={tokens.heading(30)}>{str(bag, 'title')}</h2>
        <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(16)}px`, lineHeight: 1.7, color: 'currentColor', opacity: 0.82 }}>
          {str(bag, 'subtitle')}
        </p>

        {items.length > 0 && (
          <ul style={{ listStyle: 'none', margin: `${tokens.scale(18)}px 0 0`, padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${tokens.scale(16)}px` }}>
            {items.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', fontSize: `${tokens.scale(13)}px` }}>
                <Check tokens={tokens} color={accent ? 'currentColor' : tokens.colors.primary} />
                {String(item.name ?? '')}
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: `${tokens.scale(22)}px`, display: 'flex', gap: `${tokens.scale(10)}px`, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              flex: 1, minWidth: `${tokens.scale(220)}px`, maxWidth: `${tokens.scale(340)}px`,
              padding: `${tokens.scale(13)}px ${tokens.scale(16)}px`,
              borderRadius: tokens.radius, textAlign: 'left',
              background: accent ? withAlpha(tokens.colors.background, 0.92) : tokens.colors.card,
              border: `1px solid ${accent ? 'transparent' : tokens.divider}`,
              color: withAlpha(tokens.colors.text, 0.45), fontSize: `${tokens.scale(14)}px`,
            }}
          >
            {str(bag, 'placeholder')}
          </span>
          <span
            style={{
              ...tokens.button(),
              ...(accent ? { background: tokens.colors.background, color: tokens.colors.primary, backgroundImage: undefined } : null),
            }}
          >
            {str(bag, 'ctaLabel')}
          </span>
        </div>

        <p style={{ marginTop: `${tokens.scale(12)}px`, fontSize: `${tokens.scale(12)}px`, color: 'currentColor', opacity: 0.68 }}>
          {str(bag, 'frequency')}
          {bool(bag, 'showCount') && count > 0 ? ` · Déjà ${count.toLocaleString('fr-FR')} inscrits` : ''}
        </p>
        <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(11)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
          {str(bag, 'consent')}
        </p>
      </div>
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
    case 'booking': return <FormSection tokens={props.tokens} bag={bag} fields={bookingFields(props.project)} />
    case 'cta': return <Cta {...props} bag={bag} />
    case 'social': return <Social {...props} bag={bag} />
    case 'map': return <MapSection {...props} bag={bag} />
    case 'stats': return <Stats {...props} bag={bag} />
    case 'process': return <Process {...props} bag={bag} />
    case 'team': return <Team {...props} bag={bag} />
    case 'logos': return <Logos {...props} bag={bag} />
    case 'beforeafter': return <BeforeAfter {...props} bag={bag} />
    case 'banner': return <Banner {...props} bag={bag} />
    case 'ordermodes': return <OrderModes {...props} bag={bag} />
    case 'offers': return <Offers {...props} bag={bag} />
    case 'formulas': return <Formulas {...props} bag={bag} />
    case 'venues': return <Venues {...props} bag={bag} />
    case 'allergens': return <Allergens {...props} bag={bag} />
    case 'loyalty': return <Loyalty {...props} bag={bag} />
    case 'content': return <Content {...props} bag={bag} />
    case 'finder': return <Finder {...props} bag={bag} />
    case 'program': return <Program {...props} bag={bag} />
    case 'funding': return <Funding {...props} bag={bag} />
    case 'video': return <Video {...props} bag={bag} />
    case 'news': return <News {...props} bag={bag} />
    case 'events': return <Events {...props} bag={bag} />
    case 'jobs': return <Jobs {...props} bag={bag} />
    case 'documents': return <Documents {...props} bag={bag} />
    case 'certifications': return <Certifications {...props} bag={bag} />
    case 'coverage': return <Coverage {...props} bag={bag} />
    case 'newsletter': return <Newsletter {...props} bag={bag} />
  }
}
