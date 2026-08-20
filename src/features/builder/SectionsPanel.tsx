import { useState } from 'react'
import { GripVertical, Eye, EyeOff, Plus } from 'lucide-react'
import type { Page, SectionKind } from '@/engine/types'
import { SECTION_LIST } from '@/renderer/sectionDefs'
import { MODULES, isSectionAvailable } from '@/engine/modules'
import { useProject } from '@/store/ProjectStore'

/** Sections de la page courante (§14) : ordre par glisser-deposer et ajout. */
export default function SectionsPanel({ page, selectedId, onSelect }: {
  page: Page
  selectedId: string | null
  onSelect: (sectionId: string) => void
}) {
  const { project, dispatch } = useProject()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  function drop(target: number) {
    if (dragIndex === null || dragIndex === target) return reset()
    const sections = [...page.sections]
    const [moved] = sections.splice(dragIndex, 1)
    sections.splice(target, 0, moved)
    dispatch({ type: 'reorderSections', pageId: page.id, sections })
    reset()
  }

  function reset() {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="p-4">
      <p className="label">Sections de « {page.name} »</p>

      <ul className="space-y-1">
        {page.sections.map((section, index) => {
          const def = SECTION_LIST.find((d) => d.kind === section.kind)!
          const active = section.id === selectedId
          return (
            <li
              key={section.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={reset}
              onDragOver={(e) => { e.preventDefault(); setOverIndex(index) }}
              onDrop={() => drop(index)}
              className={`flex items-center gap-2 rounded-xl border px-2 py-2 transition ${
                active ? 'border-brand/40 bg-brand/5' : 'border-transparent hover:bg-canvas'
              } ${overIndex === index && dragIndex !== null && dragIndex !== index ? 'ring-2 ring-brand/40' : ''} ${
                dragIndex === index ? 'opacity-40' : ''
              }`}
            >
              <GripVertical size={14} className="shrink-0 cursor-grab text-subtle" />
              <button
                type="button"
                className={`flex-1 truncate text-left text-sm ${section.hidden ? 'text-subtle line-through' : 'text-ink'}`}
                onClick={() => onSelect(section.id)}
              >
                {def.label}
              </button>
              <button
                type="button"
                title={section.hidden ? 'Afficher' : 'Masquer'}
                className="rounded-md p-1 text-subtle hover:text-ink"
                onClick={() => dispatch({ type: 'toggleSectionHidden', pageId: page.id, sectionId: section.id })}
              >
                {section.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </li>
          )
        })}
      </ul>

      {page.sections.length === 0 && (
        <p className="rounded-xl bg-canvas px-3 py-4 text-xs text-subtle">
          Page vide. Ajoutez une première section ci-dessous.
        </p>
      )}

      <button type="button" className="btn-secondary mt-4 w-full !py-2 text-xs" onClick={() => setAdding((v) => !v)}>
        <Plus size={14} /> Ajouter une section
      </button>

      {adding && (
        <div className="mt-2 space-y-1">
          {SECTION_LIST.map((def) => {
            const available = isSectionAvailable(def.kind, project.modules)
            return (
              <button
                key={def.kind}
                type="button"
                disabled={!available}
                title={available ? def.description : `Activez le module « ${moduleLabelFor(def.kind)} » à l'étape Fonctionnalités`}
                onClick={() => {
                  dispatch({ type: 'addSection', pageId: page.id, kind: def.kind })
                  setAdding(false)
                }}
                className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <span className="text-sm font-medium text-ink">{def.label}</span>
                <span className="truncate text-[11px] text-subtle">{def.description}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function moduleLabelFor(kind: SectionKind): string {
  return MODULES.find((m) => m.section === kind)?.label ?? kind
}
