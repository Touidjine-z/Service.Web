import type { Theme } from '@/engine/themes'
import type { ColorScheme } from '@/engine/types'
import { readableOn, withAlpha } from '@/engine/color'

/**
 * Miniature fidele d'un theme : elle rejoue les vrais tokens (nav, hero, cartes,
 * boutons, rayons, images) pour que deux themes ne se ressemblent jamais.
 */
export default function ThemeThumbnail({ theme, colors }: { theme: Theme; colors: ColorScheme }) {
  const onButton = readableOn(colors.button)
  const radius = `${Math.min(theme.radius, 14)}px`

  const buttonStyle: React.CSSProperties = {
    background: theme.button === 'outline' || theme.button === 'underline' ? 'transparent' : colors.button,
    color: theme.button === 'outline' || theme.button === 'underline' ? colors.primary : onButton,
    border: theme.button === 'outline' ? `1px solid ${colors.primary}` : 'none',
    borderBottom: theme.button === 'underline' ? `2px solid ${colors.primary}` : undefined,
    borderRadius: theme.button === 'pill' ? '999px' : theme.button === 'sharp' ? '0' : radius,
    backgroundImage:
      theme.button === 'gradient' ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` : undefined,
  }

  const cardStyle: React.CSSProperties = {
    background: theme.card === 'glass' ? withAlpha(colors.card, 0.55) : colors.card,
    border:
      theme.card === 'outlined' ? `1px solid ${withAlpha(colors.text, 0.14)}`
      : theme.card === 'bordered-heavy' ? `2px solid ${colors.text}`
      : theme.card === 'glass' ? `1px solid ${withAlpha(colors.text, 0.16)}`
      : 'none',
    boxShadow: theme.card === 'elevated' || theme.card === 'overlap' ? '0 6px 16px -8px rgba(0,0,0,.35)' : 'none',
    borderRadius: radius,
  }

  const imageRadius =
    theme.image === 'circle' ? '999px'
    : theme.image === 'arch' ? `${radius} ${radius} 2px 2px`
    : theme.image === 'sharp' ? '0'
    : radius

  return (
    <div
      className="pointer-events-none flex h-full w-full flex-col overflow-hidden text-[6px] leading-tight"
      style={{ background: colors.background, color: colors.text, fontFamily: theme.bodyFont }}
      aria-hidden
    >
      {/* Navigation */}
      <div
        className={[
          'flex shrink-0 items-center gap-1 px-2 py-1.5',
          theme.nav === 'centered' ? 'justify-center' : theme.nav === 'split' ? 'justify-between' : '',
          theme.nav === 'stacked' ? 'flex-col !items-start gap-0.5' : '',
        ].join(' ')}
        style={{ background: colors.header, borderBottom: `1px solid ${withAlpha(colors.text, 0.1)}` }}
      >
        <span
          style={{
            fontFamily: theme.headingFont,
            fontWeight: theme.headingWeight,
            textTransform: theme.headingTransform,
            color: colors.primary,
            fontSize: '7px',
          }}
        >
          LOGO
        </span>
        {theme.nav !== 'minimal' && (
          <span className="flex gap-1" style={{ opacity: 0.6 }}>
            <span>Accueil</span><span>Services</span><span>Contact</span>
          </span>
        )}
      </div>

      {/* Hero */}
      <div
        className={[
          'flex shrink-0 gap-1.5 px-2',
          theme.sectionPadding === 'compact' ? 'py-2' : theme.sectionPadding === 'vast' ? 'py-6' : 'py-4',
          theme.hero === 'split' ? 'flex-row items-center' : 'flex-col',
          theme.hero === 'centered' || theme.hero === 'overlay' ? 'items-center text-center' : 'items-start',
        ].join(' ')}
        style={{
          background:
            theme.hero === 'fullbleed' ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            : theme.hero === 'overlay' ? `linear-gradient(${withAlpha(colors.text, 0.55)}, ${withAlpha(colors.text, 0.55)}), linear-gradient(120deg, ${colors.primary}, ${colors.accent})`
            : theme.hero === 'boxed' ? colors.card
            : 'transparent',
          color: theme.hero === 'fullbleed' || theme.hero === 'overlay' ? readableOn(colors.primary) : colors.text,
        }}
      >
        <div className={theme.hero === 'split' ? 'flex-1' : 'w-full'}>
          <div
            style={{
              fontFamily: theme.headingFont,
              fontWeight: theme.headingWeight,
              textTransform: theme.headingTransform,
              letterSpacing: theme.letterSpacing === 'wide' ? '.08em' : theme.letterSpacing === 'tight' ? '-.02em' : '0',
              fontSize: theme.headingWeight >= 800 ? '11px' : '9px',
            }}
          >
            Votre entreprise
          </div>
          <div style={{ opacity: 0.65, marginTop: '2px' }}>Un savoir-faire à votre service</div>
          <div className="mt-1.5 inline-block px-1.5 py-1" style={buttonStyle}>Contact</div>
        </div>
        {theme.hero === 'split' && (
          <div className="h-9 w-12 shrink-0" style={{ background: withAlpha(colors.accent, 0.5), borderRadius: imageRadius }} />
        )}
      </div>

      {/* Cartes */}
      <div className="flex flex-1 gap-1 px-2 pb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 overflow-hidden p-1" style={cardStyle}>
            <div
              className="mb-1 w-full"
              style={{
                height: '10px',
                background: withAlpha(colors.primary, theme.image === 'duotone' ? 0.75 : 0.35),
                borderRadius: imageRadius,
              }}
            />
            <div style={{ fontFamily: theme.headingFont, fontWeight: theme.headingWeight }}>Service</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-2 py-1"
        style={{ background: colors.footer, color: readableOn(colors.footer), opacity: 0.95 }}
      >
        <span style={{ opacity: 0.7 }}>© Votre entreprise</span>
      </div>
    </div>
  )
}
