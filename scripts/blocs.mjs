import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5199'
const OUT = process.argv[2] || '.'
const errors = []
const step = (m) => console.log('  …', m)

// Aucun prix de realisation ne doit apparaitre dans le builder (§56).
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer)/i

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1600,1000'],
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
// `innerText` respecte les majuscules CSS : les intitules de panneau remontent
// en capitales, d'ou les tests insensibles a la casse plus bas.
const panel = () => page.evaluate(() => [...document.querySelectorAll('aside')].pop().innerText)
const sidebar = () => page.evaluate(() => document.querySelectorAll('aside')[0].innerText)
/** Clic dans la liste des blocs du panneau de proprietes, jamais sur la section. */
const clickInBlocks = (title, index = 0) => page.evaluate((t, i) => {
  const aside = [...document.querySelectorAll('aside')].pop()
  const button = aside.querySelector('ul').querySelectorAll(`button[title="${t}"]`)[i]
  if (!button) throw new Error(`bloc : bouton « ${t} » introuvable`)
  button.click()
}, title, index)

// --- Un projet, puis le builder -------------------------------------------
step('projet')
await go('/creer/activite')
await clickText('Menuisier')
await go('/creer/site')

const before = await page.evaluate(() => document.querySelectorAll('.section-shell').length)
if (!before) errors.push('builder : aucune section rendue')

// --- Ajout par variante (§14) ---------------------------------------------
step('variante hero avec chiffres')
await clickText('Ajouter une section')
const picker = await sidebar()
if (!/essentielles/i.test(picker)) errors.push('catalogue : les sections ne sont pas rangées par intention')
if (!/Hero — avec chiffres/i.test(picker)) errors.push('catalogue : la variante « Hero — avec chiffres » est absente')
await shot('60-catalogue')

await clickText('Hero — avec chiffres')
const added = await page.evaluate(() => document.querySelectorAll('.section-shell').length)
if (added !== before + 1) errors.push(`ajout : ${before} section(s) avant, ${added} après`)

const withStats = await site()
for (const expected of ["d'expérience", 'clients accompagnés', 'note moyenne']) {
  if (!withStats.includes(expected)) errors.push(`blocs : « ${expected} » absent de l'aperçu`)
}
await shot('61-hero-chiffres')

// --- Edition d'un bloc ------------------------------------------------------
step('édition d\'un bloc')
await page.evaluate(() => [...document.querySelectorAll('.section-shell')].pop().click())
await wait(350)
const props = await panel()
if (!/blocs/i.test(props)) errors.push('propriétés : l\'éditeur de blocs ne s\'affiche pas')
if (!/3 \/ 6/.test(props)) errors.push(`propriétés : compteur de blocs inattendu (${props.match(/\d+ \/ \d+/) ?? 'aucun'})`)

// Ouvrir le premier bloc et changer sa legende.
await clickText("d'expérience", 'aside button')
await wait(300)
const renamed = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('aside input.field')]
  const target = inputs[inputs.length - 1]
  if (!target) return false
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(target, 'de savoir-faire')
  target.dispatchEvent(new Event('input', { bubbles: true }))
  return true
})
if (!renamed) errors.push('propriétés : aucun champ de bloc éditable')
await wait(400)
if (!(await site()).includes('de savoir-faire')) errors.push('blocs : la modification ne se voit pas dans l\'aperçu')
await shot('62-edition-bloc')

// --- Ajout, masquage, suppression d'un bloc --------------------------------
step('ajout et masquage')
await clickText('Ajouter un bloc')
await clickText('Pastille')
if (!(await site()).includes('Devis gratuit')) errors.push('blocs : la pastille ajoutée n\'apparaît pas')
const afterAdd = await panel()
if (!/4 \/ 6/.test(afterAdd)) errors.push(`blocs : compteur après ajout (${afterAdd.match(/\d+ \/ \d+/) ?? 'aucun'})`)

// Un bloc masque disparait du site, mais reste dans le panneau.
await clickInBlocks('Masquer')
await wait(400)
if ((await site()).includes('de savoir-faire')) errors.push('blocs : un bloc masqué reste visible sur le site')
if (!/4 \/ 6/.test(await panel())) errors.push('blocs : un bloc masqué a disparu du panneau')

await clickInBlocks('Supprimer')
await wait(400)
const afterDelete = await panel()
if (!/3 \/ 6/.test(afterDelete)) errors.push(`blocs : compteur après suppression (${afterDelete.match(/\d+ \/ \d+/) ?? 'aucun'})`)
await shot('63-blocs-edites')

// --- Section libre ----------------------------------------------------------
step('section libre')
await page.evaluate(() => {
  const rail = document.querySelector('aside nav button[aria-label="Sections"]')
  if (rail) rail.click()
})
await wait(300)
await clickText('Ajouter une section')
await clickText('Contenu — trois arguments')
const libre = await site()
for (const expected of ['Un interlocuteur unique', 'Des délais tenus', 'Un travail garanti']) {
  if (!libre.includes(expected)) errors.push(`section libre : « ${expected} » absent`)
}
await shot('64-contenu-libre')

// --- Persistance ------------------------------------------------------------
step('persistance')
await wait(900)
await page.reload({ waitUntil: 'networkidle0' })
await wait(900)
const reloaded = await site()
if (!reloaded.includes('clients accompagnés')) errors.push('persistance : les blocs ne survivent pas au rechargement')
if (!reloaded.includes('Devis gratuit')) errors.push('persistance : le bloc ajouté a disparu')
if (!reloaded.includes('Un interlocuteur unique')) errors.push('persistance : la section libre a disparu')

const body = await page.evaluate(() => document.body.innerText)
const leak = body.match(LEAK)
if (leak) errors.push(`FUITE TARIFAIRE dans le builder : « ${leak[0]} »`)
await shot('65-apres-rechargement')

await browser.close()
if (errors.length) {
  console.error('ECHECS :')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('OK — blocs et variantes : ajout, édition, masquage, suppression, persistance')
