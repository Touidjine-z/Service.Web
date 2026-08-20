import { FONT_PAIRS } from '@/engine/fonts'
import { getTheme } from '@/engine/themes'
import { useProject } from '@/store/ProjectStore'

/**
 * Choix de la typographie (§11).
 *
 * Chaque carte est rendue AVEC la police qu'elle propose : le client juge sur
 * pieces, pas sur un nom de fonte qui ne lui dit rien. La carte « Polices du
 * theme » affiche donc celles du theme courant, et change quand il change.
 */
export default function FontPairPicker({ compact = false }: { compact?: boolean }) {
  const { project, dispatch } = useProject()
  const theme = getTheme(project.themeId)
  const current = project.fontPair || 'default'

  return (
    <div className={compact ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
      {FONT_PAIRS.map((pair) => {
        const active = pair.id === current
        // L'appairage neutre emprunte les polices du theme pour son apercu.
        const headingFont = pair.headingFont || theme.headingFont
        const bodyFont = pair.bodyFont || theme.bodyFont
        const headingWeight = pair.headingWeight ?? theme.headingWeight

        return (
          <button
            key={pair.id}
            type="button"
            aria-pressed={active}
            onClick={() => dispatch({ type: 'setFontPair', fontPair: pair.id })}
            className={[
              'rounded-xl border p-3 text-left transition',
              active ? 'border-brand bg-brand/5 ring-2 ring-brand/15' : 'border-line bg-surface hover:border-brand/40',
            ].join(' ')}
          >
            <span className="flex items-baseline gap-2">
              <span
                className="text-2xl leading-none text-ink"
                style={{ fontFamily: headingFont, fontWeight: headingWeight }}
              >
                Aa
              </span>
              <span className="truncate text-sm text-muted" style={{ fontFamily: bodyFont }}>
                Votre entreprise
              </span>
            </span>

            <span className={`mt-2 block text-xs font-semibold ${active ? 'text-brand' : 'text-ink'}`}>
              {pair.label}
            </span>
            {!compact && (
              <span className="mt-0.5 block text-[11px] leading-relaxed text-subtle">{pair.description}</span>
            )}
            <span className="mt-1 block truncate text-[11px] text-subtle">{pair.forWho}</span>
          </button>
        )
      })}
    </div>
  )
}
