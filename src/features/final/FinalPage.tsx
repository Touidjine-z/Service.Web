import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Loader2, Rocket, Sparkles } from 'lucide-react'
import { formatMoney } from '@/engine/pricing'
import { MODULE_BY_ID } from '@/engine/modules'
import { getTheme } from '@/engine/themes'
import { hasReached } from '@/engine/status'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import SaveProjectDialog from './SaveProjectDialog'

/**
 * Page finale (§29, §30) : le seul ecran du parcours ou le prix de realisation
 * a le droit d'exister — et uniquement apres que le client a explicitement
 * demande a le voir (`project.priceRevealed`).
 */
export default function FinalPage() {
  const navigate = useNavigate()
  const { project, quote, dispatch } = useProject()
  const [askLead, setAskLead] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const home = project.pages.find((p) => p.isHome) ?? project.pages[0]
  const theme = getTheme(project.themeId)

  const moduleLabels = useMemo(
    () => project.modules.map((id) => MODULE_BY_ID.get(id)?.label).filter(Boolean) as string[],
    [project.modules],
  )

  if (!home) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="text-sm text-muted">Aucun projet à finaliser.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate('/creer/activite')}>
            Commencer mon site
          </button>
        </div>
      </div>
    )
  }

  const catalogCount = project.products.length + project.services.length + project.gallery.length
  const checklist = [
    { label: 'Pages', detail: `${project.pages.length} page${project.pages.length > 1 ? 's' : ''}` },
    { label: 'Fonctionnalités', detail: `${moduleLabels.length} activées` },
    { label: 'Design', detail: theme.name },
    { label: 'Version mobile', detail: 'Testée' },
    { label: 'Version responsive', detail: 'Ordinateur, tablette, mobile' },
    {
      label: project.products.length ? 'Produits' : 'Produits / Services',
      detail: catalogCount ? `${catalogCount} élément${catalogCount > 1 ? 's' : ''}` : 'À compléter',
    },
  ]

  function request() {
    if (!project.lead) {
      setAskLead(true)
      return
    }
    setRequesting(true)
    dispatch({ type: 'setStatus', status: 'requested' })
    navigate('/paiement')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <StepBar current="final" />

      <main className="container-page py-12">
        <header className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Sparkles size={26} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Votre site est prêt
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Vous venez de créer la maquette de votre futur site professionnel.
            Vous pouvez maintenant demander sa réalisation.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <section>
            <p className="label">Aperçu de votre site</p>
            <SitePreview />
            <button type="button" className="btn-ghost mt-3 !px-0 text-xs" onClick={() => navigate('/apercu')}>
              <ArrowLeft size={14} /> Revoir mon site en entier
            </button>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card p-5">
              <p className="label">Ce que contient votre projet</p>
              <ul className="space-y-2.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                    <span className="text-ink">
                      {item.label}
                      <span className="ml-1.5 text-subtle">— {item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {moduleLabels.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                  {moduleLabels.map((label) => (
                    <span key={label} className="rounded-lg bg-canvas px-2 py-1 text-[11px] text-muted">{label}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Revelation du prix : uniquement sur action explicite (§29, §56). */}
            {!project.priceRevealed ? (
              <div className="card mt-4 p-5 text-center">
                <p className="text-sm leading-relaxed text-muted">
                  Votre maquette est terminée. Découvrez maintenant le coût de sa réalisation.
                </p>
                <button type="button" className="btn-primary mt-4 w-full" onClick={() => dispatch({ type: 'revealPrice' })}>
                  Voir le prix de réalisation
                </button>
                <p className="mt-2 text-[11px] text-subtle">Sans engagement.</p>
              </div>
            ) : (
              <div className="card mt-4 overflow-hidden">
                <div className="border-b border-line px-5 py-4">
                  <p className="label mb-0">Votre projet</p>
                  <p className="text-sm font-semibold text-ink">Site professionnel</p>
                </div>

                <ul className="divide-y divide-line px-5">
                  {quote.lines.map((line, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                      <span className="text-muted">
                        {line.label}
                        {line.detail && <span className="block text-[11px] text-subtle">{line.detail}</span>}
                      </span>
                      <span className="shrink-0 font-medium text-ink">{formatMoney(line.amount, quote.currency)}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-line px-5 py-4">
                  <Row label="Réalisation" value={formatMoney(quote.total, quote.currency)} strong />
                  <Row label="Acompte pour démarrer" value={formatMoney(quote.deposit, quote.currency)} accent />
                  <Row label="Solde restant" value={formatMoney(quote.balance, quote.currency)} />
                </div>

                <div className="border-t border-line bg-canvas px-5 py-4">
                  <p className="text-xs leading-relaxed text-muted">
                    Votre maquette est prête. Pour lancer officiellement sa réalisation, un acompte est demandé.
                  </p>
                  {hasReached(project.status, 'deposit-paid') ? (
                    <button type="button" className="btn-secondary mt-3 w-full" onClick={() => navigate('/confirmation')}>
                      <Check size={16} /> Acompte déjà payé — voir la confirmation
                    </button>
                  ) : (
                    <button type="button" className="btn-primary mt-3 w-full" disabled={requesting} onClick={request}>
                      {requesting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                      Demander la réalisation
                    </button>
                  )}
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-subtle">
                    <CreditCard size={12} /> Paiement de l'acompte à l'étape suivante
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {askLead && (
        <SaveProjectDialog
          onClose={() => setAskLead(false)}
          onSaved={() => {
            dispatch({ type: 'setStatus', status: 'requested' })
            setAskLead(false)
            navigate('/paiement')
          }}
        />
      )}
    </div>
  )
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-sm ${strong ? 'font-semibold text-ink' : 'text-muted'}`}>{label}</span>
      <span className={`shrink-0 ${accent ? 'text-xl font-extrabold text-brand' : strong ? 'text-xl font-bold text-ink' : 'text-sm font-medium text-ink'}`}>
        {value}
      </span>
    </div>
  )
}

/** Miniature reelle du site, mise a l'echelle pour tenir dans la colonne. */
function SitePreview() {
  const { project } = useProject()
  const home = project.pages.find((p) => p.isHome) ?? project.pages[0]
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const frame = frameRef.current
    if (!stage || !frame) return
    const onStage = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    const onFrame = new ResizeObserver(([e]) => setHeight(e.contentRect.height))
    onStage.observe(stage)
    onFrame.observe(frame)
    return () => { onStage.disconnect(); onFrame.disconnect() }
  }, [])

  const deviceWidth = VIEWPORT_WIDTH.desktop
  const scale = width ? width / deviceWidth : 0.4
  const capped = Math.min(height * scale, 520)

  return (
    <div ref={stageRef} className="overflow-hidden rounded-2xl border border-line shadow-card" style={{ height: capped || 380 }}>
      <div ref={frameRef} style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SiteRenderer project={project} page={home} viewport="desktop" />
      </div>
    </div>
  )
}
