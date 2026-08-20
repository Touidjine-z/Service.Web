import type { Identity, Page, Project, Section } from './types'
import { CUSTOM_ACTIVITY, getActivity } from './activities'
import { applyActivity, applyTheme } from './project'
import {
  improveText, makeAbout, makeFaq, makeSlogan,
  suggestColors, suggestTheme, type Analysis,
} from './assistant'

/**
 * Creation express (§39, variante formulaire).
 *
 * Le client qui ne veut pas parcourir les cinq etapes remplit ici les seules
 * informations qu'il connait par coeur — nom de la boutique, adresse,
 * telephone — valide, et son site est pret. Tout le reste (objectifs, modules,
 * pages, design, textes) est deduit du metier par le moteur generique : ce
 * fichier n'ecrit aucune regle propre a une activite (§48).
 *
 * Les champs sont decrits en donnees, comme les sections dans
 * `renderer/sectionDefs.ts` : le formulaire est genere a partir de ce
 * catalogue, il n'y a pas un `<input>` ecrit a la main par information.
 */

export interface ExpressForm {
  /** Metier choisi dans le catalogue, ou 'custom'. */
  activityId: string
  /** Libelle libre quand le metier n'est pas au catalogue. */
  customActivity: string
  businessName: string
  tagline: string
  phone: string
  email: string
  address: string
  city: string
  serviceArea: string
  facebook: string
  instagram: string
}

/** Champs saisis librement — l'activite a son propre selecteur. */
export type ExpressTextKey = Exclude<keyof ExpressForm, 'activityId' | 'customActivity'>

export interface ExpressField {
  key: ExpressTextKey
  label: string
  placeholder: string
  type: 'text' | 'tel' | 'email'
  /** Valeur `autocomplete` : le navigateur peut remplir le formulaire seul. */
  autoComplete: string
  /** Sans cette information, le site ne peut pas etre monte. */
  required?: boolean
  /** Precision affichee sous le champ : ce que l'information va produire. */
  hint?: string
  /** Champ pleine largeur dans la grille a deux colonnes. */
  wide?: boolean
}

export interface ExpressGroup {
  id: string
  title: string
  description: string
  fields: ExpressField[]
}

export const EXPRESS_GROUPS: ExpressGroup[] = [
  {
    id: 'etablissement',
    title: 'Votre établissement',
    description: "Le nom s'affiche en haut du site, dans le pied de page et dans les résultats de recherche.",
    fields: [
      {
        key: 'businessName', label: 'Nom de la boutique', type: 'text', required: true,
        autoComplete: 'organization', placeholder: 'Ex. : Boulangerie Dupont',
      },
      {
        key: 'tagline', label: 'Slogan', type: 'text', wide: true,
        autoComplete: 'off', placeholder: 'Ex. : Le pain cuit au feu de bois, tous les matins',
        hint: 'Laissez vide : nous en écrivons un à partir de votre métier et de votre ville.',
      },
    ],
  },
  {
    id: 'coordonnees',
    title: 'Vos coordonnées',
    description: 'Reprises dans la page contact, le plan, les horaires et le pied de page.',
    fields: [
      { key: 'phone', label: 'Numéro de téléphone', type: 'tel', autoComplete: 'tel', placeholder: '01 23 45 67 89' },
      { key: 'email', label: 'Adresse email', type: 'email', autoComplete: 'email', placeholder: 'contact@monentreprise.fr' },
      { key: 'address', label: 'Adresse', type: 'text', wide: true, autoComplete: 'street-address', placeholder: '12 rue des Lilas' },
      { key: 'city', label: 'Ville', type: 'text', autoComplete: 'address-level2', placeholder: 'Blois' },
      {
        key: 'serviceArea', label: "Zone d'intervention", type: 'text',
        autoComplete: 'off', placeholder: '30 km autour de Blois',
        hint: 'Affichée sur la section « Nous trouver ».',
      },
    ],
  },
  {
    id: 'reseaux',
    title: 'Vos réseaux',
    description: 'Facultatif. Les réseaux renseignés apparaissent dans la section « Suivez-nous ».',
    fields: [
      { key: 'facebook', label: 'Facebook', type: 'text', autoComplete: 'off', placeholder: 'facebook.com/votrepage' },
      { key: 'instagram', label: 'Instagram', type: 'text', autoComplete: 'off', placeholder: '@votrecompte' },
    ],
  },
]

export const EXPRESS_FIELDS: ExpressField[] = EXPRESS_GROUPS.flatMap((group) => group.fields)

export const EMPTY_EXPRESS_FORM: ExpressForm = {
  activityId: '',
  customActivity: '',
  businessName: '',
  tagline: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  serviceArea: '',
  facebook: '',
  instagram: '',
}

export type ExpressErrors = Partial<Record<keyof ExpressForm, string>>

