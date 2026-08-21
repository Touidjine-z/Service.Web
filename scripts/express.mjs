import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

/**
 * Creation express (§39, variante formulaire) : le client remplit ses
 * informations, valide, et son site doit exister — pages montees, coordonnees
 * propagees, aucune fuite tarifaire (§56).
 */

// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const step = (m) => console.log('  …', m)

const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer|tarif de la prestation web)/i

const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await b.newPage()
await page.setViewport({ width: 1500, height: 1000 })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

const go = async (h) => { await page.goto(`http://localhost:5199/#${h}`, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 600)) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true })
const click = async (t, scope = 'button, a') => {
  const ok = await page.evaluate((x, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(x))
    if (el) { el.click(); return true } return false
  }, t, scope)
  if (!ok) throw new Error(`introuvable: ${t}`)
  await new Promise(r => setTimeout(r, 450))
}
const checkLeak = async (where) => {
  const hit = (await page.evaluate(() => document.body.innerText)).match(LEAK)
  if (hit) errors.push(`FUITE TARIFAIRE sur ${where} : « ${hit[0]} »`)
}
/** Saisie React : passer par le setter natif, sinon l'etat ne bouge pas. */
const fill = async (name, value) => {
  const ok = await page.evaluate((n, val) => {
    const input = document.querySelector(`[name="${n}"]`)
    if (!input) return false
    const proto = input.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, val)
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
    return true
  }, name, value)
  if (!ok) throw new Error(`champ introuvable: ${name}`)
  await new Promise(r => setTimeout(r, 220))
}

// La vitrine annonce la porte d'entree
step('acces depuis la vitrine')
await go('/')
const advertised = await page.evaluate(() =>
  [...document.querySelectorAll('a')].some((a) => a.getAttribute('href')?.includes('/creer/express')))
if (!advertised) errors.push('vitrine : aucun lien vers le formulaire express')

// Le formulaire
step('formulaire')
await go('/creer/express')
await checkLeak('formulaire express')

