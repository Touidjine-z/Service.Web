import { useState } from 'react'
import { Image as ImageIcon, Sparkles, Trash2, ChevronUp, ChevronDown} from 'lucide-react'
import type { FieldDef } from '@/engine/types'
import MediaPicker from './MediaPicker'
import { improveText } from '@/engine/assistant'

/**
 * Rendu d'un champ declare par le catalogue (§14). Sections et blocs passent
 * par ici : c'est ce qui garantit qu'ajouter une section, un bloc ou un champ
 * ne demande jamais d'ecrire un formulaire (§48).
 */
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


/** Deplace un element d'une liste d'un cran, sans sortir des bornes. */
function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export default function FieldControl({ field, value, onChange, onGenerate }: {
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
                <span className="flex items-center gap-0.5">
                  {/* Sans reordonnancement, un element ajoute reste coince en
                      dernier : un agenda ou un fil d'actualites devient faux
                      des la premiere date intercalee. */}
                  <button
                    type="button"
                    className="rounded p-0.5 text-subtle transition hover:text-ink disabled:opacity-30 disabled:hover:text-subtle"
                    title="Monter"
                    aria-label={`Monter ${field.itemLabel} ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => onChange(move(items, index, -1))}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 text-subtle transition hover:text-ink disabled:opacity-30 disabled:hover:text-subtle"
                    title="Descendre"
                    aria-label={`Descendre ${field.itemLabel} ${index + 1}`}
                    disabled={index === items.length - 1}
                    onClick={() => onChange(move(items, index, 1))}
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 text-subtle transition hover:text-red-600"
                    title="Supprimer"
                    aria-label={`Supprimer ${field.itemLabel} ${index + 1}`}
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
              <div className="space-y-2">
                {field.itemFields.map((sub) => {
                  const set = (value: string) =>
                    onChange(items.map((it, i) => (i === index ? { ...it, [sub.key]: value } : it)))
                  // Un champ declare `textarea` doit l'etre aussi dans une liste :
                  // une reponse de FAQ ou une biographie ne tient pas sur une ligne.
                  return sub.type === 'textarea' ? (
                    <textarea
                      key={sub.key}
                      className="field min-h-[64px] !py-2 text-xs"
                      placeholder={sub.label}
                      value={String(item[sub.key] ?? '')}
                      onChange={(e) => set(e.target.value)}
                    />
                  ) : (
                    <input
                      key={sub.key}
                      className="field !py-2 text-xs"
                      placeholder={sub.label}
                      value={String(item[sub.key] ?? '')}
                      onChange={(e) => set(e.target.value)}
                    />
                  )
                })}
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
