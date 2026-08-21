import { useEffect, useMemo, useState } from 'react'
import { Check, History, Loader2, RotateCcw } from 'lucide-react'
import type { ModuleId, PlanId } from '@/engine/types'
import { DEFAULT_PRICING_RULES, computeDeposit, computeQuote, formatMoney, planPricing, type PlanPricing, type PricingRules } from '@/engine/pricing'
import { MODULES } from '@/engine/modules'
import { PLANS, allowedModules, planServices } from '@/engine/plans'
import { ALL_ACTIVITIES } from '@/engine/activities'
import { applyActivity, createEmptyProject } from '@/engine/project'
import { listPricingHistory, loadPricingRules, mergePricingRules, savePricingRules, type PricingChange } from '@/store/db'

/**
 * Page « Tarification » (§38). C'est ici que vivent les montants : aucun
 * composant du parcours client n'en connait, ils lisent tous ces regles.
 */
export default function PricingRulesPanel({ onSaved }: { onSaved: () => void }) {
  const [rules, setRules] = useState<PricingRules | null>(null)
  const [initial, setInitial] = useState<PricingRules | null>(null)
  const [history, setHistory] = useState<PricingChange[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPricingRules()
      .then((stored) => {
        // FUSION, pas repli (§60) : des tarifs enregistres AVANT les formules
        // n'ont pas de cle `plans`. Sans `mergePricingRules`, le panneau
        // editerait des formules vides pendant que `planPricing` sert deja les
        // defauts au moteur de devis — panneau et devis divergeraient.
        const value = stored ? mergePricingRules(stored) : DEFAULT_PRICING_RULES
        setRules(value)
        setInitial(value)
      })
      .catch(() => { setRules(DEFAULT_PRICING_RULES); setInitial(DEFAULT_PRICING_RULES) })
    listPricingHistory().then(setHistory).catch(() => undefined)
  }, [])

  const dirty = useMemo(
    () => Boolean(rules && initial) && JSON.stringify(rules) !== JSON.stringify(initial),
    [rules, initial],
  )

  if (!rules || !initial) {
    return <p className="mt-6 flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> Chargement…</p>
  }

  function set(patch: Partial<PricingRules>) {
    setRules({ ...rules!, ...patch })
    setSaved(false)
  }

  function setModulePrice(id: ModuleId, value: number) {
    set({ modulePrices: { ...rules!.modulePrices, [id]: value } })
  }

  /** Ecriture ciblee d'un tarif de formule ; la lecture passe par planPricing. */
  function setPlanPricing(plan: PlanId, patch: Partial<PlanPricing>) {
    const plans = { ...DEFAULT_PRICING_RULES.plans!, ...rules!.plans }
    plans[plan] = { ...planPricing(rules!, plan), ...patch }
    set({ plans })
  }

  /**
   * Ecriture ciblee d'un prix de travail humain (§60). Le repli est OBLIGATOIRE
   * a la lecture : `servicePrices` est absent des regles enregistrees avant
   * cette option, et un patch pose sur `undefined` perdrait l'autre prix.
   */
  function setServicePrice(patch: Partial<NonNullable<PricingRules['servicePrices']>>) {
    const current = rules!.servicePrices ?? DEFAULT_PRICING_RULES.servicePrices!
    set({ servicePrices: { ...current, ...patch } })
  }

  async function save() {
    setSaving(true)
    const changes = diff(initial!, rules!)
    await savePricingRules(rules!, changes).catch(() => undefined)
    setInitial(rules)
    setHistory(await listPricingHistory().catch(() => []))
    setSaving(false)
    setSaved(true)
    onSaved()
  }

  const sample = 660
  const servicePrices = rules.servicePrices ?? DEFAULT_PRICING_RULES.servicePrices!
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-4">
        {/* Une section par formule (§60), engendree par le catalogue : ajouter
            une formule a PLANS ajoute ses champs, sans toucher a ce fichier.
            Les champs historiques basePrice / includedPages / pricePerExtraPage
            ne sont plus edites — ils restent le repli des regles d'avant. */}
        {PLANS.map((plan) => {
          const p = planPricing(rules, plan.id)
          return (
            <section key={plan.id} className="card p-5">
              <p className="label">{plan.label}</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <Money label="Prix de base" value={p.basePrice} onChange={(v) => setPlanPricing(plan.id, { basePrice: v })} />
                <Count label="Pages incluses" value={p.includedPages} onChange={(v) => setPlanPricing(plan.id, { includedPages: v })} />
                <Money label="Page supplémentaire" value={p.pricePerExtraPage} onChange={(v) => setPlanPricing(plan.id, { pricePerExtraPage: v })} />
                <Count
                  label="Coefficient modules (%)"
                  value={Math.round(p.moduleRate * 100)}
                  onChange={(v) => setPlanPricing(plan.id, { moduleRate: v / 100 })}
                />
              </div>
            </section>
          )
        })}

        {/* Travail humain (§60). Deux prix unitaires seulement : les QUOTAS, eux,
            vivent dans plans.ts, a qui §56 interdit de connaitre un montant. Les
            rappeler ICI, sous les prix, est donc le seul endroit ou l'administrateur
            voit les deux ensemble — separes, il baisserait le prix de la page
            redigee sans voir que le cle en main en offre deja vingt. */}
        <section className="card p-5">
          <p className="label">Travail humain</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Money label="Page rédigée" value={servicePrices.writtenPage} onChange={(v) => setServicePrice({ writtenPage: v })} />
            <Money label="Image d'illustration" value={servicePrices.stockImage} onChange={(v) => setServicePrice({ stockImage: v })} />
          </div>
          <p className="mt-3 text-xs text-subtle">
            Ces deux prix ne sont facturés qu'<strong className="text-muted">au-delà</strong> du quota compris dans la formule ; en deçà, la rédaction et les images sont déjà payées par le prix de base.
          </p>
          <ul className="mt-2 space-y-1 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
            {PLANS.map((plan) => {
              const quota = planServices({ plan: plan.id })
              return (
                <li key={plan.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{plan.label}</span>
                  <span className="text-ink">
                    {quota.writtenPages} pages rédigées · {quota.stockImages} images · {quota.backlinks} liens entrants
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <PlanRanges rules={rules} />

        <section className="card p-5">
          <p className="label">Options communes aux formules</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Money label="Design sur mesure" value={rules.customThemeSurcharge} onChange={(v) => set({ customThemeSurcharge: v })} />
            <Money
              label="Nom de domaine"
              value={rules.domainSetupFee ?? DEFAULT_PRICING_RULES.domainSetupFee}
              onChange={(v) => set({ domainSetupFee: v })}
            />
          </div>
        </section>

        <section className="card p-5">
          <p className="label">Prix des modules</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODULES.map((module) => (
              <Money
                key={module.id}
                label={module.label}
                value={rules.modulePrices[module.id] ?? 0}
                onChange={(v) => setModulePrice(module.id, v)}
              />
            ))}
          </div>
        </section>

        <section className="card p-5">
          <p className="label">Intégration du catalogue</p>
          <div className="space-y-2">
            {rules.catalogTiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-muted">
                  {Number.isFinite(tier.upTo) ? `Jusqu'à ${tier.upTo} éléments` : 'Au-delà'}
                </span>
                <input
                  type="number"
                  min={0}
                  className="field !py-2 text-sm"
                  value={tier.price}
                  onChange={(e) => set({
                    catalogTiers: rules.catalogTiers.map((t, j) => (j === i ? { ...t, price: Number(e.target.value) || 0 } : t)),
                  })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <p className="label">Acompte (§31)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Count
              label="Pourcentage (%)"
              value={Math.round(rules.depositRate * 100)}
              onChange={(v) => set({ depositRate: Math.max(0, Math.min(100, v)) / 100 })}
            />
            <Money label="Minimum" value={rules.depositMinimum} onChange={(v) => set({ depositMinimum: v })} />
          </div>
          <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
            Pour un projet à {formatMoney(sample, rules.currency)}, l'acompte demandé serait de{' '}
            <strong className="text-ink">{formatMoney(computeDeposit(sample, rules), rules.currency)}</strong>.
          </p>
        </section>

        <div className="flex items-center gap-3">
          <button type="button" className="btn-primary" disabled={!dirty || saving} onClick={save}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
            {saved && !dirty ? 'Enregistré' : 'Enregistrer les tarifs'}
          </button>
          <button type="button" className="btn-ghost text-xs" disabled={saving} onClick={() => { setRules(DEFAULT_PRICING_RULES); setSaved(false) }}>
            <RotateCcw size={14} /> Revenir aux valeurs par défaut
          </button>
        </div>
      </div>

      <aside className="card h-fit p-5">
        <p className="label flex items-center gap-1.5"><History size={13} /> Historique</p>
        {history.length ? (
          <ul className="space-y-2 text-xs">
            {history.slice(0, 40).map((change) => (
              <li key={change.id} className="border-b border-line pb-2 last:border-0">
                <p className="text-ink">{change.field}</p>
                <p className="text-subtle">
                  {change.before ?? '—'} → <strong className="text-ink">{change.after ?? '—'}</strong>
                  <span className="ml-1.5">{new Date(change.changedAt).toLocaleString('fr-FR')}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-subtle">Aucune modification enregistrée.</p>
        )}
      </aside>
    </div>
  )
}

/**
 * Fourchette d'un devis, formule par formule, recalculee a la frappe.
 *
 * Elle repond a la seule question qui compte quand on fixe trois tarifs : les
 * bandes se recouvrent-elles ? Deux mesures, et l'ecart entre elles est
 * precisement le piege que cet encart existe pour desamorcer :
 *
 *  - la bande REELLE, mesuree sur les metiers du catalogue, chacun monte avec
 *    les fonctionnalites et les pages que SON modele pose — c'est ce que les
 *    clients signent ;
 *  - le PLAFOND THEORIQUE, toutes les fonctionnalites de la formule cochees a la
 *    fois, qu'aucun metier ne demande.
 *
 * Le verdict de recouvrement porte sur les bandes REELLES. Juge sur les
 * plafonds, il annoncerait un recouvrement permanent — un sur-mesure tout coche
 * depasse la base du cle en main — alors qu'aucun devis reel n'y tombe, et
 * l'administrateur baisserait un tarif pour corriger un probleme inexistant.
 * D'ou le libelle explicite du plafond : sans lui, le chiffre ment par omission.
 *
 * Tout passe par `computeQuote` : une arithmetique parallele finirait par
 * s'ecarter du devis reellement remis au client.
 */
function PlanRanges({ rules }: { rules: PricingRules }) {
  const ranges = useMemo(() => {
    const everything = MODULES.map((m) => m.id)
    return PLANS.map((plan) => {
      // `applyActivity` monte le projet exactement comme le tunnel le fera chez
      // le client (modules du metier, objectifs suggeres, pages du modele) :
      // recopier ici sa logique la ferait deriver au premier metier ajoute.
      const totals = ALL_ACTIVITIES
        .map((activity) => computeQuote(applyActivity({ ...createEmptyProject(), plan: plan.id }, activity.id), rules).total)
        .sort((a, b) => a - b)
      return {
        plan,
        min: totals[0] ?? 0,
        max: totals[totals.length - 1] ?? 0,
        median: totals[Math.floor(totals.length / 2)] ?? 0,
        // Plafond : tout ce que CETTE formule ouvre, a SON coefficient.
        ceiling: computeQuote(
          { ...createEmptyProject(), plan: plan.id, modules: allowedModules(plan.id, everything) },
          rules,
        ).total,
      }
    })
  }, [rules])

  // Recouvrements NOMMES : avec trois formules, « elles se recouvrent » laisse
  // l'administrateur chercher laquelle. Chaque paire n'est testee qu'une fois.
  const overlaps = ranges.flatMap((a, i) => ranges
    .slice(i + 1)
    .filter((b) => a.min <= b.max && b.min <= a.max)
    .map((b) => `${a.plan.label} et ${b.plan.label}`))

  return (
    <section className="card p-5">
      <p className="label">Fourchette d'un devis</p>
      <ul className="divide-y divide-line text-sm">
        {ranges.map(({ plan, min, max, median, ceiling }) => (
          <li key={plan.id} className="py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-muted">{plan.label}</span>
              <span className="text-ink">
                de <strong>{formatMoney(min, rules.currency)}</strong> à <strong>{formatMoney(max, rules.currency)}</strong>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-subtle">
              Médiane {formatMoney(median, rules.currency)} · plafond théorique {formatMoney(ceiling, rules.currency)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-subtle">
        Fourchette mesurée sur les {ALL_ACTIVITIES.length} métiers du catalogue, chacun avec les fonctionnalités et les pages de son modèle : c'est ce qui est réellement devisé. Le plafond théorique suppose toutes les fonctionnalités de la formule cochées en même temps — aucun métier ne les demande, et ces plafonds se chevauchent d'une formule à l'autre sans que les devis réels le fassent.
      </p>
      <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
        {overlaps.length
          ? `Les fourchettes de ${overlaps.join(', ')} se recouvrent : un même montant ne dira plus quelle formule a été vendue.`
          : `Les ${ranges.length} fourchettes restent disjointes : le montant seul dit la formule.`}
      </p>
    </section>
  )
}

function Money({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <div className="relative mt-1">
        <input
          type="number"
          min={0}
          className="field !py-2 !pr-8 text-sm"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">€</span>
      </div>
    </label>
  )
}

function Count({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input
        type="number"
        min={0}
        className="field mt-1 !py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  )
}

/** Journalise chaque montant modifie, pour tracer les changements (§38). */
function diff(before: PricingRules, after: PricingRules): Omit<PricingChange, 'id'>[] {
  const changedAt = new Date().toISOString()
  const out: Omit<PricingChange, 'id'>[] = []
  const push = (field: string, a: number, b: number) => {
    if (a !== b) out.push({ changedAt, field, before: a, after: b })
  }

  // Les tarifs de base sont desormais PAR FORMULE : sans le prefixe, deux
  // lignes « Prix de base » dans l'historique ne se distingueraient plus.
  for (const plan of PLANS) {
    const a = planPricing(before, plan.id)
    const b = planPricing(after, plan.id)
    push(`${plan.label} — Prix de base`, a.basePrice, b.basePrice)
    push(`${plan.label} — Pages incluses`, a.includedPages, b.includedPages)
    push(`${plan.label} — Page supplémentaire`, a.pricePerExtraPage, b.pricePerExtraPage)
    push(`${plan.label} — Coefficient modules (%)`, Math.round(a.moduleRate * 100), Math.round(b.moduleRate * 100))
  }

  // Travail humain (§60) : MEME repli qu'a l'edition. Sans lui, le premier
  // enregistrement de regles anterieures journaliserait « 0 → 60 » alors que
  // personne n'a rien touche — le tarif servi par le moteur etait deja 60.
  const beforeServices = before.servicePrices ?? DEFAULT_PRICING_RULES.servicePrices!
  const afterServices = after.servicePrices ?? DEFAULT_PRICING_RULES.servicePrices!
  push('Travail humain — Page rédigée', beforeServices.writtenPage, afterServices.writtenPage)
  push("Travail humain — Image d'illustration", beforeServices.stockImage, afterServices.stockImage)

  push('Design sur mesure', before.customThemeSurcharge, after.customThemeSurcharge)
  push('Nom de domaine', before.domainSetupFee ?? 0, after.domainSetupFee ?? 0)
  push('Taux d\'acompte (%)', Math.round(before.depositRate * 100), Math.round(after.depositRate * 100))
  push('Acompte minimum', before.depositMinimum, after.depositMinimum)

  for (const module of MODULES) {
    push(`Module — ${module.label}`, before.modulePrices[module.id] ?? 0, after.modulePrices[module.id] ?? 0)
  }
  before.catalogTiers.forEach((tier, i) => {
    push(`Catalogue — palier ${i + 1}`, tier.price, after.catalogTiers[i]?.price ?? tier.price)
  })

  return out
}
