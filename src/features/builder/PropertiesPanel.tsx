import { useState } from 'react'
import { Eye, EyeOff, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react'
import type { Page, Section } from '@/engine/types'
import { SECTION_DEFS, resolveProps, type FieldDef } from '@/renderer/sectionDefs'
import { useProject } from '@/store/ProjectStore'
import MediaPicker from './MediaPicker'
import { analyzeLocally, improveText, makeFaq } from '@/engine/assistant'

/**
 * Panneau de droite (§9). Il est entierement genere a partir du catalogue de
 * sections : ajouter une section ne demande aucun formulaire supplementaire.
 */
export default function PropertiesPanel({ page, section }: { page: Page; section: Section | null }) {
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
    </div>
  )
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: unknown) => void }) {
  const [picking, setPicking] = useState(false)
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      {value && <img src={value} alt="" className="mb-2 aspect-[3/2] w-full rounded-lg border border-line object-cover" />}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 !py-1.5 text-xs" onClick={() => setPicking(true)}>
          <ImageIcon size={13} /> {value ? 'Changer' : 'Choisir'}
        </button>
        {value && (
          <button type="button" className="rounded-lg px-2 text-subtle hover:text-red-600" onClick={() => onChange('')}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {picking && <MediaPicker onClose={() => setPicking(false)} onPick={(url) => onChange(url)} />}
    </div>
  )
}

function FieldControl({ field, value, onChange, onGenerate }: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  /** Proposition automatique, quand le champ s'y prete (§39). */
  onGenerate?: () => void
}) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center justify-between gap-3 text-xs font-medium text-muted">
        {field.label}
        <button
          type="button"
          role="switch"
          aria-checked={value !== false}
          onClick={() => onChange(value === false)}
          className={`h-5 w-9 shrink-0 rounded-full transition ${value !== false ? 'bg-brand' : 'bg-line'}`}
        >
          <span className={`block h-4 w-4 rounded-full bg-white transition ${value !== false ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className="block text-xs font-medium text-muted">
        {field.label}
        <select className="field mt-1" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    )
  }

  if (field.type === 'number') {
    return (
      <label className="block text-xs font-medium text-muted">
        {field.label}
        <input
          type="number"
          className="field mt-1"
          min={field.min}
          max={field.max}
          value={Number(value ?? field.min)}
          onChange={(e) => onChange(Math.min(field.max, Math.max(field.min, Number(e.target.value) || field.min)))}
        />
      </label>
    )
  }

  if (field.type === 'image') {
    return <ImageField label={field.label} value={value ? String(value) : ''} onChange={onChange} />
  }

  if (field.type === 'list') {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="label">{field.label}</p>
          {onGenerate && (
            <button type="button" className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline" onClick={onGenerate}>
              <Sparkles size={11} /> Proposer
            </button>
          )}
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-line bg-canvas p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  {field.itemLabel} {index + 1}
                </span>
                <button
                  type="button"
                  className="text-subtle hover:text-red-600"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="space-y-2">
                {field.itemFields.map((sub) => (
                  <input
                    key={sub.key}
                    className="field !py-2 text-xs"
                    placeholder={sub.label}
                    value={String(item[sub.key] ?? '')}
                    onChange={(e) =>
                      onChange(items.map((it, i) => (i === index ? { ...it, [sub.key]: e.target.value } : it)))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-brand hover:underline"
          onClick={() => onChange([...items, Object.fromEntries(field.itemFields.map((f) => [f.key, '']))])}
        >
          + Ajouter
        </button>
      </div>
    )
  }

  return (
    <label className="block text-xs font-medium text-muted">
      {field.label}
      {field.type === 'textarea' ? (
        <>
          <textarea
            className="field mt-1 min-h-[92px]"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {String(value ?? '').trim().length > 10 && (
            <button
              type="button"
              className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
              onClick={() => onChange(improveText(String(value ?? '')))}
            >
              <Sparkles size={11} /> Améliorer ce texte
            </button>
          )}
        </>
      ) : (
        <input
          className="field mt-1"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}
