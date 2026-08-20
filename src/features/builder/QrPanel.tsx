import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'
import { useProject } from '@/store/ProjectStore'

/**
 * QR codes (§25). Les cibles correspondent aux usages reels d'un commerce :
 * le site, la carte, la commande, la vitrine, et un QR par table.
 * L'URL de base sera celle du site publie ; tant que la publication n'existe
 * pas, elle est saisie ici pour que les codes soient deja exploitables.
 */
interface Target {
  id: string
  label: string
  hint: string
  path: (slug: string) => string
  needs?: 'menu' | 'order'
}

const TARGETS: Target[] = [
  { id: 'site', label: 'Site', hint: 'Page d\'accueil', path: () => '' },
  { id: 'menu', label: 'Carte', hint: 'Menu ou catalogue', path: (slug) => slug, needs: 'menu' },
  { id: 'order', label: 'Commande', hint: 'Prise de commande en ligne', path: (slug) => slug, needs: 'order' },
  { id: 'vitrine', label: 'Vitrine', hint: 'À coller sur la devanture', path: () => '' },
]

export default function QrPanel() {
  const { project } = useProject()
  const [baseUrl, setBaseUrl] = useState('https://votre-domaine.fr')
  const [tables, setTables] = useState(0)

  const catalogPage = project.pages.find((p) => ['menu', 'carte', 'produits'].some((s) => p.slug.includes(s)))
  const slug = catalogPage ? catalogPage.slug : ''

  const targets = TARGETS.filter((t) => {
    if (t.needs === 'menu') return project.modules.includes('menu') || project.modules.includes('products')
    if (t.needs === 'order') return project.modules.includes('order') || project.modules.includes('cart')
    return true
  })

  const base = baseUrl.replace(/\/+$/, '')

  return (
    <div className="p-4">
      <p className="label">QR Codes</p>

      <label className="block text-xs font-medium text-muted">
        Adresse de votre futur site
        <input className="field mt-1 !py-2 text-sm" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
      </label>
      <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
        Les codes pointeront vers cette adresse. Elle sera fixée à la mise en ligne de votre site.
      </p>

      <div className="mt-4 space-y-3">
        {targets.map((target) => (
          <QrCard
            key={target.id}
            label={target.label}
            hint={target.hint}
            url={`${base}/${target.path(slug)}`.replace(/\/+$/, '')}
          />
        ))}
      </div>

      {(project.modules.includes('menu') || project.modules.includes('order')) && (
        <div className="mt-5 border-t border-line pt-4">
          <label className="block text-xs font-medium text-muted">
            QR par table
            <input
              type="number"
              min={0}
              max={40}
              className="field mt-1 !py-2 text-sm"
              value={tables}
              onChange={(e) => setTables(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
            />
          </label>
          <div className="mt-3 space-y-3">
            {Array.from({ length: tables }, (_, i) => (
              <QrCard key={i} label={`Table ${i + 1}`} hint="Carte et commande à table" url={`${base}/${slug}?table=${i + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QrCard({ label, hint, url }: { label: string; hint: string; url: string }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, { width: 512, margin: 1, errorCorrectionLevel: 'M' })
      .then((value) => { if (!cancelled) setDataUrl(value) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
        {dataUrl
          ? <img src={dataUrl} alt={`QR ${label}`} className="h-full w-full" />
          : <QrCode size={20} className="m-auto mt-5 block text-subtle" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="truncate text-[11px] text-subtle">{hint}</p>
        <p className="truncate text-[11px] text-muted">{url}</p>
      </div>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`qr-${label.toLowerCase().replace(/\s+/g, '-')}.png`}
          className="rounded-lg p-2 text-subtle hover:bg-canvas hover:text-ink"
          title="Télécharger"
        >
          <Download size={15} />
        </a>
      )}
    </div>
  )
}
