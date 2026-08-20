import type { Currency, GridSettings } from '@/engine/types'
import { CURRENCY_SYMBOL } from '@/renderer/samples'
import { useProject } from '@/store/ProjectStore'

const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'EUR', label: 'Euro' },
  { id: 'USD', label: 'Dollar américain' },
  { id: 'GBP', label: 'Livre sterling' },
  { id: 'CHF', label: 'Franc suisse' },
  { id: 'CAD', label: 'Dollar canadien' },
]

const GRID_FIELDS: { key: keyof GridSettings; label: string; options: { value: string; label: string }[] }[] = [
  { key: 'columns', label: 'Colonnes', options: [2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} par ligne` })) },
  { key: 'cardSize', label: 'Taille des cartes', options: [
    { value: 'sm', label: 'Compacte' }, { value: 'md', label: 'Normale' }, { value: 'lg', label: 'Grande' },
  ] },
  { key: 'imageRatio', label: 'Format des images', options: [
    { value: 'square', label: 'Carré' }, { value: 'landscape', label: 'Paysage' }, { value: 'portrait', label: 'Portrait' },
  ] },
  { key: 'gap', label: 'Espacement', options: [
    { value: 'tight', label: 'Serré' }, { value: 'normal', label: 'Normal' }, { value: 'loose', label: 'Aéré' },
  ] },
  { key: 'align', label: 'Alignement', options: [
    { value: 'left', label: 'À gauche' }, { value: 'center', label: 'Centré' },
  ] },
]

/**
 * Devise (§20) et presentation des grilles (§19). « Afficher les prix » designe
 * les prix que le client affiche a SES visiteurs — rien a voir avec le prix de
 * realisation du site, qui reste invisible jusqu'a la page finale (§56).
 */
export default function SettingsPanel() {
  const { project, dispatch } = useProject()

  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="label">Devise du site</p>
        <select
          className="field !py-2 text-sm"
          value={project.currency}
          onChange={(e) => dispatch({ type: 'setCurrency', currency: e.target.value as Currency })}
        >
          {CURRENCIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label} ({CURRENCY_SYMBOL[c.id]})</option>
          ))}
        </select>

        <label className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-muted">
          Afficher les prix sur mon site
          <button
            type="button"
            role="switch"
            aria-checked={project.showPrices}
            onClick={() => dispatch({ type: 'setShowPrices', showPrices: !project.showPrices })}
            className={`h-5 w-9 shrink-0 rounded-full transition ${project.showPrices ? 'bg-brand' : 'bg-line'}`}
          >
            <span className={`block h-4 w-4 rounded-full bg-white transition ${project.showPrices ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </button>
        </label>
        <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
          Certains professionnels préfèrent afficher « sur devis ». Vos visiteurs verront alors les produits sans montant.
        </p>
      </div>

      <div>
        <p className="label">Présentation des grilles</p>
        <div className="space-y-2">
          {GRID_FIELDS.map((field) => (
            <label key={field.key} className="block text-xs font-medium text-muted">
              {field.label}
              <select
                className="field mt-1 !py-2 text-sm"
                value={String(project.grid[field.key])}
                onChange={(e) => {
                  const raw = e.target.value
                  const value = field.key === 'columns' ? Number(raw) : raw
                  dispatch({ type: 'setGrid', grid: { [field.key]: value } as Partial<GridSettings> })
                }}
              >
                {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-subtle">
          Ces réglages s'appliquent aux produits, services, réalisations et galerie. Une section peut ensuite ajuster son propre nombre de colonnes.
        </p>
      </div>
    </div>
  )
}
