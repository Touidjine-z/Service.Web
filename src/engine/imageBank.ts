/**
 * Banque d'images (§18). Les visuels sont generes localement : ils donnent une
 * maquette credible sans dependre d'un service externe ni de droits d'auteur.
 * La forme des donnees (categorie, titre, mots-cles, url) est celle d'un vrai
 * catalogue : brancher plus tard une banque reelle ou une generation par IA ne
 * demandera que de remplacer `seedBank`.
 */

export type BankCategoryId =
  | 'food' | 'business' | 'construction' | 'wood' | 'health'
  | 'beauty' | 'automotive' | 'real-estate' | 'technology' | 'lifestyle'

export interface BankCategory {
  id: BankCategoryId
  label: string
  /** Palette dominante de la categorie, utilisee pour composer les visuels. */
  palette: [string, string, string]
  subjects: string[]
}

export interface BankImage {
  id: string
  category: BankCategoryId
  title: string
  tags: string[]
  url: string
}

export const BANK_CATEGORIES: BankCategory[] = [
  { id: 'food', label: 'Restauration', palette: ['#B4522A', '#E8A33D', '#3E2A1F'], subjects: ['Assiette dressée', 'Salle de restaurant', 'Cuisine ouverte', 'Comptoir', 'Pâtisserie', 'Terrasse'] },
  { id: 'business', label: 'Entreprise', palette: ['#1E3A5F', '#4A7CB5', '#0F1B2A'], subjects: ['Bureau', 'Réunion', 'Poignée de main', 'Espace de travail', 'Accueil', 'Ville'] },
  { id: 'construction', label: 'Bâtiment', palette: ['#6B5B4A', '#D9A441', '#2E2A26'], subjects: ['Chantier', 'Outils', 'Charpente', 'Maçonnerie', 'Plan', 'Rénovation'] },
  { id: 'wood', label: 'Bois', palette: ['#8A5A34', '#C89B6A', '#3A2618'], subjects: ['Atelier', 'Plan de travail', 'Copeaux', 'Parquet', 'Meuble sur mesure', 'Établi'] },
  { id: 'health', label: 'Santé', palette: ['#1F7A6C', '#7FD1C1', '#0E2E2A'], subjects: ['Cabinet', 'Consultation', 'Matériel', 'Salle d\'attente', 'Soin', 'Bien-être'] },
  { id: 'beauty', label: 'Beauté', palette: ['#7C3F58', '#D9A5B5', '#2B1A22'], subjects: ['Salon', 'Coiffure', 'Soin du visage', 'Manucure', 'Produits', 'Fauteuil'] },
  { id: 'automotive', label: 'Automobile', palette: ['#2B2F36', '#C8102E', '#6B7280'], subjects: ['Garage', 'Moteur', 'Carrosserie', 'Pneus', 'Diagnostic', 'Véhicule'] },
  { id: 'real-estate', label: 'Immobilier', palette: ['#33415C', '#A8B8D8', '#1A2233'], subjects: ['Façade', 'Séjour', 'Cuisine', 'Jardin', 'Clés', 'Immeuble'] },
  { id: 'technology', label: 'Technologie', palette: ['#1B2A4A', '#22D3EE', '#0B0F17'], subjects: ['Écrans', 'Réseau', 'Data', 'Développement', 'Support', 'Innovation'] },
  { id: 'lifestyle', label: 'Lifestyle', palette: ['#3F6B4A', '#C7D9B7', '#1E2B21'], subjects: ['Nature', 'Sport', 'Voyage', 'Détente', 'Famille', 'Quotidien'] },
]

export const CATEGORY_BY_ID = new Map(BANK_CATEGORIES.map((c) => [c.id, c]))

/** Composition abstraite deterministe : meme seed, meme visuel. */
function composeSvg(palette: [string, string, string], seed: number): string {
  const [a, b, c] = palette
  const variant = seed % 6
  const angle = 20 + ((seed * 37) % 120)
  const shapes = [
    `<circle cx="${180 + (seed * 53) % 240}" cy="${140 + (seed * 29) % 120}" r="${90 + (seed * 17) % 70}" fill="${c}" opacity=".35"/>`,
    `<rect x="${(seed * 41) % 200}" y="${120 + (seed * 13) % 100}" width="${220 + (seed * 19) % 160}" height="${140 + (seed * 7) % 90}" rx="18" fill="${c}" opacity=".3"/>`,
    `<path d="M0 ${260 + (seed % 60)} Q 200 ${140 + (seed % 90)} 400 ${240 + (seed % 70)} T 800 ${220}" stroke="${c}" stroke-width="46" fill="none" opacity=".35"/>`,
    `<polygon points="${100 + seed % 120},80 ${420 + seed % 100},${120 + seed % 60} ${260},${330}" fill="${c}" opacity=".32"/>`,
    `<circle cx="${120 + (seed * 31) % 160}" cy="${230}" r="${70 + seed % 40}" fill="${b}" opacity=".45"/><circle cx="${340 + (seed * 11) % 140}" cy="${150}" r="${50 + seed % 60}" fill="${c}" opacity=".4"/>`,
    `<rect x="0" y="${200 + (seed % 80)}" width="600" height="200" fill="${c}" opacity=".4"/>`,
  ]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
<defs><linearGradient id="g${seed}" gradientTransform="rotate(${angle})"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="600" height="400" fill="url(#g${seed})"/>${shapes[variant]}</svg>`
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, ''))}`
}

function seedBank(): BankImage[] {
  const out: BankImage[] = []
  BANK_CATEGORIES.forEach((category, ci) => {
    category.subjects.forEach((subject, si) => {
      const seed = ci * 13 + si * 7 + 3
      out.push({
        id: `${category.id}-${si}`,
        category: category.id,
        title: subject,
        tags: [category.label.toLowerCase(), ...subject.toLowerCase().split(/[\s']+/)],
        url: toDataUri(composeSvg(category.palette, seed)),
      })
    })
  })
  return out
}

export const BANK_IMAGES: BankImage[] = seedBank()

export function searchBank(query: string, category: BankCategoryId | 'all'): BankImage[] {
  const q = query.trim().toLowerCase()
  return BANK_IMAGES.filter((image) => {
    if (category !== 'all' && image.category !== category) return false
    if (!q) return true
    return image.title.toLowerCase().includes(q) || image.tags.some((t) => t.includes(q))
  })
}

/** Categorie de la banque la plus proche du metier choisi (cf. Activity.imageCategory). */
export function categoryForActivity(imageCategory: string): BankCategoryId | 'all' {
  const found = BANK_CATEGORIES.find((c) => c.id === imageCategory)
  return found ? found.id : 'all'
}
