import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Loader2, Mail, Monitor, Rocket, Smartphone, Sparkles, Tablet } from 'lucide-react'
import { computeQuote, formatMoney, groupQuote } from '@/engine/pricing'
import { MODULE_BY_ID } from '@/engine/modules'
import { PLANS, PLAN_BY_ID, getPlan, planDefOf, planLoss } from '@/engine/plans'
import type { PlanId, ProjectStatus, Viewport } from '@/engine/types'
import { getTheme } from '@/engine/themes'
import { hasReached } from '@/engine/status'
import SiteRenderer from '@/renderer/SiteRenderer'
import { VIEWPORT_WIDTH } from '@/renderer/tokens'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import Confetti from '@/ui/Confetti'
import { Reveal } from '@/ui/motion'
import SaveProjectDialog from './SaveProjectDialog'

/**
 * Page finale (§29, §30) : le seul ecran du parcours ou le prix de realisation
 * a le droit d'exister — et uniquement apres que le client a explicitement
 * demande a le voir (`project.priceRevealed`).
 */
export default function FinalPage() {
  const navigate = useNavigate()
  const { project, quote, pricingRules, dispatch } = useProject()
  const [askLead, setAskLead] = useState(false)
  /** Envoi du devis par email : meme capture de lead, autre intention (§28). */
  const [askQuote, setAskQuote] = useState(false)
  const [requesting, setRequesting] = useState(false)
  /** Celebration jouee une seule fois, au clic sur « Voir le prix ». */
  const [celebrate, setCelebrate] = useState(false)

  // Formule regardee dans le selecteur : par defaut la sienne. Le devis affiche
  // suit l'onglet, l'action aussi — on ne demande pas la realisation d'une
  // formule qu'on est en train de comparer.
  const [shown, setShown] = useState<PlanId>(() => getPlan(project))
  const [confirming, setConfirming] = useState<PlanId | null>(null)

  const home = project.pages.find((p) => p.isHome) ?? project.pages[0]
  const theme = getTheme(project.themeId)
  // La formule vient du catalogue, jamais d'un libelle en dur (§48, §60).
  const plan = planDefOf(project)

  const shownQuote = useMemo(
    () => (shown === getPlan(project) ? quote : computeQuote({ ...project, plan: shown }, pricingRules)),
    [shown, project, quote, pricingRules],
  )

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
    { label: 'Formule', detail: plan.label },
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

  // Le domaine n'apparait qu'une fois choisi : avant, il n'a rien a dire (§59).
  const domain = project.domain
  if (domain && domain.status !== 'later' && domain.name) {
    checklist.push({
      label: 'Nom de domaine',
      detail: domain.status === 'owned' ? `${domain.name} (le vôtre)` : domain.name,
    })
  }

  function request() {
    if (!project.lead) {
      setAskLead(true)
      return
    }
    setRequesting(true)
    dispatch({ type: 'setStatus', status: 'requested' })
    // Le nom de domaine (§59) s'intercale entre la demande et l'acompte : c'est
    // la derniere decision qui appartient encore au client.
    navigate('/creer/domaine')
  }

  return (
    <div className="min-h-screen bg-canvas">
      {celebrate && <Confetti />}
      <StepBar current="final" />

      <main className="container-page py-12">
        <header className="mx-auto max-w-2xl text-center animate-fade-up">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand animate-pop-in">
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

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          {/* Colonne de gauche : ce que le client a FAIT — sa maquette et son
              contenu. Colonne de droite : ce qu'il en coute. La liste tenait a
              droite au-dessus du devis ; sur un ecran large, elle laissait la
              moitie gauche vide sous l'apercu. */}
          <Reveal as="section">
            <p className="label">Aperçu de votre site</p>
            <SitePreview />
            <button type="button" className="btn-ghost mt-3 !px-0 text-xs" onClick={() => navigate('/apercu')}>
              <ArrowLeft size={14} /> Revoir mon site en entier
            </button>

            <div className="card mt-6 p-5">
              <p className="label">Ce que contient votre projet</p>
              {/* La liste passe en deux colonnes des qu'elle a la place : sous
                  l'apercu, elle est large et courte plutot qu'etroite et longue. */}
              <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
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
          </Reveal>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {/* Revelation du prix : uniquement sur action explicite (§29, §56). */}
            {!project.priceRevealed ? (
              <div className="card p-5 text-center">
                <p className="text-sm leading-relaxed text-muted">
                  Votre maquette est terminée. Découvrez maintenant le coût de sa réalisation.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-4 w-full"
                  onClick={() => { setCelebrate(true); dispatch({ type: 'revealPrice' }) }}
                >
                  Voir le prix de réalisation
                </button>
                <p className="mt-2 text-[11px] text-subtle">Sans engagement.</p>
              </div>
            ) : (
              <div className="card overflow-hidden animate-pop-in">
                {/* Selecteur de formule (§60). Il remplace la carte de
                    comparaison qui vivait en bas de colonne, hors ecran : la
                    ou elle attendait d'etre decouverte, il travaille. Chaque
                    onglet recalcule le devis sur LE MEME projet — memes pages,
                    memes fonctionnalites — donc la comparaison est honnete. */}
                <div className="border-b border-line px-5 py-4">
                  <p className="label mb-0">Votre projet</p>
                  <div className="mt-2 flex gap-1 rounded-xl bg-canvas p-1">
                    {PLANS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={item.id === shown}
                        onClick={() => { setShown(item.id); setConfirming(null) }}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                          item.id === shown ? 'bg-surface text-ink shadow-card' : 'text-subtle hover:text-ink'
                        }`}
                      >
                        {item.label}
                        {item.id === plan.id && <span className="ml-1 text-brand">•</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Devis range par famille : neuf lignes a la file disaient ce
                    que le client paie, quatre familles disent ce qu'il achete. */}
                <div className="px-5">
                  {groupQuote(shownQuote).map((group) => (
                    <div key={group.id} className="border-b border-line py-3 last:border-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="label mb-0">{group.label}</p>
                        <span className="text-xs font-semibold text-muted">
                          {formatMoney(group.subtotal, shownQuote.currency)}
                        </span>
                      </div>
                      <ul className="mt-1.5 space-y-1.5">
                        {group.lines.map((line, i) => (
                          <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
                            <span className="text-muted">
                              {line.label}
                              {line.detail && <span className="block text-[11px] text-subtle">{line.detail}</span>}
                            </span>
                            <span className="shrink-0 font-medium text-ink">
                              {formatMoney(line.amount, shownQuote.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-line px-5 py-4">
                  <Row label="Réalisation" value={formatMoney(shownQuote.total, shownQuote.currency)} strong />
                  <Row label="Acompte pour démarrer" value={formatMoney(shownQuote.deposit, shownQuote.currency)} accent />
                  <Row label="Solde restant" value={formatMoney(shownQuote.balance, shownQuote.currency)} />
                </div>

                <div className="border-t border-line bg-canvas px-5 py-4">
                  {shown !== plan.id ? (
                    <PlanSwitch
                      target={shown}
                      confirming={confirming === shown}
                      onAsk={() => setConfirming(shown)}
                      onCancel={() => setConfirming(null)}
                      onDone={() => setConfirming(null)}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Ce qui se passe APRES : le client vient de voir un montant, il
                doit savoir ce qu'il achete comme suite, pas seulement comme site. */}
            {project.priceRevealed && <AfterPayment onEmail={() => setAskQuote(true)} />}
          </aside>
        </div>
      </main>

      {askQuote && (
        <SaveProjectDialog
          onClose={() => setAskQuote(false)}
          onSaved={() => setAskQuote(false)}
        />
      )}

      {askLead && (
        <SaveProjectDialog
          onClose={() => setAskLead(false)}
          onSaved={() => {
            dispatch({ type: 'setStatus', status: 'requested' })
            setAskLead(false)
            navigate('/creer/domaine')
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

/**
 * Passage d'une formule a l'autre depuis la page finale (§60).
 *
 * Monter ne retire rien : on applique. Descendre peut fermer des modules et
 * vider des pages — on NOMME ce qui part avant de le faire, jamais en silence.
 * Et quand le projet depasse un plafond, le moteur refuse : on dit pourquoi
 * plutot que d'avaler le clic.
 */
function PlanSwitch({ target, confirming, onAsk, onCancel, onDone }: {
  target: PlanId
  confirming: boolean
  onAsk: () => void
  onCancel: () => void
  onDone: () => void
}) {
  const { project, dispatch } = useProject()
  const def = PLAN_BY_ID.get(target)
  if (!def) return null

  // Un acompte encaisse a fige total, acompte et solde : la formule ne bouge
  // plus sans nous. Le reducer le refuse aussi, on ne s'y fie pas seul.
  if (hasReached(project.status, 'deposit-paid')) {
    return (
      <p className="rounded-xl bg-surface px-3 py-3 text-xs leading-relaxed text-muted">
        Votre acompte est déjà réglé : la formule de ce projet est fixée. Écrivez-nous si vous
        souhaitez passer au {def.label.toLowerCase()}, nous reprendrons le devis avec vous.
      </p>
    )
  }

  const loss = planLoss(project, target)

  if (loss.blockers.length > 0) {
    return (
      <div className="rounded-xl bg-surface px-3 py-3">
        <p className="text-xs font-semibold text-ink">Votre site dépasse ce que contient cette formule</p>
        <ul className="mt-1.5 space-y-1">
          {loss.blockers.map((line) => (
            <li key={line} className="text-[11px] leading-relaxed text-muted">— {line}</li>
          ))}
        </ul>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="rounded-xl bg-surface px-3 py-3">
        <p className="text-xs font-semibold text-ink">Passer au {def.label.toLowerCase()} retire des fonctionnalités</p>
        {loss.modules.length > 0 && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Seront désactivés : {loss.modules.map((m) => MODULE_BY_ID.get(m)?.label ?? m).join(', ')}.
          </p>
        )}
        {loss.emptiedPages.length > 0 && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            {loss.emptiedPages.length > 1 ? 'Les pages' : 'La page'}{' '}
            {loss.emptiedPages.map((n) => `« ${n} »`).join(', ')} {loss.emptiedPages.length > 1 ? 'seront retirées' : 'sera retirée'} :
            {loss.emptiedPages.length > 1 ? ' elles ne contenaient' : ' elle ne contenait'} que ces fonctionnalités.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="btn-primary flex-1 !py-2 text-xs"
            onClick={() => { dispatch({ type: 'setPlan', plan: target }); onDone() }}
          >
            Continuer
          </button>
          <button type="button" className="btn-ghost flex-1 !py-2 text-xs" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    )
  }

  const perd = loss.modules.length > 0 || loss.emptiedPages.length > 0
  return (
    <>
      <button
        type="button"
        className="btn-primary w-full"
        onClick={() => (perd ? onAsk() : dispatch({ type: 'setPlan', plan: target }))}
      >
        <Sparkles size={16} /> Passer au {def.label.toLowerCase()}
      </button>
      <p className="mt-2 text-[11px] leading-relaxed text-subtle">
        {perd
          ? 'Cette formule ne contient pas tout ce que vous avez activé — nous vous dirons quoi avant de valider.'
          : 'Vous ne perdez rien en changeant : tout ce que vous avez déjà fait est conservé.'}
      </p>
    </>
  )
}

/**
 * Ce qui se passe apres l'acompte (§34). Le client vient de decouvrir un
 * montant : entre « Demander la realisation » et le vide, il manquait la seule
 * chose qu'il achete vraiment — une suite. La frise est construite sur les
 * statuts du cycle de vie, pas sur une liste ecrite a la main : ce qu'elle
 * annonce est ce que l'administration suivra.
 */
const AFTER_STEPS: { id: ProjectStatus; label: string; detail: string }[] = [
  { id: 'deposit-paid', label: 'Acompte réglé', detail: 'Votre projet est officiellement lancé.' },
  { id: 'client-contacted', label: 'Nous vous appelons', detail: 'Sous 24 h ouvrées, pour caler les détails avec vous.' },
  { id: 'developing', label: 'Réalisation', detail: 'Nous construisons le site à partir de votre maquette.' },
  { id: 'reviewing', label: 'Vous validez', detail: 'Vous relisez, nous corrigeons avant la mise en ligne.' },
  { id: 'delivered', label: 'Mise en ligne', detail: 'Le solde est réglé à la livraison.' },
]

function AfterPayment({ onEmail }: { onEmail: () => void }) {
  const { project } = useProject()
  return (
    <div className="card mt-4 p-5">
      <p className="label">Ce qui se passe ensuite</p>
      <ol className="space-y-3">
        {AFTER_STEPS.map((step, i) => {
          const done = hasReached(project.status, step.id)
          return (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-brand text-brand-ink' : 'bg-canvas text-subtle'
                }`}
                aria-hidden
              >
                {done ? <Check size={11} strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${done ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
                <span className="block text-[11px] leading-relaxed text-subtle">{step.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 border-t border-line pt-4">
        <button type="button" className="btn-secondary w-full !py-2 text-xs" onClick={onEmail}>
          <Mail size={14} /> Recevoir mon devis par email
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-subtle">
          Pour en parler à votre associé ou à votre comptable avant de décider. Votre projet reste
          disponible ici, et nous vous écrivons sous 24 h ouvrées.
        </p>
      </div>
    </div>
  )
}

/**
 * La maquette, vivante. C'etait une image figee au moment precis ou le client
 * doit se projeter : il peut desormais changer d'appareil et naviguer entre ses
 * pages, sans quitter la page finale. Aucun composant nouveau — `SiteRenderer`
 * savait deja rendre un viewport et remonter une navigation, il n'etait pas
 * branche ici.
 */
const PREVIEW_VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
  { id: 'tablet', label: 'Tablette', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

function SitePreview() {
  const { project } = useProject()
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [slug, setSlug] = useState<string | null>(null)

  // La page regardee, avec repli sur l'accueil : un slug peut disparaitre si le
  // projet change sous nos pieds (annulation, restauration de version).
  const home = project.pages.find((p) => p.isHome) ?? project.pages[0]
  const page = project.pages.find((p) => p.slug === slug) ?? home

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

  const deviceWidth = VIEWPORT_WIDTH[viewport]
  // Sur mobile et tablette, l'appareil est plus etroit que la colonne : on ne
  // l'agrandit pas au-dela de sa taille reelle, on le centre.
  const scale = width ? Math.min(1, width / deviceWidth) : 0.4
  // La vignette suit la largeur qu'on lui donne : plafonnee a 520 px, elle
  // n'affichait que l'entete du site dans une colonne de 1 300 px. Le plafond se
  // deduit donc de la place disponible, sans jamais depasser la hauteur reelle
  // du site rendu.
  const ceiling = Math.max(420, Math.round(width * 0.55))
  const capped = Math.min(height * scale, ceiling)

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {PREVIEW_VIEWPORTS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === viewport}
            onClick={() => setViewport(id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
              id === viewport ? 'bg-ink text-canvas' : 'text-subtle hover:bg-canvas hover:text-ink'
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}

        {project.pages.length > 1 && (
          <span className="ml-auto flex flex-wrap items-center gap-1">
            {project.pages.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.slug === page.slug}
                onClick={() => setSlug(p.slug)}
                className={`rounded-lg px-2 py-1 text-[11px] transition ${
                  p.slug === page.slug ? 'bg-brand/10 font-semibold text-brand' : 'text-subtle hover:text-ink'
                }`}
              >
                {p.name}
              </button>
            ))}
          </span>
        )}
      </div>

      <div
        ref={stageRef}
        className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-card"
        style={{ height: capped || 380 }}
      >
        <div
          ref={frameRef}
          style={{
            width: deviceWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            marginInline: viewport === 'desktop' ? undefined : 'auto',
          }}
        >
          <SiteRenderer
            project={project}
            page={page}
            viewport={viewport}
            onNavigate={(next) => setSlug(next)}
          />
        </div>
      </div>
    </>
  )
}
