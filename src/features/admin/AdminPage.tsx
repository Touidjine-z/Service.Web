import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, LayoutDashboard, Loader2, Search, Tag, Users } from 'lucide-react'
import { formatMoney } from '@/engine/pricing'
import { PLANS, getPlan } from '@/engine/plans'
import { STATUSES, statusLabel } from '@/engine/status'
import { loadAdminData, matchesFilter, matchesSearch, formatDate, PROJECT_FILTERS, type AdminData, type AdminRow } from './data'
import ProjectDetail from './ProjectDetail'
import PricingRulesPanel from './PricingRulesPanel'

type Tab = 'projects' | 'leads' | 'payments' | 'pricing'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'projects', label: 'Projets', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'pricing', label: 'Tarification', icon: Tag },
]

/**
 * Dashboard administrateur (§33). Il lit la meme base que le parcours client :
 * chaque projet enregistre est deja un lead (§36), sans etape supplementaire.
 */
export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('projects')
  const [data, setData] = useState<AdminData | null>(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    loadAdminData().then(setData).catch(() => setData({ rows: [], leads: [], payments: [], rules: null as never }))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const rows = useMemo(
    () => (data?.rows ?? []).filter((r) => matchesFilter(r, filter) && matchesSearch(r, query)),
    [data, filter, query],
  )

  const open = data?.rows.find((r) => r.project.id === openId) ?? null

  const totals = useMemo(() => {
    const all = data?.rows ?? []
    return {
      projects: all.length,
      leads: all.filter((r) => r.project.lead).length,
      encaisse: (data?.payments ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + p.deposit, 0),
      potentiel: all.reduce((s, r) => s + r.quote.total, 0),
    }
  }, [data])

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Chargement…</span>
      </div>
    )
  }

  if (open) {
    return <ProjectDetail row={open} onBack={() => { setOpenId(null); refresh() }} onChanged={refresh} />
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-ink">Administration</h1>
            <p className="text-xs text-subtle">Projets, leads et paiements</p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={() => navigate('/')}>
            <ArrowLeft size={14} /> Retour au site
          </button>
        </div>
      </header>

      <div className="container-page py-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Projets" value={String(totals.projects)} />
          <Stat label="Leads" value={String(totals.leads)} />
          <Stat label="Acomptes encaissés" value={formatMoney(totals.encaisse, 'EUR')} />
          <Stat label="Potentiel total" value={formatMoney(totals.potentiel, 'EUR')} />
        </div>

        <nav className="mt-6 flex gap-1 border-b border-line">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${
                tab === id ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        {tab === 'pricing' ? (
          <PricingRulesPanel onSaved={refresh} />
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  className="field !py-2 !pl-9 text-sm"
                  placeholder="Rechercher un client, une entreprise, une ville, une formule…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {tab === 'projects' && (
                <select className="field !w-auto !py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  {PROJECT_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              )}
            </div>

            {tab === 'projects' && <ProjectsTable rows={rows} onOpen={setOpenId} />}
            {tab === 'leads' && <LeadsTable rows={rows.filter((r) => r.project.lead)} onOpen={setOpenId} />}
            {tab === 'payments' && <PaymentsTable data={data} query={query} />}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: AdminRow['project']['status'] }) {
  const index = STATUSES.findIndex((s) => s.id === status)
  const group = STATUSES[index]?.group
  const tone =
    group === 'closed' ? 'bg-emerald-50 text-emerald-700'
    : group === 'production' ? 'bg-blue-50 text-blue-700'
    : group === 'conversion' ? 'bg-amber-50 text-amber-800'
    : 'bg-canvas text-muted'
  return <span className={`inline-block rounded-lg px-2 py-1 text-[11px] font-semibold ${tone}`}>{statusLabel(status)}</span>
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="card mt-4 px-4 py-10 text-center text-sm text-subtle">{children}</p>
}

/**
 * Repartition des projets par formule (§60). C'est l'instrument de mesure de
 * l'option : si la formule basse amene des projets neufs, ce compteur monte
 * sans que l'autre baisse ; si elle cannibalise, les deux bougent en miroir.
 * Compte la liste AFFICHEE, filtres et recherche compris — sinon on ne pourrait
 * pas lire la repartition d'un mois ou d'un statut donne.
 */
function PlanCounts({ rows }: { rows: AdminRow[] }) {
  const counts = PLANS.map((plan) => ({
    plan,
    count: rows.filter((r) => getPlan(r.project) === plan.id).length,
  }))
  // Les projets d'avant les formules sont comptes dans la formule qui les sert,
  // mais signales a part : personne ne les a choisis.
  const legacy = rows.filter((r) => !r.project.plan).length

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
      {counts.map(({ plan, count }) => (
        <span key={plan.id} className="rounded-lg border border-line px-2.5 py-1">
          {plan.label} : <strong className="text-ink">{count}</strong>
        </span>
      ))}
      {legacy > 0 && <span className="text-subtle">dont {legacy} avant les formules</span>}
    </div>
  )
}

function ProjectsTable({ rows, onOpen }: { rows: AdminRow[]; onOpen: (id: string) => void }) {
  if (!rows.length) return <Empty>Aucun projet pour ce filtre.</Empty>
  return (
    <>
      <PlanCounts rows={rows} />
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-line text-left text-[11px] uppercase tracking-wide text-subtle">
            <tr>
              <Th>Client</Th><Th>Entreprise</Th><Th>Activité</Th><Th>Formule</Th><Th>Date</Th>
              <Th align="right">Prix</Th><Th align="right">Acompte</Th><Th>Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.project.id} className="cursor-pointer hover:bg-canvas" onClick={() => onOpen(row.project.id)}>
                <Td>{row.clientName}</Td>
                <Td>{row.project.identity.businessName || '—'}</Td>
                <Td>{row.activityLabel}</Td>
                <Td>{row.planLabel}</Td>
                <Td>{formatDate(row.updatedAt)}</Td>
                <Td align="right">{formatMoney(row.quote.total, row.quote.currency)}</Td>
                <Td align="right">
                  {row.paid > 0
                    ? <span className="font-semibold text-emerald-700">{formatMoney(row.paid, row.quote.currency)}</span>
                    : <span className="text-subtle">{formatMoney(row.quote.deposit, row.quote.currency)}</span>}
                </Td>
                <Td><StatusBadge status={row.project.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Lead management (§36). */
function LeadsTable({ rows, onOpen }: { rows: AdminRow[]; onOpen: (id: string) => void }) {
  if (!rows.length) return <Empty>Aucun lead enregistré pour l'instant.</Empty>
  return (
    <div className="card mt-4 overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="border-b border-line text-left text-[11px] uppercase tracking-wide text-subtle">
          <tr>
            <Th>Nom</Th><Th>Entreprise</Th><Th>Email</Th><Th>Téléphone</Th><Th>Activité</Th>
            <Th>Ville</Th><Th>Date</Th><Th align="right">Prix estimé</Th><Th align="right">Acompte</Th><Th>Statut</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const lead = row.project.lead!
            return (
              <tr key={row.project.id} className="cursor-pointer hover:bg-canvas" onClick={() => onOpen(row.project.id)}>
                <Td>{lead.firstName} {lead.lastName}</Td>
                <Td>{lead.company || row.project.identity.businessName || '—'}</Td>
                <Td><a href={`mailto:${lead.email}`} className="text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{lead.email}</a></Td>
                <Td>{lead.phone || '—'}</Td>
                <Td>{row.activityLabel}</Td>
                <Td>{row.project.identity.city || '—'}</Td>
                <Td>{formatDate(lead.savedAt)}</Td>
                <Td align="right">{formatMoney(row.quote.total, row.quote.currency)}</Td>
                <Td align="right">{formatMoney(row.quote.deposit, row.quote.currency)}</Td>
                <Td><StatusBadge status={row.project.status} /></Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PaymentsTable({ data, query }: { data: AdminData; query: string }) {
  const q = query.trim().toLowerCase()
  const payments = data.payments.filter((p) => {
    if (!q) return true
    const row = data.rows.find((r) => r.project.id === p.projectId)
    return p.transactionRef.toLowerCase().includes(q) || (row ? matchesSearch(row, q) : false)
  })
  if (!payments.length) return <Empty>Aucun paiement enregistré.</Empty>

  return (
    <div className="card mt-4 overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-line text-left text-[11px] uppercase tracking-wide text-subtle">
          <tr>
            <Th>Transaction</Th><Th>Client</Th><Th>Date</Th>
            <Th align="right">Total</Th><Th align="right">Acompte</Th><Th align="right">Solde</Th><Th>Statut</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((payment) => {
            const row = data.rows.find((r) => r.project.id === payment.projectId)
            return (
              <tr key={payment.id}>
                <Td><code className="text-xs">{payment.transactionRef}</code></Td>
                <Td>{row?.clientName ?? '—'}</Td>
                <Td>{formatDate(payment.paidAt ?? payment.createdAt)}</Td>
                <Td align="right">{formatMoney(payment.total, payment.currency)}</Td>
                <Td align="right">{formatMoney(payment.deposit, payment.currency)}</Td>
                <Td align="right">{formatMoney(payment.balance, payment.currency)}</Td>
                <Td>
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                    payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700'
                    : payment.status === 'failed' ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-800'
                  }`}>
                    {payment.status === 'paid' ? 'Payé' : payment.status === 'failed' ? 'Échoué' : 'En attente'}
                  </span>
                  {payment.method === 'simulated' && <span className="ml-1.5 text-[10px] text-subtle">simulé</span>}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <th className={`px-4 py-2.5 font-semibold ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <td className={`px-4 py-3 text-ink ${align === 'right' ? 'text-right' : ''}`}>{children}</td>
}
