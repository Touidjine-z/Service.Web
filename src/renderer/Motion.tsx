import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { Motion } from '@/engine/themes'
import { useInView, useReducedMotion } from '@/ui/motion'

/**
 * Animations du site du client.
 *
 * Le token `theme.motion` (§10) devient enfin visible : chaque theme anime
 * ses sections a sa maniere — `none` ne bouge pas, `subtle` glisse, `lively`
 * glisse plus loin avec un leger zoom et une cascade plus marquee. Comme pour
 * les couleurs, c'est le seul endroit ou ce token devient du CSS, et rien ici
 * n'utilise une classe de la plateforme (§48).
 */

interface MotionSettings {
  level: Motion
  /** Coupe tout : edition dans le builder, ecran TV, apercu fige. */
  enabled: boolean
}

const MotionContext = createContext<MotionSettings>({ level: 'none', enabled: false })

export function MotionProvider({ level, enabled, children }: MotionSettings & { children: ReactNode }) {
  return <MotionContext.Provider value={{ level, enabled }}>{children}</MotionContext.Provider>
}

const PRESET: Record<Motion, { y: number; scale: number; duration: number; stagger: number }> = {
  none: { y: 0, scale: 1, duration: 0, stagger: 0 },
  subtle: { y: 16, scale: 1, duration: 620, stagger: 60 },
  lively: { y: 30, scale: 0.965, duration: 780, stagger: 95 },
}

/**
 * Apparition au scroll d'un bloc du site client.
 * `index` cascade les elements d'une grille sans que l'appelant calcule un delai.
 */
export function Appear({
  children, index = 0, style, as = 'div',
}: { children: ReactNode; index?: number; style?: CSSProperties; as?: 'div' | 'section' | 'article' }) {
  const { level, enabled } = useContext(MotionContext)
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.12 })
  const preset = PRESET[level]
  const Tag = as as 'div'

  const off = enabled && level !== 'none' && !reduced
  const hidden = off && !inView

  if (!off) return <Tag style={style}>{children}</Tag>

  const delay = Math.min(index, 8) * preset.stagger

  return (
    <Tag
      ref={ref}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${preset.y}px, 0) scale(${preset.scale})` : 'none',
        transition: `opacity ${preset.duration}ms cubic-bezier(.22,.7,.3,1) ${delay}ms, transform ${preset.duration}ms cubic-bezier(.22,.7,.3,1) ${delay}ms`,
        willChange: hidden ? 'opacity, transform' : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

/**
 * Compteur du site client. Il ne s'anime que si le theme le permet : un theme
 * `none` affiche directement la valeur finale.
 */
export function Count({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const { level, enabled } = useContext(MotionContext)
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 })
  const animated = enabled && level !== 'none' && !reduced
  const [value, setValue] = useState(animated ? 0 : to)

  useEffect(() => {
    if (!animated) { setValue(to); return }
    if (!inView) return
    let frame = 0
    let start: number | null = null
    const duration = level === 'lively' ? 1600 : 1200
    const step = (now: number) => {
      if (start === null) start = now
      const progress = Math.min(1, (now - start) / duration)
      setValue(to * (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [animated, inView, to, level])

  return <span ref={ref}>{decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('fr-FR')}</span>
}

/** Vrai quand le theme autorise les effets de survol (cartes, images). */
export function useSiteMotion(): MotionSettings {
  return useContext(MotionContext)
}
