import { createContext } from 'react'
import type { Block, BlockType, GridArea, Section, Viewport } from '@/engine/types'
import { VIEWPORT_WIDTH, type SiteTokens } from './tokens'

/**
 * Le moteur de la GRILLE FLUIDE (§14).
 *
 * Principe, repris des editeurs visuels du marche : une section n'empile plus
 * ses blocs, elle les pose sur une grille de 24 colonnes (8 en mobile). Le
 * client attrape un bloc, le deplace, l'etire ; la position est enregistree en
 * cellules, jamais en pixels, ce qui la rend independante du theme, de la
 * largeur du conteneur et de l'appareil.
 *
 * Ce fichier ne contient QUE de la geometrie pure et le contrat d'edition :
 * aucun JSX, aucun acces au store. Le rendu est dans `BlockGrid.tsx`, le
 * branchement sur le projet dans le builder. C'est ce qui permet d'ecrire la
 * meme grille pour l'edition, l'apercu et le mode visiteur (§22, §48).
 */

export type Breakpoint = 'desktop' | 'mobile'

/** Colonnes de la grille, par point de rupture. */
export const GRID_COLUMNS: Record<Breakpoint, number> = { desktop: 24, mobile: 8 }

/** Hauteur minimale d'une section fluide, en lignes : sans elle, une section
 *  videe de ses blocs deviendrait une bande invisible impossible a viser. */
export const MIN_ROWS = 4

/** Cle de rangement de la hauteur, dans les props de la section. */
export const ROWS_KEY: Record<Breakpoint, string> = {
  desktop: 'fluidRows',
  mobile: 'fluidRowsMobile',
}

/**
 * Tablette et TV lisent la disposition large : deux points de rupture suffisent
 * a couvrir les quatre apercus, et le client n'a que deux mises en page a tenir.
 */
export function breakpointOf(viewport: Viewport): Breakpoint {
  return viewport === 'mobile' ? 'mobile' : 'desktop'
}

// ---------------------------------------------------------------------------
// Familles de blocs : le vocabulaire commun a l'empilement et a la deduction
// ---------------------------------------------------------------------------

export type BlockFamily = 'inline' | 'grid' | 'stack'

/**
 * Comportement naturel d'un bloc quand personne ne l'a place a la main : les
 * pastilles et les boutons vont en ligne, les chiffres et les arguments en
 * colonnes, le reste pleine largeur. `BlockStack` s'en sert pour composer, et
 * la grille s'en sert pour deduire une premiere position (voir `flowAreas`).
 */
export const BLOCK_FAMILY: Record<BlockType, BlockFamily> = {
  badge: 'inline', button: 'inline',
  stat: 'grid', feature: 'grid',
  heading: 'stack', text: 'stack', bullets: 'stack', image: 'stack', quote: 'stack', spacer: 'stack',
}

/**
 * Encombrement naturel d'un bloc, en cellules de la grille large. Les hauteurs
 * sont volontairement PRUDENTES : une ligne de la grille s'etire quand son
 * contenu deborde (`minmax(rowHeight, auto)`), alors qu'une hauteur trop
 * genereuse laisserait un blanc que personne n'a demande.
 */
const NATURAL: Record<BlockType, GridArea> = {
  heading: { x: 0, y: 0, w: 24, h: 1 },
  text:    { x: 0, y: 0, w: 24, h: 2 },
  bullets: { x: 0, y: 0, w: 24, h: 2 },
  quote:   { x: 0, y: 0, w: 24, h: 2 },
  image:   { x: 0, y: 0, w: 12, h: 9 },
  spacer:  { x: 0, y: 0, w: 24, h: 1 },
  stat:    { x: 0, y: 0, w: 6,  h: 2 },
  feature: { x: 0, y: 0, w: 8,  h: 2 },
  badge:   { x: 0, y: 0, w: 5,  h: 1 },
  button:  { x: 0, y: 0, w: 6,  h: 1 },
}

/** Blocs d'une meme famille qui se suivent : une rangee de la mise en page. */
export function groupRuns(blocks: Block[]): { family: BlockFamily; items: Block[] }[] {
  const runs: { family: BlockFamily; items: Block[] }[] = []
  for (const block of blocks) {
    const family = BLOCK_FAMILY[block.type]
    const last = runs[runs.length - 1]
    if (last && last.family === family && family !== 'stack') last.items.push(block)
    else runs.push({ family, items: [block] })
  }
  return runs
}

// ---------------------------------------------------------------------------
// Geometrie
// ---------------------------------------------------------------------------

