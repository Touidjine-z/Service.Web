import { Check } from 'lucide-react'
import { STEPS, stepIndex } from '@/engine/project'
import type { BuilderStep } from '@/engine/types'

/**
 * Barre de progression (§49).
 * Regle absolue : aucune information tarifaire ici (§56).
 */
export default function StepBar({ current }: { current: BuilderStep }) {
  const index = stepIndex(current)

  return (
    <nav aria-label="Progression" className="border-b border-line bg-surface/80 backdrop-blur">
      <ol className="container-page flex items-center gap-1 overflow-x-auto py-3 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition',
                  done ? 'bg-brand text-brand-ink' : active ? 'bg-brand/10 text-brand ring-2 ring-brand/30' : 'bg-canvas text-subtle',
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
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-line sm:w-8" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
