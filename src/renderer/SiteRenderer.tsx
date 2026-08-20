import type { CSSProperties } from 'react'
import type { Page, Product, Project, Viewport } from '@/engine/types'
import { getTheme } from '@/engine/themes'
import { withAlpha } from '@/engine/color'
import { createTokens, siteCssVars } from './tokens'
import SectionView from './Sections'
import { sectionLabel } from './sectionDefs'

/**
 * Rend le site du client. Le meme composant sert a l'edition, a l'apercu et au
 * mode visiteur (§22) : seule la prop `editable` change, ce qui garantit que le
 * client voit exactement ce qu'il a construit.
 */
interface Props {
  project: Project
  page: Page
  viewport?: Viewport
  /** Affiche les reperes de selection et remonte les clics sur les sections. */
  editable?: boolean
  selectedSectionId?: string | null
  onSelectSection?: (sectionId: string) => void
  onNavigate?: (slug: string) => void
  /** Actif en mode visiteur quand le site accepte les commandes. */
  onAddToCart?: (product: Product) => void
}

function Nav({ project, tokens, onNavigate, current }: {
  project: Project
  tokens: ReturnType<typeof createTokens>
  onNavigate?: (slug: string) => void
  current: string
}) {
  const { theme, colors } = tokens
  const name = project.identity.businessName.trim() || 'Votre entreprise'
  const links = project.pages.map((p) => ({ slug: p.slug, name: p.name }))
  const stacked = theme.nav === 'stacked'
  const compact = tokens.viewport === 'mobile'

  const logo = (
    <span style={{ ...tokens.heading(20), color: colors.primary, whiteSpace: 'nowrap' }}>
      {project.identity.logoUrl
        ? <img src={project.identity.logoUrl} alt={name} style={{ height: `${tokens.scale(34)}px`, display: 'block' }} />
        : name}
    </span>
  )

  const menu = theme.nav === 'minimal' || compact ? (
    <span style={{ fontSize: `${tokens.scale(14)}px`, color: tokens.muted }}>Menu</span>
  ) : (
    <nav style={{ display: 'flex', gap: `${tokens.scale(22)}px`, flexWrap: 'wrap' }}>
      {links.map((link) => (
        <button
          key={link.slug}
          type="button"
          onClick={() => onNavigate?.(link.slug)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: onNavigate ? 'pointer' : 'default',
            fontFamily: 'inherit', fontSize: `${tokens.scale(15)}px`,
            color: link.slug === current ? colors.primary : tokens.muted,
            fontWeight: link.slug === current ? 600 : 500,
            borderBottom: link.slug === current ? `2px solid ${colors.primary}` : '2px solid transparent',
          }}
        >
          {link.name}
        </button>
      ))}
    </nav>
  )

  const justify =
    theme.nav === 'centered' ? 'center'
    : theme.nav === 'split' ? 'space-between'
    : theme.nav === 'minimal' ? 'space-between'
    : 'space-between'

  return (
    <header style={{ background: colors.header, borderBottom: `1px solid ${tokens.divider}`, position: 'relative' }}>
      <div
        style={{
          ...tokens.container(),
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          alignItems: stacked ? 'flex-start' : 'center',
          justifyContent: stacked ? undefined : justify,
          gap: `${tokens.scale(14)}px`,
          paddingBlock: `${tokens.scale(16)}px`,
          textAlign: theme.nav === 'centered' ? 'center' : undefined,
        }}
      >
        {theme.nav === 'centered' ? (
          <div style={{ width: '100%', display: 'grid', justifyItems: 'center', gap: `${tokens.scale(12)}px` }}>
            {logo}
            {menu}
          </div>
        ) : (
          <>
            {logo}
            {menu}
          </>
        )}
      </div>
    </header>
  )
}

