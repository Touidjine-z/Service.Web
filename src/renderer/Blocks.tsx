import type { CSSProperties } from 'react'
import type { Block, Project } from '@/engine/types'
import { withAlpha } from '@/engine/color'
import type { SiteTokens } from './tokens'
import { resolveBlockProps } from './blockDefs'
import { groupRuns, type BlockFamily } from './fluid'
import { Count } from './Motion'

/**
 * Rendu des blocs (§14). Un bloc ne connait ni son metier ni sa section : il
 * lit ses props et les tokens du theme, exactement comme une section (§48).
 * C'est le pendant de `Sections.tsx` a l'echelle du contenu.
 *
 * Deux regles pour que le resultat reste bon quelle que soit la suite de blocs
 * choisie par le client :
 *  - les blocs qui vont naturellement en ligne (pastilles, boutons) sont
 *    regroupes sur une meme rangee ;
 *  - les blocs qui vont naturellement en grille (chiffres, arguments) sont
 *    regroupes en colonnes. Le client n'a donc aucune mise en page a gerer.
 */

type Bag = Record<string, unknown>
const str = (bag: Bag, key: string) => String(bag[key] ?? '')
const list = (bag: Bag, key: string) => (Array.isArray(bag[key]) ? (bag[key] as Bag[]) : [])

const HEADING_SIZE: Record<string, number> = { sm: 19, md: 25, lg: 33 }
const SPACER_SIZE: Record<string, number> = { sm: 12, md: 32, lg: 64 }
const IMAGE_RATIO: Record<string, string> = {
  landscape: '4 / 3', square: '1 / 1', portrait: '3 / 4', wide: '16 / 7',
}

export interface BlockStackProps {
  blocks: Block[]
  project: Project
  tokens: SiteTokens
  align?: 'left' | 'center'
  /**
   * Couleur des marqueurs (puces, filets, chiffres). Une section posee sur un
   * fond colore passe `currentColor` : la couleur principale y serait illisible.
   */
  accent?: string
  style?: CSSProperties
}

