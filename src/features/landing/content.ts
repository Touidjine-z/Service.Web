import { ALL_ACTIVITIES } from '@/engine/activities'
import { MODULES } from '@/engine/modules'
import { THEMES } from '@/engine/themes'
import { SECTION_LIST } from '@/renderer/sectionDefs'

/**
 * Textes de la vitrine (§4).
 *
 * Deux regles :
 *  1. AUCUN montant, aucune fourchette, aucun « a partir de » — la page vitrine
 *     est le premier endroit ou l'invariant §56 s'applique.
 *  2. Les chiffres mis en avant sont calcules a partir du code, pas saisis a la
 *     main : ils restent vrais quand le catalogue evolue.
 */

export const FACTS = {
  themes: THEMES.length,
  activities: ALL_ACTIVITIES.length,
  sections: SECTION_LIST.length,
  modules: MODULES.length,
}

export interface Testimonial {
  quote: string
  author: string
  role: string
  rating: number
}

/**
 * AVIS DE DEMONSTRATION — a remplacer par de vrais temoignages avant la mise en
 * ligne. Ils decrivent l'experience de creation, jamais un resultat commercial
 * chiffre, pour ne pas promettre ce qui n'a pas ete mesure.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "J'ai vu mon site avant d'en parler à qui que ce soit. C'est exactement ce qui m'a décidé : je savais déjà à quoi il ressemblerait.",
    author: 'Témoignage à remplacer', role: 'Menuisier', rating: 5,
  },
  {
    quote: "Je ne suis pas à l'aise avec l'informatique. J'ai choisi mon métier, une couleur, et la maquette était là. J'ai juste changé les photos.",
    author: 'Témoignage à remplacer', role: 'Fleuriste', rating: 5,
  },
  {
    quote: 'La carte, les catégories, le QR code pour les tables : tout était prévu pour un restaurant. Je n\'ai rien eu à expliquer.',
    author: 'Témoignage à remplacer', role: 'Restaurateur', rating: 5,
  },
  {
    quote: "Le fait de pouvoir tester le site comme un visiteur, sur mon téléphone, avant de m'engager : ça change tout.",
    author: 'Témoignage à remplacer', role: 'Kinésithérapeute', rating: 5,
  },
]

export interface Step {
  title: string
  text: string
  detail: string
}

/** La methode, facon page d'agence : chaque etape dit ce que vous obtenez. */
export const STEPS: Step[] = [
  {
    title: 'Votre métier',
    text: `Choisissez parmi ${ALL_ACTIVITIES.length} activités, ou décrivez la vôtre en une phrase.`,
    detail: 'Votre métier détermine les pages, les modules et les images proposées.',
  },
  {
    title: 'Vos objectifs',
    text: 'Être trouvé, montrer vos réalisations, recevoir des devis, vendre en ligne…',
    detail: 'Chaque objectif active les fonctionnalités qui vont avec. Rien de superflu.',
  },
  {
    title: 'Votre design',
    text: `${THEMES.length} designs professionnels, puis vos couleurs, votre logo et vos polices.`,
    detail: "Un thème change la mise en page, les cartes, les boutons et les animations — pas juste la teinte.",
  },
  {
    title: 'Votre contenu',
    text: 'Produits, services, réalisations, horaires, photos : tout se remplit dans le navigateur.',
    detail: "Un assistant propose slogan, présentation et FAQ à partir de ce que vous décrivez.",
  },
  {
    title: 'Votre test',
    text: 'Naviguez dans votre site comme un vrai visiteur, sur ordinateur, tablette, mobile et TV.',
    detail: "Le mode visiteur teste le panier, les formulaires et le QR code, pour de vrai.",
  },
]

export interface FaqItem {
  question: string
  answer: string
}

/**
 * FAQ de la vitrine. La question du prix est traitee sans jamais donner de
 * montant : c'est exactement la promesse du parcours (§56).
 */
export const FAQ: FaqItem[] = [
  {
    question: 'La création est-elle vraiment gratuite ?',
    answer: "Oui. Vous construisez votre site entier, vous le testez, vous le montrez autour de vous, sans rien payer et sans créer de compte. Vous ne décidez de la suite qu'une fois le résultat sous les yeux.",
  },
  {
    // Le vocabulaire tarifaire de la plateforme (« prix de réalisation »,
    // « acompte ») reste réservé à la page finale : ici on répond à la question
    // sans employer les mots qui annoncent un montant (§56).
    question: 'Combien cela coûtera-t-il, au bout du compte ?',
    answer: "Il dépend de ce que vous aurez construit : nombre de pages, fonctionnalités, taille de votre catalogue. Il s'affiche à la fin du parcours, sur votre demande, quand votre maquette existe. Aucune grille ne vous est présentée avant : elle ne voudrait rien dire.",
  },
  {
    question: 'Faut-il savoir coder ?',
    answer: "Non, et il n'y a rien à installer. Tout se passe dans votre navigateur : vous cliquez sur une section, vous changez le texte, vous voyez le résultat immédiatement.",
  },
  {
    question: 'Mon travail est-il conservé si je ferme la page ?',
    answer: "Oui. Votre projet est enregistré automatiquement à chaque modification, et vous le retrouvez en revenant. Pour le sécuriser durablement, laissez votre email au moment de la sauvegarde.",
  },
  {
    question: 'Mon site sera-t-il correct sur mobile ?',
    answer: "Chaque design est conçu pour s'adapter. Vous pouvez basculer l'aperçu en tablette, en mobile et même en écran TV pendant la création, pour vérifier vous-même.",
  },
  {
    question: 'Puis-je changer de design après coup ?',
    answer: `Autant de fois que vous voulez. Vos textes, vos photos et votre catalogue sont indépendants du design : passer d'un thème à l'autre ne vous fait rien perdre, et vos couleurs sont conservées si vous le souhaitez.`,
  },
  {
    question: 'Que se passe-t-il une fois ma maquette prête ?',
    answer: "Vous laissez vos coordonnées, le montant s'affiche, et vous décidez. Si vous lancez le projet, un premier versement réserve la production et nous reprenons votre maquette exactement telle que vous l'avez construite.",
  },
]

/** Ce que la plateforme fait mieux qu'un site monte a la va-vite. */
export const DIFFERENCES: { basic: string; studio: string }[] = [
  { basic: 'Un thème générique, reconnaissable au premier coup d\'œil', studio: `${THEMES.length} designs distincts : mise en page, typographie, cartes, boutons et animations` },
  { basic: 'Des rubriques vides à remplir soi-même', studio: 'Des pages déjà structurées pour votre métier, avec du contenu d\'exemple crédible' },
  { basic: 'Un devis avant même de savoir ce que vous voulez', studio: 'Votre maquette d\'abord, la décision ensuite' },
  { basic: 'Des allers-retours par mail pour la moindre correction', studio: 'Vous modifiez vous-même et vous voyez le résultat instantanément' },
]

/** Arguments courts affiches sous le hero. */
export const PROOF_POINTS = [
  { label: 'Sans engagement', detail: 'Aucun compte, aucune carte bancaire pour créer' },
  { label: 'Enregistrement automatique', detail: 'Votre projet vous attend à votre retour' },
  { label: 'Testable en vrai', detail: 'Mode visiteur, panier, formulaires, QR code' },
  { label: 'Adapté à votre métier', detail: `${ALL_ACTIVITIES.length} activités, ${MODULES.length} fonctionnalités` },
]