/** Ramene une aire dans la grille : jamais hors cadre, jamais plus petite qu'une cellule. */
export function clampArea(area: GridArea, columns: number): GridArea {
  const w = Math.max(1, Math.min(columns, Math.round(area.w)))
  const h = Math.max(1, Math.round(area.h))
  const x = Math.max(0, Math.min(columns - w, Math.round(area.x)))
  const y = Math.max(0, Math.round(area.y))
  return { x, y, w, h }
}

/** Derniere ligne occupee : la hauteur minimale que la section doit reserver. */
export function contentRows(areas: GridArea[]): number {
  return areas.reduce((max, a) => Math.max(max, a.y + a.h), 0)
}

/** Empilement pleine largeur a partir d'une ligne donnee. */
function stackAreas(blocks: Block[], columns: number, from: number, out: Map<string, GridArea>): number {
  let y = from
  for (const block of blocks) {
    const h = NATURAL[block.type].h
    out.set(block.id, { x: 0, y, w: columns, h })
    y += h
  }
  return y
}

/**
 * Deduction de la premiere mise en page : elle REPRODUIT l'empilement classique
 * (§14), rangee par rangee. C'est ce qui fait qu'une section existante passe a
 * la grille sans que le client voie son site bouger — il ne le decouvre qu'au
 * moment ou il attrape un bloc.
 */
function flowAreas(blocks: Block[], columns: number, out: Map<string, GridArea>): void {
  let y = 0
  for (const run of groupRuns(blocks)) {
    if (run.family === 'stack') {
      y = stackAreas(run.items, columns, y, out)
      continue
    }

    // Une rangee en ligne (pastilles, boutons) tient sur une seule ligne ; une
    // rangee en colonnes (chiffres, arguments) se replie en plusieurs rangees.
    const perRow = run.family === 'inline'
      ? run.items.length
      : Math.min(run.items[0].type === 'stat' ? 4 : 3, run.items.length)
    const w = Math.max(1, Math.floor(columns / perRow))
    const h = Math.max(...run.items.map((b) => NATURAL[b.type].h))

    run.items.forEach((block, index) => {
      const column = index % perRow
      const row = Math.floor(index / perRow)
      out.set(block.id, { x: column * w, y: y + row * h, w, h })
    })
    y += Math.ceil(run.items.length / perRow) * h
  }
}

export interface PlacedBlock {
  block: Block
  area: GridArea
}

/**
 * Position effective de chaque bloc visible, par couches :
 *   position dessinee par le client -> position deduite.
 *
 * Deux regimes, et c'est ce qui rend la grille previsible :
 *  - tant que le client n'a rien deplace, tout est deduit et la section
 *    ressemble a l'empilement d'avant ;
 *  - des qu'il a place ne serait-ce qu'un bloc, les nouveaux venus tombent
 *    SOUS l'existant, pleine largeur, au lieu de s'inviter au milieu de sa
 *    composition.
 */
export function resolveAreas(blocks: Block[], breakpoint: Breakpoint): PlacedBlock[] {
  const columns = GRID_COLUMNS[breakpoint]
  const visible = blocks.filter((b) => !b.hidden)

  const drawn = new Map<string, GridArea>()
  for (const block of visible) {
    const area = block.layout?.[breakpoint]
    if (area) drawn.set(block.id, clampArea(area, columns))
  }

  const derived = new Map<string, GridArea>()
  const free = visible.filter((b) => !drawn.has(b.id))

  if (drawn.size === 0) {
    // Le mobile suit l'ordre de lecture de la grille large : c'est la seule
    // facon qu'un bloc deplace en haut a droite ne reparte pas en bas du
    // telephone.
    if (breakpoint === 'mobile') stackAreas(readingOrder(visible), columns, 0, derived)
    else flowAreas(visible, columns, derived)
  } else {
    stackAreas(free, columns, contentRows([...drawn.values()]), derived)
  }

  return visible.map((block) => ({
    block,
    area: drawn.get(block.id) ?? derived.get(block.id) ?? clampArea(NATURAL[block.type], columns),
  }))
}

/** Ordre de lecture de la grille large : de haut en bas, puis de gauche a droite. */
function readingOrder(blocks: Block[]): Block[] {
  const placed = resolveAreas(blocks, 'desktop')
  return [...placed]
    .sort((a, b) => (a.area.y - b.area.y) || (a.area.x - b.area.x))
    .map((p) => p.block)
}

/**
 * Hauteur de la section, en lignes. Le client peut reserver du blanc en tirant
 * le bord bas ; il ne peut jamais couper son propre contenu, d'ou le `max`.
 */
