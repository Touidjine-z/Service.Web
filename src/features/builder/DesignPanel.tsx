import { useMemo, useState } from 'react'
import { AlertTriangle, Check, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { auditContrast, generatePalette, type HarmonyMode } from '@/engine/color'
import { FONT_PAIRS } from '@/engine/fonts'
import { THEMES, getTheme } from '@/engine/themes'
import { planDefOf, planLimits, upgradeOf } from '@/engine/plans'
import type { ColorScheme } from '@/engine/types'
import ThemeThumbnail from '@/features/onboarding/ThemeThumbnail'
import ColorField from '@/ui/ColorField'
import { PlanLock, PlanUpgradeDialog } from '@/ui/PlanLock'
import { useProject } from '@/store/ProjectStore'

/**
 * Onglet « Design » du builder (§9, §10, §11).
 *
 * Il manquait : une fois dans l'editeur, changer de theme ou de couleurs
 * obligeait a revenir en arriere dans le parcours, donc a quitter l'apercu.
 * Tout est desormais modifiable ici, avec le site rendu a cote qui se met a
 * jour a chaque clic — c'est le moment ou le choix se juge vraiment.
 */

const COLOR_FIELDS: { key: keyof ColorScheme; label: string }[] = [
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

type Block = 'theme' | 'fonts' | 'colors'

export default function DesignPanel() {
  const { project, dispatch } = useProject()
  const [open, setOpen] = useState<Block>('theme')
  const [keepColors, setKeepColors] = useState(true)
  // Formule (§60) : la vignette « sur mesure » se verrouille au lieu d'avaler
  // le clic. `upgrade` vaut null en sur-mesure, la branche disparait d'elle-meme.
  const upgrade = upgradeOf(planDefOf(project))
  const [askingCustom, setAskingCustom] = useState(false)
  const [harmony, setHarmony] = useState<HarmonyMode>('analogous')

  const theme = getTheme(project.themeId)
  const issues = useMemo(() => auditContrast(project.colors), [project.colors])
  const currentPair = project.fontPair || 'default'

  return (
    <div className="p-4">
      <p className="label">Design du site</p>

      <Accordion id="theme" title="Thème" detail={theme.name}>
        <label className="mb-3 flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={keepColors}
            onChange={(e) => setKeepColors(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line accent-[rgb(var(--brand))]"
          />
          Conserver mes couleurs en changeant de thème
        </label>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((item) => {
            const active = item.id === project.themeId
            // Le design entierement sur mesure est ferme au site modele (§60).
            // Le reducer refuse deja l'action ; sans ce verrou, le clic serait
            // simplement avale, sans un mot — le pire des comportements.
            if (item.id === 'custom' && !planLimits(project).customTheme && upgrade) {
              return (
                <div
                  key={item.id}
                  onClick={() => setAskingCustom(true)}
                  title={`Le design entièrement sur mesure fait partie du ${upgrade.label.toLowerCase()}.`}
                  className="cursor-pointer overflow-hidden rounded-lg border border-line opacity-60 transition hover:border-brand/40 hover:opacity-100"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <ThemeThumbnail theme={item} colors={item.colors} fontPair={project.fontPair} />
                    <span className="absolute right-1 top-1">
                      <PlanLock
                        feature="Le design entièrement sur mesure"
                        explain="Nous dessinons votre site à partir de votre identité visuelle, au lieu de partir d'un des designs existants."
                        onUpgraded={() => dispatch({ type: 'setTheme', themeId: item.id, keepColors })}
                      />
                    </span>
                  </span>
                  <span className="block truncate px-1.5 py-1 text-[11px] font-medium text-subtle">
                    {item.name}
                  </span>
                </div>
              )
            }
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                title={item.tagline}
                onClick={() => dispatch({ type: 'setTheme', themeId: item.id, keepColors })}
                className={[
                  'overflow-hidden rounded-lg border text-left transition',
                  active ? 'border-brand ring-2 ring-brand/20' : 'border-line hover:border-brand/40',
                ].join(' ')}
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <ThemeThumbnail
                    theme={item}
                    colors={active ? project.colors : item.colors}
                    fontPair={project.fontPair}
                  />
                  {active && (
                    <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-brand text-brand-ink">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className={`block truncate px-1.5 py-1 text-[11px] font-medium ${active ? 'text-brand' : 'text-muted'}`}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>
      </Accordion>

      <Accordion id="fonts" title="Typographie" detail={FONT_PAIRS.find((p) => p.id === currentPair)?.label ?? ''}>
        <div className="grid gap-1.5">
          {FONT_PAIRS.map((pair) => {
            const active = pair.id === currentPair
            const headingFont = pair.headingFont || theme.headingFont
            const bodyFont = pair.bodyFont || theme.bodyFont
            return (
              <button
                key={pair.id}
                type="button"
                aria-pressed={active}
                onClick={() => dispatch({ type: 'setFontPair', fontPair: pair.id })}
                className={[
                  'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition',
                  active ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/40',
                ].join(' ')}
              >
                <span
                  className="shrink-0 text-lg leading-none text-ink"
                  style={{ fontFamily: headingFont, fontWeight: pair.headingWeight ?? theme.headingWeight }}
                >
                  Aa
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-xs font-semibold ${active ? 'text-brand' : 'text-ink'}`}>
                    {pair.label}
                  </span>
                  <span className="block truncate text-[10px] text-subtle" style={{ fontFamily: bodyFont }}>
                    {pair.forWho}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Accordion>

      <Accordion id="colors" title="Couleurs" detail={project.colors.primary}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="btn-primary !py-1.5 !px-3 text-xs"
            onClick={() => dispatch({ type: 'setColors', colors: generatePalette(project.colors.primary, harmony, theme.dark) })}
          >
            <Sparkles size={13} /> Générer
          </button>
          <select
            className="field !w-auto !py-1.5 !px-2 text-xs"
            value={harmony}
            onChange={(e) => setHarmony(e.target.value as HarmonyMode)}
            aria-label="Type d'harmonie"
          >
            {HARMONIES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
          </select>
          <button
            type="button"
            className="btn-ghost !py-1.5 !px-2 text-xs"
            title="Revenir aux couleurs du thème"
            onClick={() => dispatch({ type: 'setTheme', themeId: project.themeId, keepColors: false })}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="grid gap-3">
          {COLOR_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              value={project.colors[field.key]}
              onChange={(hex) => dispatch({ type: 'setColors', colors: { [field.key]: hex } })}
            />
          ))}
        </div>

        {issues.length > 0 && (
          <div className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-[11px] leading-relaxed text-amber-900">
              <strong className="font-semibold">Lisibilité à vérifier.</strong>
              <ul className="mt-0.5">
                {issues.map((issue) => (
                  <li key={issue.pair}>{issue.pair} — {issue.ratio.toFixed(1)}:1</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Accordion>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle">
        <Wand2 size={12} className="mt-px shrink-0" />
        Chaque changement s'applique immédiatement à l'aperçu. Ctrl+Z annule.
      </p>

      {askingCustom && (
        <PlanUpgradeDialog
          feature="Le design entièrement sur mesure"
          explain="Nous dessinons votre site à partir de votre identité visuelle, au lieu de partir d'un des designs existants."
          onClose={() => setAskingCustom(false)}
          onUpgraded={() => {
            dispatch({ type: 'setTheme', themeId: 'custom', keepColors })
            setAskingCustom(false)
          }}
        />
      )}
    </div>
  )

  /** Un seul bloc ouvert a la fois : la colonne fait 288 px de large. */
  function Accordion({ id, title, detail, children }: {
    id: Block; title: string; detail?: string; children: React.ReactNode
  }) {
    const expanded = open === id
    return (
      <div className="border-t border-line first:border-t-0">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setOpen(expanded ? ('theme' as Block) : id)}
          className="flex w-full items-baseline justify-between gap-2 py-3 text-left"
        >
          <span className={`text-xs font-semibold ${expanded ? 'text-ink' : 'text-muted'}`}>{title}</span>
          {detail && <span className="truncate text-[11px] text-subtle">{detail}</span>}
        </button>
        {expanded && <div className="pb-4">{children}</div>}
      </div>
    )
  }
}
