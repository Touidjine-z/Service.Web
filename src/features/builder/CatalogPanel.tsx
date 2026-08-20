import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react'
import type { GalleryItem, Product, Service } from '@/engine/types'
import { CURRENCY_SYMBOL } from '@/renderer/samples'
import { useProject } from '@/store/ProjectStore'
import MediaPicker from './MediaPicker'

type Catalog = 'products' | 'services' | 'gallery'

const TITLES: Record<Catalog, { title: string; empty: string; add: string }> = {
  products: { title: 'Produits', empty: 'Aucun produit. Les exemples affichés dans l\'aperçu disparaîtront dès votre premier ajout.', add: 'Ajouter un produit' },
  services: { title: 'Services', empty: 'Aucun service. Les exemples affichés dans l\'aperçu disparaîtront dès votre premier ajout.', add: 'Ajouter un service' },
  gallery: { title: 'Galerie', empty: 'Aucune image. Ajoutez vos réalisations pour remplacer les exemples.', add: 'Ajouter une image' },
}

/** Produits (§15), services (§16) et galerie (§17) : meme mecanique de liste. */
export default function CatalogPanel({ catalog }: { catalog: Catalog }) {
  const { project, dispatch } = useProject()
  const [openId, setOpenId] = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')

  const items = project[catalog]
  const labels = TITLES[catalog]

  function add() {
    if (catalog === 'products') dispatch({ type: 'addProduct' })
    else if (catalog === 'services') dispatch({ type: 'addService' })
    else dispatch({ type: 'addGalleryItem', item: { imageUrl: '', title: 'Nouvelle image' } })
  }

  function patch(id: string, value: Record<string, unknown>) {
    if (catalog === 'products') dispatch({ type: 'updateProduct', productId: id, patch: value as Partial<Product> })
    else if (catalog === 'services') dispatch({ type: 'updateService', serviceId: id, patch: value as Partial<Service> })
    else dispatch({ type: 'updateGalleryItem', itemId: id, patch: value as Partial<GalleryItem> })
  }

  function remove(id: string) {
    if (catalog === 'products') dispatch({ type: 'removeProduct', productId: id })
    else if (catalog === 'services') dispatch({ type: 'removeService', serviceId: id })
    else dispatch({ type: 'removeGalleryItem', itemId: id })
  }

  function duplicate(id: string) {
    if (catalog === 'products') dispatch({ type: 'duplicateProduct', productId: id })
    else if (catalog === 'services') dispatch({ type: 'duplicateService', serviceId: id })
  }

  return (
    <div className="p-4">
      <p className="label">{labels.title}</p>

      {catalog === 'products' && (
        <div className="mb-4 rounded-xl border border-line bg-canvas p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Catégories</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {project.categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs text-ink">
                {c.name}
                <button type="button" className="text-subtle hover:text-red-600" onClick={() => dispatch({ type: 'removeCategory', categoryId: c.id })}>
                  <X size={11} />
                </button>
              </span>
            ))}
            {project.categories.length === 0 && <span className="text-xs text-subtle">Aucune catégorie</span>}
          </div>
          <div className="flex gap-1.5">
            <input
              className="field !py-1.5 text-xs"
              placeholder="Entrées, Plats…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !newCategory.trim()) return
                dispatch({ type: 'addCategory', name: newCategory.trim() })
                setNewCategory('')
              }}
            />
            <button
              type="button"
              className="btn-secondary !px-2.5 !py-1.5"
              disabled={!newCategory.trim()}
              onClick={() => { dispatch({ type: 'addCategory', name: newCategory.trim() }); setNewCategory('') }}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item, index) => {
          const open = openId === item.id
          const product = catalog === 'products' ? (item as Product) : null
          const service = catalog === 'services' ? (item as Service) : null
          const image = catalog === 'gallery' ? (item as GalleryItem) : null
          const name = product?.name ?? service?.name ?? image?.title ?? ''
          const imageUrl = product?.imageUrl ?? service?.imageUrl ?? image?.imageUrl ?? null

          return (
            <li key={item.id} className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 bg-canvas px-2 py-2">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                  {imageUrl
                    ? <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    : <ImageIcon size={13} className="m-auto mt-2.5 block text-subtle" />}
                </div>
                <button type="button" className="flex-1 truncate text-left text-sm text-ink" onClick={() => setOpenId(open ? null : item.id)}>
                  {name || 'Sans titre'}
                </button>
                <button type="button" className="rounded-md p-1 text-subtle hover:text-ink" title="Monter" disabled={index === 0}
                  onClick={() => dispatch({ type: 'moveCatalogItem', catalog, itemId: item.id, direction: -1 })}>
                  <ChevronUp size={13} />
                </button>
                <button type="button" className="rounded-md p-1 text-subtle hover:text-ink" title="Descendre" disabled={index === items.length - 1}
                  onClick={() => dispatch({ type: 'moveCatalogItem', catalog, itemId: item.id, direction: 1 })}>
                  <ChevronDown size={13} />
                </button>
              </div>

              {open && (
                <div className="space-y-2 border-t border-line p-3">
                  <Text label={catalog === 'gallery' ? 'Titre' : 'Nom'} value={name} onChange={(v) => patch(item.id, catalog === 'gallery' ? { title: v } : { name: v })} />
                  <Area label="Description" value={product?.description ?? service?.description ?? image?.description ?? ''} onChange={(v) => patch(item.id, { description: v })} />

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Image</p>
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary flex-1 !py-1.5 text-xs" onClick={() => setPicking(item.id)}>
                        <ImageIcon size={13} /> {imageUrl ? 'Changer' : 'Choisir'}
                      </button>
                      {imageUrl && (
                        <button type="button" className="rounded-lg px-2 text-subtle hover:text-red-600" onClick={() => patch(item.id, { imageUrl: catalog === 'gallery' ? '' : null })}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {product && (
                    <>
                      <label className="block text-xs font-medium text-muted">
                        Catégorie
                        <select
                          className="field mt-1 !py-2 text-sm"
                          value={product.categoryId ?? ''}
                          onChange={(e) => patch(item.id, { categoryId: e.target.value || null })}
                        >
                          <option value="">Sans catégorie</option>
                          {project.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </label>
                      <Price label={`Prix (${CURRENCY_SYMBOL[project.currency]})`} value={product.price} onChange={(v) => patch(item.id, { price: v })} />
                      <div className="flex items-center gap-2">
                        <Toggle label="Disponible" on={product.available} onChange={(v) => patch(item.id, { available: v })} />
                      </div>
                      <Variants product={product} onChange={(variants) => patch(item.id, { variants })} />
                    </>
                  )}

                  {service && (
                    <>
                      <Text label="Durée" value={service.duration} onChange={(v) => patch(item.id, { duration: v })} />
                      <Price label={`Prix (${CURRENCY_SYMBOL[project.currency]})`} value={service.price} onChange={(v) => patch(item.id, { price: v })} />
                    </>
                  )}

                  {image && <Text label="Catégorie" value={image.category} onChange={(v) => patch(item.id, { category: v })} />}

                  <div className="flex items-center justify-between border-t border-line pt-2">
                    <div className="flex gap-1">
                      {catalog !== 'gallery' && (
                        <button type="button" className="rounded-md p-1.5 text-subtle hover:text-ink" title="Dupliquer" onClick={() => duplicate(item.id)}>
                          <Copy size={13} />
                        </button>
                      )}
                      {product && (
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-subtle hover:text-ink"
                          title={product.hidden ? 'Afficher' : 'Masquer'}
                          onClick={() => patch(item.id, { hidden: !product.hidden })}
                        >
                          {product.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      )}
                    </div>
                    <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => remove(item.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {items.length === 0 && <p className="rounded-xl bg-canvas px-3 py-4 text-xs leading-relaxed text-subtle">{labels.empty}</p>}

      <button type="button" className="btn-secondary mt-3 w-full !py-2 text-xs" onClick={add}>
        <Plus size={14} /> {labels.add}
      </button>

      {picking && (
        <MediaPicker
          onClose={() => setPicking(null)}
          onPick={(url) => patch(picking, { imageUrl: url })}
        />
      )}
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

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <textarea className="field mt-1 min-h-[64px] !py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Price({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input
        className="field mt-1 !py-2 text-sm"
        type="number"
        min={0}
        step="0.01"
        value={value ?? ''}
        placeholder="Non affiché"
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </label>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex flex-1 items-center justify-between gap-3 text-xs font-medium text-muted">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-line'}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}

function Variants({ product, onChange }: { product: Product; onChange: (v: Product['variants']) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">Variantes</p>
      <div className="space-y-1.5">
        {product.variants.map((variant, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              className="field !py-1.5 text-xs"
              placeholder="Taille, format…"
              value={variant.name}
              onChange={(e) => onChange(product.variants.map((v, j) => (j === i ? { ...v, name: e.target.value } : v)))}
            />
            <input
              className="field !w-20 !py-1.5 text-xs"
              type="number"
              placeholder="Prix"
              value={variant.price ?? ''}
              onChange={(e) => onChange(product.variants.map((v, j) => (j === i ? { ...v, price: e.target.value === '' ? null : Number(e.target.value) } : v)))}
            />
            <button type="button" className="px-1 text-subtle hover:text-red-600" onClick={() => onChange(product.variants.filter((_, j) => j !== i))}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-1.5 text-xs font-semibold text-brand hover:underline" onClick={() => onChange([...product.variants, { name: '', price: null }])}>
        + Ajouter une variante
      </button>
    </div>
  )
}
