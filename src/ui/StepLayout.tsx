import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { BuilderStep } from '@/engine/types'
import StepBar from './StepBar'
import { useProject } from '@/store/ProjectStore'

interface Props {
  step: BuilderStep
  title: string
  subtitle?: string
  children: ReactNode
  back?: string
  next?: string
  nextLabel?: string
  canContinue?: boolean
  /** Message affiche sous le bouton quand la suite est bloquee. */
  hint?: string
}

export default function StepLayout({
  step, title, subtitle, children, back, next, nextLabel = 'Continuer', canContinue = true, hint,
}: Props) {
  const navigate = useNavigate()
  const { saving, dispatch } = useProject()

  function goNext() {
    if (!next || !canContinue) return
    navigate(next)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <StepBar current={step} />

      <main className="container-page py-10 sm:py-14">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
        </header>

        {children}
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-surface/90 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            {back && (
              <button type="button" className="btn-ghost" onClick={() => navigate(back)}>
                <ArrowLeft size={16} /> Retour
              </button>
            )}
            <span className="flex items-center gap-1.5 text-xs text-subtle">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Enregistrement…</> : 'Projet enregistré'}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              className="btn-primary"
              disabled={!canContinue}
              onClick={() => {
                dispatch({ type: 'setStep', step })
                goNext()
              }}
            >
              {nextLabel} <ArrowRight size={16} />
            </button>
            {hint && !canContinue && <span className="text-xs text-subtle">{hint}</span>}
          </div>
        </div>
      </footer>
    </div>
  )
}
