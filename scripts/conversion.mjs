import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer)/i

const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await b.newPage()
await page.setViewport({ width: 1500, height: 1000 })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

const step = (m) => console.log('  …', m)
const go = async (h) => { await page.goto(`http://localhost:5199/#${h}`, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 500)) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true })
const click = async (t) => {
  const ok = await page.evaluate((x) => {
    const el = [...document.querySelectorAll('button')].find((e) => e.textContent.trim().includes(x))
    if (el) { el.click(); return true } return false
  }, t)
  if (!ok) throw new Error(`bouton introuvable: ${t}`)
  await new Promise(r => setTimeout(r, 400))
}
const type = async (label, value) => {
  await page.evaluate((l, v) => {
    const lab = [...document.querySelectorAll('label')].find((e) => e.textContent.trim().startsWith(l))
    const input = lab?.querySelector('input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, value)
  await new Promise(r => setTimeout(r, 120))
}
const leak = async (where) => {
  const t = await page.evaluate(() => document.body.innerText)
  const hit = t.match(LEAK)
  if (hit) errors.push(`FUITE TARIFAIRE sur ${where} : « ${hit[0]} »`)
}

// Projet neuf
step('nouveau projet')
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
await page.evaluate(() => indexedDB.deleteDatabase('service-web'))
await page.goto('http://localhost:5199/#/creer/activite', { waitUntil: 'networkidle0' })
await new Promise(r => setTimeout(r, 600))
step('clic Menuisier')
await click('Menuisier')
step('builder')
await go('/creer/site')
await leak('builder')

// Page finale : le bouton a le droit de PARLER du prix (« Voir le prix de
// realisation »), mais aucun MONTANT ne doit apparaitre avant la revelation.
step('page finale')
await go('/creer/final')
const before = await page.evaluate(() => {
  // La maquette du client (.site-root) est ignoree : les montants qu'elle
  // affiche sont les prix du client sur son propre site, legitimes partout
  // (§56). On ne traque que les montants de la plateforme.
  const clone = document.body.cloneNode(true)
  clone.querySelectorAll('.site-root').forEach((node) => node.remove())
  return /\d+\s*€/.test(clone.textContent)
})
if (before) errors.push('page finale : un montant est visible AVANT la revelation')
await shot('10-final-avant')

// Revelation explicite
step('revelation')
await click('Voir le prix de réalisation')
const after = await page.evaluate(() => document.body.innerText)
if (!/Acompte pour démarrer/.test(after)) errors.push('page finale : le prix ne se revele pas')
if (!/\d+\s*€/.test(after)) errors.push('page finale : aucun montant apres revelation')
await shot('11-final-prix')

// Montants coherents avec la regle d'acompte (§31)
const amounts = await page.evaluate(() => {
  // Les montants sont lus dans la colonne de droite uniquement : la maquette du
  // client, rendue a cote, contient du texte libre qui pourrait porter les
  // memes libelles.
  const scope = [...document.querySelectorAll('aside')].pop() ?? document
  const grab = (label) => {
    const row = [...scope.querySelectorAll('div')].find((d) => d.children.length === 2 && d.children[0].textContent.trim() === label)
    return row ? Number(row.children[1].textContent.replace(/[^\d]/g, '')) : null
  }
  return { total: grab('Réalisation'), deposit: grab('Acompte pour démarrer'), balance: grab('Solde restant') }
})
const expected = Math.max(Math.round(amounts.total * 0.1), 50)
if (amounts.deposit !== expected) errors.push(`acompte : ${amounts.deposit} au lieu de ${expected} pour un total de ${amounts.total}`)
if (amounts.total - amounts.deposit !== amounts.balance) errors.push('solde incoherent avec total - acompte')

// Demande de realisation -> capture du lead
step('demande realisation')
await click('Demander la réalisation')
const askedLead = await page.evaluate(() => document.body.innerText.includes('Enregistrez votre projet'))
if (!askedLead) errors.push('lead : le formulaire ne s\'ouvre pas a la demande de realisation')
await shot('12-lead')
await type('Prénom', 'Marc')
await type('Nom', 'Durand')
await type('Email', 'marc.durand@example.com')
await type('Téléphone', '0612345678')
await click('Enregistrer mon projet')
await new Promise(r => setTimeout(r, 800))

// Nom de domaine (§59) : l'etape s'intercale entre la demande et l'acompte.
step('nom de domaine')
const onDomain = await page.evaluate(() => location.hash.includes('/creer/domaine'))
if (!onDomain) errors.push(`domaine : pas de redirection (hash=${await page.evaluate(() => location.hash)})`)
await new Promise(r => setTimeout(r, 900))
const domainText = await page.evaluate(() => document.body.innerText)
if (!/Votre nom de domaine/.test(domainText)) errors.push('domaine : la page ne s\'affiche pas')
// Aucune cle GoDaddy en test : le mode simule doit etre annonce, comme pour Stripe.
if (!/Vérification simulée/.test(domainText)) errors.push('domaine : le mode simule n\'est pas annonce a l\'ecran')
const proposed = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Choisir').length)
if (!proposed) errors.push('domaine : aucune extension disponible proposee')
await shot('13-domaine')

await click('Choisir')
await new Promise(r => setTimeout(r, 400))
const picked = await page.evaluate(() => {
  const scope = [...document.querySelectorAll('aside')].pop() ?? document
  const row = [...scope.querySelectorAll('div')].find((d) => d.children.length === 2 && d.children[0].textContent.trim() === 'Réalisation')
  return {
    name: (scope.innerText.match(/[a-z0-9-]+\.[a-z]{2,}/) ?? [null])[0],
    total: row ? Number(row.children[1].textContent.replace(/[^\d]/g, '')) : null,
  }
})
if (!picked.name) errors.push('domaine : le choix n\'apparait pas dans le recapitulatif')
// Le domaine ajoute une ligne au devis : notre travail de reservation, pas le
// prix du registrar, qui reste chez lui et dans sa devise.
if (picked.total !== amounts.total + 30) errors.push(`domaine : total ${picked.total} au lieu de ${amounts.total + 30} apres ajout du domaine`)
await shot('14-domaine-choisi')

await click('Continuer vers')
await new Promise(r => setTimeout(r, 500))

// Checkout
const onCheckout = await page.evaluate(() => location.hash.includes('/paiement'))
if (!onCheckout) errors.push(`checkout : pas de redirection (hash=${await page.evaluate(() => location.hash)})`)
const checkoutText = await page.evaluate(() => document.body.innerText)
if (picked.name && !checkoutText.includes(picked.name)) errors.push('checkout : le nom de domaine retenu n\'est pas rappele')
await shot('15-checkout')
step('checkout')
await type('Titulaire de la carte', 'Marc Durand')
await type('Numéro de carte', '4242424242424242')
await type('Expiration', '1228')
await type('CVC', '123')
step('paiement')
await click('Payer')
await new Promise(r => setTimeout(r, 2000))

const onConfirm = await page.evaluate(() => location.hash.includes('/confirmation'))
if (!onConfirm) errors.push('paiement : pas de redirection vers la confirmation')
const confirmText = await page.evaluate(() => document.body.innerText)
if (!/Acompte payé/.test(confirmText)) errors.push('confirmation : statut « Acompte payé » absent')
if (!/SIM-/.test(confirmText)) errors.push('confirmation : reference de transaction absente')
if (picked.name && !confirmText.includes(picked.name)) errors.push('confirmation : le nom de domaine reserve n\'est pas rappele')
await shot('16-confirmation')

// Persistance : le paiement, le lead et le domaine sont en base
const stored = await page.evaluate(async () => {
  const open = () => new Promise((res, rej) => { const r = indexedDB.open('service-web'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  const db = await open()
  const all = (name) => new Promise((res) => { const t = db.transaction(name).objectStore(name).getAll(); t.onsuccess = () => res(t.result) })
  const projects = await all('projects')
  return {
    payments: await all('payments'),
    leads: await all('leads'),
    projects: projects.map((p) => p.data.status),
    domains: projects.map((p) => p.data.domain).filter(Boolean),
  }
})
if (!stored.payments.some((p) => p.status === 'paid')) errors.push('base : aucun paiement « paid » enregistre')
if (!stored.leads.length) errors.push('base : aucun lead enregistre')
if (!stored.projects.includes('deposit-paid')) errors.push(`base : statut projet = ${stored.projects.join(',')} au lieu de deposit-paid`)
if (!stored.domains.some((d) => d.status === 'wanted' && d.name)) errors.push('base : le nom de domaine choisi n\'est pas enregistre')

await b.close()
if (errors.length) { console.log('ECHECS :'); errors.forEach((e) => console.log(' -', e)); process.exit(1) }
console.log('OK — conversion complete : revelation, lead, nom de domaine, acompte, paiement, confirmation, persistance')
