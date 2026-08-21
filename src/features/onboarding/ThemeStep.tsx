import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { THEMES, getTheme } from '@/engine/themes'
import { planDefOf, planLimits, upgradeOf } from '@/engine/plans'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'
import { PlanLock, PlanUpgradeDialog } from '@/ui/PlanLock'
import ThemeThumbnail from './ThemeThumbnail'

/** Ce que le theme neutre apporte, dit sans jargon et sans un montant (§56). */
const CUSTOM_EXPLAIN = "Vous partez d'une base neutre et vous définissez vous-même chaque couleur, "
  + 'au lieu de retoucher un thème existant.'

/** Etape 4 (§10) : les 20 themes. */
export default function ThemeStep() {
  const { project, dispatch } = useProject()
  // Une fois les couleurs retouchees, changer de theme ne doit pas les ecraser.
  const [keepColors, setKeepColors] = useState(false)
  const current = getTheme(project.themeId)
  // Un seul theme depend de la formule, et la regle se lit dans le catalogue :
  // aucune formule n'est nommee ici.
  const customTheme = planLimits(project).customTheme
  const upgrade = upgradeOf(planDefOf(project))
  const [asking, setAsking] = useState(false)

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
        {THEMES.map((theme) => {
          const active = theme.id === project.themeId
          // Le theme ferme reste a sa place, grise et etiquete : cache, il ne
          // vendrait rien. Son clic ouvre la feuille au lieu de ne rien faire.
          if (theme.id === 'custom' && !customTheme && upgrade) {
            return (
              <div
                key={theme.id}
                onClick={() => setAsking(true)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-line opacity-60 transition hover:border-brand/40 hover:opacity-100"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
                  <ThemeThumbnail theme={theme} colors={theme.colors} fontPair={project.fontPair} />
                  <span className="absolute right-2 top-2">
                    <PlanLock
                      feature="Le design entièrement sur mesure"
                      explain={CUSTOM_EXPLAIN}
                      onUpgraded={() => dispatch({ type: 'setTheme', themeId: theme.id, keepColors })}
                    />
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{theme.name}</p>
                  <p className="text-xs leading-relaxed text-subtle">
                    Le design entièrement sur mesure fait partie du {upgrade.label.toLowerCase()}.
                  </p>
                </div>
              </div>
            )
          }
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
                <ThemeThumbnail theme={theme} colors={active ? project.colors : theme.colors} fontPair={project.fontPair} />
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

      {/* La promesse « definissez chaque couleur » n'est tenue que si le theme
          neutre est ouvert : sinon la carte porte deja son explication. */}
      {customTheme && (
        <p className="mt-6 flex items-start gap-2 text-xs text-subtle">
          <Info size={14} className="mt-px shrink-0" />
          Le thème « Custom » part d'une base neutre : idéal si vous souhaitez définir vous-même
          chaque couleur à l'étape suivante.
        </p>
      )}

      {asking && (
        <PlanUpgradeDialog
          feature="Le design entièrement sur mesure"
          explain={CUSTOM_EXPLAIN}
          onClose={() => setAsking(false)}
          onUpgraded={() => {
            // La montee acceptee, on applique le theme que le client visait.
            dispatch({ type: 'setTheme', themeId: 'custom', keepColors })
            setAsking(false)
          }}
        />
      )}
    </StepLayout>
  )
}