export function BlockStack({ blocks, project, tokens, align = 'left', accent, style }: BlockStackProps) {
  const visible = blocks.filter((b) => !b.hidden)
  if (visible.length === 0) return null

  const tint = accent ?? tokens.colors.primary
  // Le regroupement en rangees est partage avec la grille fluide, qui s'en sert
  // pour deduire une premiere mise en page identique a cet empilement (§14).
  const runs: { family: BlockFamily; items: Block[] }[] = groupRuns(visible)

  return (
    <div style={{ display: 'grid', gap: `${tokens.scale(20)}px`, textAlign: align, ...style }}>
      {runs.map((run, index) => {
        if (run.family === 'inline') {
          return (
            <div
              key={index}
              style={{
                display: 'flex', flexWrap: 'wrap', gap: `${tokens.scale(10)}px`, alignItems: 'center',
                justifyContent: align === 'center' ? 'center' : 'flex-start',
              }}
            >
              {run.items.map((block) => (
                <BlockView key={block.id} block={block} project={project} tokens={tokens} align={align} tint={tint} />
              ))}
            </div>
          )
        }

        if (run.family === 'grid') {
          const wanted = run.items[0].type === 'stat' ? 4 : 3
          return (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${tokens.columns(Math.min(wanted, run.items.length))}, minmax(0, 1fr))`,
                gap: `${tokens.scale(24)}px`,
              }}
            >
              {run.items.map((block) => (
                <BlockView key={block.id} block={block} project={project} tokens={tokens} align={align} tint={tint} />
              ))}
            </div>
          )
        }

        const block = run.items[0]
        return <BlockView key={block.id} block={block} project={project} tokens={tokens} align={align} tint={tint} />
      })}
    </div>
  )
}

/**
 * Rendu d'un bloc, quel que soit son contexte : empile par `BlockStack`, ou
 * pose sur la grille fluide par `BlockGrid`. `fill` dit au bloc qu'il occupe
 * une boite DESSINEE par le client — seule l'image en tire parti, en remplissant
 * le cadre au lieu d'imposer son propre format.
 */
export function BlockView({ block, project, tokens, align, tint, fill = false }: {
  block: Block
  project: Project
  tokens: SiteTokens
  align: 'left' | 'center'
  tint: string
  fill?: boolean
}) {
  const bag = resolveBlockProps(block, project)

  switch (block.type) {
    case 'heading': {
      const title = str(bag, 'title')
      if (!title) return null
      return <h3 style={tokens.heading(HEADING_SIZE[str(bag, 'size')] ?? HEADING_SIZE.md)}>{title}</h3>
    }

    case 'text': {
      const text = str(bag, 'text')
      if (!text) return null
      return (
        <p style={{ fontSize: `${tokens.scale(16)}px`, lineHeight: 1.75, opacity: 0.8, margin: 0 }}>{text}</p>
      )
    }

    case 'bullets': {
      const items = list(bag, 'items').filter((it) => String(it.text ?? '').trim())
      if (items.length === 0) return null
      return (
        <ul style={{ display: 'grid', gap: `${tokens.scale(9)}px`, margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'flex', gap: `${tokens.scale(10)}px`, alignItems: 'flex-start',
                justifyContent: align === 'center' ? 'center' : 'flex-start',
                fontSize: `${tokens.scale(15)}px`, lineHeight: 1.6,
              }}
            >
              <span
                aria-hidden
                style={{
                  marginTop: `${tokens.scale(7)}px`, width: `${tokens.scale(7)}px`, height: `${tokens.scale(7)}px`,
                  borderRadius: '999px', background: tint, flexShrink: 0,
                }}
              />
              <span style={{ opacity: 0.85 }}>{String(item.text ?? '')}</span>
            </li>
          ))}
        </ul>
      )
    }

    case 'button': {
      const label = str(bag, 'label')
      if (!label) return null
      const variant = str(bag, 'variant') === 'primary' ? 'primary' : 'secondary'
      return <span style={tokens.button(variant)}>{label}</span>
    }

    case 'image': {
      const src = str(bag, 'imageUrl')
      const caption = str(bag, 'caption')
      const ratio = IMAGE_RATIO[str(bag, 'ratio')] ?? IMAGE_RATIO.landscape
      const frame: CSSProperties = fill
        ? { ...tokens.image(), width: '100%', flex: 1, minHeight: 0 }
        : { ...tokens.image(), aspectRatio: ratio, width: '100%' }
      return (
        <figure style={fill ? { margin: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } : { margin: 0 }}>
          {src ? (
            <div style={frame}>
              <img src={src} alt={caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <div
              aria-hidden
              style={{ ...frame, background: `linear-gradient(135deg, ${withAlpha(tokens.colors.primary, 0.5)}, ${withAlpha(tokens.colors.accent, 0.25)})` }}
            />
          )}
          {caption && (
            <figcaption style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(13)}px`, opacity: 0.65 }}>
              {caption}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'stat': {
      const raw = str(bag, 'value')
      const numeric = Number(raw.replace(',', '.'))
      const decimals = raw.includes(',') || raw.includes('.') ? 1 : 0
      return (
        <div style={{ textAlign: align === 'center' ? 'center' : 'left' }}>
          <p style={{ ...tokens.heading(38), color: tint, margin: 0 }}>
            {Number.isFinite(numeric) && raw.trim() !== '' ? <Count to={numeric} decimals={decimals} /> : raw}
            {str(bag, 'suffix')}
          </p>
          <p style={{ marginTop: `${tokens.scale(6)}px`, fontSize: `${tokens.scale(14)}px`, opacity: 0.75 }}>
            {str(bag, 'label')}
          </p>
        </div>
      )
    }

    case 'quote': {
      const text = str(bag, 'text')
      if (!text) return null
      const author = str(bag, 'author')
      return (
        <blockquote
          style={{
            margin: 0,
            paddingInlineStart: align === 'center' ? 0 : `${tokens.scale(18)}px`,
            borderInlineStart: align === 'center' ? 'none' : `3px solid ${tint}`,
          }}
        >
          <p style={{ fontSize: `${tokens.scale(19)}px`, lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>« {text} »</p>
          {author && (
            <footer style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(13)}px`, opacity: 0.7 }}>
              {author}
            </footer>
          )}
        </blockquote>
      )
    }

    case 'feature': {
      const title = str(bag, 'title')
      const text = str(bag, 'text')
      if (!title && !text) return null
      return (
        <div>
          <div
            style={{
              display: 'flex', gap: `${tokens.scale(9)}px`, alignItems: 'center',
              justifyContent: align === 'center' ? 'center' : 'flex-start',
            }}
          >
            <span aria-hidden style={{ width: `${tokens.scale(18)}px`, height: '2px', background: tint, flexShrink: 0 }} />
            <p style={{ ...tokens.heading(18), margin: 0 }}>{title}</p>
          </div>
          {text && (
            <p style={{ marginTop: `${tokens.scale(8)}px`, fontSize: `${tokens.scale(14)}px`, lineHeight: 1.65, opacity: 0.78 }}>
              {text}
            </p>
          )}
        </div>
      )
    }

    case 'badge': {
      const label = str(bag, 'label')
      if (!label) return null
      return (
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: `${tokens.scale(7)}px`,
            paddingInline: `${tokens.scale(12)}px`, paddingBlock: `${tokens.scale(6)}px`,
            borderRadius: '999px', border: `1px solid ${withAlpha(tint, 0.4)}`,
            fontSize: `${tokens.scale(13)}px`, fontWeight: 600,
          }}
        >
          <span aria-hidden style={{ width: `${tokens.scale(6)}px`, height: `${tokens.scale(6)}px`, borderRadius: '999px', background: tint }} />
          {label}
        </span>
      )
    }

    case 'spacer':
      return <div aria-hidden style={{ height: `${tokens.scale(SPACER_SIZE[str(bag, 'size')] ?? SPACER_SIZE.md)}px` }} />
  }
}
