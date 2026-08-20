import { useState } from 'react'
import { Check, Loader2, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import type { Order, Project } from '@/engine/types'
import { uid } from '@/engine/project'
import { formatPrice } from '@/renderer/samples'
import { buildOrder, cartTotal, isPriced, serviceModes, setQuantity, type CartLine } from '@/renderer/commerce'
import { saveOrder } from '@/store/db'

/** Creneaux proposes quand le site affiche des modes de service. */
const SLOTS = ['Dès que possible', 'Dans 30 minutes', 'Dans 1 heure', 'Plus tard dans la journée']

/**
 * Panier et tunnel de commande du site du client. Quand aucun produit n'a de
 * prix, la commande devient une demande de devis : le professionnel garde le
 * droit d'afficher « sur devis » (§20) sans perdre la prise de commande.
 */
export default function CartDrawer({ project, lines, onChange, onClose }: {
  project: Project
  lines: CartLine[]
  onChange: (lines: CartLine[]) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<'cart' | 'form' | 'done'>('cart')
  const [sending, setSending] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', note: '' })
  // Modes de service (livraison, a emporter...) : ils viennent du site du
  // client, pas d'une liste figee du tunnel.
  const modes = serviceModes(project)
  const [service, setService] = useState(modes[0] ?? '')
  const [slot, setSlot] = useState(SLOTS[0])

  const total = cartTotal(lines)
  const priced = isPriced(lines)
  // Le panier est vide une fois la commande partie : la confirmation doit lire
  // la commande envoyee, sinon elle annonce un devis pour une commande chiffree.
  const sentPriced = order ? order.lines.every((line) => line.unitPrice !== null) : priced
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)
  const canSend = customer.name.trim().length >= 2 && emailValid && lines.length > 0

  async function send() {
    if (!canSend || sending) return
    setSending(true)
    const built = buildOrder(project, lines, customer, uid('ord'), modes.length ? service : '', modes.length ? slot : '')
    await saveOrder(built).catch(() => undefined)
    setOrder(built)
    setSending(false)
    setStep('done')
    onChange([])
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShoppingCart size={16} />
            {step === 'done' ? 'Commande envoyée' : step === 'form' ? 'Vos coordonnées' : 'Votre panier'}
          </h2>
          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </header>

        {step === 'done' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Check size={22} />
            </div>
            <p className="text-base font-semibold text-ink">Merci !</p>
            <p className="text-sm leading-relaxed text-muted">
              {sentPriced
                ? 'Votre commande a bien été transmise. Vous recevrez une confirmation par email.'
                : 'Votre demande a bien été transmise. Vous recevrez un devis par email.'}
            </p>
            {order?.service && (
              <p className="text-sm font-medium text-ink">
                {order.service}{order.slot ? ` — ${order.slot.toLowerCase()}` : ''}
              </p>
            )}
            {order && <p className="text-xs text-subtle">Référence {order.id.slice(-6).toUpperCase()}</p>}
            <button type="button" className="btn-secondary mt-2" onClick={onClose}>Fermer</button>
          </div>
        ) : step === 'form' ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {modes.length > 0 && (
                <>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Mode de service</p>
                    <div className="flex flex-wrap gap-1.5">
                      {modes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setService(mode)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            mode === service ? 'bg-brand text-brand-ink' : 'bg-canvas text-muted hover:text-ink'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-xs font-medium text-muted">
                    Créneau souhaité
                    <select className="field mt-1" value={slot} onChange={(e) => setSlot(e.target.value)}>
                      {SLOTS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              )}
              <Field label="Nom" value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} />
              <Field label="Email" type="email" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} />
              <Field label="Téléphone" value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} />
              <label className="block text-xs font-medium text-muted">
                Précisions
                <textarea
                  className="field mt-1 min-h-[90px]"
                  value={customer.note}
                  onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                />
              </label>
            </div>
            <footer className="border-t border-line p-5">
              {priced && (
                <div className="mb-3 flex items-baseline justify-between text-sm">
                  <span className="text-muted">Total</span>
                  <span className="text-lg font-bold text-ink">{formatPrice(total, project.currency)}</span>
                </div>
              )}
              <button type="button" className="btn-primary w-full" disabled={!canSend || sending} onClick={send}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                {priced ? 'Envoyer ma commande' : 'Envoyer ma demande'}
              </button>
              <button type="button" className="btn-ghost mt-1 w-full text-xs" onClick={() => setStep('cart')}>
                Revenir au panier
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              {lines.length === 0 ? (
                <p className="py-10 text-center text-sm text-subtle">Votre panier est vide.</p>
              ) : (
                <ul className="space-y-3">
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-start gap-3 rounded-xl border border-line p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{line.name}</p>
                        {line.variant && <p className="text-xs text-subtle">{line.variant}</p>}
                        <p className="mt-0.5 text-xs text-muted">
                          {line.unitPrice !== null ? formatPrice(line.unitPrice, project.currency) : 'Sur devis'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded-md border border-line p-1 text-muted hover:text-ink"
                          onClick={() => onChange(setQuantity(lines, line.key, line.quantity - 1))} aria-label="Retirer un">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button type="button" className="rounded-md border border-line p-1 text-muted hover:text-ink"
                          onClick={() => onChange(setQuantity(lines, line.key, line.quantity + 1))} aria-label="Ajouter un">
                          <Plus size={12} />
                        </button>
                        <button type="button" className="ml-1 rounded-md p-1 text-subtle hover:text-red-600"
                          onClick={() => onChange(setQuantity(lines, line.key, 0))} aria-label="Supprimer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <footer className="border-t border-line p-5">
              {priced && (
                <div className="mb-3 flex items-baseline justify-between text-sm">
                  <span className="text-muted">Total</span>
                  <span className="text-lg font-bold text-ink">{formatPrice(total, project.currency)}</span>
                </div>
              )}
              <button type="button" className="btn-primary w-full" disabled={!lines.length} onClick={() => setStep('form')}>
                {priced ? 'Commander' : 'Demander un devis'}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input className="field mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
