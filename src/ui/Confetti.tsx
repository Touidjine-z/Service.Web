import { useEffect, useState } from 'react'
import { useReducedMotion } from './motion'

/**
 * Petite celebration, sans dependance : une trentaine de fragments animes en
 * CSS puis retires du DOM. Utilisee au moment ou le client decouvre le
 * resultat de son travail (§29) — jamais ailleurs, pour que ca reste un signal.
 */

const COLORS = ['#4F46E5', '#38BDF8', '#F472B6', '#FBBF24', '#34D399']
const COUNT = 34

export default function Confetti({ duration = 2600 }: { duration?: number }) {
  const reduced = useReducedMotion()
  const [alive, setAlive] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setAlive(false), duration)
    return () => window.clearTimeout(timer)
  }, [duration])

  if (reduced || !alive) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: COUNT }, (_, i) => {
        // Reparties de maniere deterministe : pas d'aleatoire, pas de rendu
        // different entre deux passages, et aucune dependance a Math.random.
        const left = ((i * 37) % 100) + (i % 3)
        const delay = (i % 7) * 90
        const drift = ((i % 5) - 2) * 40
        const size = 6 + (i % 4) * 2
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-5%',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * (i % 2 ? 1 : 2)}px`,
              background: COLORS[i % COLORS.length],
              borderRadius: i % 3 === 0 ? '999px' : '2px',
              opacity: 0.9,
              animation: `confetti-fall ${1800 + (i % 5) * 300}ms cubic-bezier(.25,.6,.4,1) ${delay}ms forwards`,
              ['--confetti-drift' as string]: `${drift}px`,
            }}
          />
        )
      })}
    </div>
  )
}
