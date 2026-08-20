import { Globe, Upload, X } from 'lucide-react'
import { useProject } from '@/store/ProjectStore'

/**
 * SEO (§40) : titre, description, URL, favicon, Open Graph, avec un apercu du
 * resultat dans Google. Les valeurs sont par page, sauf le favicon et l'image
 * de partage qui valent pour tout le site.
 */
export default function SeoPanel({ pageId }: { pageId: string }) {
  const { project, dispatch } = useProject()
  const page = project.pages.find((p) => p.id === pageId) ?? project.pages[0]
  if (!page) return null

  const businessName = project.identity.businessName.trim() || 'Votre entreprise'
  const title = page.seo.title.trim() || `${page.name} — ${businessName}`
  const description = page.seo.description.trim()
    || project.identity.tagline.trim()
    || 'Ajoutez une description : c\'est le texte que Google affichera sous votre titre.'
  const domain = 'votre-domaine.fr'
  const url = `${domain}${page.isHome ? '' : `/${page.slug}`}`

  function readFavicon(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => dispatch({ type: 'setIdentity', identity: { faviconUrl: String(reader.result) } })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="label">Référencement de « {page.name} »</p>

        <label className="block text-xs font-medium text-muted">
          Titre
          <input
            className="field mt-1 !py-2 text-sm"
            value={page.seo.title}
            placeholder={`${page.name} — ${businessName}`}
            onChange={(e) => dispatch({ type: 'updatePageSeo', pageId: page.id, seo: { title: e.target.value } })}
          />
        </label>
        <Counter value={page.seo.title.length || title.length} max={60} />

        <label className="mt-3 block text-xs font-medium text-muted">
          Description
          <textarea
            className="field mt-1 min-h-[80px] !py-2 text-sm"
            value={page.seo.description}
            placeholder="Une phrase qui donne envie de cliquer."
            onChange={(e) => dispatch({ type: 'updatePageSeo', pageId: page.id, seo: { description: e.target.value } })}
          />
        </label>
        <Counter value={page.seo.description.length} max={155} />

        <div className="mt-3">
          <p className="text-xs font-medium text-muted">Adresse de la page</p>
          <p className="field mt-1 !py-2 text-sm text-muted">{page.isHome ? '/' : `/${page.slug}`}</p>
          <p className="mt-1 text-[11px] text-subtle">
            {page.isHome
              ? "La page d'accueil est toujours à la racine du site."
              : "L'adresse suit le nom de la page : renommez la page pour la changer."}
          </p>
        </div>
      </div>

      <div>
        <p className="label">Aperçu dans Google</p>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <Globe size={11} /> {url}
          </p>
          <p className="mt-1 truncate text-[15px] leading-snug text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#4d5156]">{description}</p>
        </div>
      </div>

      <div>
        <p className="label">Favicon</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
            {project.identity.faviconUrl
              ? <img src={project.identity.faviconUrl} alt="" className="max-h-full max-w-full object-contain" />
              : <span className="text-[9px] text-subtle">Aucun</span>}
          </div>
          <label className="btn-secondary cursor-pointer !py-2 text-xs">
            <Upload size={13} /> Importer
            <input type="file" accept="image/*" className="hidden" onChange={(e) => readFavicon(e.target.files?.[0])} />
          </label>
          {project.identity.faviconUrl && (
            <button
              type="button"
              className="rounded-lg p-2 text-subtle hover:text-red-600"
              onClick={() => dispatch({ type: 'setIdentity', identity: { faviconUrl: null } })}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="label">Partage sur les réseaux (Open Graph)</p>
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="aspect-[1.91/1] bg-canvas">
            {project.identity.logoUrl
              ? <img src={project.identity.logoUrl} alt="" className="h-full w-full object-contain p-6" />
              : <div className="grid h-full place-items-center text-[11px] text-subtle">Votre logo ou une image d'accroche</div>}
          </div>
          <div className="border-t border-line px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-subtle">{domain}</p>
            <p className="truncate text-xs font-semibold text-ink">{title}</p>
            <p className="line-clamp-1 text-[11px] text-muted">{description}</p>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
          Voilà à quoi ressemblera un lien vers votre site partagé sur Facebook, LinkedIn ou WhatsApp.
        </p>
      </div>
    </div>
  )
}

function Counter({ value, max }: { value: number; max: number }) {
  const over = value > max
  return (
    <p className={`mt-1 text-[11px] ${over ? 'text-amber-600' : 'text-subtle'}`}>
      {value} / {max} caractères{over ? ' — Google risque de couper' : ''}
    </p>
  )
}
