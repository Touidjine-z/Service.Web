import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Globe, Link2, Loader2, Search } from 'lucide-react'
import type { DomainChoice } from '@/engine/types'
import {
  buildCandidates, checkDomain, checkDomains, domainApiMode, isValidDomain, modeNote,
  normalizeDomain, suggestedLabel, type DomainOffer,
} from '@/engine/domain'
import { formatMoney } from '@/engine/pricing'
import { useProject } from '@/store/ProjectStore'
import StepBar from '@/ui/StepBar'
import { Reveal } from '@/ui/motion'

/**
 * Choix du nom de domaine (§59) — derniere etape avant l'acompte.
 *
 * L'ecran vient APRES la revelation du prix : il affiche des montants, il n'a
 * donc pas le droit d'exister avant (§56, meme garde que le paiement).
 *
 * Trois issues, toutes acceptables : le client reserve un domaine avec nous, il
 * declare celui qu'il possede deja, ou il decide plus tard. Aucune ne bloque la
 * suite du parcours : le domaine n'est pas une condition de la realisation.
 */
export default function DomainPage() {
  const navigate = useNavigate()
  const { project, quote, dispatch } = useProject()

  const [input, setInput] = useState(() => project.domain?.name || suggestedLabel(project))
  const [offers, setOffers] = useState<DomainOffer[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [owned, setOwned] = useState(() => (project.domain?.status === 'owned' ? project.domain.name : ''))
  const [ownedBusy, setOwnedBusy] = useState(false)
  /** Jeton de recherche : seule la derniere lancee a le droit d'ecrire l'ecran. */
  const run = useRef(0)

  const mode = domainApiMode()
  const choice = project.domain ?? null

  // Premiere recherche automatique : le client arrive avec des propositions
  // deja faites a partir de son enseigne, il n'a rien a taper.
  useEffect(() => {
    const start = project.domain?.name || suggestedLabel(project)
    if (start) void search(start)
    return () => { run.current += 1 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function search(value: string) {
    const candidates = buildCandidates(value)
    if (!candidates.length) {
      setOffers([])
      setError('Entrez un nom, par exemple « menuiserie-durand ».')
      return
    }
    run.current += 1
    const token = run.current
    setSearching(true)
    setError('')
    const results = await checkDomains(candidates)
    if (run.current !== token) return
    setOffers(results)
    setSearching(false)
    // Tout en erreur : c'est la verification qui est en panne, pas les noms.
    setError(results.every((r) => r.status === 'error') ? results[0]?.error ?? 'Vérification impossible.' : '')
  }

  function choose(offer: DomainOffer) {
    dispatch({
      type: 'setDomain',
      domain: {
        name: offer.domain,
        status: 'wanted',
        price: offer.price,
        renewalPrice: offer.renewalPrice,
        currency: offer.currency,
        source: offer.source,
        checkedAt: new Date().toISOString(),
      },
    })
  }

  /** Domaine deja possede : on le verifie quand meme, pour confirmer qu'il est bien pris. */
  async function declareOwned() {
    const name = normalizeDomain(owned)
    if (!isValidDomain(name) || ownedBusy) return
    setOwnedBusy(true)
    const offer = await checkDomain(name).catch(() => null)
    setOwnedBusy(false)
    dispatch({
      type: 'setDomain',
      domain: {
        name,
        status: 'owned',
        price: null,
        renewalPrice: null,
        currency: offer?.currency ?? quote.currency,
        source: offer ? offer.source : 'declared',
        checkedAt: new Date().toISOString(),
      },
    })
  }

  function decideLater() {
    dispatch({
      type: 'setDomain',
      domain: { name: '', status: 'later', price: null, renewalPrice: null, currency: quote.currency, source: 'declared', checkedAt: new Date().toISOString() },
    })
  }

  if (!project.priceRevealed) {
    // Meme garde que le paiement : on n'entre pas ici sans etre passe par la
    // page finale, sinon des montants s'afficheraient hors de leur moment (§56).
    navigate('/creer/final', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-canvas">
      <StepBar current="final" />

      <main className="container-page py-10">
        <button type="button" className="btn-ghost !px-0 text-sm" onClick={() => navigate('/creer/final')}>
          <ArrowLeft size={15} /> Retour au projet
        </button>

        <header className="mt-4 max-w-2xl animate-fade-up">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Globe size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Votre nom de domaine</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            C'est l'adresse de votre site sur Internet, celle que vos clients taperont et que vous
            mettrez sur vos cartes de visite. Nous le réservons et le configurons pour vous.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <section>
            <div className="card p-5">
              <label className="label" htmlFor="domain-search">Cherchez votre adresse</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="domain-search"
                  className="field"
                  value={input}
                  placeholder="menuiserie-durand"
                  autoComplete="off"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void search(input) }}
                />
                <button type="button" className="btn-primary shrink-0" disabled={searching} onClick={() => void search(input)}>
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Vérifier
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-subtle">{modeNote(mode)}</p>
            </div>

            {error && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {searching && offers.length === 0 && (
                <li className="card flex items-center gap-2 p-5 text-sm text-muted">
                  <Loader2 size={15} className="animate-spin" /> Vérification des extensions…
                </li>
              )}
              {offers.map((offer, i) => (
                <Reveal key={offer.domain} as="li" delay={i * 40}>
                  <OfferRow
                    offer={offer}
                    selected={choice?.status === 'wanted' && choice.name === offer.domain}
                    onChoose={() => choose(offer)}
                  />
                </Reveal>
              ))}
            </ul>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="card p-5">
                <p className="label flex items-center gap-1.5"><Link2 size={13} /> J'ai déjà un domaine</p>
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  Nous le raccorderons à votre nouveau site, sans frais supplémentaires.
                </p>
                <input
                  className="field"
                  value={owned}
                  placeholder="mon-entreprise.fr"
                  autoComplete="off"
                  onChange={(e) => setOwned(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void declareOwned() }}
                />
                <button
                  type="button"
                  className="btn-secondary mt-2 w-full !py-2 text-xs"
                  disabled={!isValidDomain(normalizeDomain(owned)) || ownedBusy}
                  onClick={() => void declareOwned()}
                >
                  {ownedBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                  Utiliser ce domaine
                </button>
              </div>

              <div className="card p-5">
                <p className="label flex items-center gap-1.5"><Clock size={13} /> Pas encore décidé</p>
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  Le domaine peut être choisi plus tard, pendant la réalisation. Cela ne retarde rien.
                </p>
                <button type="button" className="btn-secondary w-full !py-2 text-xs" onClick={decideLater}>
                  Décider plus tard
                </button>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card p-5">
              <p className="label">Votre choix</p>
              {choice ? (
                <ChoiceSummary choice={choice} onClear={() => dispatch({ type: 'setDomain', domain: null })} />
              ) : (
                <p className="text-sm leading-relaxed text-muted">
                  Choisissez une adresse dans la liste, indiquez celle que vous possédez déjà,
                  ou passez cette étape.
                </p>
              )}

              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Réalisation</dt>
                  <dd className="font-medium text-ink">{formatMoney(quote.total, quote.currency)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-semibold text-ink">Acompte pour démarrer</dt>
                  <dd className="text-xl font-extrabold text-brand">{formatMoney(quote.deposit, quote.currency)}</dd>
                </div>
              </dl>

              <button type="button" className="btn-primary mt-4 w-full" onClick={() => navigate('/paiement')}>
                Continuer vers l'acompte <ArrowRight size={16} />
              </button>
              <p className="mt-2 text-center text-[11px] text-subtle">
                {choice?.status === 'wanted'
                  ? 'Le domaine est réservé à votre nom après le paiement de l\'acompte.'
                  : 'Cette étape n\'est pas obligatoire.'}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

/** Une extension proposee : disponible, deja prise, ou non verifiable. */
function OfferRow({ offer, selected, onChoose }: {
  offer: DomainOffer
  selected: boolean
  onChoose: () => void
}) {
  const available = offer.status === 'available'
  return (
    <div className={`card flex flex-wrap items-center justify-between gap-3 p-4 transition ${selected ? 'ring-2 ring-brand' : ''}`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{offer.domain}</p>
        <p className="mt-0.5 text-xs text-subtle">
          {offer.status === 'error'
            ? offer.error
            : available
              ? offer.price !== null
                ? `${formatMoney(offer.price, offer.currency)} la première année${offer.renewalPrice !== null ? ` · ${formatMoney(offer.renewalPrice, offer.currency)} par an ensuite` : ''}`
                : 'Disponible'
              : 'Déjà pris par quelqu\'un d\'autre'}
        </p>
      </div>

      {offer.status === 'error' ? (
        <span className="rounded-lg bg-canvas px-2.5 py-1 text-[11px] text-subtle">Non vérifié</span>
      ) : available ? (
        <button type="button" className={selected ? 'btn-secondary !py-2 text-xs' : 'btn-primary !py-2 text-xs'} onClick={onChoose}>
          {selected ? <><Check size={14} /> Choisi</> : 'Choisir'}
        </button>
      ) : (
        <span className="rounded-lg bg-canvas px-2.5 py-1 text-[11px] text-subtle">Indisponible</span>
      )}
    </div>
  )
}

function ChoiceSummary({ choice, onClear }: { choice: DomainChoice; onClear: () => void }) {
  return (
    <div>
      {choice.status === 'later' ? (
        <p className="text-sm text-ink">Vous choisirez votre nom de domaine plus tard.</p>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Check size={15} className="text-brand" /> {choice.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {choice.status === 'wanted'
              ? 'Nous réservons ce domaine et le configurons avec votre site.'
              : 'Vous possédez déjà ce domaine : nous le raccorderons à votre site.'}
          </p>
          {choice.status === 'wanted' && choice.price !== null && (
            <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-[11px] leading-relaxed text-muted">
              Domaine facturé par le registrar : {formatMoney(choice.price, choice.currency)} la première année
              {choice.renewalPrice !== null && <>, puis {formatMoney(choice.renewalPrice, choice.currency)} par an</>}.
              Ce montant n'est pas compris dans le prix de réalisation.
            </p>
          )}
        </>
      )}
      <button type="button" className="btn-ghost mt-2 !px-0 text-xs" onClick={onClear}>
        Changer de choix
      </button>
    </div>
  )
}