function Footer({ project, tokens }: { project: Project; tokens: ReturnType<typeof createTokens> }) {
  const { theme, colors } = tokens
  const name = project.identity.businessName.trim() || 'Votre entreprise'
  const year = new Date().getFullYear()
  const columns = theme.footer === 'columns' || theme.footer === 'large'

  return (
    <footer style={{ background: colors.footer, color: tokens.onFooter, paddingBlock: `${tokens.scale(theme.footer === 'compact' ? 24 : 48)}px` }}>
      <div style={tokens.container()}>
        {columns && tokens.viewport !== 'mobile' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: `${tokens.scale(28)}px`, marginBottom: `${tokens.scale(28)}px` }}>
            <div>
              <p style={{ ...tokens.heading(18), color: tokens.onFooter }}>{name}</p>
              <p style={{ marginTop: '8px', fontSize: `${tokens.scale(14)}px`, opacity: 0.75, lineHeight: 1.7 }}>
                {project.identity.tagline || 'Votre accroche apparaîtra ici.'}
              </p>
            </div>
            <div style={{ fontSize: `${tokens.scale(14)}px`, opacity: 0.8, lineHeight: 1.9 }}>
              {project.pages.slice(0, 5).map((p) => <p key={p.id}>{p.name}</p>)}
            </div>
            <div style={{ fontSize: `${tokens.scale(14)}px`, opacity: 0.8, lineHeight: 1.9 }}>
              {project.identity.phone && <p>{project.identity.phone}</p>}
              {project.identity.email && <p>{project.identity.email}</p>}
              {project.identity.address && <p>{project.identity.address}</p>}
              {project.identity.city && <p>{project.identity.city}</p>}
            </div>
          </div>
        ) : null}
        <p style={{ fontSize: `${tokens.scale(13)}px`, opacity: 0.7, textAlign: theme.footer === 'centered' ? 'center' : 'left' }}>
          © {year} {name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}

export default function SiteRenderer({
  project, page, viewport = 'desktop', editable = false, selectedSectionId, onSelectSection, onNavigate, onAddToCart,
}: Props) {
  const theme = getTheme(project.themeId)
  const tokens = createTokens(theme, project.colors, viewport)
  const visible = page.sections.filter((s) => editable || !s.hidden)

  return (
    <div className="site-root" style={siteCssVars(theme, project.colors) as CSSProperties}>
      <Nav project={project} tokens={tokens} onNavigate={onNavigate} current={page.slug} />

      <main>
        {visible.length === 0 && (
          <div style={{ ...tokens.container(), paddingBlock: `${tokens.scale(80)}px`, textAlign: 'center', color: tokens.muted }}>
            Cette page n'a encore aucune section.
          </div>
        )}

        {visible.map((section) => {
          const selected = editable && section.id === selectedSectionId
          return (
            <div
              key={section.id}
              className={editable ? 'section-shell' : undefined}
              onClick={editable ? (event) => { event.stopPropagation(); onSelectSection?.(section.id) } : undefined}
              style={{
                position: 'relative',
                cursor: editable ? 'pointer' : undefined,
                opacity: section.hidden ? 0.45 : 1,
                outline: selected ? `2px solid ${theme.colors.primary}` : undefined,
                outlineOffset: '-2px',
              }}
            >
              <SectionView section={section} project={project} tokens={tokens} onAddToCart={onAddToCart} />

              {editable && (
                <span
                  style={{
                    position: 'absolute', top: 0, left: 0, zIndex: 2,
                    background: selected ? project.colors.primary : withAlpha(project.colors.text, 0.75),
                    color: selected ? tokens.onPrimary : project.colors.background,
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    opacity: selected ? 1 : 0.001,
                    transition: 'opacity .15s',
                  }}
                  className="section-tag"
                >
                  {sectionLabel(section.kind)}{section.hidden ? ' — masquée' : ''}
                </span>
              )}
            </div>
          )
        })}
      </main>

      <Footer project={project} tokens={tokens} />
    </div>
  )
}
