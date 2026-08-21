import { useState } from 'react'
import { Check } from 'lucide-react'
import { OBJECTIVES } from '@/engine/modules'
import { getActivity } from '@/engine/activities'
import { getPlan, planAllowsObjective } from '@/engine/plans'
import { useProject } from '@/store/ProjectStore'
import StepLayout from '@/ui/StepLayout'
import { PlanLock, PlanUpgradeDialog } from '@/ui/PlanLock'
import type { ObjectiveDef, ObjectiveId } from '@/engine/types'

/**
 * Ce que la fonctionnalite fait, dit comme le client la nomme (§60). C'est de
 * la COPIE, pas une regle : la regle reste `planAllowsObjective`, et cette
 * table ne connait ni formule ni plafond — elle est indexee par objectif.
 * Aucun montant ici (§56) : la difference se dit en valeur, le prix se
 * decouvre a la page finale.
 */
const LOCKED_COPY: Partial<Record<ObjectiveId, { feature: string; explain: string }>> = {
  orders: {
    feature: 'Les commandes en ligne',
    explain: 'Vos clients remplissent un panier et commandent directement depuis votre site.',
  },
  ecommerce: {
    feature: 'La vente en ligne',
    explain: 'Vos produits sont mis en vente avec panier et paiement : le client achète sans avoir à vous appeler.',
  },
  booking: {
    feature: 'La prise de rendez-vous',
    explain: 'Vos clients choisissent un créneau libre et réservent eux-mêmes, y compris quand vous êtes fermé.',
  },
  quote: {
    feature: 'La demande de devis détaillée',
    explain: 'Un formulaire guidé recueille le besoin du client, ses mesures, ses photos et ses délais, avant que vous ne rappeliez.',
  },
  promotions: {
    feature: "L'affichage de vos promotions",
    explain: "Vos offres du moment s'affichent aussi sur un écran en boutique et derrière un QR code, en plus de votre site.",
  },
}

/** Le catalogue d'abord, un texte generique ensuite : jamais de carte muette. */
function lockedCopy(def: ObjectiveDef): { feature: string; explain: string } {
  return LOCKED_COPY[def.id] ?? {
    feature: def.label,
    explain: "Cet objectif demande une fonctionnalité qui n'existe pas dans votre formule actuelle.",
  }
}

/** Etape 2 (§7) : objectifs du site, choix multiples. */
export default function ObjectivesStep() {
  const { project, dispatch } = useProject()
  const activity = getActivity(project.activityId)
  const plan = getPlan(project)
  // Objectif dont la feuille de montee est ouverte. Un clic sans effet sur une
  // carte fermee serait la pire panne de confiance du tunnel : on explique.
  const [asking, setAsking] = useState<ObjectiveDef | null>(null)
  const label = project.activityId === 'custom' && project.customActivity
    ? project.customActivity
    : activity?.label ?? 'votre activité'

  /**
   * Apres la montee, on enchaine l'action que le client voulait : il a clique
   * pour COCHER, pas pour lire une feuille.
   *
   * `setObjectives` et non `toggleObjective` : le metier a souvent DEJA coche
   * l'objectif alors que la formule en fermait les modules. Basculer ne ferait
   * rien de visible — ou pire, decocherait ce qu'on vient de vendre. Re-appliquer
   * la liste entiere fait recalculer les modules sous la NOUVELLE formule, donc
   * la fonctionnalite promise apparait vraiment.
   */
  // Objectifs que la formule tient vraiment : un objectif ferme reste coche en
  // base (il redeviendra vrai apres une montee) mais sa carte s'affiche
  // decochee. Le compteur suit ce que le client VOIT, sinon il annonce six
  // objectifs sous quatre cases cochees.
  const held = project.objectives.filter((id) => {
    const def = OBJECTIVES.find((o) => o.id === id)
    return !def || planAllowsObjective(plan, def)
  })

  function obtain(def: ObjectiveDef) {
    dispatch({ type: 'setObjectives', objectives: [...new Set([...project.objectives, def.id])] })
  }

  return (
    <StepLayout
      step="objectives"
      title="Que souhaitez-vous faire avec votre site ?"
      subtitle={`Plusieurs réponses possibles. Nous avons pré-sélectionné ce qui fonctionne le mieux pour « ${label} ».`}
      back="/creer/formule"
      next="/creer/fonctionnalites"
      canContinue={held.length > 0}
      hint="Choisissez au moins un objectif"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
        {OBJECTIVES.map((objective) => {
          const checked = project.objectives.includes(objective.id)
          // On ne CACHE jamais ce qu'une formule ferme : cache, l'objectif ne
          // vend rien ; montre et etiquete, il travaille pour nous.
          if (!planAllowsObjective(plan, objective)) {
            const copy = lockedCopy(objective)
            return (
              <div
                key={objective.id}
                onClick={() => setAsking(objective)}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4 opacity-60 transition hover:border-brand/40 hover:opacity-100"
              >
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line bg-canvas"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-muted">{objective.label}</span>
                  <PlanLock
                    className="mt-1.5"
                    feature={copy.feature}
                    explain={copy.explain}
                    onUpgraded={() => obtain(objective)}
                  />
                </span>
              </div>
            )
          }
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
        {held.length} objectif{held.length > 1 ? 's' : ''} sélectionné
        {held.length > 1 ? 's' : ''}.
      </p>

      {asking && (
        <PlanUpgradeDialog
          feature={lockedCopy(asking).feature}
          explain={lockedCopy(asking).explain}
          onClose={() => setAsking(null)}
          onUpgraded={() => {
            obtain(asking)
            setAsking(null)
          }}
        />
      )}
    </StepLayout>
  )
}
