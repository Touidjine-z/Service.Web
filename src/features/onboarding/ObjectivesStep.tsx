import { Check } from 'lucide-react'
import { OBJECTIVES } from '@/engine/modules'
import { getActivity } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'

/** Etape 2 (§7) : objectifs du site, choix multiples. */
export default function ObjectivesStep() {
  const { project, dispatch } = useProject()
  const activity = getActivity(project.activityId)
  const label = project.activityId === 'custom' && project.customActivity
    ? project.customActivity
    : activity?.label ?? 'votre activité'

  return (
    <StepLayout
      step="objectives"
      title="Que souhaitez-vous faire avec votre site ?"
      subtitle={`Plusieurs réponses possibles. Nous avons pré-sélectionné ce qui fonctionne le mieux pour « ${label} ».`}
      back="/creer/activite"
      next="/creer/fonctionnalites"
      canContinue={project.objectives.length > 0}
      hint="Choisissez au moins un objectif"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OBJECTIVES.map((objective) => {
          const checked = project.objectives.includes(objective.id)
          return (
            <label
              key={objective.id}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                checked ? 'border-brand bg-brand/5 ring-4 ring-brand/10' : 'border-line bg-surface hover:border-brand/40',
              ].join(' ')}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => dispatch({ type: 'toggleObjective', objective: objective.id })}
              />
              <span
                className={[
                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                  checked ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface',
                ].join(' ')}
                aria-hidden
              >
                {checked && <Check size={13} strokeWidth={3} />}
              </span>
              <span className={`text-sm font-medium ${checked ? 'text-ink' : 'text-muted'}`}>
                {objective.label}
              </span>
            </label>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-subtle">
        {project.objectives.length} objectif{project.objectives.length > 1 ? 's' : ''} sélectionné
        {project.objectives.length > 1 ? 's' : ''}.
      </p>
    </StepLayout>
  )
}
