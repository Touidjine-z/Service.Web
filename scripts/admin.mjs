import puppeteer from 'puppeteer-core'
const OUT = process.argv[2] || '.'
const errors = []
const step = (m) => console.log('  …', m)

const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const page = await b.newPage()
await page.setViewport({ width: 1500, height: 1000 })
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

const go = async (h) => { await page.goto(`http://localhost:5199/#${h}`, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 600)) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true })
const click = async (t) => {
  const ok = await page.evaluate((x) => {
    const el = [...document.querySelectorAll('button')].find((e) => e.textContent.trim().includes(x))
    if (el) { el.click(); return true } return false
  }, t)
  if (!ok) throw new Error(`bouton introuvable: ${t}`)
  await new Promise(r => setTimeout(r, 500))
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

// Alimenter la base : parcours client complet jusqu'au paiement.
step('parcours client')
await go('/creer/activite')
await click('Menuisier')
await go('/creer/final')
await click('Voir le prix de réalisation')
await click('Demander la réalisation')
await type('Prénom', 'Marc')
await type('Nom', 'Durand')
await type('Email', 'marc.durand@example.com')
await click('Enregistrer mon projet')
await new Promise(r => setTimeout(r, 900))
// Nom de domaine (§59) : l'etape s'intercale entre la demande et l'acompte.
// Ce scenario ne la teste pas — conversion.mjs s'en charge — il la traverse.
await click('Choisir')
await new Promise(r => setTimeout(r, 400))
await click('Continuer vers')
await new Promise(r => setTimeout(r, 700))
await type('Titulaire de la carte', 'Marc Durand')
await type('Numéro de carte', '4242424242424242')
await type('Expiration', '1228')
await type('CVC', '123')
await click('Payer')
await new Promise(r => setTimeout(r, 2200))

step('dashboard')
await go('/admin')
await shot('20-admin-projets')
const dash = (await page.evaluate(() => document.body.innerText)).toLowerCase()
if (!/administration/.test(dash)) errors.push('admin : page non rendue')
if (!/acomptes encaissés/.test(dash)) errors.push('admin : indicateurs absents')
const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length)
if (rowCount < 1) errors.push('admin : aucun projet listé alors que la base en contient')
if (!/acompte payé/.test(dash)) errors.push('admin : le statut du projet payé ne remonte pas')

step('leads')
await click('Leads')
const leads = await page.evaluate(() => document.body.innerText)
if (!/marc\.durand@example\.com/.test(leads)) errors.push('admin : le lead ne remonte pas dans l\'onglet Leads')
await shot('21-admin-leads')

step('paiements')
await click('Paiements')
const pay = (await page.evaluate(() => document.body.innerText)).toLowerCase()
if (!/sim-/.test(pay)) errors.push('admin : le paiement ne remonte pas')
if (!/simulé/.test(pay)) errors.push('admin : le paiement simulé n\'est pas signalé comme tel')
await shot('22-admin-paiements')

// Total du projet avant modification des tarifs : l'assertion doit porter sur
// l'ECART (+500 €) et non sur un montant en dur, qui bougerait a chaque
// evolution des modules par defaut d'un metier.
await click('Projets')
await new Promise(r => setTimeout(r, 500))
const totalBefore = await page.evaluate(() => {
  const cells = document.querySelector('tbody tr').querySelectorAll('td')
  return Number(cells[4].textContent.replace(/[^\d]/g, ''))
})

step('tarification')
await click('Tarification')
await new Promise(r => setTimeout(r, 500))
const pricing = (await page.evaluate(() => document.body.innerText)).toLowerCase()
if (!/prix de base/.test(pricing)) errors.push('admin : éditeur de tarifs absent')
// Modifier le prix de base doit changer le devis du projet
await page.evaluate(() => {
  const lab = [...document.querySelectorAll('label')].find((e) => e.textContent.trim().startsWith('Prix de base'))
  const input = lab.querySelector('input')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, '900')
  input.dispatchEvent(new Event('input', { bubbles: true }))
})
await new Promise(r => setTimeout(r, 300))
await shot('23-admin-tarifs')
await click('Enregistrer les tarifs')
await new Promise(r => setTimeout(r, 900))

step('répercussion du tarif')
await click('Projets')
await new Promise(r => setTimeout(r, 700))
const totalAfter = await page.evaluate(() => {
  const cells = document.querySelector('tbody tr').querySelectorAll('td')
  return Number(cells[4].textContent.replace(/[^\d]/g, ''))
})
if (totalAfter - totalBefore !== 500) {
  errors.push(`tarification : ${totalBefore} € -> ${totalAfter} €, ecart de ${totalAfter - totalBefore} € au lieu de 500 €`)
}

step('historique')
await click('Tarification')
await new Promise(r => setTimeout(r, 600))
const hist = await page.evaluate(() => document.body.innerText)
if (!/400 → 900/.test(hist.replace(/\s+/g, ' '))) errors.push('tarification : le changement n\'est pas historisé')

step('détail projet')
await click('Projets')
await new Promise(r => setTimeout(r, 500))
await page.evaluate(() => document.querySelector('tbody tr').click())
await new Promise(r => setTimeout(r, 700))
const detail = (await page.evaluate(() => document.body.innerText)).toLowerCase()
for (const expected of ['Ce que le client a construit', 'Pages et sections', 'Client', 'Devis', 'Paiements', 'Statut', 'Versions']) {
  if (!detail.includes(expected.toLowerCase())) errors.push(`détail projet : bloc « ${expected} » absent`)
}
await shot('24-admin-detail')

step('voir la maquette')
await click('Voir la maquette')
const preview = await page.evaluate(() => !!document.querySelector('.site-root'))
if (!preview) errors.push('détail projet : la maquette ne s\'affiche pas')
await shot('25-admin-maquette')

await b.close()
if (errors.length) { console.log('ECHECS :'); errors.forEach((e) => console.log(' -', e)); process.exit(1) }
console.log('OK — administration : projets, leads, paiements, tarification, détail, maquette')
