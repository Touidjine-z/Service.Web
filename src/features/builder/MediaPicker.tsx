import { useMemo, useState } from 'react'
import { Search, Upload, X } from 'lucide-react'
import { BANK_CATEGORIES, categoryForActivity, searchBank, type BankCategoryId } from '@/engine/imageBank'
import { getActivity } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'

/**
 * Choix d'une image (§18) : banque organisee par categorie, recherche, ou import
 * d'un visuel personnel. La categorie du metier est preselectionnee.
 */
export default function MediaPicker({ onPick, onClose }: {
  onPick: (url: string) => void
  onClose: () => void
}) {
  const { project } = useProject()
  const activity = project.activityId ? getActivity(project.activityId) : null
  const [category, setCategory] = useState<BankCategoryId | 'all'>(
    activity ? categoryForActivity(activity.imageCategory) : 'all',
  )
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchBank(query, category), [query, category])

  function importFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { onPick(String(reader.result)); onClose() }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Choisir une image</h2>
          <div className="flex items-center gap-2">
            <label className="btn-secondary cursor-pointer !py-2 text-xs">
              <Upload size={14} /> Importer
              <input type="file" accept="image/*" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
            </label>
            <button type="button" className="rounded-lg p-2 text-muted hover:bg-canvas" onClick={onClose} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              className="field !py-2 !pl-9 text-sm"
              placeholder="Rechercher une image"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="field !w-auto !py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value as BankCategoryId | 'all')}>
            <option value="all">Toutes les catégories</option>
            {BANK_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* auto-rows-max : sans cela les lignes s'ecrasent pour tenir dans la
            hauteur du modal au lieu de le faire defiler. */}
        <div className="grid flex-1 auto-rows-max content-start grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-4">
          {results.map((image) => (
            <button
              key={image.id}
              type="button"
              className="group overflow-hidden rounded-xl border border-line text-left transition hover:border-brand"
              onClick={() => { onPick(image.url); onClose() }}
            >
              <img src={image.url} alt={image.title} className="aspect-[3/2] w-full object-cover" />
              <span className="block truncate px-2 py-1.5 text-[11px] text-muted group-hover:text-ink">{image.title}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-subtle">Aucune image pour cette recherche.</p>
          )}
        </div>

        <footer className="border-t border-line px-5 py-3 text-[11px] text-subtle">
          Visuels d'habillage fournis avec la plateforme. Importez vos propres photos pour un rendu définitif.
        </footer>
      </div>
    </div>
  )
}
