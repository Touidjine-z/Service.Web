import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react'
import { auditContrast, generatePalette, type HarmonyMode } from '@/engine/color'
import { getTheme } from '@/engine/themes'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'
import ColorField from '@/ui/ColorField'
import FontPairPicker from '@/ui/FontPairPicker'
import ThemeThumbnail from './ThemeThumbnail'
import type { ColorScheme } from '@/engine/types'

const FIELDS: { key: keyof ColorScheme; label: string }[] = [
  { key: 'primary', label: 'Principale' },
  { key: 'secondary', label: 'Secondaire' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Fond' },
  { key: 'text', label: 'Texte' },
  { key: 'button', label: 'Boutons' },
  { key: 'card', label: 'Cartes' },
  { key: 'header', label: 'En-tête' },
  { key: 'footer', label: 'Pied de page' },
]

const HARMONIES: { id: HarmonyMode; label: string }[] = [
  { id: 'analogous', label: 'Analogue' },
  { id: 'complementary', label: 'Complémentaire' },
  { id: 'triadic', label: 'Triadique' },
  { id: 'monochrome', label: 'Monochrome' },
]

/** Etape 5 (§11) : couleurs, avec generation de palette et controle de contraste. */
export default function ColorsStep() {
  const { project, dispatch } = useProject()
  const [harmony, setHarmony] = useState<HarmonyMode>('analogous')
  const theme = getTheme(project.themeId)

  const issues = useMemo(() => auditContrast(project.colors), [project.colors])

  function generate() {
    dispatch({ type: 'setColors', colors: generatePalette(project.colors.primary, harmony, theme.dark) })
  }

  function resetToTheme() {
    dispatch({ type: 'setTheme', themeId: project.themeId, keepColors: false })
  }

  return (
    <StepLayout
      step="design"
      title="Vos couleurs et votre typographie"
      subtitle="Ajustez chaque couleur, générez une palette harmonieuse à partir de votre couleur principale, et choisissez les polices qui vous ressemblent."
      back="/creer/theme"
      next="/creer/site"
      nextLabel="Construire mon site"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary !py-2 !px-4 text-sm" onClick={generate}>
              <Sparkles size={15} /> Générer une palette
            </button>
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              {HARMONIES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHarmony(h.id)}
                  className={[
                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                    harmony === h.id ? 'bg-brand/10 text-brand' : 'text-muted hover:text-ink',
                  ].join(' ')}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost !py-2 !px-3 text-sm" onClick={resetToTheme}>
              <RotateCcw size={14} /> Couleurs du thème
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <ColorField
                key={field.key}
                label={field.label}
                value={project.colors[field.key]}
                onChange={(hex) => dispatch({ type: 'setColors', colors: { [field.key]: hex } })}
              />
            ))}
          </div>

          <section className="mt-10">
            <p className="label">Typographie</p>
            <p className="mb-4 text-xs leading-relaxed text-subtle">
              Chaque proposition est affichée avec ses vraies polices. « Polices du thème »
              laisse le thème décider — vous pourrez en changer à tout moment.
            </p>
            <FontPairPicker />
          </section>

          {issues.length > 0 && (
            <div className="mt-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed text-amber-900">
                <strong className="font-semibold">Lisibilité à vérifier.</strong>
                <ul className="mt-1 space-y-0.5">
                  {issues.map((issue) => (
                    <li key={issue.pair}>
                      {issue.pair} — contraste {issue.ratio.toFixed(1)}:1 (recommandé : 4.5:1)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="label">Aperçu</p>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line shadow-card">
            <ThemeThumbnail theme={theme} colors={project.colors} fontPair={project.fontPair} />
          </div>
          <p className="mt-3 text-xs text-subtle">
            Aperçu réduit du thème {theme.name}. L'aperçu complet et navigable vous attend à l'étape suivante.
          </p>
        </aside>
      </div>
    </StepLayout>
  )
}
