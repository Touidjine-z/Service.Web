import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { THEMES, type Theme } from '@/engine/themes'
import ThemeThumbnail from '@/features/onboarding/ThemeThumbnail'
import { useProject } from '@/store/ProjectStore'
import { Reveal } from '@/ui/motion'

/**
 * Galerie de designs (§10).
 *
 * Les vignettes ne sont pas des captures : c'est le meme composant que l'etape
 * « Design » du parcours, alimente par les vrais tokens du theme. Ce qui est
 * montre ici est donc exactement ce que le visiteur obtiendra — et la galerie
 * reste juste quand un theme change, sans image a regenerer.
 */

type FilterId = 'all' | 'light' | 'dark' | 'round' | 'character'

const FILTERS: { id: FilterId; label: string; match: (theme: Theme) => boolean }[] = [
  { id: 'all', label: 'Tous les designs', match: () => true },
  { id: 'light', label: 'Clairs', match: (t) => !t.dark },
  { id: 'dark', label: 'Sombres', match: (t) => Boolean(t.dark) },
  { id: 'round', label: 'Arrondis', match: (t) => t.radius >= 14 },
  {
    id: 'character',
    label: 'Du caractère',
    match: (t) => t.headingWeight >= 800 || t.headingTransform === 'uppercase' || t.button === 'gradient' || t.card === 'bordered-heavy',
  },
]

export default function ThemeGallery() {
  const navigate = useNavigate()
  const { dispatch } = useProject()
  const [filter, setFilter] = useState<FilterId>('all')

  const shown = useMemo(() => {
    const rule = FILTERS.find((f) => f.id === filter) ?? FILTERS[0]
    // Le theme « custom » est un point de depart vierge : il n'a rien a montrer ici.
    return THEMES.filter((theme) => theme.id !== 'custom' && rule.match(theme))
  }, [filter])

  function start(theme: Theme) {
    dispatch({ type: 'setTheme', themeId: theme.id, keepColors: false })
    navigate('/creer/activite')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = item.id === filter
          const count = THEMES.filter((t) => t.id !== 'custom' && item.match(t)).length
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.id)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink',
              ].join(' ')}
            >
              {item.label}
              <span className={`ml-1.5 text-xs ${active ? 'text-white/60' : 'text-subtle'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {shown.map((theme, i) => (
          <Reveal key={theme.id} delay={(i % 3) * 80} zoom>
            <button
              type="button"
              onClick={() => start(theme)}
              className="group block w-full overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-canvas">
                {/* La miniature est zoomee au survol : on regarde le design de plus pres. */}
                <span className="absolute inset-0 block origin-top transition-transform duration-500 group-hover:scale-[1.06]">
                  <ThemeThumbnail theme={theme} colors={theme.colors} />
                </span>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-ink/85 px-4 py-3 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Créer mon site avec ce design
                  <ArrowUpRight size={15} />
                </span>
              </span>

              <span className="flex items-start justify-between gap-3 px-4 py-3.5">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{theme.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-subtle">{theme.tagline}</span>
                </span>
                <span className="flex shrink-0 gap-1 pt-1" aria-hidden>
                  {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, index) => (
                    <span key={index} className="h-3.5 w-3.5 rounded-full ring-1 ring-line" style={{ background: color }} />
                  ))}
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
