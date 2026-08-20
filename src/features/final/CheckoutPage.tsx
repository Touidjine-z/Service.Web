import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Loader2, ShieldCheck } from 'lucide-react'
import type { Payment } from '@/engine/types'
import { formatMoney } from '@/engine/pricing'
import { uid } from '@/engine/project'
import { savePayment } from '@/store/db'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'

/**
 * Paiement de l'acompte (§32).
 *
 * L'integration Stripe n'est pas branchee : ce formulaire SIMULE la transaction
 * et l'ecrit dans la base locale, en le disant clairement a l'ecran. Le contrat
 * de donnees (`Payment`) est deja celui attendu par Stripe — projet, client,
 * total, acompte, solde, date, transaction, statut — pour que le branchement se
 * limite a remplacer `simulatePayment`.
 */
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { project, quote, dispatch } = useProject()
  const [processing, setProcessing] = useState(false)
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })

  const lead = project.lead
  const domain = project.domain
  const digits = card.number.replace(/\s/g, '')
  const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(card.expiry) && card.cvc.length >= 3 && card.name.trim().length >= 3

  async function pay() {
    if (!valid || processing) return
    setProcessing(true)
    dispatch({ type: 'setStatus', status: 'payment-pending' })

    const payment: Payment = {
      id: uid('pay'),
      projectId: project.id,
      total: quote.total,
      deposit: quote.deposit,
      balance: quote.balance,
      currency: quote.currency,
      transactionRef: `SIM-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      paidAt: null,
      status: 'pending',
      method: 'simulated',
    }
    await savePayment(payment).catch(() => undefined)

    // Latence volontaire : le parcours doit ressembler a un vrai paiement.
    await new Promise((resolve) => setTimeout(resolve, 900))

    await savePayment({ ...payment, status: 'paid', paidAt: new Date().toISOString() }).catch(() => undefined)
    dispatch({ type: 'setStatus', status: 'deposit-paid' })
    setProcessing(false)
    navigate('/confirmation')
  }

  if (!project.priceRevealed) {
    // Garde-fou : on n'atteint jamais le paiement sans etre passe par la page
    // finale, sinon un montant s'afficherait hors de son moment (§56).
    navigate('/creer/final', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-canvas">
      <StepBar current="final" />

      <main className="container-page py-12">
        <button type="button" className="btn-ghost !px-0 text-sm" onClick={() => navigate('/creer/final')}>
          <ArrowLeft size={15} /> Retour au projet
        </button>

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <section className="card p-6">
            <h1 className="text-xl font-bold text-ink">Payer l'acompte</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Cet acompte lance officiellement la réalisation de votre site. Le solde ne sera
              demandé qu'à la livraison.
            </p>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              <strong className="font-semibold">Paiement simulé.</strong> L'intégration Stripe n'est pas
              encore branchée : aucune carte n'est débitée et aucune donnée bancaire n'est transmise.
              La transaction est enregistrée localement pour permettre de tester le parcours complet.
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Titulaire de la carte" value={card.name} onChange={(v) => setCard({ ...card, name: v })} placeholder="Prénom Nom" />
              <Field
                label="Numéro de carte"
                value={card.number}
                onChange={(v) => setCard({ ...card, number: formatCard(v) })}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiration" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: formatExpiry(v) })} placeholder="12/28" inputMode="numeric" />
                <Field label="CVC" value={card.cvc} onChange={(v) => setCard({ ...card, cvc: v.replace(/\D/g, '').slice(0, 4) })} placeholder="123" inputMode="numeric" />
              </div>
            </div>

            <button type="button" className="btn-primary mt-6 w-full" disabled={!valid || processing} onClick={pay}>
              {processing
                ? <><Loader2 size={16} className="animate-spin" /> Paiement en cours…</>
                : <><Lock size={15} /> Payer {formatMoney(quote.deposit, quote.currency)}</>}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-subtle">
              <ShieldCheck size={12} /> Vos informations ne quittent pas votre navigateur.
            </p>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card p-5">
              <p className="label">Récapitulatif</p>
              {lead && (
                <p className="mb-3 text-sm text-ink">
                  {lead.firstName} {lead.lastName}
                  {lead.company && <span className="block text-xs text-subtle">{lead.company}</span>}
                  <span className="block text-xs text-subtle">{lead.email}</span>
                </p>
              )}
              <dl className="space-y-2 border-t border-line pt-3 text-sm">
                <Line label="Réalisation" value={formatMoney(quote.total, quote.currency)} />
                <Line label="Solde à la livraison" value={formatMoney(quote.balance, quote.currency)} />
              </dl>

              {/* Nom de domaine retenu a l'etape precedente (§59). */}
              {domain && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs text-muted">
                    {domain.status === 'later' ? (
                      'Nom de domaine : à choisir plus tard.'
                    ) : (
                      <>
                        Nom de domaine : <strong className="text-ink">{domain.name}</strong>
                        {domain.status === 'owned' && ' (déjà le vôtre)'}
                      </>
                    )}
                  </p>
                  {domain.status === 'wanted' && domain.price !== null && (
                    <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                      Le domaine est facturé par le registrar ({formatMoney(domain.price, domain.currency)} la
                      première année) et n'entre pas dans le montant ci-dessus.
                    </p>
                  )}
                  <button type="button" className="btn-ghost mt-1 !px-0 text-[11px]" onClick={() => navigate('/creer/domaine')}>
                    Modifier
                  </button>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-ink">À payer maintenant</span>
                <span className="text-xl font-extrabold text-brand">{formatMoney(quote.deposit, quote.currency)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, inputMode }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric'
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input className="field mt-1" value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function formatCard(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}
