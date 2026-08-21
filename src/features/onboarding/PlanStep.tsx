import { useState } from 'react'
import { Check, Lock, Minus } from 'lucide-react'
import type { ModuleId, PlanId, PlanServices } from '@/engine/types'
import { PLANS, getPlan, planLoss } from '@/engine/plans'
import { MODULE_BY_ID } from '@/engine/modules'
import { hasReached } from '@/engine/status'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'

/**
 * Etape 2 (§60) : la formule. Elle vient avant les objectifs pour que le client
 * construise directement dans le bon perimetre, au lieu de construire puis
 * d'etre ampute.
 *
 * L'ecran ne connait AUCUNE des deux formules (§48) : il rend `PLANS` tel quel,
 * et la seule asymetrie qu'il lit est declarative — `upgradeTo` designe la
 * formule basse, `recommended` la haute. Ajouter une troisieme formule au
 * catalogue n'obligerait a toucher ni ce fichier ni un autre composant.
 *
 * GARDE §56 : aucun montant, et aucun import de `pricing.ts` — `PlanDef` ne
 * porte de toute facon aucun champ monetaire. La difference se dit en
 * fonctionnalites ; le prix se decouvre a la page finale.
 */

/** « Deux », « trois »… le catalogue peut grandir, la phrase suit. */
function countWord(n: number): string {
  return ['Aucune', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq'][n] ?? String(n)
}

/**
 * Les services d'une formule, dits en francais. Ils se deduisent des quotas du
 * catalogue : changer un nombre dans plans.ts suffit, aucune phrase a reecrire.
 * Aucun montant ici non plus (§56) — on annonce des quantites.
 */
function serviceLines(services: PlanServices): string[] {
  const lines = [
    `${services.writtenPages} pages rédigées par nos soins`,
    `${services.stockImages} images d'illustration achetées pour vous`,
  ]
  if (services.backlinks > 0) {
    lines.push(`${services.backlinks} liens entrants posés pour votre référencement`)
  }
  return lines
}

/** Ce qu'une descente couterait, retenu entre le clic et la confirmation. */
interface Pending {
  plan: PlanId
  modules: ModuleId[]
  emptiedPages: string[]
}

export default function PlanStep() {
  const { project, dispatch } = useProject()
  const current = getPlan(project)
  // Un paiement fige la formule : total, acompte et solde passent tous par
  // 'deposit-paid', un seul test suffit donc a couvrir les trois.
  const frozen = hasReached(project.status, 'deposit-paid')
  const [pending, setPending] = useState<Pending | null>(null)
  const [blocked, setBlocked] = useState<{ plan: PlanId; blockers: string[] } | null>(null)

  function choose(plan: PlanId) {
    if (frozen || plan === current) return
    setBlocked(null)
    setPending(null)
    // `planLoss` est generique : une montee ne ferme aucun module et renvoie
    // donc trois listes vides. L'ecran n'a pas a savoir dans quel sens il va.
    const loss = planLoss(project, plan)
    if (loss.blockers.length > 0) {
      // Le reducer refuserait l'action ; on ne le laisse pas avaler le clic en
      // silence, on dit ce qui bloque et comment le lever.
      setBlocked({ plan, blockers: loss.blockers })
      return
    }
    if (loss.modules.length > 0 || loss.emptiedPages.length > 0) {
      setPending({ plan, ...loss })
      return
    }
    dispatch({ type: 'setPlan', plan })
  }

  const blockedPlan = blocked ? PLANS.find((p) => p.id === blocked.plan) : undefined

  return (
    <StepLayout
      step="plan"
      title="De quoi avez-vous besoin ?"
      subtitle={`${countWord(PLANS.length)} façons de faire votre site. Vous pourrez changer d'avis jusqu'à la fin.`}
      back="/creer/activite"
      next="/creer/objectifs"
    >
      {frozen && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3">
          <Lock size={15} className="mt-0.5 shrink-0 text-subtle" />
          <p className="text-sm leading-relaxed text-muted">
            Votre projet est déjà engagé : la formule est figée. Tout changement passe
            désormais par nous — écrivez-nous et nous adapterons votre projet avec vous.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const active = plan.id === current
          const badge = plan.badge
          return (
            <article
              key={plan.id}
              className={[
                'flex flex-col rounded-2xl border p-6 transition',
                active
                  ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                  : 'border-line bg-surface hover:border-brand/40 hover:shadow-card',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                {badge && (
                  <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                    {badge}
                  </span>
                )}
                {active && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-brand-ink shadow">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>

              <h2 className={`mt-3 text-xl font-bold tracking-tight ${active ? 'text-brand' : 'text-ink'}`}>
                {plan.label}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{plan.tagline}</p>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                <span className="label mb-0 inline">Pour qui</span> — {plan.audience}
              </p>

              <p className="label mt-5">Ce que vous avez</p>
              <ul className="space-y-2">
                {plan.highlights.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" />
                    {line}
                  </li>
                ))}
              </ul>

              <p className="label mt-5">Ce que nous faisons pour vous</p>
              <ul className="space-y-2">
                {serviceLines(plan.services).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" />
                    {line}
                  </li>
                ))}
              </ul>

              {plan.excludes.length > 0 && (
                <>
                  <p className="label mt-5">Pas dans cette formule</p>
                  <ul className="space-y-2">
                    {plan.excludes.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-subtle">
                        <Minus size={15} className="mt-0.5 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Les cartes n'ont pas la meme hauteur de contenu : le bloc est
                  pousse en bas pour que les trois boutons s'alignent. */}
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={frozen}
                  onClick={() => choose(plan.id)}
                  className={`w-full ${active ? 'btn-secondary' : 'btn-primary'}`}
                >
                  Choisir le {plan.label.toLowerCase()}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Vous construisez votre site gratuitement, quelle que soit la formule. Vous découvrirez
        le prix à la fin, avant tout engagement.
      </p>

      {blocked && blockedPlan && (
        <div className="mt-6 max-w-2xl rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-ink">
            Votre site dépasse ce que contient le {blockedPlan.label.toLowerCase()}
          </p>
          <ul className="mt-2 space-y-1.5">
            {blocked.blockers.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-muted">
                <Minus size={15} className="mt-0.5 shrink-0 text-subtle" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Supprimez-les depuis l'étape Contenu pour pouvoir choisir cette formule.
          </p>
        </div>
      )}

      {pending && (
        <PlanDowngradeDialog
          pending={pending}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            dispatch({ type: 'setPlan', plan: pending.plan })
            setPending(null)
          }}
        />
      )}
    </StepLayout>
  )
}

/**
 * Confirmation d'une descente. Elle NOMME ce qui part : un client qui perd le
 * panier doit lire « Panier », pas « certaines fonctionnalites ».
 */
function PlanDowngradeDialog({ pending, onCancel, onConfirm }: {
  pending: Pending
  onCancel: () => void
  onConfirm: () => void
}) {
  const plan = PLANS.find((p) => p.id === pending.plan)
  const modules = pending.modules.map((m) => MODULE_BY_ID.get(m)?.label ?? m)
  const pages = pending.emptiedPages
  const several = pages.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold leading-snug text-ink">
          {plan ? `Passer au ${plan.label.toLowerCase()} retire des fonctionnalités` : 'Ce changement retire des fonctionnalités'}
        </h2>

        {modules.length > 0 && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Seront désactivés : <strong className="text-ink">{modules.join(', ')}</strong>.
          </p>
        )}
        {pages.length > 0 && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {several ? 'Les pages ' : 'La page '}
            <strong className="text-ink">{joinFr(pages.map((n) => `« ${n} »`))}</strong>
            {several
              ? ' seront retirées : elles ne contenaient que ces fonctionnalités.'
              : ' sera retirée : elle ne contenait que ces fonctionnalités.'}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Tout le reste de votre site est conservé, et vous pourrez revenir en arrière
          jusqu'à la fin.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button type="button" className="btn-primary w-full" onClick={onConfirm}>
            Continuer
          </button>
          <button type="button" className="btn-ghost w-full" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/** Enumeration francaise : « A », « B » et « C ». */
function joinFr(items: string[]): string {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}