/**
 * Deux informations seulement bloquent la validation : le nom et le metier.
 * Le reste est verifie s'il est rempli, jamais exige — un artisan sans adresse
 * fixe doit pouvoir valider.
 */
export function validateExpress(form: ExpressForm): ExpressErrors {
  const errors: ExpressErrors = {}

  if (form.businessName.trim().length < 2) {
    errors.businessName = 'Indiquez le nom de votre établissement.'
  }
  if (!form.activityId) {
    errors.activityId = 'Choisissez votre activité.'
  } else if (form.activityId === 'custom' && form.customActivity.trim().length < 2) {
    errors.customActivity = 'Décrivez votre activité en quelques mots.'
  }
  const email = form.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Cette adresse email semble incomplète.'
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 6) {
    errors.phone = 'Ce numéro semble trop court.'
  }

  return errors
}

export function isExpressValid(form: ExpressForm): boolean {
  return Object.keys(validateExpress(form)).length === 0
}

/** Nombre d'informations facultatives renseignees : sert a la jauge du recapitulatif. */
export function expressFilled(form: ExpressForm): number {
  return EXPRESS_FIELDS.filter((field) => form[field.key].trim() !== '').length
}

/**
 * Traduit le formulaire dans le format attendu par les generateurs de texte.
 *
 * Le libelle est ramene a son premier terme : « Boulangerie / Patisserie »
 * donne « Votre boulangerie a Blois », qui se lit, la ou le libelle entier
 * produisait une phrase avec une barre oblique au milieu.
 */
export function expressAnalysis(form: ExpressForm): Analysis {
  const activity = getActivity(form.activityId)
  const isCustom = !activity || activity.id === 'custom'
  return {
    activityId: isCustom ? null : activity.id,
    activityLabel: isCustom
      ? form.customActivity.trim() || CUSTOM_ACTIVITY.label
      : activity.label.split('/')[0].trim(),
    city: form.city.trim(),
    businessName: form.businessName.trim(),
    specialties: [],
    confidence: 'high',
  }
}

/** Reglages d'une section, en conservant ceux deja poses. */
function withProps(section: Section, props: Record<string, unknown>): Section {
  return { ...section, props: { ...section.props, ...props } }
}

/**
 * Monte le projet complet a partir du formulaire.
 *
 * Fonction pure : elle part du projet en cours (elle en garde l'identifiant,
 * donc la sauvegarde automatique continue d'ecrire la meme fiche) et rend le
 * projet pret a etre visite.
 *
 * Ce qui n'est PAS ecrit ici est volontaire : le titre du hero, les titres de
 * sections et les coordonnees du pied de page se deduisent deja de l'identite
 * (`renderer/sectionDefs.ts`). Les figer maintenant empecherait le site de
 * suivre le client s'il renomme sa boutique ensuite.
 */
export function buildExpressProject(base: Project, form: ExpressForm): Project {
  const analysis = expressAnalysis(form)
  const businessName = analysis.businessName || 'Votre entreprise'
  const city = analysis.city

  const withActivity = applyActivity(base, form.activityId || 'custom', form.customActivity.trim())
  const themeId = suggestTheme(analysis)
  const themed = applyTheme(withActivity, themeId, false)

  const social: Identity['social'] = { ...themed.identity.social }
  if (form.facebook.trim()) social.facebook = form.facebook.trim()
  if (form.instagram.trim()) social.instagram = form.instagram.trim()

  const identity: Identity = {
    ...themed.identity,
    businessName,
    tagline: form.tagline.trim() ? improveText(form.tagline) : makeSlogan(analysis),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    city,
    serviceArea: form.serviceArea.trim(),
    social,
  }

  const about = makeAbout(analysis, businessName)
  const faq = makeFaq(analysis)
  const where = city ? ` à ${city}` : ''

  const pages: Page[] = themed.pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      switch (section.kind) {
        case 'about':
          return withProps(section, { text: about })
        case 'faq':
          return withProps(section, { items: faq })
        case 'contact':
          return identity.phone
            ? withProps(section, {
                subtitle: `Appelez-nous au ${identity.phone} ou écrivez-nous : nous répondons sous 24 h.`,
              })
            : section
        case 'location':
          return identity.serviceArea
            ? withProps(section, { note: `Zone d'intervention : ${identity.serviceArea}.` })
            : section
        default:
          return section
      }
    }),
    seo: {
      title: page.isHome
        ? `${businessName} — ${analysis.activityLabel}${where}`
        : `${page.name} — ${businessName}`,
      description: page.isHome
        ? identity.tagline
        : `${page.name} de ${businessName}${where}.`,
    },
  }))

  return {
    ...themed,
    colors: { ...themed.colors, ...suggestColors(themeId) },
    identity,
    pages,
    // Le contenu est en place : la prochaine chose a faire est de regarder
    // le site, pas de le remplir.
    step: 'preview',
    updatedAt: new Date().toISOString(),
  }
}