const blocked = await page.evaluate(() =>
  [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Valider et créer'))?.disabled)
if (blocked !== true) errors.push('formulaire : la validation devrait être bloquée tant que rien n\'est saisi')

await fill('activityId', 'boulangerie')
await fill('businessName', 'Boulangerie Dupont')
await fill('phone', '02 54 12 34 56')
await fill('email', 'contact@boulangerie-dupont.fr')
await fill('address', '12 rue des Lilas')
await fill('city', 'Blois')
await fill('serviceArea', '15 km autour de Blois')
await fill('instagram', '@boulangeriedupont')

// Le recapitulatif doit annoncer ce qui sera cree, sans le creer
const recap = await page.evaluate(() => document.querySelector('aside').innerText)
if (!/Boulangerie Dupont/.test(recap)) errors.push('récapitulatif : le nom saisi ne remonte pas')
if (!/pages/i.test(recap)) errors.push('récapitulatif : le nombre de pages n\'est pas annoncé')
if (!/Blois/.test(recap)) errors.push('récapitulatif : la ville ne remonte pas')
await shot('50-formulaire')

const ready = await page.evaluate(() =>
  [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Valider et créer'))?.disabled)
if (ready !== false) errors.push('formulaire : la validation reste bloquée alors que tout est saisi')

// Validation : le site est monte
step('validation')
await click('Valider et créer mon site')
await new Promise(r => setTimeout(r, 800))
const confirmation = await page.evaluate(() => document.body.innerText)
if (!/prêt/i.test(confirmation)) errors.push('validation : aucune confirmation que le site est prêt')
if (!/Boulangerie Dupont/.test(confirmation)) errors.push('validation : la confirmation ne nomme pas l\'établissement')
await checkLeak('confirmation express')
await shot('51-confirmation')

const stored = await page.evaluate(async () => {
  const open = () => new Promise((res) => { const r = indexedDB.open('service-web'); r.onsuccess = () => res(r.result) })
  const db = await open()
  const rows = await new Promise((res) => { const t = db.transaction('projects').objectStore('projects').getAll(); t.onsuccess = () => res(t.result) })
  const p = rows[0]?.data
  return {
    projects: rows.length,
    activity: p?.activityId,
    theme: p?.themeId,
    step: p?.step,
    pages: p?.pages.length ?? 0,
    modules: p?.modules.length ?? 0,
    identity: p?.identity,
    seo: p?.pages.find((x) => x.isHome)?.seo,
    about: p?.pages.flatMap((x) => x.sections).find((s) => s.kind === 'about')?.props.text ?? '',
  }
})
if (stored.projects !== 1) errors.push(`express : ${stored.projects} projets en base au lieu d'un seul`)
if (stored.activity !== 'boulangerie') errors.push(`express : activité appliquée = ${stored.activity}`)
if (stored.theme === 'modern') errors.push('express : le design n\'a pas été adapté au métier')
if (stored.pages < 3) errors.push(`express : seulement ${stored.pages} pages montées`)
if (stored.modules < 4) errors.push(`express : seulement ${stored.modules} fonctionnalités activées`)
if (stored.identity?.phone !== '02 54 12 34 56') errors.push('express : téléphone non enregistré')
if (stored.identity?.address !== '12 rue des Lilas') errors.push('express : adresse non enregistrée')
if (stored.identity?.social?.instagram !== '@boulangeriedupont') errors.push('express : réseau social non enregistré')
if (!stored.identity?.tagline) errors.push('express : aucun slogan proposé')
if (!/Blois/.test(stored.about)) errors.push('express : la présentation n\'utilise pas la ville')
if (!/Boulangerie Dupont/.test(stored.seo?.title ?? '')) errors.push('express : référencement de l\'accueil non renseigné')
if (stored.step !== 'preview') errors.push(`express : étape courante = ${stored.step}`)

// Le site, vu comme un visiteur
step('site rendu')
await click('Voir mon site')
await new Promise(r => setTimeout(r, 900))
const site = await page.evaluate(() => {
  const root = document.querySelector('.site-root')
  return { text: root?.innerText ?? '', sections: document.querySelectorAll('.section-shell').length, has: !!root }
})
if (!site.has) errors.push('aperçu : le site n\'est pas rendu')
if (site.sections) errors.push('aperçu : repères d\'édition présents en mode visiteur')
if (!site.text.includes('Boulangerie Dupont')) errors.push('aperçu : le nom est absent du site rendu')
if (!site.text.includes('Blois')) errors.push('aperçu : la ville est absente du site rendu')
await checkLeak('aperçu express')
await shot('52-site')

// Page contact : c'est la que les coordonnees saisies doivent se retrouver
await page.evaluate(() => {
  const link = [...document.querySelectorAll('.site-root header button')].find((x) => x.textContent.trim() === 'Contact')
  link?.click()
})
await new Promise(r => setTimeout(r, 700))
const contact = await page.evaluate(() => document.querySelector('.site-root')?.innerText ?? '')
for (const [what, value] of [['téléphone', '02 54 12 34 56'], ['email', 'contact@boulangerie-dupont.fr'], ['adresse', '12 rue des Lilas'], ["zone d'intervention", '15 km autour de Blois']]) {
  if (!contact.includes(value)) errors.push(`page contact : ${what} absent`)
}
await checkLeak('page contact express')
await shot('53-contact')

// Reprise : le formulaire ne fait pas ressaisir ce qui est deja connu, meme
// apres un vrai rechargement (le projet est relu dans IndexedDB, en differe).
step('reprise')
await go('/creer/express')
await page.reload({ waitUntil: 'networkidle0' })
await new Promise(r => setTimeout(r, 900))
const again = await page.evaluate(() => document.querySelector('[name="businessName"]')?.value ?? '')
if (again !== 'Boulangerie Dupont') errors.push(`reprise : le formulaire est revenu vide (${again})`)

await b.close()

if (errors.length) {
  console.log('ECHECS :')
  for (const e of errors) console.log(' -', e)
  process.exit(1)
}
console.log('OK — création express : site monté, coordonnées propagées, aucune fuite tarifaire')
