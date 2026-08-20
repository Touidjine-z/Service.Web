import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Blocks, Check, ChevronDown, ClipboardList, Eye, Layers, Menu,
  MessageSquare, MonitorSmartphone, Palette, Quote, Sparkles, Star, Wand2, X,
} from 'lucide-react'
import { ALL_ACTIVITIES } from '@/engine/activities'
import { useProject } from '@/store/ProjectStore'
import {
  Counter, Magnetic, Marquee, Reveal, RotatingWords, Spotlight,
  useScrollProgress, useScrolledPast,
} from '@/ui/motion'
import { DIFFERENCES, FACTS, FAQ, PROOF_POINTS, STEPS, TESTIMONIALS } from './content'
import LeadChat, { LeadChatLauncher } from './LeadChat'
import MetierFinder from './MetierFinder'
import SiteShowcase from './SiteShowcase'
import ThemeGallery from './ThemeGallery'

/**
 * Vitrine (§4).
 *
 * Regle commerciale absolue : aucun prix, aucune grille tarifaire, aucun
 * « a partir de X € » sur cette page (§56). Tout ce qui est promis ici doit
 * exister dans le parcours — les chiffres viennent de `content.ts`, qui les
 * lit dans le moteur.
 */
export default function LandingPage() {
  const { project } = useProject()
  const [chatOpen, setChatOpen] = useState(false)
  const hasDraft = project.activityId !== null

  return (
    <div className="min-h-screen bg-surface">
      <ScrollProgress />
      <Header onChat={() => setChatOpen(true)} hasDraft={hasDraft} />

      <main>
        <Hero hasDraft={hasDraft} onChat={() => setChatOpen(true)} />
        <ActivityMarquee />
        <Numbers />
        <HowItWorks />
        <Designs />
        <Difference />
        <Metiers />
        <Testimonials />
        <Questions />
        <FinalCta onChat={() => setChatOpen(true)} />
      </main>

      <Footer />

      <LeadChatLauncher onOpen={() => setChatOpen(true)} hidden={chatOpen} />
      <LeadChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <MobileCta hasDraft={hasDraft} hidden={chatOpen} />
    </div>
  )
}

/** Avancee de lecture : un fil fin, sous l'en-tete. */
function ScrollProgress() {
  const progress = useScrollProgress()
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent" aria-hidden>
      <div
        className="scroll-progress h-full bg-gradient-to-r from-brand via-sky-400 to-fuchsia-500"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}

const NAV = [
  { href: '#methode', label: 'La méthode' },
  { href: '#designs', label: 'Designs' },
  { href: '#metiers', label: 'Métiers' },
  { href: '#avis', label: 'Avis' },
  { href: '#questions', label: 'Questions' },
]

