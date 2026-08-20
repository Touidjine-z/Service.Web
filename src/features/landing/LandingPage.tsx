import { Link } from 'react-router-dom'
import {
  ArrowRight, Blocks, Eye, Layers, MonitorSmartphone, Palette, Play, Sparkles, Wand2,
} from 'lucide-react'
import { SECTORS } from '@/engine/activities'
import { THEMES } from '@/engine/themes'
import { useProject } from '@/store/ProjectStore'

/**
 * Landing (§4).
 * Regle commerciale absolue : aucun prix, aucune grille tarifaire,
 * aucun « a partir de X € » sur cette page (§56).
 */
export default function LandingPage() {
  const { project } = useProject()
  const hasDraft = project.activityId !== null

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main>
        <Hero hasDraft={hasDraft} />
        <TrustStrip />
        <HowItWorks />
        <ThemesPreview />
        <SectorsGrid />
        <FinalCta />
      </main>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <span className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
            <Blocks size={17} />
          </span>
          Studio
        </span>
        <Link to="/creer/activite" className="btn-primary !py-2 !px-4 text-sm">
          Créer mon site
        </Link>
      </div>
    </header>
  )
}

function Hero({ hasDraft }: { hasDraft: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-70"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(79,70,229,.14), transparent 70%)' }}
        aria-hidden
      />
      <div className="container-page relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-muted">
            <Sparkles size={13} className="text-brand" />
            Création libre, sans engagement
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Créez gratuitement votre futur site professionnel.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Choisissez votre activité, votre style et votre contenu. Construisez votre site en
            quelques minutes et visualisez-le immédiatement sur ordinateur et mobile.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/creer/activite" className="btn-primary w-full sm:w-auto">
              {hasDraft ? 'Reprendre mon site' : 'Créer mon site gratuitement'} <ArrowRight size={17} />
            </Link>
            <Link to="/creer/theme" className="btn-secondary w-full sm:w-auto">
              <Play size={16} /> Voir une démonstration
            </Link>
          </div>

          <p className="mt-5 text-xs text-subtle">
            Aucune compétence technique requise. Votre projet est enregistré automatiquement.
          </p>
        </div>

        <BrowserMock />
      </div>
    </section>
  )
}

/** Vignette illustrative de l'editeur : trois colonnes, comme le vrai builder (§9). */
function BrowserMock() {
  return (
    <div className="mx-auto mt-16 max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 rounded-md bg-surface px-3 py-1 text-[11px] text-subtle">votre-entreprise.fr</span>
        </div>

        <div className="grid grid-cols-12 gap-px bg-line">
          <aside className="col-span-3 hidden space-y-2 bg-surface p-4 sm:block">
            {['Pages', 'Sections', 'Design', 'Produits', 'Médias'].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${i === 2 ? 'bg-brand/10 text-brand' : 'text-muted'}`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="col-span-12 bg-canvas p-6 sm:col-span-6">
            <div className="h-24 rounded-xl bg-gradient-to-br from-brand/25 to-brand/5" />
            <div className="mt-3 h-2.5 w-2/3 rounded bg-line" />
            <div className="mt-2 h-2.5 w-1/2 rounded bg-line" />
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[4/3] rounded-lg bg-surface" />
                  <div className="h-2 w-3/4 rounded bg-line" />
                </div>
              ))}
            </div>
          </div>

          <aside className="col-span-3 hidden space-y-3 bg-surface p-4 sm:block">
            <div className="h-2 w-1/2 rounded bg-line" />
            <div className="flex gap-1.5">
              {['#2563EB', '#0F172A', '#38BDF8'].map((c) => (
                <span key={c} className="h-6 w-6 rounded-md ring-1 ring-line" style={{ background: c }} />
              ))}
            </div>
            <div className="h-8 rounded-lg border border-line" />
            <div className="h-8 rounded-lg border border-line" />
          </aside>
        </div>
      </div>
    </div>
  )
}

function TrustStrip() {
  const items = [
    { icon: Wand2, label: 'Sans code' },
    { icon: MonitorSmartphone, label: 'Ordinateur, tablette, mobile' },
    { icon: Palette, label: '20 designs professionnels' },
    { icon: Eye, label: 'Aperçu en temps réel' },
  ]
  return (
    <section className="border-y border-line bg-canvas">
      <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-sm text-muted">
            <Icon size={17} className="shrink-0 text-brand" />
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Blocks, title: 'Choisissez votre activité', text: "Restaurant, artisan, cabinet, commerce, agence… votre métier détermine les modules proposés." },
    { icon: Palette, title: 'Composez votre design', text: 'Un thème parmi vingt, puis vos couleurs, votre logo et votre typographie.' },
    { icon: Layers, title: 'Ajoutez votre contenu', text: 'Pages, sections, produits, services, réalisations et photos.' },
    { icon: Eye, title: 'Testez votre site', text: 'Naviguez comme un vrai visiteur, sur ordinateur, tablette, mobile et TV.' },
  ]

  return (
    <section className="container-page py-20 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Comment ça marche</h2>
        <p className="mt-3 text-muted">
          Quatre étapes, quelques minutes, et votre maquette est prête à être testée.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <article key={title} className="card p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon size={19} />
              </span>
              <span className="text-3xl font-bold text-line">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-4 font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ThemesPreview() {
  return (
    <section className="border-y border-line bg-canvas py-20 sm:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Vingt designs, un seul vous ressemble</h2>
          <p className="mt-3 text-muted">
            Chaque thème change la mise en page, la typographie, les cartes et les animations —
            pas seulement les couleurs.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {THEMES.map((theme) => (
            <div key={theme.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex h-16" aria-hidden>
                <span className="flex-1" style={{ background: theme.colors.primary }} />
                <span className="flex-1" style={{ background: theme.colors.secondary }} />
                <span className="flex-1" style={{ background: theme.colors.accent }} />
              </div>
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">{theme.name}</p>
                <p className="truncate text-[11px] text-subtle">{theme.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectorsGrid() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Pensé pour votre métier</h2>
        <p className="mt-3 text-muted">
          Les fonctionnalités proposées s'adaptent à votre activité. Un menuisier n'a pas les mêmes
          besoins qu'un restaurant ou qu'un cabinet médical.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {SECTORS.map((sector) => (
          <div key={sector.id}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">{sector.label}</h3>
            <div className="flex flex-wrap gap-2">
              {sector.activities.map((activity) => (
                <Link
                  key={activity.id}
                  to="/creer/activite"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted transition hover:border-brand/40 hover:text-ink"
                >
                  <span aria-hidden>{activity.icon}</span>
                  {activity.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="container-page pb-24">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: 'radial-gradient(50% 70% at 50% 0%, rgba(79,70,229,.6), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Votre site commence maintenant
          </h2>
          <p className="mt-4 text-white/70">
            Construisez librement votre maquette. Vous ne décidez de la suite qu'une fois le
            résultat sous les yeux.
          </p>
          <Link to="/creer/activite" className="btn mt-8 bg-white text-ink hover:bg-white/90">
            Créer mon site gratuitement <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-subtle sm:flex-row">
        <span>© {new Date().getFullYear()} Studio — Création de sites professionnels</span>
        <span>Création libre et gratuite. Aucun engagement.</span>
      </div>
    </footer>
  )
}
