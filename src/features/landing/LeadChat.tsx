import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, Check, MessageSquare, Send, Sparkles, X } from 'lucide-react'
import { analyzeLocally, suggestObjectives, suggestTheme, type Analysis } from '@/engine/assistant'
import { SECTORS, getActivity } from '@/engine/activities'
import { OBJECTIVES } from '@/engine/modules'
import { getTheme } from '@/engine/themes'
import type { Lead, ObjectiveId } from '@/engine/types'
import { saveLead } from '@/store/db'
import { useProject } from '@/store/ProjectStore'
import { useReducedMotion } from '@/ui/motion'

/**
 * Conversation de qualification (§4, §39).
 *
 * Elle remplace le formulaire de contact des sites d'agence : au lieu de
 * demander au visiteur de decrire son besoin dans un champ libre qu'il
 * n'enverra jamais, on pose six questions courtes et on lui rend une maquette
 * deja configuree — metier, objectifs, design, ville.
 *
 * Deux points de vigilance :
 *  - AUCUNE question de budget, aucune fourchette : la conversation ne doit
 *    jamais laisser filtrer un montant (§56) ;
 *  - aucun modele de langage derriere. L'analyse de la premiere phrase est
 *    celle de `engine/assistant.ts` : mots-cles, ville, nom commercial.
 */

type Stage = 'metier' | 'metier-choix' | 'objectifs' | 'delai' | 'nom' | 'email' | 'pret'

interface Message {
  from: 'bot' | 'user'
  text: string
}

const DEADLINES = ['Dès que possible', 'Dans le mois', 'Dans les trois mois', 'Je me renseigne']

/** Objectifs les plus parlants pour un premier echange. */
const CHAT_OBJECTIVES: ObjectiveId[] = ['company', 'services', 'products', 'portfolio', 'quote', 'booking', 'orders', 'reviews']

