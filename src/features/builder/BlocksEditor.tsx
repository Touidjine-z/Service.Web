import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, LayoutGrid, Plus, RotateCcw, Rows3, Trash2 } from 'lucide-react'
import type { BlockType, Page, Section, Viewport } from '@/engine/types'
import { acceptsMoreBlocks, isFluid, resolveBlocks, type SectionDef } from '@/renderer/sectionDefs'
import { BLOCK_DEFS, blockSummary, resolveBlockProps } from '@/renderer/blockDefs'
import { ROWS_KEY, breakpointOf } from '@/renderer/fluid'
import { useProject } from '@/store/ProjectStore'
import FieldControl from './FieldControl'

/**
 * Editeur de blocs d'une section (§14). Comme le reste du panneau, il est
 * genere : la liste des blocs acceptes vient du catalogue de la section, leurs
 * champs viennent du catalogue des blocs. Ajouter un type de bloc ne demande
 * aucune ligne ici (§48).
 *
 * Sur une section dessinable, il pilote aussi la GRILLE FLUIDE : le placement
 * se fait a la souris dans l'apercu, ce panneau ne garde que ce qui ne se
 * dessine pas — le mode de disposition, le contenu de chaque bloc, et le retour
 * a la mise en page proposee.
 */
export default function BlocksEditor({ page, section, def, viewport, selectedBlockId, onSelectBlock }: {
  page: Page
  section: Section
  def: SectionDef
  /** Apercu courant : il decide du point de rupture que le client modifie. */
  viewport: Viewport
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
}) {
  const { project, dispatch } = useProject()
  const blocks = resolveBlocks(section)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const canAdd = acceptsMoreBlocks(def, blocks.length)
  const fluid = isFluid(section)
  const breakpoint = breakpointOf(viewport)

  // Un bloc attrape dans l'apercu s'ouvre ici : le client trouve ses reglages
  // la ou il vient de cliquer, sans avoir a le retrouver dans la liste.
  useEffect(() => {
    if (selectedBlockId) setOpenId(selectedBlockId)
  }, [selectedBlockId])

  function reset() {
    setDragIndex(null)
    setOverIndex(null)
  }

  function drop(target: number) {
    if (dragIndex === null || dragIndex === target) return reset()
    const next = [...blocks]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(target, 0, moved)
    dispatch({ type: 'reorderBlocks', pageId: page.id, sectionId: section.id, blocks: next })
    reset()
  }

  function add(type: BlockType) {
    dispatch({ type: 'addBlock', pageId: page.id, sectionId: section.id, blockType: type })
    setAdding(false)
  }

  function setFluid(next: boolean) {
    dispatch({ type: 'updateSection', pageId: page.id, sectionId: section.id, props: { fluid: next } })
  }

  /** Retour a la mise en page proposee, pour le point de rupture affiche. */
  function resetLayout() {
    dispatch({ type: 'setBlockLayout', pageId: page.id, sectionId: section.id, blockId: null, breakpoint, area: null })
    dispatch({ type: 'updateSection', pageId: page.id, sectionId: section.id, props: { [ROWS_KEY[breakpoint]]: undefined } })
  }

  return (
    <div className="mt-6 border-t border-line pt-4">
      {def.fluid && (
        <div className="mb-4">
          <p className="label">Disposition</p>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
            <button
              type="button"
              aria-pressed={fluid}
              onClick={() => setFluid(true)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition ${
                fluid ? 'bg-surface text-ink shadow-sm' : 'text-subtle hover:text-ink'
              }`}
            >
              <LayoutGrid size={13} /> Libre
            </button>
            <button
              type="button"
              aria-pressed={!fluid}
              onClick={() => setFluid(false)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition ${
                !fluid ? 'bg-surface text-ink shadow-sm' : 'text-subtle hover:text-ink'
              }`}
            >
              <Rows3 size={13} /> Empilée
            </button>
          </div>

          {fluid ? (
            <>
              <p className="mt-2 text-[11px] leading-relaxed text-subtle">
                Placez vos blocs directement dans l'aperçu : glissez pour déplacer, tirez les poignées
                pour redimensionner, tirez le bord bas pour agrandir la section.
                {breakpoint === 'mobile'
                  ? ' Vous modifiez ici la disposition mobile, indépendante de l’ordinateur.'
                  : ' Vous modifiez la disposition ordinateur ; le mobile s’en déduit tant que vous n’y touchez pas.'}
              </p>
              <button
                type="button"
                className="btn-ghost mt-2 w-full !py-1.5 text-[11px]"
                onClick={resetLayout}
              >
                <RotateCcw size={12} />
                Réinitialiser {breakpoint === 'mobile' ? 'le mobile' : 'l’ordinateur'}
              </button>
            </>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-subtle">
              Les blocs se suivent, le thème gère leur mise en page.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="label mb-0">Blocs</p>
        <span className="text-[11px] text-subtle">
          {blocks.length}
          {def.maxBlocks ? ` / ${def.maxBlocks}` : ''}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-subtle">
        {fluid
          ? 'Le contenu de cette section. L’ordre décide du bloc qui passe devant quand deux se superposent.'
          : 'Le contenu que vous ajoutez dans cette section. Glissez pour réordonner.'}
      </p>

      <ul className="mt-3 space-y-1">
        {blocks.map((block, index) => {
          const blockDef = BLOCK_DEFS[block.type]
          const open = block.id === openId
          const selected = block.id === selectedBlockId
          const values = resolveBlockProps(block, project)
          return (
            <li
              key={block.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={reset}
              onDragOver={(e) => { e.preventDefault(); setOverIndex(index) }}
              onDrop={() => drop(index)}
              className={`rounded-xl border transition ${
                open || selected ? 'border-brand/40 bg-brand/5' : 'border-line bg-canvas'
              } ${overIndex === index && dragIndex !== null && dragIndex !== index ? 'ring-2 ring-brand/40' : ''} ${
                dragIndex === index ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 px-2 py-2">
                <GripVertical size={13} className="shrink-0 cursor-grab text-subtle" />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => {
                    const next = open ? null : block.id
                    setOpenId(next)
                    onSelectBlock(next)
                  }}
                >
                  {open ? <ChevronDown size={13} className="shrink-0 text-subtle" /> : <ChevronRight size={13} className="shrink-0 text-subtle" />}
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-subtle">
                      {blockDef.label}
                    </span>
                    <span className={`block truncate text-xs ${block.hidden ? 'text-subtle line-through' : 'text-ink'}`}>
                      {blockSummary(block, project)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  title={block.hidden ? 'Afficher' : 'Masquer'}
                  className="rounded-md p-1 text-subtle hover:text-ink"
                  onClick={() => dispatch({ type: 'toggleBlockHidden', pageId: page.id, sectionId: section.id, blockId: block.id })}
                >
                  {block.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  type="button"
                  title="Supprimer"
                  className="rounded-md p-1 text-subtle hover:text-red-600"
                  onClick={() => {
                    if (openId === block.id) setOpenId(null)
                    if (selectedBlockId === block.id) onSelectBlock(null)
                    dispatch({ type: 'removeBlock', pageId: page.id, sectionId: section.id, blockId: block.id })
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {open && (
                <div className="space-y-3 border-t border-line px-3 py-3">
                  {blockDef.fields.map((field) => (
                    <FieldControl
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={(v) =>
                        dispatch({
                          type: 'updateBlock',
                          pageId: page.id,
                          sectionId: section.id,
                          blockId: block.id,
                          props: { [field.key]: v },
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {blocks.length === 0 && (
        <p className="rounded-xl bg-canvas px-3 py-3 text-[11px] leading-relaxed text-subtle">
          Aucun bloc. Cette section affiche uniquement ses réglages ci-dessus.
        </p>
      )}

      <button
        type="button"
        disabled={!canAdd}
        className="btn-secondary mt-3 w-full !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => setAdding((v) => !v)}
        title={canAdd ? undefined : 'Cette section a atteint son nombre de blocs maximum'}
      >
        <Plus size={13} /> Ajouter un bloc
      </button>

      {adding && canAdd && (
        <div className="mt-2 space-y-1">
          {(def.blocks ?? []).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-canvas"
            >
              <span className="text-xs font-medium text-ink">{BLOCK_DEFS[type].label}</span>
              <span className="truncate text-[11px] text-subtle">{BLOCK_DEFS[type].description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
