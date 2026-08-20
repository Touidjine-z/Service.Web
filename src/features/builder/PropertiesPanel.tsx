import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'
import type { Page, Section, Viewport } from '@/engine/types'
import { SECTION_DEFS, resolveProps } from '@/renderer/sectionDefs'
import { useProject } from '@/store/ProjectStore'
import FieldControl from './FieldControl'
import BlocksEditor from './BlocksEditor'
import { analyzeLocally, makeFaq } from '@/engine/assistant'

/**
 * Panneau de droite (§9). Il est entierement genere a partir du catalogue de
 * sections : ajouter une section ne demande aucun formulaire supplementaire.
 */
export default function PropertiesPanel({ page, section, viewport, selectedBlockId, onSelectBlock }: {
  page: Page
  section: Section | null
  /** Apercu courant : la grille fluide n'edite pas le meme point de rupture
   *  selon qu'on regarde l'ordinateur ou le mobile (§14). */
  viewport: Viewport
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
}) {
  const { project, dispatch } = useProject()

  if (!section) {
    return (
      <div className="p-5">
        <p className="label">Page</p>
        <label className="mt-3 block text-xs font-medium text-muted">
          Nom
          <input
            className="field mt-1"
            value={page.name}
            onChange={(e) => dispatch({ type: 'renamePage', pageId: page.id, name: e.target.value })}
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-muted">
          Titre pour les moteurs de recherche
          <input
            className="field mt-1"
            value={page.seo.title}
            onChange={(e) => dispatch({ type: 'updatePageSeo', pageId: page.id, seo: { title: e.target.value } })}
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-muted">
          Description
          <textarea
            className="field mt-1 min-h-[80px]"
            value={page.seo.description}
            onChange={(e) => dispatch({ type: 'updatePageSeo', pageId: page.id, seo: { description: e.target.value } })}
          />
        </label>
        <p className="mt-6 text-xs leading-relaxed text-subtle">
          Cliquez sur une section dans l'aperçu pour la modifier.
        </p>
      </div>
    )
  }

  const def = SECTION_DEFS[section.kind]
  const values = resolveProps(section, project)

  function patch(key: string, value: unknown) {
    dispatch({ type: 'updateSection', pageId: page.id, sectionId: section!.id, props: { [key]: value } })
  }

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label mb-0.5">Section</p>
          <p className="text-sm font-semibold text-ink">{def.label}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
            title={section.hidden ? 'Afficher' : 'Masquer'}
            onClick={() => dispatch({ type: 'toggleSectionHidden', pageId: page.id, sectionId: section.id })}
          >
            {section.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
            title="Dupliquer"
            onClick={() => dispatch({ type: 'duplicateSection', pageId: page.id, sectionId: section.id })}
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
            title="Supprimer"
            onClick={() => dispatch({ type: 'removeSection', pageId: page.id, sectionId: section.id })}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-subtle">{def.description}</p>

      <div className="mt-5 space-y-4">
        {def.fields.map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => patch(field.key, v)}
            onGenerate={
              field.key === 'items' && section!.kind === 'faq'
                ? () => patch('items', makeFaq(analyzeLocally(
                    `${project.identity.businessName} ${project.identity.city}`,
                  )))
                : undefined
            }
          />
        ))}
      </div>

      {def.blocks && def.blocks.length > 0 && (
        <BlocksEditor
          page={page}
          section={section}
          def={def}
          viewport={viewport}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
        />
      )}
    </div>
  )
}