export default function LeadChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { project, dispatch } = useProject()
  const reduced = useReducedMotion()

  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Bonjour 👋 Je prépare la maquette de votre site pendant que nous discutons.' },
    { from: 'bot', text: 'Pour commencer : quel est votre métier, et dans quelle ville êtes-vous installé ?' },
  ])
  const [stage, setStage] = useState<Stage>('metier')
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [objectives, setObjectives] = useState<ObjectiveId[]>([])
  const [deadline, setDeadline] = useState('')
  const [name, setName] = useState({ first: '', last: '' })
  const [email, setEmail] = useState('')

  const streamRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // Le flux suit toujours le dernier message.
  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [messages, typing, stage, reduced])

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 260)
  }, [open, stage])

  /** Reponse du bot, precedee d'une courte hesitation : la conversation respire. */
  function botSay(lines: string[], next?: () => void) {
    setTyping(true)
    const delay = reduced ? 0 : 520
    const timer = window.setTimeout(() => {
      setTyping(false)
      setMessages((current) => [...current, ...lines.map((text) => ({ from: 'bot' as const, text }))])
      next?.()
    }, delay)
    timers.current.push(timer)
  }

  function userSay(text: string) {
    setMessages((current) => [...current, { from: 'user', text }])
  }

  const themeId = useMemo(() => (analysis ? suggestTheme(analysis) : 'modern'), [analysis])
  const activityLabel = analysis?.activityLabel || analysis?.city || 'votre activité'

  function submitMetier() {
    const sentence = draft.trim()
    if (sentence.length < 3) return
    userSay(sentence)
    setDraft('')
    const found = analyzeLocally(sentence)
    setAnalysis(found)

    if (!found.activityId) {
      botSay(
        ["Je n'ai pas reconnu le métier avec certitude. Choisissez le plus proche — vous pourrez toujours en changer :"],
        () => setStage('metier-choix'),
      )
      return
    }

    const where = found.city ? ` à ${found.city}` : ''
    botSay(
      [`${found.activityLabel}${where} : c'est noté.`, 'Que doit faire votre site en priorité ? Plusieurs réponses possibles.'],
      () => {
        setObjectives(suggestObjectives(found).filter((o) => CHAT_OBJECTIVES.includes(o)))
        setStage('objectifs')
      },
    )
  }

  function pickActivity(activityId: string, label: string) {
    userSay(label)
    const found: Analysis = { ...(analysis ?? { city: '', businessName: '', specialties: [], confidence: 'low' as const, activityId: null, activityLabel: '' }), activityId, activityLabel: label, confidence: 'medium' }
    setAnalysis(found)
    botSay(['Parfait.', 'Que doit faire votre site en priorité ? Plusieurs réponses possibles.'], () => {
      setObjectives(suggestObjectives(found).filter((o) => CHAT_OBJECTIVES.includes(o)))
      setStage('objectifs')
    })
  }

  function submitObjectives() {
    if (!objectives.length) return
    const labels = objectives.map((id) => OBJECTIVES.find((o) => o.id === id)?.label ?? id)
    userSay(labels.join(' · '))
    botSay(['Très bien. Sous quel délai aimeriez-vous être en ligne ?'], () => setStage('delai'))
  }

  function submitDeadline(value: string) {
    setDeadline(value)
    userSay(value)
    botSay(
      [`Je vous prépare une maquette de ${activityLabel.toLowerCase()} avec le design « ${getTheme(themeId).name} ».`, 'Comment vous appelez-vous ?'],
      () => setStage('nom'),
    )
  }

  function submitNom() {
    const value = draft.trim()
    if (value.length < 2) return
    userSay(value)
    setDraft('')
    const [first, ...rest] = value.split(/\s+/)
    setName({ first, last: rest.join(' ') })
    botSay(['Dernière chose : votre email, pour retrouver votre maquette depuis n\'importe quel appareil.'], () => setStage('email'))
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.trim())

  async function submitEmail() {
    const value = draft.trim()
    if (!emailValid) return
    userSay(value)
    setEmail(value)
    setDraft('')

    const lead: Lead = {
      firstName: name.first,
      lastName: name.last,
      email: value,
      phone: '',
      company: analysis?.businessName ?? '',
      savedAt: new Date().toISOString(),
    }
    dispatch({ type: 'setLead', lead })
    await saveLead(project.id, lead).catch(() => undefined)

    botSay(['C\'est prêt. Votre maquette vous attend, déjà configurée.'], () => setStage('pret'))
  }

  /** Applique la conversation au projet, puis ouvre l'editeur. */
  function openDraft() {
    if (!analysis) return
    // « Autre activite » passe par le metier generique : le libelle saisi devient
    // le nom du metier, sinon le projet s'ouvrirait sans intitule.
    const activityId = analysis.activityId ?? 'custom'
    dispatch({ type: 'setActivity', activityId, customLabel: activityId === 'custom' ? activityLabel : '' })
    if (objectives.length) dispatch({ type: 'setObjectives', objectives })
    dispatch({ type: 'setTheme', themeId, keepColors: false })
    dispatch({
      type: 'setIdentity',
      identity: {
        city: analysis.city,
        businessName: analysis.businessName || '',
      },
    })
    dispatch({ type: 'setStep', step: 'design' })
    onClose()
    navigate('/creer/site')
  }

  if (!open) return null

  const sectorList = SECTORS.flatMap((sector) => sector.activities.map((a) => ({ ...a, sector: sector.label })))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-ink/30 p-0 backdrop-blur-[2px] sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-label="Décrire mon projet"
    >
      <div
        className="flex h-[min(680px,100dvh)] w-full flex-col overflow-hidden border border-line bg-surface shadow-lift sm:h-[640px] sm:w-[420px] sm:rounded-2xl"
        style={{ animation: reduced ? undefined : 'slide-up-in .32s cubic-bezier(.2,.7,.3,1) both' }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-ink">
              <Bot size={17} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-ink">Votre maquette en 6 questions</span>
              <span className="flex items-center gap-1.5 text-[11px] text-subtle">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500 text-emerald-500" />
                Sans engagement, sans compte
              </span>
            </span>
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-subtle transition hover:bg-surface hover:text-ink" aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <div ref={streamRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: reduced ? undefined : 'slide-up-in .3s cubic-bezier(.2,.7,.3,1) both' }}
            >
              <p
                className={[
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  message.from === 'user'
                    ? 'rounded-br-sm bg-brand text-brand-ink'
                    : 'rounded-bl-sm bg-canvas text-ink',
                ].join(' ')}
              >
                {message.text}
              </p>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-canvas px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-subtle"
                    style={{ animation: reduced ? undefined : `float 1s ease-in-out ${i * 0.15}s infinite` }}
                  />
                ))}
              </span>
            </div>
          )}

          {stage === 'pret' && !typing && <Recap />}
        </div>

        <div className="border-t border-line bg-surface p-3">{renderComposer()}</div>
      </div>
    </div>
  )

  function Recap() {
    const theme = getTheme(themeId)
    const activity = analysis?.activityId ? getActivity(analysis.activityId) : null
    return (
      <div className="rounded-2xl border border-line bg-canvas p-4" style={{ animation: reduced ? undefined : 'pop-in .4s cubic-bezier(.2,.8,.3,1) both' }}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
          <Sparkles size={13} /> Votre maquette est configurée
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="Métier" value={`${activity?.icon ?? '•'} ${activityLabel}`} />
          {analysis?.city && <Row label="Ville" value={analysis.city} />}
          <Row label="Objectifs" value={`${objectives.length} retenus`} />
          <Row label="Design" value={theme.name} />
          {deadline && <Row label="Mise en ligne" value={deadline} />}
          {email && <Row label="Email" value={email} />}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Vous pourrez tout changer : chaque réponse n'est qu'un point de départ.
        </p>
      </div>
    )
  }

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-xs text-subtle">{label}</dt>
        <dd className="truncate text-right font-medium text-ink">{value}</dd>
      </div>
    )
  }

  function renderComposer() {
    if (typing) return <p className="px-1 py-2 text-xs text-subtle">…</p>

    if (stage === 'metier' || stage === 'nom' || stage === 'email') {
      const config = {
        metier: { placeholder: 'Ex : je suis menuisier à Blois', action: submitMetier, valid: draft.trim().length >= 3, type: 'text' },
        nom: { placeholder: 'Prénom et nom', action: submitNom, valid: draft.trim().length >= 2, type: 'text' },
        email: { placeholder: 'vous@exemple.fr', action: submitEmail, valid: emailValid, type: 'email' },
      }[stage]

      return (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => { event.preventDefault(); void config.action() }}
        >
          <input
            ref={inputRef}
            className="field"
            type={config.type}
            value={draft}
            placeholder={config.placeholder}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={config.placeholder}
          />
          <button type="submit" className="btn-primary !px-3.5 !py-2.5" disabled={!config.valid} aria-label="Envoyer">
            <Send size={16} />
          </button>
        </form>
      )
    }

    if (stage === 'metier-choix') {
      return (
        <div className="max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {sectorList.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => pickActivity(activity.id, activity.label)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-brand/50 hover:bg-brand/5 hover:text-ink"
              >
                <span aria-hidden>{activity.icon}</span> {activity.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => pickActivity('custom', draft.trim() || 'Mon activité')}
              className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-muted transition hover:border-brand/50 hover:text-ink"
            >
              Autre activité
            </button>
          </div>
        </div>
      )
    }

    if (stage === 'objectifs') {
      return (
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHAT_OBJECTIVES.map((id) => {
              const objective = OBJECTIVES.find((o) => o.id === id)
              if (!objective) return null
              const active = objectives.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setObjectives((current) => (active ? current.filter((o) => o !== id) : [...current, id]))}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs transition',
                    active ? 'border-brand bg-brand text-brand-ink' : 'border-line text-muted hover:border-brand/50 hover:text-ink',
                  ].join(' ')}
                >
                  {active && <Check size={12} className="mr-1 inline" />}
                  {objective.label}
                </button>
              )
            })}
          </div>
          <button type="button" className="btn-primary w-full !py-2.5 text-sm" disabled={!objectives.length} onClick={submitObjectives}>
            Continuer <ArrowRight size={15} />
          </button>
        </div>
      )
    }

    if (stage === 'delai') {
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {DEADLINES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => submitDeadline(value)}
              className="rounded-xl border border-line px-3 py-2 text-xs text-muted transition hover:border-brand/50 hover:bg-brand/5 hover:text-ink"
            >
              {value}
            </button>
          ))}
        </div>
      )
    }

    return (
      <button type="button" className="btn-primary w-full" onClick={openDraft}>
        Ouvrir ma maquette <ArrowRight size={16} />
      </button>
    )
  }
}

/** Bouton flottant qui ouvre la conversation, visible sur toute la vitrine. */
export function LeadChatLauncher({ onOpen, hidden }: { onOpen: () => void; hidden?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-ink py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition',
        'hover:brightness-125 focus-visible:outline focus-visible:outline-2',
        hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100',
      ].join(' ')}
      style={{ transitionDuration: '.3s' }}
    >
      <span className="relative grid h-6 w-6 place-items-center">
        <MessageSquare size={17} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      Décrire mon projet
    </button>
  )
}
