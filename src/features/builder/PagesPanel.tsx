import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Home, Plus, Trash2 } from 'lucide-react'
import { useProject } from '@/store/ProjectStore'

/** Gestion des pages (§13) : ajouter, renommer, dupliquer, deplacer, accueil. */
export default function PagesPanel({ currentPageId, onSelect }: {
  currentPageId: string
  onSelect: (pageId: string) => void
}) {
  const { project, dispatch } = useProject()
  const [name, setName] = useState('')

  function addPage() {
    const label = name.trim()
    if (!label) return
    dispatch({ type: 'addPage', name: label })
    setName('')
  }

  return (
    <div className="p-4">
      <p className="label">Pages du site</p>

      <ul className="space-y-1">
        {project.pages.map((page, index) => {
          const active = page.id === currentPageId
          return (
            <li
              key={page.id}
              className={`group rounded-xl border px-3 py-2 transition ${
                active ? 'border-brand/40 bg-brand/5' : 'border-transparent hover:bg-canvas'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm font-medium text-ink"
                  onClick={() => onSelect(page.id)}
                >
                  {page.name}
                </button>
                {page.isHome && <Home size={13} className="shrink-0 text-brand" aria-label="Page d'accueil" />}
              </div>

              <div className="mt-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <IconBtn label="Monter" disabled={index === 0} onClick={() => dispatch({ type: 'movePage', pageId: page.id, direction: -1 })}>
                  <ChevronUp size={13} />
                </IconBtn>
                <IconBtn label="Descendre" disabled={index === project.pages.length - 1} onClick={() => dispatch({ type: 'movePage', pageId: page.id, direction: 1 })}>
                  <ChevronDown size={13} />
                </IconBtn>
                <IconBtn label="Dupliquer" onClick={() => dispatch({ type: 'duplicatePage', pageId: page.id })}>
                  <Copy size={13} />
                </IconBtn>
                <IconBtn label="Définir comme accueil" disabled={page.isHome} onClick={() => dispatch({ type: 'setHomePage', pageId: page.id })}>
                  <Home size={13} />
                </IconBtn>
                <IconBtn
                  label="Supprimer"
                  disabled={project.pages.length <= 1 || page.isHome}
                  danger
                  onClick={() => {
                    if (page.id === currentPageId) {
                      const fallback = project.pages.find((p) => p.id !== page.id)
                      if (fallback) onSelect(fallback.id)
                    }
                    dispatch({ type: 'removePage', pageId: page.id })
                  }}
                >
                  <Trash2 size={13} />
                </IconBtn>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          className="field !py-2 text-xs"
          placeholder="Nouvelle page"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPage()}
        />
        <button type="button" className="btn-secondary !px-3 !py-2" onClick={addPage} disabled={!name.trim()}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

function IconBtn({ children, label, onClick, disabled, danger }: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-1.5 text-subtle transition disabled:opacity-25 ${
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-surface hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
