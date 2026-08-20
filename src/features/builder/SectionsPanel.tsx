import { useMemo, useState } from 'react'
import { Copy, Eye, EyeOff, GripVertical, Plus, Search } from 'lucide-react'
import type { Page, SectionKind } from '@/engine/types'
import { SECTION_DEFS, SECTION_GROUPS, presetsOf, type SectionPreset } from '@/renderer/sectionDefs'
import { MODULES, isSectionAvailable } from '@/engine/modules'
import { useProject } from '@/store/ProjectStore'

/** Sections de la page courante (§14) : ordre par glisser-deposer et ajout. */
export default function SectionsPanel({ page, selectedId, onSelect }: {
  page: Page
  selectedId: string | null
  onSelect: (sectionId: string) => void
}) {
  const { dispatch } = useProject()
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
          const def = SECTION_DEFS[section.kind]
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
                title="Dupliquer"
                className="rounded-md p-1 text-subtle hover:text-ink"
                onClick={() => dispatch({ type: 'duplicateSection', pageId: page.id, sectionId: section.id })}
              >
                <Copy size={13} />
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

      {adding && <SectionPicker page={page} onDone={() => setAdding(false)} />}
    </div>
  )
}

/**
 * Catalogue d'ajout. On n'y propose pas des types techniques mais des points de
 * depart : une section peut se presenter sous plusieurs variantes, qui ne font
 * que pre-remplir ses champs et ses blocs (§14). La mise en page, elle, reste
 * celle du theme (§10).
 */
function SectionPicker({ page, onDone }: { page: Page; onDone: () => void }) {
  const { project, dispatch } = useProject()
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const groups = useMemo(
    () =>
      SECTION_GROUPS.map((category) => ({
        ...category,
        entries: category.kinds.flatMap((kind) => {
          const def = SECTION_DEFS[kind]
          return presetsOf(def)
            .map((preset) => ({ kind, preset, available: isSectionAvailable(kind, project.modules) }))
            .filter(({ preset }) =>
              !needle
              || `${preset.label} ${preset.description} ${def.label} ${def.description}`.toLowerCase().includes(needle),
            )
        }),
      })).filter((group) => group.entries.length > 0),
    [needle, project.modules],
  )

  function add(kind: SectionKind, preset: SectionPreset) {
    dispatch({ type: 'addSection', pageId: page.id, kind, props: preset.props, blocks: preset.blocks })
    onDone()
  }

  return (
    <div className="mt-2">
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          autoFocus
          className="field !py-2 !pl-8 text-xs"
          placeholder="Chercher une section…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-2 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="label mb-1">{group.label}</p>
            <div className="space-y-1">
              {group.entries.map(({ kind, preset, available }) => (
                <button
                  key={`${kind}-${preset.id}`}
                  type="button"
                  disabled={!available}
                  title={available ? preset.description : `Activez le module « ${moduleLabelFor(kind)} » à l'étape Fonctionnalités`}
                  onClick={() => add(kind, preset)}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                >
                  <span className="text-sm font-medium text-ink">{preset.label}</span>
                  <span className="truncate text-[11px] text-subtle">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <p className="rounded-xl bg-canvas px-3 py-4 text-xs text-subtle">Aucune section ne correspond.</p>
        )}
      </div>
    </div>
  )
}

function moduleLabelFor(kind: SectionKind): string {
  return MODULES.find((m) => m.section === kind)?.label ?? kind
}
