import { useMemo } from 'react'
import { MODULES, modulesForObjectives } from '@/engine/modules'
import { getActivity } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'
import ModuleIcon from '@/ui/ModuleIcon'
import type { ModuleDef } from '@/engine/types'

/**
 * Etape 3 (§8) : modules. Ceux qui decoulent du metier et des objectifs sont
 * mis en avant, mais l'utilisateur peut activer ou desactiver n'importe quoi.
 */
export default function FeaturesStep() {
  const { project, dispatch } = useProject()
  const activity = getActivity(project.activityId)

  const { recommended, others } = useMemo(() => {
    const suggested = new Set([
      ...modulesForObjectives(project.objectives),
      ...(activity?.defaultModules ?? []),
    ])
    return {
      recommended: MODULES.filter((m) => suggested.has(m.id)),
      others: MODULES.filter((m) => !suggested.has(m.id)),
    }
  }, [project.objectives, activity])

  return (
    <StepLayout
      step="features"
      title="Quelles fonctionnalités souhaitez-vous ?"
      subtitle="Recommandées pour votre métier, mais entièrement libres. Activez ou désactivez ce que vous voulez."
      back="/creer/objectifs"
      next="/creer/theme"
      canContinue={project.modules.length > 0}
      hint="Gardez au moins une fonctionnalité"
    >
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-subtle">
          Recommandées pour vous
        </h2>
        <ModuleGrid modules={recommended} />
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-subtle">
            Autres fonctionnalités disponibles
          </h2>
          <ModuleGrid modules={others} />
        </section>
      )}
    </StepLayout>
  )

  function ModuleGrid({ modules }: { modules: ModuleDef[] }) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const active = project.modules.includes(module.id)
          const locked = Boolean(module.required) && active
          return (
            <button
              key={module.id}
              type="button"
              disabled={locked}
              aria-pressed={active}
              onClick={() => dispatch({ type: 'toggleModule', module: module.id })}
              className={[
                'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
                active ? 'border-brand bg-brand/5 ring-4 ring-brand/10' : 'border-line bg-surface hover:border-brand/40',
                locked ? 'cursor-default opacity-90' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition',
                  active ? 'bg-brand text-brand-ink' : 'bg-canvas text-muted',
                ].join(' ')}
                aria-hidden
              >
                <ModuleIcon id={module.id} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${active ? 'text-ink' : 'text-muted'}`}>
                    {module.label}
                  </span>
                  {locked && <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] text-subtle">inclus</span>}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-subtle">{module.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }
}
