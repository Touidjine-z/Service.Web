import type { CSSProperties } from 'react'
import type { Page, Product, Project, Viewport } from '@/engine/types'
import { getTheme } from '@/engine/themes'
import { withAlpha } from '@/engine/color'
import { createTokens, siteCssVars } from './tokens'
import SectionView from './Sections'
import { sectionLabel } from './sectionDefs'
import { Appear, MotionProvider } from './Motion'

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
  /**
   * Animations d'entree des sections. Par defaut elles suivent le mode :
   * actives pour le visiteur, coupees en edition. Une vignette figee (vitrine,
   * page finale) peut les couper explicitement.
   */
  animate?: boolean
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

/**
 * Rail lateral (`nav: 'sidebar'`).
 *
 * La variante etait declaree depuis l'origine mais tombait dans le meme
 * `space-between` que `inline` et `split` : trois valeurs, un seul rendu. Elle
 * produit desormais une vraie colonne, et bascule en en-tete classique des que
 * l'ecran n'est plus assez large.
 */
function Rail({ project, tokens, onNavigate, current }: {
  project: Project
  tokens: ReturnType<typeof createTokens>
  onNavigate?: (slug: string) => void
  current: string
}) {
  const { colors } = tokens
  const name = project.identity.businessName.trim() || 'Votre entreprise'

  return (
    <aside
      style={{
        width: `${tokens.scale(248)}px`,
        flexShrink: 0,
        background: colors.header,
        borderRight: `1px solid ${tokens.divider}`,
        padding: `${tokens.scale(28)}px ${tokens.scale(24)}px`,
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
      }}
    >
      <span style={{ ...tokens.heading(21), color: colors.primary, display: 'block' }}>
        {project.identity.logoUrl
          ? <img src={project.identity.logoUrl} alt={name} style={{ height: `${tokens.scale(38)}px`, display: 'block' }} />
          : name}
      </span>

      {project.identity.tagline && (
        <p style={{ marginTop: `${tokens.scale(10)}px`, fontSize: `${tokens.scale(13)}px`, lineHeight: 1.6, color: 'currentColor', opacity: 0.68 }}>
          {project.identity.tagline}
        </p>
      )}

      <nav style={{ display: 'grid', gap: `${tokens.scale(4)}px`, marginTop: `${tokens.scale(26)}px` }}>
        {project.pages.map((p) => {
          const active = p.slug === current
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate?.(p.slug)}
              style={{
                background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit',
                padding: `${tokens.scale(7)}px 0`,
                cursor: onNavigate ? 'pointer' : 'default',
                fontSize: `${tokens.scale(15)}px`,
                fontWeight: active ? 700 : 500,
                color: active ? colors.primary : 'currentColor',
                opacity: active ? 1 : 0.68,
                borderLeft: `2px solid ${active ? colors.primary : 'transparent'}`,
                paddingLeft: `${tokens.scale(12)}px`,
              }}
            >
              {p.name}
            </button>
          )
        })}
      </nav>

      {(project.identity.phone || project.identity.email) && (
        <div style={{ marginTop: `${tokens.scale(28)}px`, paddingTop: `${tokens.scale(16)}px`, borderTop: `1px solid ${tokens.divider}`, fontSize: `${tokens.scale(13)}px`, lineHeight: 1.9, color: 'currentColor', opacity: 0.68 }}>
          {project.identity.phone && <p>{project.identity.phone}</p>}
          {project.identity.email && <p>{project.identity.email}</p>}
        </div>
      )}
    </aside>
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
        {/* « large » signait le meme rendu que « columns » : il pose desormais
            l'enseigne en grand, comme une signature de bas de page. */}
        {theme.footer === 'large' && tokens.viewport !== 'mobile' && (
          <p
            style={{
              ...tokens.heading(tokens.viewport === 'tv' ? 96 : 64),
              color: tokens.onFooter,
              opacity: 0.16,
              lineHeight: 1,
              marginBottom: `${tokens.scale(20)}px`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            aria-hidden
          >
            {name}
          </p>
        )}
        <p style={{ fontSize: `${tokens.scale(13)}px`, opacity: 0.7, textAlign: theme.footer === 'centered' ? 'center' : 'left' }}>
          © {year} {name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}

export default function SiteRenderer({
  project, page, viewport = 'desktop', editable = false, selectedSectionId, onSelectSection, onNavigate, onAddToCart,
  animate,
}: Props) {
  const theme = getTheme(project.themeId)
  const tokens = createTokens(theme, project.colors, viewport, project.fontPair)
  const visible = page.sections.filter((s) => editable || !s.hidden)
  // Le rail lateral n'a pas de sens sous 900 px : mobile et tablette
  // retombent sur l'en-tete horizontale.
  const railed = theme.nav === 'sidebar' && (viewport === 'desktop' || viewport === 'tv')

  return (
    // Les animations du site suivent `theme.motion` (§10) et sont coupees en
    // edition : rien ne doit bouger sous le curseur pendant qu'on compose.
    <MotionProvider level={theme.motion} enabled={animate ?? !editable}>
    <div
      className="site-root"
      style={{
        ...(siteCssVars(theme, project.colors, project.fontPair) as CSSProperties),
        display: railed ? 'flex' : undefined,
        alignItems: railed ? 'flex-start' : undefined,
      }}
    >
      {railed
        ? <Rail project={project} tokens={tokens} onNavigate={onNavigate} current={page.slug} />
        : <Nav project={project} tokens={tokens} onNavigate={onNavigate} current={page.slug} />}

      <div style={railed ? { flex: 1, minWidth: 0 } : { display: 'contents' }}>

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
              <Appear>
                <SectionView section={section} project={project} tokens={tokens} onAddToCart={onAddToCart} />
              </Appear>

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
    </div>
    </MotionProvider>
  )
}
