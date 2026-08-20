import { useEffect, useMemo, useState } from 'react'
import { Check, History, Loader2, RotateCcw } from 'lucide-react'
import type { ModuleId } from '@/engine/types'
import { DEFAULT_PRICING_RULES, computeDeposit, formatMoney, type PricingRules } from '@/engine/pricing'
import { MODULES } from '@/engine/modules'
import { listPricingHistory, loadPricingRules, savePricingRules, type PricingChange } from '@/store/db'

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
        const value = stored ?? DEFAULT_PRICING_RULES
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
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-4">
        <section className="card p-5">
          <p className="label">Base</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Money label="Prix de base" value={rules.basePrice} onChange={(v) => set({ basePrice: v })} />
            <Count label="Pages incluses" value={rules.includedPages} onChange={(v) => set({ includedPages: v })} />
            <Money label="Page supplémentaire" value={rules.pricePerExtraPage} onChange={(v) => set({ pricePerExtraPage: v })} />
            <Money label="Design sur mesure" value={rules.customThemeSurcharge} onChange={(v) => set({ customThemeSurcharge: v })} />
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

  push('Prix de base', before.basePrice, after.basePrice)
  push('Pages incluses', before.includedPages, after.includedPages)
  push('Page supplémentaire', before.pricePerExtraPage, after.pricePerExtraPage)
  push('Design sur mesure', before.customThemeSurcharge, after.customThemeSurcharge)
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
