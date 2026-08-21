import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

/**
 * Grille fluide (§14) : le client dessine sa section au lieu de l'empiler.
 * Ce scenario verifie ce qu'un typecheck ne voit pas — que le glisser-deposer
 * tombe bien sur la cellule visee malgre l'apercu mis a l'echelle, que la
 * disposition mobile est independante de celle de l'ordinateur, et que tout
 * cela survit au rechargement puis au mode visiteur.
 */

const BASE = process.env.BASE || 'http://localhost:5199'
// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const step = (m) => console.log('  …', m)

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,1000'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000 })
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const go = async (hash) => {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle0' })
  await wait(500)
}
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })
const clickText = async (text, sel = 'button') => {
  const ok = await page.evaluate((t, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t))
    if (el) { el.click(); return true }
    return false
  }, text, sel)
  if (!ok) throw new Error(`introuvable: ${text}`)
  await wait(400)
}
const site = () => page.evaluate(() => document.querySelector('.site-root').innerText)
const panel = () => page.evaluate(() => [...document.querySelectorAll('aside')].pop().innerText)

/** Etat de la grille tel que le navigateur l'a reellement calcule. */
const readGrid = () => page.evaluate(() => {
  const grid = document.querySelector('.fluid-grid')
  if (!grid) return null
  return {
    columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
    areas: [...grid.querySelectorAll('[data-block-id]')].map((c) => c.dataset.area),
  }
})

const parse = (area) => (area ?? '').split(',').map(Number)

/** L'apercu defile : sans cela, la souris viserait une section hors de l'ecran. */
const scrollToGrid = async () => {
  await page.evaluate(() => document.querySelector('.fluid-grid')?.scrollIntoView({ block: 'center' }))
  await wait(350)
}

/**
 * Glisse le n-ieme bloc de `dx`/`dy` CELLULES, a la souris, comme un client.
 * Les lignes de la grille ne sont pas toutes de la meme hauteur — une ligne
 * s'etire quand son contenu deborde — donc on vise le CENTRE de la ligne
 * d'arrivee, pas un multiple d'un pas theorique.
 */
async function dragBlock(index, dx, dy) {
  await scrollToGrid()
  const box = await page.evaluate(({ i, dx, dy }) => {
    const grid = document.querySelector('.fluid-grid')
    const cell = grid.querySelectorAll('[data-block-id]')[i]
    const [, ay] = cell.dataset.area.split(',').map(Number)
    const g = grid.getBoundingClientRect()
    const style = getComputedStyle(grid)
    const gap = parseFloat(style.rowGap) || 0
    const tracks = style.gridTemplateRows.split(' ').map(parseFloat).filter((n) => Number.isFinite(n))
    const edges = [0]
    for (const t of tracks) edges.push(edges[edges.length - 1] + t + gap)
    const pitch = (tracks[tracks.length - 1] ?? 30) + gap
    // L'apercu est mis a l'echelle : les tailles calculees sont en pixels du
    // SITE, la souris parle en pixels d'ECRAN.
    const ratio = g.width / grid.offsetWidth
    const rowCenter = (row) => g.top + ratio * (row < tracks.length
      ? edges[row] + tracks[row] / 2
      : edges[tracks.length] + (row - tracks.length + 0.5) * pitch)
    const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length
    const r = cell.getBoundingClientRect()
    return {
      x: r.x + r.width / 2,
      y: rowCenter(ay),
      toX: r.x + r.width / 2 + dx * ratio * ((grid.offsetWidth + gap) / columns),
      toY: rowCenter(ay + dy),
    }
  }, { i: index, dx, dy })
  await page.mouse.move(box.x, box.y)
  await page.mouse.down()
  await page.mouse.move(box.toX, box.toY, { steps: 10 })
  await page.mouse.up()
  await wait(400)
}

const near = (value, expected, tolerance = 1) => Math.abs(value - expected) <= tolerance

// --- Un projet, puis une section dessinable ---------------------------------
step('projet et section libre')
await go('/creer/activite')
await clickText('Menuisier')
await go('/creer/site')

await clickText('Ajouter une section')
await clickText('Contenu — trois arguments')
await page.evaluate(() => [...document.querySelectorAll('.section-shell')].pop().click())
await wait(350)

const props = await panel()
if (!/disposition/i.test(props)) errors.push('panneau : le choix de disposition est absent')
if (!/libre/i.test(props)) errors.push('panneau : le mode « Libre » n’est pas proposé')

// --- La grille dessinee -----------------------------------------------------
step('grille 24 colonnes')
const initial = await readGrid()
if (!initial) errors.push('grille : aucune grille fluide rendue dans l’aperçu')
else {
  if (initial.columns !== 24) errors.push(`grille : ${initial.columns} colonnes au lieu de 24`)
  if (initial.areas.length !== 3) errors.push(`grille : ${initial.areas.length} bloc(s) posé(s) au lieu de 3`)
  // Tant que le client n'a rien deplace, la deduction reproduit l'empilement :
  // trois arguments cote a cote, un tiers de la largeur chacun.
  const [x0, y0, w0] = parse(initial.areas[0])
  const [x1, , w1] = parse(initial.areas[1])
  if (x0 !== 0 || y0 !== 0) errors.push(`déduction : le premier bloc démarre en ${x0},${y0} au lieu de 0,0`)
  if (w0 !== 8 || w1 !== 8) errors.push(`déduction : largeurs ${w0} et ${w1} au lieu de 8 colonnes`)
  if (x1 !== 8) errors.push(`déduction : le deuxième bloc démarre en ${x1} au lieu de 8`)
}
await shot('70-grille-deduite')

