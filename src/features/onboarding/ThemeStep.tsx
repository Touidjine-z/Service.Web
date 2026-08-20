import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { THEMES, getTheme } from '@/engine/themes'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'
import ThemeThumbnail from './ThemeThumbnail'

/** Etape 4 (§10) : les 20 themes. */
export default function ThemeStep() {
  const { project, dispatch } = useProject()
  // Une fois les couleurs retouchees, changer de theme ne doit pas les ecraser.
  const [keepColors, setKeepColors] = useState(false)
  const current = getTheme(project.themeId)

  return (
    <StepLayout
      step="design"
      title="Choisissez votre style"
      subtitle="Chaque thème modifie la mise en page, la typographie, les cartes et les animations — pas seulement les couleurs."
      back="/creer/fonctionnalites"
      next="/creer/couleurs"
      nextLabel="Personnaliser les couleurs"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Thème actuel : <strong className="text-ink">{current.name}</strong> — {current.tagline}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={keepColors}
            onChange={(e) => setKeepColors(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-[rgb(var(--brand))]"
          />
          Conserver mes couleurs en changeant de thème
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {THEMES.map((theme) => {
          const active = theme.id === project.themeId
          return (
            <button
              key={theme.id}
              type="button"
              aria-pressed={active}
              onClick={() => dispatch({ type: 'setTheme', themeId: theme.id, keepColors })}
              className={[
                'group overflow-hidden rounded-2xl border text-left transition',
                active ? 'border-brand ring-4 ring-brand/15' : 'border-line hover:border-brand/40 hover:shadow-card',
              ].join(' ')}
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
                <ThemeThumbnail theme={theme} colors={active ? project.colors : theme.colors} />
                {active && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-ink shadow">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className={`text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{theme.name}</p>
                <p className="truncate text-xs text-subtle">{theme.tagline}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-subtle">
        <Info size={14} className="mt-px shrink-0" />
        Le thème « Custom » part d'une base neutre : idéal si vous souhaitez définir vous-même
        chaque couleur à l'étape suivante.
      </p>
    </StepLayout>
  )
}
