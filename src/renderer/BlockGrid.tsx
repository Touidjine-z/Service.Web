import { useContext, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import type { Block, GridArea, Project, Section } from '@/engine/types'
import { withAlpha } from '@/engine/color'
import type { SiteTokens } from './tokens'
import { BlockView } from './Blocks'
import {
  FluidEditContext, applyDrag, areaStyle, gridMetrics, resolveAreas, sectionRows,
  type DragMode,
} from './fluid'

/**
 * La GRILLE FLUIDE (§14) : le meme composant sert au site fini et a l'edition.
 *
 * En mode visiteur, c'est une grille CSS et rien d'autre — aucun script, aucun
 * ecouteur : ce que le client a dessine est ce que son visiteur recevra (§22).
 * Quand le builder fournit le contexte d'edition, la meme grille gagne la
 * selection, le glisser-deposer aimante a la cellule, les huit poignees de
 * redimensionnement et le bord bas qui reserve du blanc.
 *
 * Toute la geometrie est dans `fluid.ts` : ici on ne fait que traduire des
 * pixels d'ecran en cellules, et des cellules en CSS.
 */

interface Props {
  section: Section
  /** Blocs deja resolus par la section (catalogue + reglages du client). */
  blocks: Block[]
  project: Project
  tokens: SiteTokens
  align?: 'left' | 'center'
  /** Couleur des marqueurs quand la section est posee sur un fond colore. */
  accent?: string
}

/**
 * Geometrie de la grille A L'ECRAN, relevee au debut d'un geste. L'apercu du
 * builder est mis a l'echelle et une ligne s'etire quand son contenu deborde :
 * la souris ne parle donc ni en pixels du site, ni en lignes regulieres. On lit
 * les hauteurs de lignes REELLES calculees par le navigateur, ce qui garantit
 * que le bloc suit le curseur cellule par cellule, meme sur une grille inegale.
 */
interface Frame {
  ratio: number
  top: number
  colPitch: number
  /** Position du haut de chaque ligne, en pixels ecran, depuis le haut de la grille. */
  rowEdges: number[]
}

interface Drag {
  blockId: string
  mode: DragMode
  origin: GridArea
  frame: Frame
  from: { x: number; row: number }
  area: GridArea
}

const HANDLES: { mode: DragMode; style: CSSProperties }[] = [
  { mode: 'nw', style: { top: -4, left: -4, cursor: 'nwse-resize' } },
  { mode: 'n', style: { top: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' } },
  { mode: 'ne', style: { top: -4, right: -4, cursor: 'nesw-resize' } },
  { mode: 'e', style: { top: '50%', right: -4, marginTop: -4, cursor: 'ew-resize' } },
  { mode: 'se', style: { bottom: -4, right: -4, cursor: 'nwse-resize' } },
  { mode: 's', style: { bottom: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' } },
  { mode: 'sw', style: { bottom: -4, left: -4, cursor: 'nesw-resize' } },
  { mode: 'w', style: { top: '50%', left: -4, marginTop: -4, cursor: 'ew-resize' } },
]

const NUDGE: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
}

export default function BlockGrid({ section, blocks, project, tokens, align = 'left', accent }: Props) {
  const edit = useContext(FluidEditContext)
  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [rowsDrag, setRowsDrag] = useState<{ from: number; pitch: number; origin: number; rows: number } | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [inside, setInside] = useState(false)

  const { breakpoint, columns, gap, rowHeight } = gridMetrics(tokens)
  const placed = useMemo(() => resolveAreas(blocks, breakpoint), [blocks, breakpoint])

  // La hauteur suit le contenu, sauf quand le client a reserve du blanc.
  const stored = sectionRows(section, breakpoint, placed.map((p) => p.area))
  const rows = rowsDrag ? Math.max(rowsDrag.rows, stored) : stored

  const tint = accent ?? tokens.colors.primary
  const guide = withAlpha(tokens.colors.text, drag || rowsDrag ? 0.18 : 0.08)
  const showGrid = Boolean(edit) && (inside || drag !== null || rowsDrag !== null)

  function frameOf(): Frame {
    const el = gridRef.current
    const width = el?.offsetWidth ?? 0
    if (!el || !width) return { ratio: 1, top: 0, colPitch: 1, rowEdges: [0] }
    const rect = el.getBoundingClientRect()
    const ratio = rect.width / width
    const edges = [0]
    for (const track of getComputedStyle(el).gridTemplateRows.split(' ')) {
      const size = parseFloat(track)
      if (Number.isFinite(size)) edges.push(edges[edges.length - 1] + (size + gap) * ratio)
    }
    return { ratio, top: rect.top, colPitch: ((width + gap) / columns) * ratio, rowEdges: edges }
  }

  /** Ligne survolee par une ordonnee ecran, au-dela de la grille comme au-dessus. */
  function rowAt(frame: Frame, clientY: number): number {
    const y = clientY - frame.top
    const pitch = (rowHeight + gap) * frame.ratio
    if (y < 0) return Math.floor(y / pitch)
    for (let i = 0; i < frame.rowEdges.length - 1; i += 1) {
      if (y < frame.rowEdges[i + 1]) return i
    }
    // Sous la derniere ligne declaree, on extrapole au pas nominal : `floor`,
    // pour designer la ligne QUI CONTIENT le curseur, comme la boucle ci-dessus.
    const last = frame.rowEdges.length - 1
    return last + Math.floor((y - frame.rowEdges[last]) / pitch)
  }

  function startDrag(event: PointerEvent<HTMLDivElement>, blockId: string, area: GridArea) {
    if (!edit) return
    // Le clic ne doit pas remonter jusqu'a la section, qui deselectionnerait le bloc.
    event.stopPropagation()
    event.preventDefault()
    edit.select(section.id, blockId)
    const mode = ((event.target as HTMLElement).dataset.handle as DragMode | undefined) ?? 'move'
    event.currentTarget.setPointerCapture(event.pointerId)
    const frame = frameOf()
    setDrag({ blockId, mode, origin: area, area, frame, from: { x: event.clientX, row: rowAt(frame, event.clientY) } })
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return
    const dx = Math.round((event.clientX - drag.from.x) / drag.frame.colPitch)
    const dy = rowAt(drag.frame, event.clientY) - drag.from.row
    const area = applyDrag(drag.origin, drag.mode, dx, dy, columns)
    if (area.x !== drag.area.x || area.y !== drag.area.y || area.w !== drag.area.w || area.h !== drag.area.h) {
      setDrag({ ...drag, area })
    }
  }

  /** Une seule ecriture a la fin du geste : l'historique garde un pas par
   *  deplacement, pas un par pixel parcouru (§26). */
  function endDrag() {
    if (!drag) return
    if (drag.area !== drag.origin) edit?.move(section.id, drag.blockId, drag.area)
    setDrag(null)
  }

  function startRows(event: PointerEvent<HTMLDivElement>) {
    if (!edit) return
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setRowsDrag({ from: event.clientY, pitch: (rowHeight + gap) * frameOf().ratio, origin: rows, rows })
  }

  function moveRows(event: PointerEvent<HTMLDivElement>) {
    if (!rowsDrag) return
    const next = Math.max(1, rowsDrag.origin + Math.round((event.clientY - rowsDrag.from) / rowsDrag.pitch))
    if (next !== rowsDrag.rows) setRowsDrag({ ...rowsDrag, rows: next })
  }

  function endRows() {
    if (!rowsDrag) return
    if (rowsDrag.rows !== rowsDrag.origin) edit?.setRows(section.id, rowsDrag.rows)
    setRowsDrag(null)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, blockId: string, area: GridArea) {
    const step = NUDGE[event.key]
    if (!edit || !step) return
    event.preventDefault()
    event.stopPropagation()
    // Maj + fleche etire le bloc par son bord bas-droit, comme a la souris.
    edit.move(section.id, blockId, applyDrag(area, event.shiftKey ? 'se' : 'move', step[0], step[1], columns))
  }

  if (placed.length === 0 && !edit) return null

  return (
    <div
      style={{ position: 'relative' }}
      onPointerEnter={edit ? () => setInside(true) : undefined}
      onPointerLeave={edit ? () => setInside(false) : undefined}
    >
      {showGrid && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage:
              `repeating-linear-gradient(to right, ${guide} 0 1px, transparent 1px calc((100% + ${gap}px) / ${columns})),`
              + `repeating-linear-gradient(to bottom, ${guide} 0 1px, transparent 1px ${rowHeight + gap}px)`,
          }}
        />
      )}

      <div
        ref={gridRef}
        className={edit ? 'fluid-grid' : undefined}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          // Une ligne s'etire quand son contenu deborde : un bloc dessine trop
          // court repousse la suite au lieu de la recouvrir.
          gridTemplateRows: `repeat(${rows}, minmax(${rowHeight}px, auto))`,
          gridAutoRows: `minmax(${rowHeight}px, auto)`,
          gap: `${gap}px`,
          textAlign: align,
          position: 'relative',
        }}
      >
        {placed.map(({ block, area: base }) => {
          const area = drag?.blockId === block.id ? drag.area : base
          const selected = edit?.selectedBlockId === block.id
          const active = selected || hovered === block.id
          return (
            <div
              key={block.id}
              data-block-id={block.id}
              data-area={`${area.x},${area.y},${area.w},${area.h}`}
              style={{
                ...areaStyle(area),
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                minWidth: 0,
                zIndex: selected ? 3 : 1,
                cursor: edit ? (drag?.blockId === block.id ? 'grabbing' : 'grab') : undefined,
                outline: edit && active ? `${selected ? 2 : 1}px solid ${selected ? tint : withAlpha(tint, 0.5)}` : undefined,
                outlineOffset: '3px',
                touchAction: edit ? 'none' : undefined,
              }}
              tabIndex={edit ? 0 : undefined}
              onPointerDown={edit ? (e) => startDrag(e, block.id, area) : undefined}
              // Sans cela, le clic remonterait a la section, qui deselectionnerait
              // le bloc a l'instant meme ou le client vient de l'attraper.
              onClick={edit ? (e) => e.stopPropagation() : undefined}
              onPointerMove={edit ? moveDrag : undefined}
              onPointerUp={edit ? endDrag : undefined}
              onPointerCancel={edit ? endDrag : undefined}
              onPointerEnter={edit ? () => setHovered(block.id) : undefined}
              onPointerLeave={edit ? () => setHovered((id) => (id === block.id ? null : id)) : undefined}
              onKeyDown={edit ? (e) => onKeyDown(e, block.id, area) : undefined}
            >
              <BlockView
                block={block}
                project={project}
                tokens={tokens}
                align={align}
                tint={tint}
                fill
              />

              {edit && selected && (
                <>
                  {HANDLES.map((handle) => (
                    <span
                      key={handle.mode}
                      data-handle={handle.mode}
                      style={{
                        position: 'absolute', width: 8, height: 8, borderRadius: 2, zIndex: 4,
                        background: tokens.colors.background, border: `2px solid ${tint}`,
                        ...handle.style,
                      }}
                    />
                  ))}
                  <BlockToolbar
                    onDuplicate={() => edit.duplicate(section.id, block.id)}
                    onRemove={() => edit.remove(section.id, block.id)}
                    tint={tint}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* La poignee de hauteur n'apparait qu'au survol de la section : posee en
          permanence, sa bande volerait les clics de la section suivante. */}
      {edit && (inside || rowsDrag !== null) && (
        <div
          onPointerDown={startRows}
          onPointerMove={moveRows}
          onPointerUp={endRows}
          onPointerCancel={endRows}
          title="Hauteur de la section"
          style={{
            position: 'absolute', left: 0, right: 0, bottom: -10, height: 12,
            cursor: 'ns-resize', touchAction: 'none', zIndex: 4,
            display: 'grid', placeItems: 'center',
          }}
        >
          <span style={{ width: 46, height: 4, borderRadius: 999, background: withAlpha(tint, rowsDrag ? 0.9 : 0.35) }} />
        </div>
      )}
    </div>
  )
}

/** Barre flottante du bloc selectionne : dupliquer, supprimer. Le reste des
 *  reglages reste dans le panneau, la ou le client a l'habitude de les lire. */
function BlockToolbar({ onDuplicate, onRemove, tint }: {
  onDuplicate: () => void
  onRemove: () => void
  tint: string
}) {
  const button: CSSProperties = {
    display: 'grid', placeItems: 'center', width: 24, height: 24,
    border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: 0,
  }
  return (
    <div
      style={{
        position: 'absolute', top: -34, right: -3, zIndex: 5, display: 'flex', gap: 2,
        padding: 3, borderRadius: 8, background: tint,
        boxShadow: '0 6px 18px -8px rgba(0,0,0,.6)',
      }}
      // La barre commande le bloc, elle ne doit pas le faire glisser.
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" title="Dupliquer" style={button} onClick={onDuplicate}>
        <Copy size={13} />
      </button>
      <button type="button" title="Supprimer" style={button} onClick={onRemove}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
