import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, Sparkles } from 'lucide-react'
import AssistantDialog from './AssistantDialog'
import { SECTORS, CUSTOM_ACTIVITY, matchesActivity } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'

/** Etape 1 (§6) : choix du metier, avec repli « Autre activite ». */
export default function ActivityStep() {
  const { project, dispatch } = useProject()
  const [query, setQuery] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(project.activityId === 'custom')
  const [customLabel, setCustomLabel] = useState(project.customActivity)

  const sectors = useMemo(() => {
    // La recherche porte aussi sur les mots-cles du metier : « carrosserie »
    // doit trouver « Carrossier », « pneu » doit trouver « Pneus & jantes ».
    if (!query.trim()) return SECTORS
    return SECTORS
      .map((s) => ({ ...s, activities: s.activities.filter((a) => matchesActivity(a, query)) }))
      .filter((s) => s.activities.length > 0)
  }, [query])

  const selected = project.activityId
  const customValid = customLabel.trim().length >= 2
  const canContinue = selected !== null && (selected !== 'custom' || customValid)

  function choose(id: string) {
    setCustomOpen(false)
    dispatch({ type: 'setActivity', activityId: id })
  }

  function chooseCustom(label: string) {
    setCustomLabel(label)
    if (label.trim().length >= 2) {
      dispatch({ type: 'setActivity', activityId: 'custom', customLabel: label })
    }
  }

  return (
    <StepLayout
      step="activity"
      title="Quel est votre métier ?"
      subtitle="Votre activité détermine les fonctionnalités et les pages qui vous seront proposées. Vous pourrez tout modifier ensuite."
      back="/"
      next="/creer/formule"
      canContinue={canContinue}
      hint="Sélectionnez une activité pour continuer"
    >
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            className="field pl-10"
            placeholder="Rechercher une activité…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une activité"
          />
        </div>
        <button type="button" className="btn-secondary" onClick={() => setAssistantOpen(true)}>
          <Sparkles size={16} /> Créer automatiquement mon site
        </button>
        <Link to="/creer/express" className="btn-secondary">
          <ClipboardList size={16} /> Remplir un formulaire
        </Link>
      </div>

      <div className="space-y-10">
        {sectors.map((sector) => (
          <section key={sector.id}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-subtle">{sector.label}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-7">
              {sector.activities.map((activity) => {
                const isActive = selected === activity.id
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => choose(activity.id)}
                    aria-pressed={isActive}
                    className={[
                      'group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition',
                      isActive
                        ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                        : 'border-line bg-surface hover:border-brand/40 hover:shadow-card',
                    ].join(' ')}
                  >
                    <span className="text-2xl" aria-hidden>{activity.icon}</span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-brand' : 'text-ink'}`}>
                      {activity.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {sectors.length === 0 && (
          <p className="text-sm text-muted">Aucune activité ne correspond à « {query} ».</p>
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-6">
        {!customOpen ? (
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={() => setCustomOpen(true)}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Je ne trouve pas mon activité</span>
              <span className="block text-xs text-muted">Décrivez-la, nous adapterons votre site.</span>
            </span>
          </button>
        ) : (
          <div className="max-w-md">
            <label className="label" htmlFor="custom-activity">Décrivez votre activité</label>
            <input
              id="custom-activity"
              className="field"
              placeholder="Ex. : atelier de réparation de vélos"
              value={customLabel}
              onChange={(e) => chooseCustom(e.target.value)}
              autoFocus
            />
            <p className="mt-2 text-xs text-subtle">
              Nous partirons d'une base généraliste : {CUSTOM_ACTIVITY.defaultPages.length} pages,
              présentation, services et contact.
            </p>
          </div>
        )}
      </section>
      {assistantOpen && <AssistantDialog onClose={() => setAssistantOpen(false)} />}
    </StepLayout>
  )
}