// --- Glisser-deposer aimante -------------------------------------------------
step('glisser un bloc')
await dragBlock(0, 4, 2)
const moved = await readGrid()
const [mx, my, mw, mh] = parse(moved?.areas[0])
if (!near(mx, 4)) errors.push(`déplacement : colonne ${mx} au lieu de ~4`)
if (!near(my, 2)) errors.push(`déplacement : ligne ${my} au lieu de ~2`)
if (mw !== 8 || mh !== 2) errors.push(`déplacement : la taille a changé (${mw}×${mh} au lieu de 8×2)`)
await shot('71-bloc-deplace')

// --- Redimensionnement par la poignee ---------------------------------------
step('étirer un bloc par sa poignée est')
const resized = await page.evaluate(() => {
  const cell = document.querySelector('.fluid-grid [data-block-id]')
  const handle = cell.querySelector('[data-handle="e"]')
  return Boolean(handle)
})
if (!resized) errors.push('poignées : le bloc sélectionné n’en affiche aucune')

await scrollToGrid()
const handleBox = await page.evaluate(() => {
  const grid = document.querySelector('.fluid-grid')
  const cell = grid.querySelector('[data-block-id]')
  const handle = cell.querySelector('[data-handle="e"]')
  if (!handle) return null
  const r = handle.getBoundingClientRect()
  const g = grid.getBoundingClientRect()
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0
  const ratio = g.width / grid.offsetWidth
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, pitchX: ratio * ((grid.offsetWidth + gap) / 24) }
})
if (handleBox) {
  await page.mouse.move(handleBox.x, handleBox.y)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + 3 * handleBox.pitchX, handleBox.y, { steps: 10 })
  await page.mouse.up()
  await wait(400)
  const [, , rw] = parse((await readGrid())?.areas[0])
  if (!near(rw, 11)) errors.push(`redimensionnement : largeur ${rw} au lieu de ~11 colonnes`)
}
await shot('72-bloc-etire')

// --- Deux points de rupture ---------------------------------------------------
step('disposition mobile indépendante')
const desktopArea = (await readGrid()).areas[0]

await page.evaluate(() => document.querySelector('button[aria-label="Mobile"]').click())
await wait(500)
const mobile = await readGrid()
if (!mobile) errors.push('mobile : aucune grille rendue')
else {
  if (mobile.columns !== 8) errors.push(`mobile : ${mobile.columns} colonnes au lieu de 8`)
  const pleineLargeur = mobile.areas.every((a) => parse(a)[0] === 0 && parse(a)[2] === 8)
  if (!pleineLargeur) errors.push(`mobile : les blocs déduits ne sont pas pleine largeur (${mobile.areas.join(' | ')})`)
}
await shot('73-mobile-deduit')

// Le bloc deplace sur l'ordinateur passe en fin d'ordre de lecture : sa ligne
// de depart sur le mobile n'est donc pas la premiere.
const mobileBefore = parse((await readGrid()).areas[0])[1]
await dragBlock(0, 0, 3)
const mobileMoved = parse((await readGrid()).areas[0])
if (!near(mobileMoved[1], mobileBefore + 3)) {
  errors.push(`mobile : ligne ${mobileMoved[1]} au lieu de ~${mobileBefore + 3} après glissement`)
}

await page.evaluate(() => document.querySelector('button[aria-label="Ordinateur"]').click())
await wait(500)
if ((await readGrid()).areas[0] !== desktopArea) {
  errors.push('points de rupture : modifier le mobile a déplacé la disposition ordinateur')
}
await shot('74-retour-ordinateur')

// --- Persistance ---------------------------------------------------------------
step('persistance')
await wait(900)
await page.reload({ waitUntil: 'networkidle0' })
await wait(1000)
const reloaded = await readGrid()
if (!reloaded) errors.push('persistance : plus de grille après rechargement')
else if (reloaded.areas[0] !== desktopArea) {
  errors.push(`persistance : disposition ${reloaded.areas[0]} au lieu de ${desktopArea}`)
}

// --- Retour a l'empilement ------------------------------------------------------
step('retour à l’empilement')
await page.evaluate(() => [...document.querySelectorAll('.section-shell')].pop().click())
await wait(350)
await clickText('Empilée')
if (await readGrid()) errors.push('empilement : la grille reste affichée après bascule')
if (!(await site()).includes('Un interlocuteur unique')) errors.push('empilement : le contenu a disparu')
await shot('75-empilee')

await clickText('Libre')
if (!(await readGrid())) errors.push('bascule : le retour à la grille ne fonctionne pas')

// --- Mode visiteur ----------------------------------------------------------------
step('mode visiteur')
await wait(900)
await go('/apercu')
const visitor = await site()
for (const expected of ['Un interlocuteur unique', 'Des délais tenus', 'Un travail garanti']) {
  if (!visitor.includes(expected)) errors.push(`visiteur : « ${expected} » absent du site fini`)
}
// Le site rendu au visiteur n'embarque aucune poignee d'edition.
const affordances = await page.evaluate(() => document.querySelectorAll('[data-handle]').length)
if (affordances) errors.push(`visiteur : ${affordances} poignée(s) d’édition livrée(s) au visiteur`)
await shot('76-visiteur')

await browser.close()
if (errors.length) {
  console.error('ECHECS :')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('OK — grille fluide : déduction, glisser-déposer, poignées, mobile, persistance, visiteur')
