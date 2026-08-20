import { Check } from 'lucide-react'
import { STEPS, stepIndex } from '@/engine/project'
import type { BuilderStep } from '@/engine/types'

/**
 * Barre de progression (§49).
 * Regle absolue : aucune information tarifaire ici (§56).
 */
export default function StepBar({ current }: { current: BuilderStep }) {
  const index = stepIndex(current)
  const progress = STEPS.length > 1 ? index / (STEPS.length - 1) : 1

  return (
    <nav aria-label="Progression" className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
      {/* Avancee du parcours : la meme lecture qu'une barre de chargement, sans
          jamais annoncer ce qui reste a payer (§49, §56). */}
      <div className="h-0.5 w-full bg-line/60" aria-hidden>
        <div
          className="h-full origin-left bg-gradient-to-r from-brand to-sky-400 transition-transform duration-700 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <ol className="container-page flex items-center gap-1 overflow-x-auto py-3 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition duration-300',
                  done ? 'bg-brand text-brand-ink' : active ? 'scale-110 bg-brand/10 text-brand ring-2 ring-brand/30' : 'bg-canvas text-subtle',
                ].join(' ')}
                aria-hidden
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={[
                  'text-xs font-medium sm:text-sm',
                  active ? 'text-ink' : done ? 'text-muted' : 'text-subtle',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`mx-1 h-px w-4 transition-colors duration-500 sm:w-8 ${done ? 'bg-brand/50' : 'bg-line'}`} aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
