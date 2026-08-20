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
const click = async (t, scope = 'button') => {
  const ok = await page.evaluate((x, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(x))
    if (el) { el.click(); return true } return false
  }, t, scope)
  if (!ok) throw new Error(`introuvable: ${t}`)
  await new Promise(r => setTimeout(r, 450))
}

// Assistant (§39)
step('assistant')
await go('/creer/activite')
await click('Créer automatiquement mon site')
await page.evaluate(() => {
  const ta = document.querySelector('.fixed textarea')
  Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    .call(ta, 'Je suis menuisier à Blois et je fabrique des meubles sur mesure.')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
})
await new Promise(r => setTimeout(r, 250))
await click('Analyser ma description')
const understood = await page.evaluate(() => document.querySelector('.fixed').innerText)
if (!/Menuisier/.test(understood)) errors.push(`assistant : métier non reconnu (${understood.replace(/\n/g, ' | ').slice(0, 160)})`)
if (!/Blois/.test(understood)) errors.push('assistant : ville non reconnue')
if (!/aucun modèle d'intelligence artificielle/i.test(understood)) errors.push('assistant : la nature locale de l\'analyse n\'est pas annoncée')
await shot('40-assistant')

await click('Construire mon site')
await new Promise(r => setTimeout(r, 900))
const built = await page.evaluate(async () => {
  const open = () => new Promise((res) => { const r = indexedDB.open('service-web'); r.onsuccess = () => res(r.result) })
  const db = await open()
  const rows = await new Promise((res) => { const t = db.transaction('projects').objectStore('projects').getAll(); t.onsuccess = () => res(t.result) })
  const p = rows[0]?.data
  return { activity: p?.activityId, theme: p?.themeId, city: p?.identity.city, tagline: p?.identity.tagline }
})
if (built.activity !== 'menuisier') errors.push(`assistant : activité appliquée = ${built.activity}`)
if (built.city !== 'Blois') errors.push(`assistant : ville appliquée = ${built.city}`)
if (!built.tagline) errors.push('assistant : aucun slogan proposé')
if (built.theme === 'modern') errors.push('assistant : le thème n\'a pas été adapté au métier')
await shot('41-apres-assistant')

// SEO (§40)
step('seo')
await page.evaluate(() => document.querySelector('aside nav button[aria-label="Référencement"]').click())
await new Promise(r => setTimeout(r, 400))
const seo = await page.evaluate(() => document.querySelector('aside').innerText)
if (!/Aperçu dans Google/i.test(seo)) errors.push('seo : aperçu Google absent')
if (!/Favicon/i.test(seo)) errors.push('seo : favicon absent')
if (!/Open Graph/i.test(seo)) errors.push('seo : Open Graph absent')
await shot('42-seo')

// QR (§25)
step('qr')
const hasQrTab = await page.evaluate(() => Boolean(document.querySelector('aside nav button[aria-label="QR Code"]')))
if (!hasQrTab) errors.push('qr : onglet absent')
else {
  await page.evaluate(() => document.querySelector('aside nav button[aria-label="QR Code"]').click())
  // Le panneau est charge a la demande, puis chaque code est genere en asynchrone.
  await new Promise(r => setTimeout(r, 2500))
  const codes = await page.evaluate(() => [...document.querySelectorAll('aside img')]
    .filter((img) => img.src.startsWith('data:image/png')).length)
  if (codes < 2) errors.push(`qr : ${codes} code(s) généré(s)`)
  await shot('43-qr')
}

// TV (§24) — le menuisier n'a pas le module TV : on l'active
step('tv')
await go('/creer/fonctionnalites')
await click('Affichage TV')
await go('/tv')
const tv = await page.evaluate(() => document.body.innerText)
if (!/Carte|Grille|Mise en avant/.test(tv)) errors.push('tv : sélecteur de mise en page absent')
const ratio = await page.evaluate(() => {
  const el = document.querySelector('.site-root')
  return el ? Math.round((el.style.width.replace('px','') / el.style.height.replace('px','')) * 100) / 100 : 0
})
if (Math.abs(ratio - 16 / 9) > 0.02) errors.push(`tv : format ${ratio} au lieu de 16:9`)
await shot('44-tv')

await b.close()
if (errors.length) { console.log('ECHECS :'); errors.forEach((e) => console.log(' -', e)); process.exit(1) }
console.log('OK — assistant, SEO, QR codes, écran TV')
