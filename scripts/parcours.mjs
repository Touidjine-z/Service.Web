import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5199'
const OUT = process.argv[2] || '.'
const errors = []

// Detecteur de fuite tarifaire (§56) : aucun prix de REALISATION ne doit
// apparaitre avant la page finale. Les mentions de tarifs du client sur son
// propre site sont legitimes, on ne cible que le vocabulaire de la plateforme.
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer|tarif de la prestation web)/i

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1600,1000'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000 })
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

const go = async (hash) => {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 500))
}
const shot = async (name) => page.screenshot({ path: `${OUT}/${name}.png` })
const clickText = async (text, sel = 'button') => {
  const ok = await page.evaluate((t, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t))
    if (el) { el.click(); return true }
    return false
  }, text, sel)
  if (!ok) throw new Error(`introuvable: ${text}`)
  await new Promise((r) => setTimeout(r, 350))
}
const checkLeak = async (where) => {
  const text = await page.evaluate(() => document.body.innerText)
  const hit = text.match(LEAK)
  if (hit) errors.push(`FUITE TARIFAIRE sur ${where} : « ${hit[0]} »`)
}

// Parcours complet
await go('/')
await checkLeak('landing')

await go('/creer/activite')
await clickText('Restaurant')
await checkLeak('activite')
await shot('01-activite')

await go('/creer/objectifs')
await checkLeak('objectifs')
await go('/creer/fonctionnalites')
await checkLeak('fonctionnalites')
await go('/creer/theme')
await checkLeak('theme')
await go('/creer/couleurs')
await checkLeak('couleurs')

// Builder
await go('/creer/site')
await checkLeak('builder')
await shot('02-builder')

const stats = await page.evaluate(() => ({
  sections: document.querySelectorAll('.section-shell').length,
  pages: [...document.querySelectorAll('aside button')].length,
  hasNav: !!document.querySelector('.site-root header'),
  hasFooter: !!document.querySelector('.site-root footer'),
}))
if (!stats.sections) errors.push('builder : aucune section rendue')
if (!stats.hasNav || !stats.hasFooter) errors.push('builder : nav ou footer manquant')

// Selection d'une section -> panneau de proprietes
await page.evaluate(() => document.querySelector('.section-shell').click())
await new Promise((r) => setTimeout(r, 300))
const propsPanel = await page.evaluate(() => {
  const panel = [...document.querySelectorAll('aside')].pop()
  return panel && /Titre/.test(panel.innerText) && panel.querySelectorAll('input, textarea').length >= 3
})
if (!propsPanel) errors.push('builder : panneau de proprietes non ouvert')
await shot('03-selection')

// Edition d'un champ -> repercussion dans l'apercu
await page.evaluate(() => {
  const input = [...document.querySelectorAll('aside input.field')].pop()
  return input ? true : false
})

const openTab = async (label) => {
  const ok = await page.evaluate((l) => {
    const el = document.querySelector(`aside nav button[aria-label="${l}"]`)
    if (el) { el.click(); return true }
    return false
  }, label)
  if (!ok) throw new Error(`onglet introuvable: ${label}`)
  await new Promise((r) => setTimeout(r, 350))
}

// Onglet Pages
await openTab('Pages')
await shot('04-pages')

// Produits : ajouter une categorie et un produit avec image de la banque
await openTab('Produits')
await page.evaluate(() => {
  const input = document.querySelector('aside input.field')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, 'Entrées')
  input.dispatchEvent(new Event('input', { bubbles: true }))
})
await clickText('Ajouter un produit')
const productAdded = await page.evaluate(() => document.body.innerText.includes('Nouveau produit'))
if (!productAdded) errors.push('produits : ajout sans effet')
await page.evaluate(() => {
  const el = [...document.querySelectorAll('aside button')].find((b) => b.textContent.trim() === 'Nouveau produit')
  el?.click()
})
await new Promise((r) => setTimeout(r, 300))
await clickText('Choisir')
await new Promise((r) => setTimeout(r, 400))
// La categorie du metier est preselectionnee ; « toutes » doit ouvrir la banque entiere.
const preselected = await page.evaluate(() => document.querySelectorAll('.fixed img').length)
if (preselected !== 6) errors.push(`banque : ${preselected} visuels pour le metier, 6 attendus`)
await page.evaluate(() => {
  const select = document.querySelector('.fixed select')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
  setter.call(select, 'all')
  select.dispatchEvent(new Event('change', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 300))
const bankSize = await page.evaluate(() => document.querySelectorAll('.fixed img').length)
if (bankSize < 60) errors.push(`banque d'images : ${bankSize} visuels seulement`)
await shot('04b-banque')
await page.evaluate(() => document.querySelector('.fixed img')?.closest('button')?.click())
await new Promise((r) => setTimeout(r, 500))
const inPreview = await page.evaluate(() => !!document.querySelector('.site-root img'))
if (!inPreview) errors.push("banque d'images : l'image choisie n'apparait pas dans l'apercu")
await shot('04c-produit')

// Parametres : devise et grille (§19, §20) repercutees dans l'apercu
await openTab('Paramètres')
const gridBefore = await page.evaluate(() => {
  const g = [...document.querySelectorAll('.site-root div')].find((d) => getComputedStyle(d).display === 'grid' && getComputedStyle(d).gridTemplateColumns.split(' ').length > 1)
  return g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0
})
await page.evaluate(() => {
  const select = [...document.querySelectorAll('aside select')].find((s) => [...s.options].some((o) => o.textContent.includes('par ligne')))
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
  setter.call(select, '2')
  select.dispatchEvent(new Event('change', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 500))
const gridAfter = await page.evaluate(() => {
  const g = [...document.querySelectorAll('.site-root div')].find((d) => getComputedStyle(d).display === 'grid' && getComputedStyle(d).gridTemplateColumns.split(' ').length > 1)
  return g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0
})
if (gridAfter !== 2) errors.push(`grille : ${gridBefore} colonnes avant, ${gridAfter} apres le passage a 2`)
await shot('04d-parametres')

// Onglet Informations : saisir le nom de l'entreprise
await openTab('Informations')
await page.evaluate(() => {
  const input = document.querySelector('aside input.field')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, 'Chez Marco')
  input.dispatchEvent(new Event('input', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 500))
const named = await page.evaluate(() => document.querySelector('.site-root').innerText.includes('Chez Marco'))
if (!named) errors.push("identite : le nom de l'entreprise ne se propage pas dans l'apercu")
await shot('05-identite')

// Viewports
for (const [i, label] of [['Tablette', 1], ['Mobile', 2], ['TV', 3]].map(([l], i) => [i, l])) {
  await page.evaluate((lbl) => {
    document.querySelector(`main button[aria-label="${lbl}"]`)?.click()
  }, label)
  await new Promise((r) => setTimeout(r, 400))
  await shot(`06-${label.toLowerCase()}`)
}

// Mode visiteur
await go('/apercu')
await checkLeak('mode visiteur')
const visitor = await page.evaluate(() => ({
  editing: document.querySelectorAll('.section-shell').length,
  site: !!document.querySelector('.site-root'),
}))
if (visitor.editing) errors.push('mode visiteur : reperes d\'edition encore presents')
if (!visitor.site) errors.push('mode visiteur : site non rendu')
await shot('07-visiteur')

await browser.close()

if (errors.length) {
  console.log('ECHECS :')
  for (const e of errors) console.log(' -', e)
  process.exit(1)
}
console.log('OK — parcours complet, aucune fuite tarifaire')
