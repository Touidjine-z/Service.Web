import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Globe, Mail, Printer } from 'lucide-react'
import type { Payment } from '@/engine/types'
import { formatMoney } from '@/engine/pricing'
import { paymentsForProject } from '@/store/db'
import { useProject } from '@/store/ProjectStore'

/** Confirmation apres paiement de l'acompte (§32). */
export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { project, quote } = useProject()
  const [payment, setPayment] = useState<Payment | null>(null)

  useEffect(() => {
    paymentsForProject(project.id)
      .then((list) => setPayment(list.filter((p) => p.status === 'paid').pop() ?? null))
      .catch(() => undefined)
  }, [project.id])

  const lead = project.lead
  const domain = project.domain

  return (
    <div className="min-h-screen bg-canvas">
      <main className="container-page max-w-2xl py-16">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Acompte payé</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Merci {lead?.firstName ?? ''}. La réalisation de votre site est officiellement lancée.
            Nous vous contactons sous 24 h ouvrées pour démarrer.
          </p>

          <dl className="mt-7 space-y-2.5 rounded-xl bg-canvas p-5 text-left text-sm">
            <Row label="Projet" value={project.identity.businessName || 'Votre site professionnel'} />
            <Row label="Réalisation" value={formatMoney(quote.total, quote.currency)} />
            <Row label="Acompte payé" value={formatMoney(quote.deposit, quote.currency)} strong />
            <Row label="Solde à la livraison" value={formatMoney(quote.balance, quote.currency)} />
            {domain && domain.status !== 'later' && domain.name && (
              <Row
                label="Nom de domaine"
                value={domain.status === 'owned' ? `${domain.name} (le vôtre)` : domain.name}
              />
            )}
            {payment && (
              <>
                <Row label="Transaction" value={payment.transactionRef} />
                <Row label="Date" value={new Date(payment.paidAt ?? payment.createdAt).toLocaleString('fr-FR')} />
              </>
            )}
          </dl>

          {domain?.status === 'wanted' && domain.name && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Globe size={13} /> Nous réservons {domain.name} et le configurons avec votre site.
            </p>
          )}

          {lead && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-subtle">
              <Mail size={13} /> Confirmation envoyée à {lead.email}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" className="btn-secondary" onClick={() => navigate('/apercu')}>
              Revoir ma maquette
            </button>
            <button type="button" className="btn-ghost" onClick={() => window.print()}>
              <Printer size={15} /> Imprimer le reçu
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-subtle">
          Paiement simulé : aucune carte n'a été débitée et aucun email n'est réellement envoyé
          tant que Stripe et l'envoi transactionnel ne sont pas branchés.
        </p>
      </main>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'font-bold text-brand' : 'font-medium text-ink'}>{value}</dd>
    </div>
  )
}
