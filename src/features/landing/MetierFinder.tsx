import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { ALL_ACTIVITIES, SECTORS, matchesActivity } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'

/**
 * Recherche de metier (§5). Le visiteur tape ce qu'il fait, il voit
 * immediatement si la plateforme le connait — et il entre dans le parcours
 * depuis la vitrine, sans passer par une page intermediaire.
 */

export default function MetierFinder() {
  const navigate = useNavigate()
  const { dispatch } = useProject()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return ALL_ACTIVITIES.filter((activity) => matchesActivity(activity, query)).slice(0, 12)
  }, [query])

  function start(activityId: string, customLabel = '') {
    dispatch({ type: 'setActivity', activityId, customLabel })
    navigate('/creer/objectifs')
  }

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          className="field !py-3.5 !pl-11 !text-base"
          value={query}
          placeholder="Votre métier : menuisier, restaurant, kiné…"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Rechercher votre métier"
        />
      </div>

      {query.trim() !== '' && (
        <div className="mx-auto mt-4 max-w-xl animate-fade-up">
          {results.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              {results.map((activity) => (
                <li key={activity.id}>
                  <button
                    type="button"
                    onClick={() => start(activity.id)}
                    className="group flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm transition last:border-0 hover:bg-canvas"
                  >
                    <span className="text-lg" aria-hidden>{activity.icon}</span>
                    <span className="flex-1 font-medium text-ink">{activity.label}</span>
                    <span className="flex items-center gap-1 text-xs text-subtle opacity-0 transition group-hover:opacity-100">
                      Commencer <ArrowRight size={13} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-5 text-center">
              <p className="text-sm text-muted">
                « {query.trim()} » n'est pas encore au catalogue — ce n'est pas un problème.
              </p>
              <button type="button" className="btn-primary mt-3 !py-2.5 text-sm" onClick={() => start('custom', query.trim())}>
                Créer avec mon activité <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {query.trim() === '' && (
        <div className="mt-8 space-y-6">
          {SECTORS.map((sector) => (
            <div key={sector.id}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">{sector.label}</h3>
              <div className="flex flex-wrap gap-2">
                {sector.activities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => start(activity.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:text-ink hover:shadow-card"
                  >
                    <span aria-hidden>{activity.icon}</span>
                    {activity.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
