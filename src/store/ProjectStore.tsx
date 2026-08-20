import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Project } from '@/engine/types'
import type { Action } from './actions'
import { reducer } from './reducer'
import { createEmptyProject } from '@/engine/project'
import { computeQuote, DEFAULT_PRICING_RULES, type Quote } from '@/engine/pricing'
import { loadLatestProject, saveProject } from './db'

/** Actions qui ne doivent pas creer d'entree dans l'historique undo/redo. */
const NON_UNDOABLE = new Set<Action['type']>(['load', 'setStep', 'revealPrice'])

const HISTORY_LIMIT = 60

interface History {
  past: Project[]
  present: Project
  future: Project[]
}

function historyReducer(state: History, action: Action | { type: '@undo' } | { type: '@redo' }): History {
  if (action.type === '@undo') {
    if (state.past.length === 0) return state
    const previous = state.past[state.past.length - 1]
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    }
  }
  if (action.type === '@redo') {
    if (state.future.length === 0) return state
    const [next, ...rest] = state.future
    return { past: [...state.past, state.present], present: next, future: rest }
  }

  const present = reducer(state.present, action as Action)
  if (present === state.present) return state
  if (NON_UNDOABLE.has((action as Action).type)) {
    return { ...state, present }
  }
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT)
  return { past, present, future: [] }
}

interface ProjectContextValue {
  project: Project
  dispatch: (action: Action) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Devis calcule en continu, mais a ne rendre qu'apres `project.priceRevealed`. */
  quote: Quote
  hydrated: boolean
  saving: boolean
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: createEmptyProject(),
    future: [],
  }))
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dispatch = useCallback((action: Action) => rawDispatch(action), [])
  const undo = useCallback(() => rawDispatch({ type: '@undo' }), [])
  const redo = useCallback(() => rawDispatch({ type: '@redo' }), [])

  // Reprise du dernier projet en cours : le client retrouve son travail.
  useEffect(() => {
    let cancelled = false
    loadLatestProject()
      .then((project) => {
        if (!cancelled && project) rawDispatch({ type: 'load', project })
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Sauvegarde automatique debouncee (§27).
  useEffect(() => {
    if (!hydrated) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      saveProject(state.present)
        .catch(() => undefined)
        .finally(() => setSaving(false))
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state.present, hydrated])

  // CTRL+Z / CTRL+SHIFT+Z (§26).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
      const target = event.target as HTMLElement | null
      // Ne pas voler le undo natif d'un champ en cours d'edition.
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const quote = useMemo(() => computeQuote(state.present, DEFAULT_PRICING_RULES), [state.present])

  const value = useMemo<ProjectContextValue>(
    () => ({
      project: state.present,
      dispatch,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      quote,
      hydrated,
      saving,
    }),
    [state, dispatch, undo, redo, quote, hydrated, saving],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject doit etre utilise dans <ProjectProvider>')
  return ctx
}