function Header({ onChat, hasDraft }: { onChat: () => void; hasDraft: boolean }) {
  const scrolled = useScrolledPast(20)
  const [open, setOpen] = useState(false)

  return (
    <header
      className={[
        'sticky top-0 z-30 transition-all duration-300',
        scrolled ? 'border-b border-line bg-surface/85 backdrop-blur-md' : 'border-b border-transparent bg-transparent',
      ].join(' ')}
    >
      <div className={`container-page flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-20'}`}>
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
            <Blocks size={17} />
          </span>
          Studio
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onChat}
            className="hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink sm:inline-flex"
          >
            <MessageSquare size={16} /> Décrire mon projet
          </button>
          <Link to="/creer/activite" className="btn-primary !py-2 !px-4 text-sm">
            {hasDraft ? 'Reprendre' : 'Créer mon site'}
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-muted transition hover:bg-canvas lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade-up border-t border-line bg-surface lg:hidden">
          <div className="container-page grid gap-1 py-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

const HERO_WORDS = ['restaurant', 'menuisier', 'coiffeur', 'cabinet', 'garage', 'fleuriste', 'photographe']

function Hero({ hasDraft, onChat }: { hasDraft: boolean; onChat: () => void }) {
  return (
    <section className="relative overflow-hidden pb-8">
      <div className="aurora" aria-hidden />
      <div className="grid-veil" aria-hidden />

      <div className="container-page relative pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal direction="none">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500 text-emerald-500" />
              Création libre — aucun compte, aucune carte bancaire
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Le site de votre{' '}
              <RotatingWords words={HERO_WORDS} className="text-gradient" />
              <br className="hidden sm:block" /> existe déjà. Ouvrez-le.
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Choisissez votre métier, votre design et votre contenu. En quelques minutes, votre
              maquette est là — vraie navigation, vrai panier, vrai mobile. Vous décidez de la
              suite seulement après l'avoir vue.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic>
                <Link to="/creer/activite" className="btn-primary w-full shadow-lift sm:w-auto">
                  {hasDraft ? 'Reprendre mon site' : 'Créer mon site gratuitement'} <ArrowRight size={17} />
                </Link>
              </Magnetic>
              <button type="button" onClick={onChat} className="btn-secondary w-full sm:w-auto">
                <MessageSquare size={16} /> Décrire mon projet en 6 questions
              </button>
            </div>
          </Reveal>

          <Reveal delay={275}>
            <p className="mt-5 text-sm text-muted">
              Pressé ?{' '}
              <Link
                to="/creer/express"
                className="inline-flex items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
              >
                <ClipboardList size={15} /> Renseignez vos informations, le site est monté
                <ArrowRight size={14} />
              </Link>
            </p>
          </Reveal>

          <Reveal delay={310}>
            <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {PROOF_POINTS.map((point) => (
                <div key={point.label} className="text-left">
                  <dt className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                    <Check size={14} className="mt-1 shrink-0 text-brand" /> {point.label}
                  </dt>
                  <dd className="mt-0.5 pl-[22px] text-xs leading-relaxed text-subtle">{point.detail}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <SiteShowcase />
      </div>
    </section>
  )
}

/** Bandeau de metiers : la preuve immediate que la plateforme parle au visiteur. */
function ActivityMarquee() {
  return (
    <section className="border-y border-line bg-canvas py-5">
      <Marquee speed={46}>
        {ALL_ACTIVITIES.map((activity) => (
          <span key={activity.id} className="flex items-center gap-2 text-sm font-medium text-muted">
            <span className="text-base" aria-hidden>{activity.icon}</span>
            {activity.label}
          </span>
        ))}
      </Marquee>
    </section>
  )
}

/** Chiffres du produit, comptes a l'entree a l'ecran. Tous verifiables dans le moteur. */
function Numbers() {
  const items = [
    { value: FACTS.themes, suffix: '', label: 'designs professionnels', detail: 'Mise en page, typographie, animations' },
    { value: FACTS.activities, suffix: '', label: 'métiers reconnus', detail: 'Plus votre activité si elle manque' },
    { value: FACTS.sections, suffix: '', label: 'sections disponibles', detail: 'Chiffres, méthode, avant/après…' },
    { value: FACTS.modules, suffix: '', label: 'fonctionnalités', detail: 'Panier, devis, rendez-vous, QR code' },
  ]

  return (
    <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(79,70,229,.45), transparent 65%)' }}
        aria-hidden
      />
      <div className="container-page relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={i * 90}>
            <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              <Counter to={item.value} />{item.suffix}
            </p>
            <p className="mt-2 text-sm font-semibold text-white/90">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{item.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const STEP_ICONS = [Blocks, Layers, Palette, Wand2, Eye]

function HowItWorks() {
  return (
    <section id="methode" className="container-page scroll-mt-20 py-20 sm:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">La méthode</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Cinq étapes, et votre site existe
          </h2>
          <p className="mt-4 text-muted">
            Pas de brief à rédiger, pas de rendez-vous à caler. Vous avancez à votre rythme, et
            vous voyez le résultat se construire à chaque étape.
          </p>
        </div>
      </Reveal>

      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Blocks
          return (
            <Reveal key={step.title} delay={i * 90} as="li">
              <Spotlight className="h-full rounded-2xl">
                <article className="hover-lift flex h-full flex-col rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Icon size={19} />
                    </span>
                    <span className="text-3xl font-bold text-line">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                  <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-subtle">{step.detail}</p>
                </article>
              </Spotlight>
            </Reveal>
          )
        })}
      </ol>
    </section>
  )
}

function Designs() {
  return (
    <section id="designs" className="scroll-mt-20 border-y border-line bg-canvas py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Les designs</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {FACTS.themes} designs, aucun air de famille
            </h2>
            <p className="mt-4 text-muted">
              Un thème ne change pas que les couleurs : il change la navigation, le hero, les
              cartes, les boutons, les images, les espacements et les animations. Survolez une
              vignette pour la voir de plus près, cliquez pour démarrer avec.
            </p>
          </div>
        </Reveal>

        <div className="mt-12">
          <ThemeGallery />
        </div>
      </div>
    </section>
  )
}

/** Comparaison frontale avec un site monte a la va-vite. */
function Difference() {
  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">La différence</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Ni gabarit générique, ni devis à l'aveugle
          </h2>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="h-full rounded-2xl border border-line bg-canvas p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Ailleurs</p>
            <ul className="mt-5 space-y-4">
              {DIFFERENCES.map((item) => (
                <li key={item.basic} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <X size={17} className="mt-0.5 shrink-0 text-subtle" />
                  {item.basic}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal direction="left" delay={110}>
          <div className="ring-gradient h-full rounded-2xl bg-surface p-6 shadow-card sm:p-8">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
              <Sparkles size={13} /> Avec Studio
            </p>
            <ul className="mt-5 space-y-4">
              {DIFFERENCES.map((item) => (
                <li key={item.studio} className="flex gap-3 text-sm font-medium leading-relaxed text-ink">
                  <Check size={17} className="mt-0.5 shrink-0 text-brand" />
                  {item.studio}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Metiers() {
  return (
    <section id="metiers" className="scroll-mt-20 border-y border-line bg-canvas py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Votre métier</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Un menuisier n'a pas les mêmes besoins qu'un restaurant
            </h2>
            <p className="mt-4 text-muted">
              Les pages, les modules et les images proposées changent avec votre activité.
              Cherchez la vôtre : vous entrez directement dans le parcours.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10">
            <MetierFinder />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5 text-amber-400" aria-label={`${count} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < count ? 'currentColor' : 'none'} strokeWidth={i < count ? 0 : 1.5} />
      ))}
    </span>
  )
}

function Testimonials() {
  return (
    <section id="avis" className="container-page scroll-mt-20 py-20 sm:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Les retours</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Ce que change le fait de voir avant de choisir
          </h2>
        </div>
      </Reveal>

      {/* Rail horizontal : on garde le geste de defilement plutot qu'un carrousel
          automatique, plus penible a lire qu'a regarder. */}
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {TESTIMONIALS.map((item, i) => (
          <Reveal key={item.quote} delay={i * 80} className="min-w-[300px] max-w-sm flex-1 snap-start">
            <figure className="hover-lift flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
              <Quote size={22} className="text-brand/30" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">« {item.quote} »</blockquote>
              <figcaption className="mt-5 border-t border-line pt-4">
                <Stars count={item.rating} />
                <p className="mt-2 text-sm font-semibold text-ink">{item.author}</p>
                <p className="text-xs text-subtle">{item.role}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Questions() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="questions" className="scroll-mt-20 border-y border-line bg-canvas py-20 sm:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Questions</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Ce qu'on nous demande le plus souvent
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Une question qui n'est pas là ? Décrivez votre projet, nous répondons dans la
              conversation.
            </p>
          </div>
        </Reveal>

        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const expanded = open === i
            return (
              <Reveal key={item.question} delay={i * 60}>
                <div className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${expanded ? 'border-brand/40' : 'border-line'}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : i)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className={`text-sm font-semibold ${expanded ? 'text-ink' : 'text-muted'}`}>{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-subtle transition-transform duration-300 ${expanded ? 'rotate-180 text-brand' : ''}`}
                    />
                  </button>
                  {/* La hauteur est animee par une grille : pas de mesure JS, pas de saut. */}
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCta({ onChat }: { onChat: () => void }) {
  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal zoom>
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: 'radial-gradient(55% 80% at 50% 0%, rgba(79,70,229,.65), transparent 70%)' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl animate-float-slow"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Votre site commence maintenant
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/70">
              Construisez librement votre maquette, testez-la comme un visiteur, montrez-la autour
              de vous. Vous ne décidez de la suite qu'une fois le résultat sous les yeux.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic>
                <Link to="/creer/activite" className="btn bg-white text-ink hover:bg-white/90">
                  Créer mon site gratuitement <ArrowRight size={17} />
                </Link>
              </Magnetic>
              <button
                type="button"
                onClick={onChat}
                className="btn border border-white/25 text-white transition hover:bg-white/10"
              >
                <MessageSquare size={16} /> Décrire mon projet
              </button>
            </div>
            <p className="mt-6 text-xs text-white/45">
              Aucun compte, aucune carte bancaire. Votre projet est enregistré automatiquement.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/** Barre d'action collante, sur mobile uniquement : le CTA reste a portee de pouce. */
function MobileCta({ hasDraft, hidden }: { hasDraft: boolean; hidden: boolean }) {
  const scrolled = useScrolledPast(600)
  return (
    <div
      className={[
        'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden',
        scrolled && !hidden ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <Link to="/creer/activite" className="btn-primary w-full">
        {hasDraft ? 'Reprendre mon site' : 'Créer mon site gratuitement'} <ArrowRight size={16} />
      </Link>
    </div>
  )
}

const FOOTER_LINKS = [
  {
    title: 'Créer',
    links: [
      { label: 'Choisir mon métier', to: '/creer/activite' },
      { label: 'Remplir mes informations', to: '/creer/express' },
      { label: 'Voir les designs', to: '/creer/theme' },
      { label: 'Reprendre mon projet', to: '/creer/site' },
    ],
  },
  {
    title: 'Comprendre',
    links: [
      { label: 'La méthode', to: '/#methode' },
      { label: 'Les métiers couverts', to: '/#metiers' },
      { label: 'Questions fréquentes', to: '/#questions' },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <span className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
              <Blocks size={17} />
            </span>
            Studio
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            La maquette d'abord, la décision ensuite. Studio permet à un professionnel de
            construire lui-même le site qu'il veut, puis de le confier à réaliser.
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs text-subtle">
            <MonitorSmartphone size={14} /> Ordinateur, tablette, mobile et écran TV
          </p>
        </div>

        {FOOTER_LINKS.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted transition hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-subtle sm:flex-row">
          <span>© {new Date().getFullYear()} Studio — Création de sites professionnels</span>
          <span>Création libre et gratuite. Aucun engagement.</span>
        </div>
      </div>
    </footer>
  )
}
