import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const step = (m) => console.log('  …', m)

const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await b.newPage()
await page.setViewport({ width: 1500, height: 1000 })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

const go = async (h) => { await page.goto(`http://localhost:5199/#${h}`, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 600)) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true })
const click = async (t, scope = 'button') => {
  const ok = await page.evaluate((x, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(x))
    if (el) { el.click(); return true } return false
  }, t, scope)
  if (!ok) throw new Error(`bouton introuvable: ${t}`)
  await new Promise(r => setTimeout(r, 450))
}
const type = async (label, value) => {
  await page.evaluate((l, v) => {
    const lab = [...document.querySelectorAll('label')].find((e) => e.textContent.trim().startsWith(l))
    const input = lab?.querySelector('input, textarea')
    const proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement : window.HTMLInputElement
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, value)
  await new Promise(r => setTimeout(r, 120))
}

// Un metier qui vend : restaurant (modules menu + produits)
step('projet restaurant')
await go('/creer/activite')
await click('Restaurant')

// « Recevoir des commandes » fait partie des objectifs suggeres du restaurant :
// les modules panier et commande doivent donc etre actifs sans rien cocher.
await go('/creer/objectifs')
const ordersChecked = await page.evaluate(() => {
  const lab = [...document.querySelectorAll('label')].find((e) => e.textContent.includes('Recevoir des commandes'))
  return Boolean(lab?.querySelector('input')?.checked)
})
if (!ordersChecked) errors.push('objectifs : « Recevoir des commandes » n\'est pas pré-coché pour un restaurant')
await go('/creer/site')

// Ajouter deux produits avec prix
step('catalogue')
await page.evaluate(() => document.querySelector('aside nav button[aria-label="Produits"]').click())
await new Promise(r => setTimeout(r, 400))
const toggleLastProduct = () => page.evaluate(() => {
  const items = [...document.querySelectorAll('aside li')]
  const last = items[items.length - 1]
  last.querySelector('button.flex-1')?.click()
})
for (const [name, price] of [['Pizza Margherita', '12'], ['Tiramisu', '6']]) {
  await click('Ajouter un produit')
  await toggleLastProduct()
  await new Promise(r => setTimeout(r, 350))
  await type('Nom', name)
  await type('Prix', price)
  await toggleLastProduct()
  await new Promise(r => setTimeout(r, 300))
}
const catalogue = await page.evaluate(() => document.querySelector('aside').innerText)
if (!/Pizza Margherita/.test(catalogue) || !/Tiramisu/.test(catalogue)) {
  errors.push(`catalogue : produits mal saisis (${catalogue.replace(/\n/g, ' | ').slice(0, 200)})`)
}

// Mode visiteur : le panier doit exister
step('mode visiteur')
await go('/apercu')
const hasCart = await page.evaluate(() => document.body.innerText.includes('Panier'))
if (!hasCart) errors.push('commerce : pas de bouton panier alors que le module commande est actif')

const added = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.site-root button')].find((b) => b.textContent.trim() === 'Ajouter')
  if (!btn) return false
  btn.click(); return true
})
if (!added) {
  const diag = await page.evaluate(() => ({
    modules: JSON.parse(localStorage.getItem('diag') || 'null'),
    siteButtons: [...document.querySelectorAll('.site-root button')].map((b) => b.textContent.trim()).slice(0, 20),
    bar: document.body.innerText.slice(0, 200),
  }))
  errors.push(`commerce : aucun bouton « Ajouter » — boutons du site = ${JSON.stringify(diag.siteButtons)}`)
}
await new Promise(r => setTimeout(r, 500))
await shot('30-panier')

const cartText = await page.evaluate(() => document.body.innerText)
if (!/Votre panier/.test(cartText)) errors.push('commerce : le panier ne s\'ouvre pas')
if (!/Pizza Margherita/.test(cartText)) errors.push('commerce : le produit n\'est pas dans le panier')

// Quantite
await page.evaluate(() => document.querySelector('aside button[aria-label="Ajouter un"]')?.click())
await new Promise(r => setTimeout(r, 300))
const qty = await page.evaluate(() => {
  const t = document.querySelector('aside').innerText
  return /24\s*€/.test(t)
})
if (!qty) errors.push('commerce : le total ne suit pas la quantité (24 € attendus pour 2 × 12 €)')

// Commande
step('commande')
await click('Commander')
await type('Nom', 'Julie Martin')
await type('Email', 'julie@example.com')
await type('Téléphone', '0601020304')
await type('Précisions', 'Sans oignons')
await click('Envoyer ma commande')
await new Promise(r => setTimeout(r, 900))
const done = await page.evaluate(() => document.body.innerText)
if (!/Commande envoyée|Merci/.test(done)) errors.push('commerce : pas de confirmation apres envoi')
await shot('31-commande-envoyee')

// Ecran TV alimente par le vrai catalogue (§24)
step('écran TV')
await go('/creer/fonctionnalites')
await click('Affichage TV')
await go('/tv')
for (const layout of ['Carte', 'Grille', 'Mise en avant']) {
  await click(layout)
  const tv = await page.evaluate(() => document.querySelector('.site-root').innerText)
  if (!/Pizza Margherita|Tiramisu/.test(tv)) errors.push(`tv : la mise en page « ${layout} » n'affiche aucun produit`)
}
await shot('33-tv-carte')

// La commande doit remonter cote proprietaire
step('admin')
await go('/admin')
await new Promise(r => setTimeout(r, 700))
await page.evaluate(() => document.querySelector('tbody tr').click())
await new Promise(r => setTimeout(r, 700))
const detail = await page.evaluate(() => document.body.innerText)
if (!/Commandes reçues/i.test(detail)) errors.push('admin : les commandes ne remontent pas dans la vue projet')
if (!/Julie Martin/.test(detail)) errors.push('admin : le client de la commande est absent')
if (!/Sans oignons/.test(detail)) errors.push('admin : les précisions de la commande sont absentes')
await shot('32-admin-commandes')

await b.close()
if (errors.length) { console.log('ECHECS :'); errors.forEach((e) => console.log(' -', e)); process.exit(1) }
console.log('OK — commerce : panier, quantités, commande, remontée côté propriétaire')
