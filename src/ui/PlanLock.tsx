import { useState, type ReactNode } from 'react'
import { Lock, Sparkles, X } from 'lucide-react'
import { planDefOf, upgradeOf } from '@/engine/plans'
import { useProject } from '@/store/ProjectStore'

/**
 * Verrou de formule (§60). Primitive unique, lue par tous les ecrans qui
 * touchent a une limite : etape Objectifs, etape Fonctionnalites, etape Design,
 * pages et catalogue du builder.
 *
 * Deux regles de produit tiennent dans ce composant :
 *
 *  1. On ne CACHE jamais ce qui est ferme. Cache, un module ne vend rien ;
 *     montre et etiquete, il travaille pour nous. Le clic n'est donc jamais
 *     ignore : il ouvre l'explication et propose la montee en gamme.
 *  2. Aucun montant, jamais (§56). Ce composant n'importe pas `pricing.ts` et
 *     n'en importera jamais : la difference se dit en valeur (« plus complete,
 *     donc plus chere »), le prix se decouvre a la page finale. Ne jamais ecrire
 *     ici « le cout du site » : c'est aussi le motif que traquent les
 *     detecteurs de fuite des tests de parcours.
 */
export function PlanLock({ feature, explain, label, onUpgraded, className = '' }: {
  /** Ce qui est ferme, tel que le client le nomme : « La commande en ligne ». */
  feature: string
  /** Une phrase qui explique la fonctionnalite, sans jargon. */
  explain: string
  /** Texte de la pastille. Par defaut : le nom de la formule superieure. */
  label?: string
  /** Appele apres la montee, pour enchainer l'action que le client voulait. */
  onUpgraded?: () => void
  className?: string
}) {
  const { project } = useProject()
  const [open, setOpen] = useState(false)
  const upgrade = upgradeOf(planDefOf(project))
  if (!upgrade) return null

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true) }}
        className={`inline-flex items-center gap-1 rounded-lg bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand transition hover:bg-brand/20 ${className}`}
      >
        <Lock size={10} /> {label ?? upgrade.label}
      </button>
      {open && (
        <PlanUpgradeDialog
          feature={feature}
          explain={explain}
          onClose={() => setOpen(false)}
          onUpgraded={() => { setOpen(false); onUpgraded?.() }}
        />
      )}
    </>
  )
}

/**
 * Bandeau de limite atteinte : meme discours que la pastille, mais pose sous un
 * controle desactive (ajout d'une page, ajout d'un article).
 */
export function PlanLimitNotice({ title, feature, explain, onUpgraded }: {
  title: string
  feature: string
  explain: string
  onUpgraded?: () => void
}) {
  const { project } = useProject()
  const [open, setOpen] = useState(false)
  const upgrade = upgradeOf(planDefOf(project))
  if (!upgrade) return null

  return (
    <>
      <div className="mt-3 rounded-xl border border-brand/25 bg-brand/5 px-3 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
          <Lock size={12} className="text-brand" /> {title}
        </p>
        <button
          type="button"
          className="mt-1.5 text-[11px] font-semibold text-brand hover:underline"
          onClick={() => setOpen(true)}
        >
          Passer au {upgrade.label.toLowerCase()}
        </button>
      </div>
      {open && (
        <PlanUpgradeDialog
          feature={feature}
          explain={explain}
          onClose={() => setOpen(false)}
          onUpgraded={() => { setOpen(false); onUpgraded?.() }}
        />
      )}
    </>
  )
}

/** La feuille de montee en gamme. Un seul texte, partout, sans un euro. */
export function PlanUpgradeDialog({ feature, explain, onClose, onUpgraded }: {
  feature: string
  explain: string
  onClose: () => void
  onUpgraded: () => void
}) {
  const { project, dispatch } = useProject()
  const current = planDefOf(project)
  const upgrade = upgradeOf(current)
  if (!upgrade) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold leading-snug text-ink">
            Cette fonctionnalité fait partie du {upgrade.label.toLowerCase()}
          </h2>
          <button type="button" className="rounded-lg p-1 text-subtle hover:text-ink" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm font-semibold text-ink">{feature}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{explain}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Elle n'existe pas dans le {current.label.toLowerCase()}. C'est une formule plus complète,
          donc plus chère. Vous verrez le prix des deux à la fin, avant tout engagement.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Vous ne perdez rien en changeant : tout ce que vous avez déjà fait est conservé.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => { dispatch({ type: 'setPlan', plan: upgrade.id }); onUpgraded() }}
          >
            <Sparkles size={16} /> Passer au {upgrade.label.toLowerCase()}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={onClose}>
            Rester sur le {current.label.toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Pastille simple, sans interaction : pour une liste deja explicite. */
export function PlanBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
      <Lock size={10} /> {children}
    </span>
  )
}
