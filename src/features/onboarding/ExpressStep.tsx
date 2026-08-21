import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Blocks, Check, ClipboardList, Eye, Loader2, Palette,
  PencilRuler, Sparkles,
} from 'lucide-react'
import { CUSTOM_ACTIVITY, SECTORS, getActivity } from '@/engine/activities'
import {
  EMPTY_EXPRESS_FORM, EXPRESS_FIELDS, EXPRESS_GROUPS, buildExpressProject,
  expressFilled, validateExpress, type ExpressField, type ExpressForm,
} from '@/engine/express'
import { getTheme } from '@/engine/themes'
import { useProject } from '@/store/ProjectStore'
import Confetti from '@/ui/Confetti'

/**
 * Creation express (§39, variante formulaire).
 *
 * Le client remplit les informations qu'il connait par coeur, il valide, et le
 * site est monte d'un seul coup. C'est la meme creation que le parcours en cinq
 * etapes — memes objectifs, memes modules, memes pages — mais decidee par le
 * moteur a partir du metier plutot qu'ecran par ecran.
 *
 * Regle commerciale : aucun montant ici non plus (§56). Ce qui est promis,
 * c'est un site pret a regarder, pas un tarif.
 */
export default function ExpressStep() {
  const navigate = useNavigate()
  const { project, dispatch, saving, hydrated } = useProject()
  const [form, setForm] = useState<ExpressForm>(() => fromProject(project))
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [done, setDone] = useState(false)
  // Le projet est relu dans IndexedDB apres le premier rendu : tant que le
  // client n'a rien tape, le formulaire se recale sur ce qui remonte, sinon il
  // reviendrait vide a chaque retour sur la page.
  const edited = useRef(false)
  useEffect(() => {
    if (hydrated && !edited.current) setForm(fromProject(project))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const errors = useMemo(() => validateExpress(form), [form])
  const valid = Object.keys(errors).length === 0

  // Ce que la validation produira : le vrai projet, calcule sans etre applique.
  // Le recapitulatif montre donc exactement ce qui sera cree, jamais une promesse.
  const preview = useMemo(
    () => (form.activityId ? buildExpressProject(project, form) : null),
    [project, form],
  )

  function set(key: keyof ExpressForm, value: string) {
    edited.current = true
    setForm((current) => ({ ...current, [key]: value }))
  }

  function markTouched(key: keyof ExpressForm) {
    setTouched((current) => new Set(current).add(key))
  }

  function submit() {
    if (!valid) {
      setTouched(new Set(Object.keys(errors)))
      return
    }
    dispatch({ type: 'applyExpress', form })
    setDone(true)
    window.scrollTo({ top: 0 })
  }

  // La suite passe par l'etape Formule, jamais directement par le builder :
  // sinon le chemin le plus rapide rendrait le site modele inatteignable.
  if (done) return <ReadyScreen name={form.businessName.trim()} onEdit={() => navigate('/creer/formule')} />

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
              <Blocks size={17} />
            </span>
            Studio
          </Link>
          <Link to="/creer/activite" className="text-sm font-medium text-muted transition hover:text-ink">
            Je préfère le parcours détaillé
          </Link>
        </div>
      </header>

      <main className="container-page py-10 sm:py-14">
        <header className="mb-8 max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
            <Sparkles size={13} className="text-brand" /> Création en une fois
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Renseignez vos informations, nous montons le site
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Le nom de votre boutique, votre adresse, votre téléphone : c'est tout ce dont nous
            avons besoin. À la validation, vos pages, votre design et vos textes sont en place —
            et vous pourrez ensuite tout modifier.
          </p>
        </header>

        <div className="grid animate-fade-up gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" style={{ animationDelay: '80ms' }}>
          <div className="space-y-5">
            <ActivityCard
              form={form}
              error={touched.has('activityId') || touched.has('customActivity')
                ? errors.activityId ?? errors.customActivity
                : undefined}
              onChange={set}
              onBlur={markTouched}
            />

            {EXPRESS_GROUPS.map((group) => (
              <section key={group.id} className="card p-5 sm:p-6">
                <h2 className="text-sm font-bold text-ink">{group.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">{group.description}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <TextField
                      key={field.key}
                      field={field}
                      value={form[field.key]}
                      error={touched.has(field.key) ? errors[field.key] : undefined}
                      onChange={(value) => set(field.key, value)}
                      onBlur={() => markTouched(field.key)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <Recap form={form} preview={preview} />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-surface/90 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-ghost">
              <ArrowLeft size={16} /> Retour
            </Link>
            <span className="hidden items-center gap-1.5 text-xs text-subtle sm:flex">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Enregistrement…</> : 'Projet enregistré'}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button type="button" className="btn-primary whitespace-nowrap" disabled={!valid} onClick={submit}>
              Valider et créer mon site <ArrowRight size={16} />
            </button>
            {!valid && (
              <span className="hidden text-xs text-subtle sm:block">
                Le nom et l'activité suffisent à lancer la création
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Reprend ce que le projet en cours sait deja : on ne fait pas ressaisir. */
function fromProject(project: ReturnType<typeof useProject>['project']): ExpressForm {
  const { identity } = project
  return {
    ...EMPTY_EXPRESS_FORM,
    activityId: project.activityId ?? '',
    customActivity: project.customActivity,
    businessName: identity.businessName,
    tagline: identity.tagline,
    phone: identity.phone,
    email: identity.email,
    address: identity.address,
    city: identity.city,
    serviceArea: identity.serviceArea,
    facebook: identity.social.facebook ?? '',
    instagram: identity.social.instagram ?? '',
  }
}

function ActivityCard({
  form, error, onChange, onBlur,
}: {
  form: ExpressForm
  error?: string
  onChange: (key: keyof ExpressForm, value: string) => void
  onBlur: (key: keyof ExpressForm) => void
}) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-sm font-bold text-ink">Votre activité</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        C'est elle qui décide des pages, des fonctionnalités et du design proposés.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Métier <span className="text-brand">*</span>
          <select
            className="field mt-1.5"
            name="activityId"
            value={form.activityId}
            onChange={(e) => onChange('activityId', e.target.value)}
            onBlur={() => onBlur('activityId')}
          >
            <option value="">Choisir mon activité…</option>
            {SECTORS.map((sector) => (
              <optgroup key={sector.id} label={sector.label}>
                {sector.activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.icon} {activity.label}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="custom">✨ {CUSTOM_ACTIVITY.label}</option>
          </select>
        </label>

        {form.activityId === 'custom' && (
          <label className="block text-xs font-medium text-muted">
            Décrivez votre activité <span className="text-brand">*</span>
            <input
              className="field mt-1.5"
              name="customActivity"
              placeholder="Ex. : atelier de réparation de vélos"
              value={form.customActivity}
              onChange={(e) => onChange('customActivity', e.target.value)}
              onBlur={() => onBlur('customActivity')}
              autoFocus
            />
          </label>
        )}
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </section>
  )
}

function TextField({
  field, value, error, onChange, onBlur,
}: {
  field: ExpressField
  value: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
}) {
  return (
    <label className={`block text-xs font-medium text-muted ${field.wide ? 'sm:col-span-2' : ''}`}>
      {field.label} {field.required && <span className="text-brand">*</span>}
      <input
        className={`field mt-1.5 ${error ? '!border-red-400 focus:!ring-red-500/10' : ''}`}
        type={field.type}
        name={field.key}
        autoComplete={field.autoComplete}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error
        ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
        : field.hint && <span className="mt-1 block text-[11px] leading-relaxed text-subtle">{field.hint}</span>}
    </label>
  )
}

/** Recapitulatif de ce qui sera cree : uniquement des faits lus dans le projet. */
function Recap({ form, preview }: { form: ExpressForm; preview: ReturnType<typeof buildExpressProject> | null }) {
  const activity = getActivity(form.activityId)
  const filled = expressFilled(form)
  const total = EXPRESS_FIELDS.length
  const theme = preview ? getTheme(preview.themeId) : null

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="card p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <ClipboardList size={16} className="text-brand" /> Ce que la validation crée
        </p>

        {preview && activity ? (
          <>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Établissement" value={preview.identity.businessName || '—'} />
              <Row
                label="Activité"
                value={`${activity.icon} ${activity.id === 'custom' ? form.customActivity.trim() || activity.label : activity.label}`}
              />
              {preview.identity.city && <Row label="Ville" value={preview.identity.city} />}
              <Row label="Pages" value={`${preview.pages.length} pages`} />
              <Row label="Fonctionnalités" value={`${preview.modules.length} activées`} />
              {theme && <Row label="Design" value={theme.name} />}
            </dl>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {preview.pages.map((page) => (
                <li key={page.id} className="rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-muted">
                  {page.name}
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-[11px] leading-relaxed text-subtle">
              <Palette size={13} className="mt-0.5 shrink-0 text-brand" />
              Design et palette choisis d'après votre métier. Slogan, présentation et questions
              fréquentes sont rédigés à partir de vos informations.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Choisissez votre activité : le détail de ce qui sera créé s'affiche ici.
          </p>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted">
            <span>Informations renseignées</span>
            <span>{filled} / {total}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-sky-400 transition-[width] duration-500"
              style={{ width: `${Math.round((filled / total) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-subtle">
            Les champs vides restent modifiables plus tard : le site se met à jour tout seul.
          </p>
        </div>
      </div>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-subtle">{label}</dt>
      <dd className="truncate text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

/** Ecran de confirmation : le moment ou le client decouvre que son site existe (§29). */
function ReadyScreen({ name, onEdit }: { name: string; onEdit: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5 py-16">
      <Confetti />
      <div className="w-full max-w-lg animate-fade-up text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Check size={26} strokeWidth={3} />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {name ? `Le site de ${name} est prêt` : 'Votre site est prêt'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Vos pages sont montées, vos coordonnées en place et vos textes rédigés. Regardez-le
          comme le verra un visiteur, puis modifiez ce que vous voulez.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/apercu" className="btn-primary">
            <Eye size={17} /> Voir mon site
          </Link>
          <button type="button" className="btn-secondary" onClick={onEdit}>
            <PencilRuler size={16} /> Modifier le contenu
          </button>
        </div>

        <p className="mt-6 text-xs text-subtle">
          Rien n'est figé : nom, couleurs, pages et textes se changent à tout moment.
        </p>
      </div>
    </div>
  )
}
