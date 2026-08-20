import { useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import type { Lead } from '@/engine/types'
import { saveLead } from '@/store/db'
import { useProject } from '@/store/ProjectStore'

/**
 * Capture du lead (§28). Aucune information personnelle n'est demandee pendant
 * la creation : ce formulaire n'apparait qu'au moment ou le client veut
 * conserver son projet. Seuls prenom, nom et email sont requis.
 */
export default function SaveProjectDialog({ onClose, onSaved }: {
  onClose: () => void
  onSaved?: () => void
}) {
  const { project, dispatch } = useProject()
  const [form, setForm] = useState<Omit<Lead, 'savedAt'>>({
    firstName: project.lead?.firstName ?? '',
    lastName: project.lead?.lastName ?? '',
    email: project.lead?.email ?? '',
    phone: project.lead?.phone ?? '',
    company: project.lead?.company ?? project.identity.businessName,
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)
  const valid = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2 && emailValid

  async function submit() {
    if (!valid || saving) return
    setSaving(true)
    const lead: Lead = { ...form, savedAt: new Date().toISOString() }
    dispatch({ type: 'setLead', lead })
    await saveLead(project.id, lead).catch(() => undefined)
    setSaving(false)
    setDone(true)
    onSaved?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Check size={22} />
            </div>
            <h2 className="text-lg font-bold text-ink">Projet enregistré</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Vous pourrez le retrouver et le modifier quand vous voulez.
            </p>
            <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
              Continuer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-ink">Enregistrez votre projet</h2>
              <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas" onClick={onClose} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              Enregistrez gratuitement votre projet pour pouvoir le retrouver plus tard.
              Aucun engagement, aucun paiement.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
                <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Téléphone (facultatif)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Entreprise (facultatif)" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            </div>

            <button type="button" className="btn-primary mt-5 w-full" disabled={!valid || saving} onClick={submit}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : 'Enregistrer mon projet'}
            </button>
            {!valid && (
              <p className="mt-2 text-center text-xs text-subtle">
                Prénom, nom et email valide sont nécessaires.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input className="field mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
