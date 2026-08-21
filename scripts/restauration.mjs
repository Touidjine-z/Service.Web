import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

/**
 * Chaine restauration : modes de service, offres, carte a onglets, formules,
 * allergenes, fidelite, etablissements — puis une commande avec mode de service
 * et sa remontee cote proprietaire.
 */
// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const step = (m) => console.log('  …', m)

// Vocabulaire de la PLATEFORME : aucun de ces mots ne doit apparaitre avant la
// page finale. Les prix du client sur son propre site restent legitimes (§56).
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer)/i

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
const site = () => page.evaluate(() => document.querySelector('.site-root').innerText)
const expect = (text, needles, where) => {
  for (const needle of needles) {
    if (!text.includes(needle)) errors.push(`${where} : « ${needle} » absent`)
  }
}

// --- Fast-food : la maquette d'exemple doit deja ressembler a une enseigne ---
step('projet fast-food')
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
await page.evaluate(() => indexedDB.deleteDatabase('service-web'))
await go('/creer/activite')
await click('Snack / Fast-food')

await go('/creer/site')
const builder = await page.evaluate(() => document.body.innerText)
if (LEAK.test(builder)) errors.push(`FUITE TARIFAIRE dans le builder : « ${builder.match(LEAK)[0]} »`)

step('accueil visiteur')
await go('/apercu')
const home = await site()
expect(home, [
  'Comment souhaitez-vous être servi', 'Livraison', 'À emporter', 'Sur place',
  'Nos offres du moment', 'programme fidélité', 'avant votre récompense',
], 'accueil fast-food')
await shot('50-restauration-accueil')

step('carte à onglets')
await click('La carte', '.site-root header button')
const tabs = await page.evaluate(() => [...document.querySelectorAll('.site-root button')].map((x) => x.textContent.trim()))
for (const tab of ['Tout', 'Burgers', 'Boissons']) {
  if (!tabs.includes(tab)) errors.push(`carte : onglet « ${tab} » absent (${tabs.slice(0, 8).join(', ')})`)
}
await click('Boissons', '.site-root button')
// Les noms des cartes produit, pas le texte de la page : le tableau des
// allergenes liste toute la carte, filtre ou non.
const shown = await page.evaluate(() => [...document.querySelectorAll('.site-root article h3')].map((h) => h.textContent.trim()))
if (shown.includes('Le Signature')) errors.push('carte : le filtre par catégorie n\'exclut pas les autres plats')
if (!shown.includes('Limonade artisanale')) errors.push('carte : le filtre par catégorie masque les boissons')
await click('Tout', '.site-root button')
const carte = await site()
expect(carte, ['Nos formules', 'Allergènes et informations nutritionnelles', 'kcal', 'Gluten'], 'page carte')
await shot('51-restauration-carte')

step('établissements')
await click('Nos restaurants', '.site-root header button')
expect(await site(), ['Nos établissements', 'Ville ou code postal', 'Drive'], 'page établissements')

// --- Commande avec mode de service --------------------------------------
step('catalogue')
await go('/creer/site')
await page.evaluate(() => document.querySelector('aside nav button[aria-label="Produits"]').click())
await new Promise(r => setTimeout(r, 400))
const toggleLast = () => page.evaluate(() => {
  const items = [...document.querySelectorAll('aside li')]
  items[items.length - 1].querySelector('button.flex-1')?.click()
})
await click('Ajouter un produit')
await toggleLast()
await new Promise(r => setTimeout(r, 350))
await type('Nom', 'Menu Braise')
await type('Prix', '13.5')
await toggleLast()

step('commande à emporter')
await go('/apercu')
const added = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.site-root button')].find((x) => x.textContent.trim() === 'Ajouter')
  if (!btn) return false
  btn.click(); return true
})
if (!added) errors.push('commerce : aucun bouton « Ajouter » sur la carte')
await new Promise(r => setTimeout(r, 400))
await click('Commander')
const tunnel = await page.evaluate(() => document.querySelector('aside').innerText)
expect(tunnel, ['Mode de service', 'Livraison', 'À emporter', 'Créneau souhaité'], 'tunnel de commande')
await click('À emporter', 'aside button')
await page.select('aside select', 'Dans 30 minutes')
await type('Nom', 'Sofia Berger')
await type('Email', 'sofia@example.com')
await type('Téléphone', '0601020304')
await click('Envoyer ma commande')
await new Promise(r => setTimeout(r, 900))
const done = await page.evaluate(() => document.querySelector('aside').innerText)
expect(done, ['Commande envoyée', 'À emporter', 'dans 30 minutes', 'Votre commande a bien été transmise'], 'confirmation de commande')
await shot('52-restauration-commande')

step('remontée côté propriétaire')
await go('/admin')
await new Promise(r => setTimeout(r, 700))
await page.evaluate(() => document.querySelector('tbody tr').click())
await new Promise(r => setTimeout(r, 700))
const detail = await page.evaluate(() => document.body.innerText)
expect(detail, ['Sofia Berger', 'À emporter'], 'détail projet')

// --- Restaurant a table : formules et reservation -------------------------
step('restaurant à table')
await go('/creer/activite')
await click('Restaurant')
await go('/apercu')
const resto = await site()
expect(resto, ['Nos formules', 'Réserver une table'], 'accueil restaurant')
await click('Réserver', '.site-root header button')
expect(await site(), ['Réserver une table', 'Nombre de couverts'], 'page réservation')
await shot('53-restauration-reservation')

console.log(errors.length ? 'ERREURS:\n' + errors.join('\n') : 'OK — restauration : modes de service, carte, formules, allergènes, fidélité, commande')
await b.close()
process.exit(errors.length ? 1 : 0)
