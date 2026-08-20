import puppeteer from 'puppeteer-core'

/**
 * Verticale automobile : selecteur de vehicule, forfaits d'entretien, recherche
 * de pneus par dimension, devis carrosserie en photos, programme de formation,
 * financement — et la recherche de metier par mots-cles.
 */
const OUT = process.argv[2] || '.'
const errors = []
const step = (m) => console.log('  …', m)

// Vocabulaire de la PLATEFORME : interdit avant la page finale (§56). Les prix
// que le CLIENT affiche sur son propre site restent legitimes.
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer)/i

const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
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
const site = () => page.evaluate(() => document.querySelector('.site-root').innerText)
const expect = (text, needles, where) => {
  for (const needle of needles) {
    if (!text.includes(needle)) errors.push(`${where} : « ${needle} » absent`)
  }
}
const start = async (metier) => {
  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
  await page.evaluate(() => indexedDB.deleteDatabase('service-web'))
  // Rechargement : tant que l'onglet garde sa connexion ouverte, la suppression
  // reste en attente et le projet precedent revient.
  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
  await go('/creer/activite')
  await click(metier)
  await new Promise(r => setTimeout(r, 400))
}

// --- Recherche de metier par mots-cles ------------------------------------
step('recherche par mots-clés')
await go('/creer/activite')
const search = async (q) => {
  await page.evaluate((value) => {
    const input = document.querySelector('input[aria-label="Rechercher une activité"]')
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, q)
  await new Promise(r => setTimeout(r, 250))
  return page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
}
// Le client tape ce qu'il fait, pas le libelle du catalogue.
expect(await search('carrosserie'), ['Carrossier'], 'recherche « carrosserie »')
expect(await search('pneu'), ['Pneus & jantes'], 'recherche « pneu »')
expect(await search('mecanique'), ['Garage / Mécanique générale'], 'recherche sans accent')
expect(await search('cpf'), ['Centre de formation automobile'], 'recherche « cpf »')

// --- Centre auto : selecteur de vehicule, forfaits, promotions ------------
step('centre auto')
await start('Centre auto')
const builder = await page.evaluate(() => document.body.innerText)
if (LEAK.test(builder)) errors.push(`FUITE TARIFAIRE dans le builder : « ${builder.match(LEAK)[0]} »`)

await go('/apercu')
const centre = await site()
expect(centre, [
  'Sélectionnez votre véhicule', 'Marque', 'Modèle', 'Motorisation',
  'Ou saisissez votre plaque', 'AB-123-CD', 'Valider mon véhicule',
  'Nos forfaits d’entretien', 'Forfait vidange', 'Révision complète',
  'contrôle 20 points',
  'Rendez-vous en ligne en moins d’une minute',
], 'accueil centre auto')
// Le catalogue d'exemple doit etre celui du metier, pas les libelles neutres.
expect(centre, ['Batterie et démarrage', 'Montage de pneus'], 'prestations centre auto')
// Les sections venues de la restauration (`offers`, `loyalty`) sont rhabillees
// par le metier : un centre auto ne parle ni de menu ni de plat.
expect(centre, ['Nos promotions du moment', 'Pack révision + freinage'], 'promotions centre auto')
for (const mot of ['menu du midi', 'Menu enfant', 'plat', 'table']) {
  if (centre.toLowerCase().includes(mot.toLowerCase())) {
    errors.push(`centre auto : vocabulaire de restauration hérité — « ${mot} »`)
  }
}
if (centre.includes('Première prestation')) errors.push('centre auto : le catalogue d’exemple générique n’a pas été remplacé')
await shot('60-auto-centre')

step('page forfaits')
await click('Nos forfaits', '.site-root header button')
expect(await site(), ['Forfait freinage', 'Comment ça se passe'], 'page forfaits')

// --- Pneus : recherche par dimension --------------------------------------
step('pneus')
await start('Pneus & jantes')
await go('/apercu')
const pneus = await site()
expect(pneus, [
  'Trouvez vos pneus', 'Largeur', 'Diamètre', 'Indice de charge',
  'monte d’origine', 'Voir les pneus compatibles', 'Pneus hiver',
], 'accueil pneus')
await shot('61-auto-pneus')

// --- Carrosserie : devis en photos, avant/apres ---------------------------
step('carrosserie')
await start('Carrossier / Peintre auto')
await go('/apercu')
const carrosserie = await site()
expect(carrosserie, ['Avant / après réparation', 'Après le choc', 'Débosselage sans peinture'], 'accueil carrosserie')
await click('Devis', '.site-root header button')
expect(await site(), ['Votre devis en trois photos', 'Envoyer mes photos'], 'page devis carrosserie')
await shot('62-auto-carrosserie')

// --- Formation : programme, durees, financement ---------------------------
step('centre de formation')
await start('Centre de formation automobile')
await go('/apercu')
const accueil = await site()
expect(accueil, ['Financer votre formation', 'Compte personnel de formation', 'Alternance', 'de réussite à l’examen'], 'accueil formation')
if (/\d+\s*€/.test(accueil)) errors.push('formation : un montant apparaît alors qu’aucun n’est saisi')

await click('Nos formations', '.site-root header button')
const programme = await site()
expect(programme, [
  'CAP Maintenance des véhicules', 'Le programme', 'Moteur et périphériques',
  '120 h', 'Période en entreprise', '12 semaines',
], 'page formations')
await shot('63-auto-formation')

await click('Financement', '.site-root header button')
expect(await site(), ['France Travail', 'Paiement en plusieurs fois', 'conseiller vérifie votre éligibilité'], 'page financement')

// --- Sessions et documents du centre de formation -------------------------
step('agenda et documents')
await click('Sessions', '.site-root header button')
const sessions = await site()
expect(sessions, ['Prochaines sessions', 'SEPT.', 'CAP Maintenance des véhicules', 'Temps plein, 9 mois'], 'agenda des sessions')
// L'etiquette de disponibilite est rendue en majuscules par la section.
if (!/places limit/i.test(sessions)) errors.push('agenda : l’étiquette de disponibilité est absente')
await click('Nos formations', '.site-root header button')
expect(await site(), ['À télécharger', 'Programme détaillé du CAP', 'Guide du financement'], 'documents')
await click('Le centre', '.site-root header button')
const centreText = await site()
expect(centreText, ['Nos certifications', 'France Compétences', 'RNCP'], 'certifications du centre')
// La mention par defaut de la section est une consigne au client : jamais en ligne.
if (/Remplacez ces exemples/.test(centreText)) errors.push('certifications : la consigne au client reste affichée')
await shot('67-auto-certifications')

// --- Garage et dépannage : engagements et zone d'intervention -------------
step('engagements du garage')
await start('Garage / Mécanique générale')
await go('/apercu')
expect(await site(), ['Nos engagements', 'Devis avant intervention', 'Véhicule de prêt'], 'engagements garage')

step('zone d’intervention du dépanneur')
await start('Dépannage / Remorquage')
await go('/apercu')
const depannage = await site()
expect(depannage, ['Notre zone d’intervention', 'Sur place en moins de 30 minutes', 'Autoroutes et voies rapides', 'Disponible 24 h/24'], 'dépannage')
if (/\bkm\b/.test(depannage)) errors.push('dépannage : la zone est exprimée en kilomètres, pas en minutes')
await shot('68-auto-depannage')

// --- Page finale : aucun montant avant la revelation (§56) ----------------
step('page finale')
await go('/creer/final')
const before = await page.evaluate(() => document.body.innerText)
if (/\d+\s*€/.test(before)) errors.push('page finale : un montant est visible AVANT la révélation')
if (LEAK.test(before.replace(/Voir le prix de réalisation/g, ''))) {
  errors.push(`page finale : « ${before.match(LEAK)[0] } » avant révélation`)
}
await click('Voir le prix de réalisation')
const after = await page.evaluate(() => document.body.innerText)
if (!/Acompte pour démarrer/.test(after)) errors.push('page finale : le prix ne se révèle pas')
await shot('64-auto-final')

console.log(errors.length ? 'ERREURS:\n' + errors.join('\n') : 'OK — automobile : sélecteur de véhicule, forfaits, pneus, carrosserie, formation')
await b.close()
process.exit(errors.length ? 1 : 0)
