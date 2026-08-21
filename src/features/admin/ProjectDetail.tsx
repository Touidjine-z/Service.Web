import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Eye, History, Loader2, Monitor, RotateCcw, Smartphone, Tv } from 'lucide-react'
import type { Order, Project, ProjectStatus, Viewport } from '@/engine/types'
import { formatMoney } from '@/engine/pricing'
import { getTheme } from '@/engine/themes'
import { MODULE_BY_ID } from '@/engine/modules'
import { STATUSES, nextStatus, statusLabel } from '@/engine/status'
import { sectionLabel } from '@/renderer/sectionDefs'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { listOrders, listVersions, saveOrder, saveProject, snapshotVersion, type ProjectVersion } from '@/store/db'
import { formatDate, type AdminRow } from './data'

const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'TV', icon: Tv },
]

/**
 * Vue administrateur d'un projet (§35) : tout ce que le client a construit,
 * son devis, ses paiements, ses coordonnees — et la maquette elle-meme.
 */
export default function ProjectDetail({ row, onBack, onChanged }: {
  row: AdminRow
  onBack: () => void
  onChanged: () => void
}) {
  const { project, quote, payments } = row
  const theme = getTheme(project.themeId)
  const [showPreview, setShowPreview] = useState(false)
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listVersions(project.id).then(setVersions).catch(() => undefined)
    listOrders(project.id).then(setOrders).catch(() => undefined)
  }, [project.id])

  async function setOrderStatus(order: Order, status: Order['status']) {
    await saveOrder({ ...order, status }).catch(() => undefined)
    setOrders(await listOrders(project.id).catch(() => []))
  }

  async function changeStatus(status: ProjectStatus) {
    setBusy(true)
    await saveProject({ ...project, status, updatedAt: new Date().toISOString() }).catch(() => undefined)
    setBusy(false)
    onChanged()
  }

  async function snapshot() {
    setBusy(true)
    await snapshotVersion(project, `Version ${versions.length + 1}`).catch(() => undefined)
    setVersions(await listVersions(project.id).catch(() => []))
    setBusy(false)
  }

  async function restore(version: ProjectVersion) {
    setBusy(true)
    await saveProject({ ...version.data, updatedAt: new Date().toISOString() }).catch(() => undefined)
    setBusy(false)
    onChanged()
  }

  const next = nextStatus(project.status)
  const modules = project.modules.map((id) => MODULE_BY_ID.get(id)?.label).filter(Boolean) as string[]
  const lead = project.lead

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost !px-2 !py-2" onClick={onBack} aria-label="Retour">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-ink">{project.identity.businessName || 'Projet sans nom'}</h1>
              <p className="text-xs text-subtle">{row.activityLabel} · {row.clientName} · modifié le {formatDate(row.updatedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => setShowPreview(true)}>
              <Eye size={14} /> Voir la maquette
            </button>
          </div>
        </div>
      </header>

      <main className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <Card title="Ce que le client a construit">
            <Grid>
              <Info label="Activité" value={row.activityLabel} />
              <Info label="Formule" value={row.planLabel} />
              <Info label="Thème" value={theme.name} />
              <Info label="Devise" value={project.currency} />
              <Info label="Prix affichés" value={project.showPrices ? 'Oui' : 'Non'} />
              <Info label="Pages" value={String(project.pages.length)} />
              <Info label="Produits" value={String(project.products.length)} />
              <Info label="Services" value={String(project.services.length)} />
              <Info label="Images de galerie" value={String(project.gallery.length)} />
              <Info label="Nom de domaine" value={domainSummary(project)} />
              <Info label="Affichage TV" value={project.modules.includes('tv') ? 'Demandé' : 'Non'} />
              <Info label="QR Code" value={project.modules.includes('qrcode') ? 'Demandé' : 'Non'} />
            </Grid>

            <div className="mt-4 border-t border-line pt-4">
              <p className="label">Couleurs</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(project.colors).map(([key, value]) => (
                  <span key={key} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] text-muted">
                    <span className="h-3.5 w-3.5 rounded" style={{ background: value }} />
                    {key} <code>{value}</code>
                  </span>
                ))}
              </div>
            </div>

            {project.identity.logoUrl && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="label">Logo</p>
                <img src={project.identity.logoUrl} alt="" className="h-12 object-contain" />
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <p className="label">Fonctionnalités</p>
              <div className="flex flex-wrap gap-1.5">
                {modules.map((m) => <span key={m} className="rounded-lg bg-canvas px-2 py-1 text-[11px] text-muted">{m}</span>)}
              </div>
            </div>
          </Card>

          <Card title="Pages et sections">
            <ul className="space-y-2.5">
              {project.pages.map((page) => (
                <li key={page.id}>
                  <p className="text-sm font-medium text-ink">
                    {page.name}
                    {page.isHome && <span className="ml-1.5 text-[10px] uppercase text-brand">accueil</span>}
                    <span className="ml-2 text-xs text-subtle">/{page.slug}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {page.sections.length
                      ? page.sections.map((s) => sectionLabel(s.kind) + (s.hidden ? ' (masquée)' : '')).join(' · ')
                      : 'Aucune section'}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          {orders.length > 0 && (
            <Card title={`Commandes reçues sur le site (${orders.length})`}>
              <ul className="divide-y divide-line">
                {orders.map((order) => (
                  <li key={order.id} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{order.customer.name}</p>
                        <p className="text-xs text-subtle">
                          {order.customer.email}{order.customer.phone ? ` · ${order.customer.phone}` : ''} · {formatDate(order.createdAt)}
                        </p>
                        {order.service && (
                          <p className="text-xs font-medium text-brand">
                            {order.service}{order.slot ? ` · ${order.slot.toLowerCase()}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {order.total > 0 ? formatMoney(order.total, order.currency) : 'Sur devis'}
                        </span>
                        <select
                          className="field !w-auto !py-1 text-xs"
                          value={order.status}
                          onChange={(e) => setOrderStatus(order, e.target.value as Order['status'])}
                        >
                          <option value="new">Nouvelle</option>
                          <option value="accepted">Acceptée</option>
                          <option value="done">Traitée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </div>
                    </div>
                    <ul className="mt-1.5 text-xs text-muted">
                      {order.lines.map((line, i) => (
                        <li key={i}>
                          {line.quantity} × {line.name}{line.variant ? ` (${line.variant})` : ''}
                          {line.unitPrice !== null ? ` — ${formatMoney(line.unitPrice, order.currency)}` : ''}
                        </li>
                      ))}
                    </ul>
                    {order.customer.note && <p className="mt-1.5 text-xs italic text-subtle">« {order.customer.note} »</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(project.products.length > 0 || project.services.length > 0) && (
            <Card title="Catalogue">
              <ul className="divide-y divide-line text-sm">
                {project.products.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-ink">{p.name}{p.hidden && <span className="ml-1.5 text-[10px] text-subtle">masqué</span>}</span>
                    <span className="text-muted">{p.price !== null ? formatMoney(p.price, project.currency) : '—'}</span>
                  </li>
                ))}
                {project.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-ink">{s.name}{s.duration && <span className="ml-1.5 text-xs text-subtle">{s.duration}</span>}</span>
                    <span className="text-muted">{s.price !== null ? formatMoney(s.price, project.currency) : '—'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card title="Client">
            {lead ? (
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-ink">{lead.firstName} {lead.lastName}</p>
                {lead.company && <p className="text-muted">{lead.company}</p>}
                <p><a className="text-brand hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a></p>
                {lead.phone && <p className="text-muted">{lead.phone}</p>}
                {project.identity.city && <p className="text-muted">{project.identity.city}</p>}
                <p className="text-xs text-subtle">Enregistré le {formatDate(lead.savedAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-subtle">Le client n'a pas encore enregistré son projet.</p>
            )}
          </Card>

          <Card title="Devis">
            <ul className="divide-y divide-line text-sm">
              {quote.lines.map((line, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-muted">{line.label}</span>
                  <span className="text-ink">{formatMoney(line.amount, quote.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="font-semibold text-ink">Total</span><span className="font-bold text-ink">{formatMoney(quote.total, quote.currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Acompte</span><span className="font-semibold text-brand">{formatMoney(quote.deposit, quote.currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Solde</span><span className="text-ink">{formatMoney(quote.balance, quote.currency)}</span></div>
            </div>
            <p className="mt-2 text-[11px] text-subtle">Recalculé avec les règles de tarification en vigueur.</p>
          </Card>

          <Card title="Paiements">
            {payments.length ? (
              <ul className="space-y-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3">
                    <span>
                      <code className="text-xs">{p.transactionRef}</code>
                      <span className="block text-[11px] text-subtle">{formatDate(p.paidAt ?? p.createdAt)}{p.method === 'simulated' ? ' · simulé' : ''}</span>
                    </span>
                    <span className={p.status === 'paid' ? 'font-semibold text-emerald-700' : 'text-muted'}>
                      {formatMoney(p.deposit, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-subtle">Aucun paiement.</p>
            )}
          </Card>

          <Card title="Statut">
            <select
              className="field !py-2 text-sm"
              value={project.status}
              disabled={busy}
              onChange={(e) => changeStatus(e.target.value as ProjectStatus)}
            >
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {next && (
              <button type="button" className="btn-secondary mt-2 w-full !py-2 text-xs" disabled={busy} onClick={() => changeStatus(next)}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                Passer à « {statusLabel(next)} »
              </button>
            )}
          </Card>

          <Card title="Versions">
            <button type="button" className="btn-secondary w-full !py-2 text-xs" disabled={busy} onClick={snapshot}>
              <History size={14} /> Enregistrer une version
            </button>
            {versions.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {v.label}
                      <span className="block text-[11px] text-subtle">{formatDate(v.createdAt)}</span>
                    </span>
                    <button type="button" className="rounded-md p-1.5 text-subtle hover:text-ink" title="Restaurer" disabled={busy} onClick={() => restore(v)}>
                      <RotateCcw size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </main>

      {showPreview && <PreviewModal project={project} onClose={() => setShowPreview(false)} />}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <p className="label">{title}</p>
      {children}
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">{children}</div>
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  )
}

/** « Voir la maquette » (§35) : le vrai rendu, dans les formats demandes. */
function PreviewModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [slug, setSlug] = useState(project.pages.find((p) => p.isHome)?.slug ?? '')
  const page = project.pages.find((p) => p.slug === slug) ?? project.pages[0]

  const stageRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!page) return null
  const deviceWidth = VIEWPORT_WIDTH[viewport]
  const scale = width ? Math.min(1, (width - 32) / deviceWidth) : 0.5

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/50 p-4" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-surface" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1 rounded-xl bg-canvas p-1">
            {VIEWPORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setViewport(id)}
                className={`rounded-lg px-2.5 py-1.5 transition ${viewport === id ? 'bg-surface text-ink shadow-sm' : 'text-subtle hover:text-ink'}`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
          <select className="field !w-auto !py-1.5 text-xs" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {project.pages.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
          </select>
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={onClose}>Fermer</button>
        </header>

        <div ref={stageRef} className="flex-1 overflow-auto bg-canvas p-4">
          <div style={{ width: deviceWidth * scale, marginInline: 'auto' }}>
            <div style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <SiteRenderer project={project} page={page} viewport={viewport} onNavigate={setSlug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Ce que l'administrateur doit savoir du domaine avant de le reserver (§59). */
function domainSummary(project: Project): string {
  const domain = project.domain
  if (!domain) return 'Non demandé'
  if (domain.status === 'later') return 'À choisir plus tard'
  if (domain.status === 'owned') return `${domain.name} — déjà au client`
  return `${domain.name} — à réserver`
}
