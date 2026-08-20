import { Upload, X } from 'lucide-react'
import type { Identity, OpeningHour } from '@/engine/types'
import { useProject } from '@/store/ProjectStore'

const DAYS: Record<OpeningHour['day'], string> = {
  lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche',
}

const SOCIALS = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube'] as const

/** Identite du client (§12), repercutee immediatement dans l'apercu. */
export default function IdentityPanel() {
  const { project, dispatch } = useProject()
  const { identity } = project

  function set(patch: Partial<Identity>) {
    dispatch({ type: 'setIdentity', identity: patch })
  }

  function readImage(file: File | undefined, key: 'logoUrl' | 'faviconUrl') {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ [key]: String(reader.result) })
    reader.readAsDataURL(file)
  }

  function setHour(day: OpeningHour['day'], patch: Partial<OpeningHour>) {
    set({ hours: identity.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)) })
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="label">Votre entreprise</p>
        <div className="space-y-2">
          <Text label="Nom" value={identity.businessName} onChange={(v) => set({ businessName: v })} />
          <Text label="Slogan" value={identity.tagline} onChange={(v) => set({ tagline: v })} />
        </div>
      </div>

      <div>
        <p className="label">Logo</p>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
            {identity.logoUrl
              ? <img src={identity.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
              : <span className="text-[10px] text-subtle">Aucun</span>}
          </div>
          <label className="btn-secondary cursor-pointer !py-2 text-xs">
            <Upload size={14} /> Importer
            <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], 'logoUrl')} />
          </label>
          {identity.logoUrl && (
            <button type="button" className="rounded-lg p-2 text-subtle hover:text-red-600" onClick={() => set({ logoUrl: null })}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="label">Coordonnées</p>
        <div className="space-y-2">
          <Text label="Téléphone" value={identity.phone} onChange={(v) => set({ phone: v })} />
          <Text label="Email" value={identity.email} onChange={(v) => set({ email: v })} />
          <Text label="Adresse" value={identity.address} onChange={(v) => set({ address: v })} />
          <Text label="Ville" value={identity.city} onChange={(v) => set({ city: v })} />
          <Text label="Zone d'intervention" value={identity.serviceArea} onChange={(v) => set({ serviceArea: v })} />
        </div>
      </div>

      <div>
        <p className="label">Horaires</p>
        <div className="space-y-1">
          {identity.hours.map((h) => (
            <div key={h.day} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-muted">{DAYS[h.day]}</span>
              {h.closed ? (
                <span className="flex-1 text-subtle">Fermé</span>
              ) : (
                <>
                  <input type="time" className="field !w-auto flex-1 !px-2 !py-1 text-xs" value={h.open} onChange={(e) => setHour(h.day, { open: e.target.value })} />
                  <input type="time" className="field !w-auto flex-1 !px-2 !py-1 text-xs" value={h.close} onChange={(e) => setHour(h.day, { close: e.target.value })} />
                </>
              )}
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-muted hover:bg-canvas hover:text-ink"
                onClick={() => setHour(h.day, { closed: !h.closed })}
              >
                {h.closed ? 'Ouvrir' : 'Fermer'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Réseaux sociaux</p>
        <div className="space-y-2">
          {SOCIALS.map((key) => (
            <Text
              key={key}
              label={key[0].toUpperCase() + key.slice(1)}
              value={identity.social[key] ?? ''}
              onChange={(v) => set({ social: { ...identity.social, [key]: v } })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input className="field mt-1 !py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
