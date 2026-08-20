import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'

/**
 * Socle d'animation de la plateforme (§9, §50).
 *
 * Regles :
 *  - aucune dependance : IntersectionObserver + CSS, rien d'autre ;
 *  - `prefers-reduced-motion` coupe tout, y compris les animations pilotees en
 *    JavaScript (compteurs, carrousels) que le CSS global ne peut pas arreter ;
 *  - ces primitives servent la plateforme. Le site du client a les siennes,
 *    pilotees par le theme (cf. `renderer/Motion.tsx`), pour qu'aucune classe
 *    Tailwind de la plateforme ne fuie dans le rendu (§48).
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

interface InViewOptions {
  threshold?: number
  rootMargin?: string
  /** Par defaut l'animation ne joue qu'une fois : pas de clignotement au scroll. */
  once?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(options: InViewOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    // Environnement sans IntersectionObserver (jsdom, vieux navigateur) : on
    // montre le contenu plutot que de le laisser invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView] as const
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const OFFSET: Record<Direction, [number, number]> = {
  up: [0, 18], down: [0, -18], left: [22, 0], right: [-22, 0], none: [0, 0],
}

interface RevealProps {
  children: ReactNode
  /** Retard en millisecondes : sert a cascader une grille (index × 70). */
  delay?: number
  direction?: Direction
  /** Leger zoom d'entree, pour les visuels. */
  zoom?: boolean
  duration?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'li' | 'article' | 'span'
}

/** Apparition au scroll. C'est la brique de base de toute la vitrine. */
export function Reveal({
  children, delay = 0, direction = 'up', zoom = false, duration = 620, className, style, as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const [x, y] = OFFSET[direction]
  const Tag = as as 'div'

  const hidden = !inView && !reduced

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(${x}px, ${y}px, 0) scale(${zoom ? 0.965 : 1})` : 'none',
        transition: reduced ? undefined : `opacity ${duration}ms cubic-bezier(.22,.7,.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(.22,.7,.3,1) ${delay}ms`,
        willChange: hidden ? 'opacity, transform' : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

/** Compteur qui s'incremente quand il entre a l'ecran (preuve chiffree, §4). */
export function Counter({
  to, duration = 1500, decimals = 0, prefix = '', suffix = '', className,
}: { to: number; duration?: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 })
  const [value, setValue] = useState(reduced ? to : 0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setValue(to); return }
    let frame = 0
    let start: number | null = null
    const step = (now: number) => {
      if (start === null) start = now
      const progress = Math.min(1, (now - start) / duration)
      // easeOutExpo : demarre vite, se pose doucement sur la valeur finale.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(to * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, to, duration])

  const shown = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('fr-FR')
  return <span ref={ref} className={className}>{prefix}{shown}{suffix}</span>
}

/** Bandeau defilant en boucle. Le contenu est duplique pour une boucle sans saut. */
export function Marquee({
  children, speed = 38, reverse = false, className,
}: { children: ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={`marquee ${className ?? ''}`} aria-hidden={false}>
      <div
        className="marquee-track"
        style={reduced ? { animation: 'none' } : { animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden>{children}</div>
      </div>
    </div>
  )
}

/** Carte qui s'incline legerement vers le curseur. */
export function Tilt({
  children, max = 7, className, style,
}: { children: ReactNode; max?: number; className?: string; style?: CSSProperties }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = useState<string>('none')

  const onMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const element = ref.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`)
  }, [max, reduced])

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => setTransform('none')}
      style={{ transform, transition: 'transform .35s cubic-bezier(.2,.7,.3,1)', transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </div>
  )
}

/** Element qui suit le curseur de quelques pixels : rend un CTA « vivant ». */
export function Magnetic({
  children, strength = 10, className,
}: { children: ReactNode; strength?: number; className?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-flex',
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? 'transform .4s cubic-bezier(.2,.9,.3,1)' : 'transform .12s linear',
      }}
      onMouseMove={(event) => {
        if (reduced) return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        setOffset({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * strength * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * strength * 2,
        })
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </span>
  )
}

/** Lueur qui suit le curseur a l'interieur d'un bloc. */
export function Spotlight({
  children, className, color = 'rgb(var(--brand) / .16)',
}: { children: ReactNode; className?: string; color?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null)

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ''}`}
      onMouseMove={(event) => {
        if (reduced) return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        setPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}
      onMouseLeave={() => setPoint(null)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: point ? 1 : 0,
          background: point ? `radial-gradient(340px circle at ${point.x}px ${point.y}px, ${color}, transparent 70%)` : undefined,
        }}
      />
      {children}
    </div>
  )
}

/** Mot qui change en boucle dans un titre (« votre site de restaurant… »). */
export function RotatingWords({
  words, interval = 2100, className,
}: { words: string[]; interval?: number; className?: string }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (reduced || words.length < 2) return
    const timer = window.setInterval(() => {
      setLeaving(true)
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setLeaving(false)
      }, 320)
    }, interval)
    return () => window.clearInterval(timer)
  }, [reduced, words.length, interval])

  const longest = useMemo(() => words.reduce((a, b) => (b.length > a.length ? b : a), ''), [words])

  return (
    <span className={`relative inline-grid align-bottom ${className ?? ''}`}>
      {/* Un fantome invisible reserve la largeur du mot le plus long : le titre
          ne saute pas a chaque rotation. */}
      <span className="invisible col-start-1 row-start-1" aria-hidden>{longest}</span>
      <span
        className="col-start-1 row-start-1 whitespace-nowrap"
        style={{
          display: 'inline-block',
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-45%) rotateX(35deg)' : 'none',
          transition: reduced ? undefined : 'opacity .3s ease, transform .3s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        {words[index]}
      </span>
    </span>
  )
}

/** Avancee de lecture de la page, de 0 a 1. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return progress
}

/** Vrai des que la page a defile de `after` pixels (en-tete collant, CTA mobile). */
export function useScrolledPast(after = 24): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > after)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [after])
  return past
}

/** Deplacement lent au scroll, pour les decors du hero. */
export function Parallax({
  children, speed = 0.12, className,
}: { children: ReactNode; speed?: number; className?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    if (reduced) return
    let frame = 0
    const update = () => {
      frame = 0
      const element = ref.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      setShift((rect.top - window.innerHeight / 2) * -speed)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [speed, reduced])

  return (
    <div ref={ref} className={className} style={{ transform: `translate3d(0, ${shift.toFixed(1)}px, 0)` }}>
      {children}
    </div>
  )
}
