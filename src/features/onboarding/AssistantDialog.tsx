import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import {
  analyzeLocally, makeAbout, makeFaq, makeSlogan,
  suggestColors, suggestObjectives, suggestTheme, type Analysis,
} from '@/engine/assistant'
import { useProject } from '@/store/ProjectStore'

/**
 * « Créer automatiquement mon site » (§39).
 *
 * L'analyse est locale (mots-cles), pas un modele de langage : l'ecran le dit
 * clairement plutot que de laisser croire a une IA. Ce que l'assistant propose
 * reste entierement modifiable ensuite.
 */
export default function AssistantDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { project, dispatch } = useProject()
  const [sentence, setSentence] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  function analyze() {
    if (sentence.trim().length < 10) return
    setAnalysis(analyzeLocally(sentence))
  }

  function apply() {
    if (!analysis?.activityId) return
    const themeId = suggestTheme(analysis)
    const businessName = analysis.businessName || project.identity.businessName

    dispatch({ type: 'setActivity', activityId: analysis.activityId })
    dispatch({ type: 'setObjectives', objectives: suggestObjectives(analysis) })
    dispatch({ type: 'setTheme', themeId, keepColors: false })
    dispatch({ type: 'setColors', colors: suggestColors(themeId) })
    dispatch({
      type: 'setIdentity',
      identity: {
        businessName,
        city: analysis.city || project.identity.city,
        tagline: makeSlogan(analysis),
      },
    })

    // Les textes proposes atterrissent dans les sections concernees.
    const home = project.pages.find((p) => p.isHome)
    if (home) {
      const about = home.sections.find((s) => s.kind === 'about')
      if (about) {
        dispatch({
          type: 'updateSection', pageId: home.id, sectionId: about.id,
          props: { text: makeAbout(analysis, businessName || 'Votre entreprise') },
        })
      }
      const faq = home.sections.find((s) => s.kind === 'faq')
      if (faq) {
        dispatch({ type: 'updateSection', pageId: home.id, sectionId: faq.id, props: { items: makeFaq(analysis) } })
      }
    }

    onClose()
    navigate('/creer/site')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Sparkles size={18} className="text-brand" /> Créer automatiquement mon site
          </h2>
          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Décrivez votre activité en une phrase. Nous préparons une première version complète,
          que vous pourrez modifier entièrement.
        </p>

        <textarea
          className="field min-h-[92px]"
          placeholder="Je suis menuisier à Blois et je fabrique des meubles sur mesure."
          value={sentence}
          onChange={(e) => { setSentence(e.target.value); setAnalysis(null) }}
        />

        {analysis && (
          <div className="mt-4 rounded-xl border border-line bg-canvas p-4 text-sm">
            {analysis.activityId ? (
              <>
                <p className="font-semibold text-ink">Voici ce que nous avons compris</p>
                <ul className="mt-2 space-y-1 text-muted">
                  <li>Métier — <strong className="text-ink">{analysis.activityLabel}</strong></li>
                  {analysis.city && <li>Ville — <strong className="text-ink">{analysis.city}</strong></li>}
                  <li>Design — <strong className="text-ink">{suggestTheme(analysis)}</strong>, avec une palette assortie</li>
                  <li>Contenu — slogan, présentation et questions fréquentes pré-remplis</li>
                </ul>
                {analysis.confidence !== 'high' && (
                  <p className="mt-2 text-xs text-amber-700">
                    Nous ne sommes pas certains du métier : vérifiez-le à l'étape suivante.
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted">
                Nous n'avons pas reconnu votre métier. Choisissez-le dans la liste, tout le reste
                fonctionnera de la même façon.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {analysis?.activityId ? (
            <button type="button" className="btn-primary flex-1" onClick={apply}>
              Construire mon site
            </button>
          ) : (
            <button type="button" className="btn-primary flex-1" disabled={sentence.trim().length < 10} onClick={analyze}>
              Analyser ma description
            </button>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          Cette proposition est construite localement, à partir des mots de votre phrase — aucun
          modèle d'intelligence artificielle n'est utilisé pour l'instant, et rien ne quitte votre
          navigateur.
        </p>
      </div>
    </div>
  )
}
