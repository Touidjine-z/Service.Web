import type { ObjectiveId, Project } from './types'
import { ALL_ACTIVITIES, getActivity } from './activities'
import { THEMES } from './themes'
import { generatePalette } from './color'

/**
 * Assistant de creation (§39).
 *
 * IMPORTANT : il n'y a pas de modele de langage derriere. L'analyse est locale
 * — mots-cles du metier, ville, savoir-faire — et les textes sont composes a
 * partir de gabarits. C'est volontaire : la plateforme fonctionne hors ligne et
 * sans cle d'API.
 *
 * `AssistantProvider` est la couture prevue pour brancher un vrai modele : il
 * suffira d'en fournir une implementation distante, l'appelant ne changera pas.
 */
export interface Analysis {
  activityId: string | null
  activityLabel: string
  city: string
  businessName: string
  specialties: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface AssistantProvider {
  analyze(sentence: string): Promise<Analysis>
  slogan(analysis: Analysis): Promise<string>
  about(analysis: Analysis): Promise<string>
  description(name: string, analysis: Analysis): Promise<string>
  faq(analysis: Analysis): Promise<{ question: string; answer: string }[]>
  improve(text: string): Promise<string>
}

// --- analyse locale ---------------------------------------------------------

const STOP_WORDS = new Set([
  'je', 'suis', 'un', 'une', 'le', 'la', 'les', 'des', 'de', 'du', 'et', 'a', 'à',
  'mon', 'ma', 'mes', 'nous', 'sommes', 'sur', 'en', 'pour', 'avec', 'dans', 'qui',
  'que', 'fais', 'fait', 'faisons', 'propose', 'proposons', 'vends', 'vendons',
])

/** Mots-cles supplementaires par metier, en plus de son libelle. */
const HINTS: Record<string, string[]> = {
  restaurant: ['restaurant', 'cuisine', 'chef', 'brasserie', 'bistrot', 'plats', 'grill', 'trattoria', 'crêperie', 'creperie'],
  snack: ['snack', 'fast', 'burger', 'kebab', 'sandwich', 'tacos', 'pizza', 'pizzeria', 'friterie', 'emporter'],
  cafe: ['café', 'cafe', 'salon', 'thé', 'the', 'torréfaction'],
  boulangerie: ['boulangerie', 'boulanger', 'pâtisserie', 'patisserie', 'pain', 'viennoiserie'],
  traiteur: ['traiteur', 'buffet', 'réception', 'reception', 'événement'],
  'food-truck': ['food', 'truck', 'camion'],
  epicerie: ['épicerie', 'epicerie', 'primeur', 'alimentation'],
  boutique: ['boutique', 'prêt-à-porter', 'vêtements', 'vetements', 'mode'],
  fleuriste: ['fleuriste', 'fleurs', 'bouquets', 'floral'],
  opticien: ['opticien', 'lunettes', 'optique', 'vue'],
  menuisier: ['menuisier', 'menuiserie', 'bois', 'meubles', 'ébéniste', 'ebeniste', 'parquet', 'agencement'],
  plombier: ['plombier', 'plomberie', 'chauffage', 'sanitaire', 'fuite'],
  electricien: ['électricien', 'electricien', 'électricité', 'electricite', 'tableau'],
  peintre: ['peintre', 'peinture', 'décoration', 'ravalement', 'enduit'],
  macon: ['maçon', 'macon', 'maçonnerie', 'gros œuvre', 'dalle'],
  serrurier: ['serrurier', 'serrurerie', 'serrure', 'porte', 'dépannage'],
  medecin: ['médecin', 'medecin', 'docteur', 'généraliste', 'cabinet médical'],
  dentiste: ['dentiste', 'dentaire', 'orthodontie'],
  kine: ['kiné', 'kine', 'kinésithérapeute', 'ostéopathe', 'osteopathe', 'rééducation'],
  psychologue: ['psychologue', 'psychothérapie', 'thérapie', 'therapie'],
  avocat: ['avocat', 'juridique', 'droit', 'barreau'],
  comptable: ['comptable', 'comptabilité', 'expert-comptable', 'fiscalité'],
  consultant: ['consultant', 'conseil', 'stratégie', 'accompagnement'],
  coach: ['coach', 'formateur', 'formation', 'coaching'],
  agence: ['agence', 'freelance', 'studio', 'communication', 'web'],
  photographe: ['photographe', 'photo', 'reportage', 'mariage'],
  garage: ['garage', 'mécanique', 'mecanique', 'automobile', 'carrosserie', 'voiture'],
  immobilier: ['immobilier', 'agent immobilier', 'biens', 'location', 'vente'],
  coiffeur: ['coiffeur', 'coiffure', 'institut', 'beauté', 'esthétique', 'barbier'],
  architecte: ['architecte', 'architecture', 'plans', 'maîtrise d\'œuvre'],
  association: ['association', 'bénévole', 'adhérents', 'club'],
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** « a Blois », « à Saint-Malo », « sur Lyon » → la ville. */
function extractCity(sentence: string): string {
  // (?:^|\s) plutot que \b : \b ne cree pas de frontiere devant « à », qui n'est
  // pas un caractere de mot au sens ASCII — la ville n'etait alors jamais trouvee.
  const match = sentence.match(/(?:^|\s)(?:à|a|sur|vers|près de|pres de|dans)\s+([A-ZÀ-Ü][\wÀ-ÿ'’-]*(?:[- ][A-ZÀ-Ü][\wÀ-ÿ'’-]*)*)/)
  return match ? match[1].trim() : ''
}

/** « Chez Marco », « la boulangerie Dupont » → le nom commercial eventuel. */
function extractName(sentence: string): string {
  const match = sentence.match(/\b(?:s'appelle|nommée?|nommé|enseigne|société|entreprise)\s+«?\s*([A-ZÀ-Ü][\wÀ-ÿ'’&-]*(?:\s+[A-ZÀ-Ü][\wÀ-ÿ'’&-]*){0,3})/)
  return match ? match[1].trim() : ''
}

export function analyzeLocally(sentence: string): Analysis {
  const normalized = normalize(sentence)
  let best: { id: string; score: number } | null = null

  for (const activity of ALL_ACTIVITIES) {
    // Trois sources : le libelle, les mots-cles declares par le metier
    // (Activity.keywords) et les indices historiques ci-dessus.
    const words = [
      ...normalize(activity.label).split(/[^a-z0-9]+/),
      ...(activity.keywords ?? []).map(normalize),
      ...(HINTS[activity.id] ?? []).map(normalize),
    ]
    let score = 0
    for (const word of words) {
      if (word.length < 4 || STOP_WORDS.has(word)) continue
      if (normalized.includes(word)) score += word.length
    }
    if (score > 0 && (!best || score > best.score)) best = { id: activity.id, score }
  }

  const specialties = sentence
    .split(/[.,;]| et /)
    .map((part) => part.trim())
    .filter((part) => part.length > 12 && /(fabriqu|répar|pose|install|vend|propose|réalis|cuisin|conseil|accompagn)/i.test(part))
    .slice(0, 3)

  return {
    activityId: best?.id ?? null,
    activityLabel: best ? getActivity(best.id)?.label ?? '' : '',
    city: extractCity(sentence),
    businessName: extractName(sentence),
    specialties,
    confidence: !best ? 'low' : best.score >= 16 ? 'high' : 'medium',
  }
}

// --- generation de textes ---------------------------------------------------

export function makeSlogan(analysis: Analysis): string {
  const metier = analysis.activityLabel.toLowerCase() || 'professionnel'
  if (analysis.city) return `Votre ${metier} à ${analysis.city}, depuis toujours à votre écoute.`
  return `Un ${metier} qui prend le temps de bien faire.`
}

export function makeAbout(analysis: Analysis, businessName: string): string {
  const where = analysis.city ? ` à ${analysis.city} et dans les environs` : ''
  const what = analysis.specialties.length
    ? ` Nous sommes reconnus pour ${analysis.specialties[0].toLowerCase()}.`
    : ''
  return `${businessName} accompagne ses clients${where} avec exigence et proximité.${what} Chaque projet est traité avec le même soin, du premier échange jusqu'à la livraison.`
}

export function makeDescription(name: string, analysis: Analysis): string {
  const metier = analysis.activityLabel.toLowerCase() || 'métier'
  return `${name} — une prestation de ${metier} réalisée avec soin, adaptée à votre besoin et à votre budget.`
}

export function makeFaq(analysis: Analysis): { question: string; answer: string }[] {
  const where = analysis.city || 'votre commune'
  return [
    { question: 'Quels sont vos délais ?', answer: 'Nous répondons sous 24 h et intervenons généralement sous une semaine.' },
    { question: `Intervenez-vous à ${where} ?`, answer: `Oui, nous couvrons ${where} et les communes alentour. Contactez-nous pour vérifier votre adresse.` },
    { question: 'Le devis est-il gratuit ?', answer: 'Oui, chaque devis est gratuit et sans engagement.' },
    { question: 'Comment se passe un premier rendez-vous ?', answer: 'Nous échangeons sur votre besoin, nous évaluons sur place si nécessaire, puis nous vous envoyons une proposition détaillée.' },
  ]
}

/** Retouche mecanique : ponctuation, majuscule, espaces. Pas de reecriture. */
export function improveText(text: string): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?=\S)/g, '$1 ')
    .trim()
  if (!cleaned) return cleaned
  const capitalized = cleaned[0].toUpperCase() + cleaned.slice(1)
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

/** Theme le plus coherent avec le metier detecte. */
export function suggestTheme(analysis: Analysis): Project['themeId'] {
  const byActivity: Record<string, Project['themeId']> = {
    restaurant: 'fresh', snack: 'bold', cafe: 'nature', boulangerie: 'vintage',
    traiteur: 'elegant', 'food-truck': 'urban', epicerie: 'nature', boutique: 'editorial',
    fleuriste: 'nature', opticien: 'clean', menuisier: 'nature', plombier: 'professional',
    electricien: 'professional', peintre: 'creative', macon: 'corporate', serrurier: 'professional',
    medecin: 'clean', dentiste: 'clean', kine: 'clean', psychologue: 'elegant',
    avocat: 'classic', comptable: 'corporate', consultant: 'agence', coach: 'dynamic',
    agence: 'dark', photographe: 'minimal', garage: 'atelier', immobilier: 'premium',
    carrosserie: 'bold', 'centre-auto': 'vitrine', pneus: 'bold',
    'pare-brise': 'clean', 'controle-technique': 'brief', depannage: 'urban',
    preparation: 'studio', moto: 'dark', 'vente-auto': 'premium',
    'formation-auto': 'civic',
    coiffeur: 'luxury', architecte: 'minimal', association: 'repere',
  }
  const id = analysis.activityId ? byActivity[analysis.activityId] : undefined
  return id && THEMES.some((t) => t.id === id) ? id : 'modern'
}

/** Objectifs deduits du metier detecte, sinon ceux suggeres par l'activite. */
export function suggestObjectives(analysis: Analysis): ObjectiveId[] {
  const activity = analysis.activityId ? getActivity(analysis.activityId) : null
  return activity ? [...activity.suggestedObjectives] : ['company', 'services', 'contact']
}

export function suggestColors(themeId: Project['themeId']) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  return generatePalette(theme.colors.primary, 'analogous', theme.dark)
}

/** Implementation locale du contrat ; une version distante pourra la remplacer. */
export const localAssistant: AssistantProvider = {
  async analyze(sentence) { return analyzeLocally(sentence) },
  async slogan(analysis) { return makeSlogan(analysis) },
  async about(analysis) { return makeAbout(analysis, 'Votre entreprise') },
  async description(name, analysis) { return makeDescription(name, analysis) },
  async faq(analysis) { return makeFaq(analysis) },
  async improve(text) { return improveText(text) },
}