export function sectionRows(section: Section, breakpoint: Breakpoint, areas: GridArea[]): number {
  const raw = Number(section.props[ROWS_KEY[breakpoint]])
  const content = Math.max(contentRows(areas), MIN_ROWS)
  return Number.isFinite(raw) && raw > 0 ? Math.max(Math.round(raw), content) : content
}

/** Copie d'un bloc : decalee d'une ligne, pour ne pas se cacher sous l'original. */
export function shiftLayout(layout: Block['layout'], rows: number): Block['layout'] {
  if (!layout) return undefined
  const next: NonNullable<Block['layout']> = {}
  if (layout.desktop) next.desktop = { ...layout.desktop, y: layout.desktop.y + rows }
  if (layout.mobile) next.mobile = { ...layout.mobile, y: layout.mobile.y + rows }
  return next
}

// ---------------------------------------------------------------------------
// Mesures d'ecran
// ---------------------------------------------------------------------------

export interface GridMetrics {
  breakpoint: Breakpoint
  columns: number
  /** Gouttiere entre deux cellules, en pixels du site. */
  gap: number
  /** Hauteur d'une ligne, en pixels du site : la cellule est carree. */
  rowHeight: number
}

/**
 * Une cellule carree, deduite de la largeur reelle du conteneur : la grille a
 * donc la meme maille sur un mobile que sur une TV, et un bloc « demi-largeur »
 * le reste partout.
 */
export function gridMetrics(tokens: SiteTokens): GridMetrics {
  const breakpoint = breakpointOf(tokens.viewport)
  const columns = GRID_COLUMNS[breakpoint]
  const gap = tokens.scale(10)
  const padding = tokens.scale(tokens.viewport === 'mobile' ? 20 : 32) * 2
  const width = Math.min(VIEWPORT_WIDTH[tokens.viewport], tokens.containerWidth) - padding
  const rowHeight = Math.max(14, Math.round((width - (columns - 1) * gap) / columns))
  return { breakpoint, columns, gap, rowHeight }
}

/** Placement CSS d'une aire. La grille est en base 1, le modele en base 0. */
export function areaStyle(area: GridArea): { gridColumn: string; gridRow: string } {
  return {
    gridColumn: `${area.x + 1} / span ${area.w}`,
    gridRow: `${area.y + 1} / span ${area.h}`,
  }
}

// ---------------------------------------------------------------------------
// Interaction : deplacement et redimensionnement
// ---------------------------------------------------------------------------

/** `move`, ou l'un des huit points cardinaux d'une poignee de redimensionnement. */
export type DragMode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * Nouvelle aire apres un glissement de `dx`/`dy` CELLULES. Toute la souris est
 * deja convertie en cellules par l'appelant : cette fonction est pure, donc le
 * comportement des poignees se raisonne sans navigateur.
 */
export function applyDrag(origin: GridArea, mode: DragMode, dx: number, dy: number, columns: number): GridArea {
  if (mode === 'move') return clampArea({ ...origin, x: origin.x + dx, y: origin.y + dy }, columns)

  let { x, y, w, h } = origin
  if (mode.includes('e')) w = origin.w + dx
  if (mode.includes('s')) h = origin.h + dy
  if (mode.includes('w')) { x = origin.x + dx; w = origin.w - dx }
  if (mode.includes('n')) { y = origin.y + dy; h = origin.h - dy }

  // Un bord tire au-dela du cadre s'y arrete au lieu d'emporter le bloc entier.
  if (x < 0) { w += x; x = 0 }
  if (y < 0) { h += y; y = 0 }
  // Une poignee ne traverse jamais son bloc : elle s'arrete a une cellule.
  if (w < 1) { if (mode.includes('w')) x = origin.x + origin.w - 1; w = 1 }
  if (h < 1) { if (mode.includes('n')) y = origin.y + origin.h - 1; h = 1 }

  return clampArea({ x, y, w, h }, columns)
}

// ---------------------------------------------------------------------------
// Contrat d'edition
// ---------------------------------------------------------------------------

/**
 * Ce que le builder fournit a la grille pour qu'elle devienne editable. Le
 * renderer ne connait ni le store ni les actions : il recoit ces cinq verbes et
 * reste utilisable tel quel en mode visiteur, ou le contexte vaut `null` (§22).
 */
export interface FluidEdit {
  selectedBlockId: string | null
  select: (sectionId: string, blockId: string | null) => void
  move: (sectionId: string, blockId: string, area: GridArea) => void
  setRows: (sectionId: string, rows: number) => void
  duplicate: (sectionId: string, blockId: string) => void
  remove: (sectionId: string, blockId: string) => void
}

export const FluidEditContext = createContext<FluidEdit | null>(null)
