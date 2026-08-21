import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5199'
// Par defaut, les captures sortent DU depot : `npm run smoke` ne passe aucun
// argument, et le dossier courant est la racine du projet.
const OUT = process.argv[2] || process.env.SHOTS || '/tmp/studio-captures'
mkdirSync(OUT, { recursive: true })
const errors = []
const step = (m) => console.log('  …', m)

/**
 * Detecteur de fuite tarifaire (§56), repris de parcours.mjs et durci d'un
 * motif « nombre suivi de € » : les formules se comparent en fonctionnalites et
 * en QUANTITES de travail humain, jamais en montants. Un « a partir de 550 € »
 * sur l'ecran des formules serait la fuite la plus couteuse du tunnel, c'est
 * celle qu'on traque ici.
 *
 * Aucune exemption : l'ecran de choix annonce que le prix viendra a la fin sans
 * jamais employer les tournures traquees, le detecteur reste donc entier. Les
 * quotas de service affiches sur les cartes (« 6 pages redigees par nos soins »)
 * sont des QUANTITES : elles n'ouvrent aucune exemption, elles n'en ont pas
 * besoin — une quantite ne porte pas d'euro.
 */
const LEAK = /(prix de r[ée]alisation|co[ûu]t du site|acompte|votre devis|total [àa] payer|tarif de la prestation web|\d\s*€)/i

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
const hash = () => page.evaluate(() => location.hash)
const body = () => page.evaluate(() => document.body.innerText)
const clickText = async (text, sel = 'button') => {
  const ok = await page.evaluate((t, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t))
    if (el) { el.click(); return true }
    return false
  }, text, sel)
  if (!ok) throw new Error(`introuvable: ${text}`)
  await wait(400)
}
const checkLeak = async (where) => {
  const text = await page.evaluate(() => {
    // La maquette du client est ecartee : les prix qu'elle affiche sont les
    // SIENS sur son propre site, legitimes partout (§56). On ne traque que les
    // montants de la plateforme.
    const clone = document.body.cloneNode(true)
    clone.querySelectorAll('.site-root').forEach((n) => n.remove())
    return clone.textContent.replace(/\s+/g, ' ')
  })
  const hit = text.match(LEAK)
  if (hit) errors.push(`FUITE TARIFAIRE sur ${where} : « ${hit[0]} »`)
}

// --- Activite, puis l'etape des formules -----------------------------------
step('activité')
await go('/creer/activite')
await clickText('Restaurant')
await clickText('Continuer')
if (!(await hash()).includes('/creer/formule')) {
  errors.push(`formule : l'étape ne s'intercale pas après l'activité (hash=${await hash()})`)
  await go('/creer/formule')
}

step('les trois formules')
const cards = await body()
// Les libelles viennent du catalogue : on teste ce que le client lit, pas les
// identifiants. `innerText` respecte les majuscules CSS, d'ou le mode insensible.
if (!/De quoi avez-vous besoin \?/i.test(cards)) errors.push('formule : le titre de l\'écran est absent')
for (const label of ['site modèle', 'site sur mesure', 'site clé en main']) {
  if (!new RegExp(`Choisir le ${label}`, 'i').test(cards)) {
    errors.push(`formule : la carte « ${label} » est absente`)
  }
}

/**
 * Les cartes sont lues UNE PAR UNE plutot que cherchees dans le texte de la
 * page : c'est le seul moyen de verifier que chaque formule porte SA pastille.
 * Un catalogue qui recopierait « Le plus choisi » sur deux formules passerait
 * une recherche de texte, pas celle-ci.
 */
const planCards = await page.evaluate(() => {
  const articles = [...document.querySelectorAll('article')].filter((a) => a.querySelector('button[aria-pressed]'))
  return articles.map((a) => {
    const title = a.querySelector('h2')
    return {
      title: title?.textContent.trim() ?? '',
      badge: title?.previousElementSibling?.textContent.trim() ?? '',
      lines: [...a.querySelectorAll('li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
    }
  })
})
if (planCards.length !== 3) errors.push(`formule : ${planCards.length} cartes au lieu de trois`)
const badges = planCards.map((c) => c.badge).filter(Boolean)
if (badges.length !== planCards.length) {
  errors.push(`formule : ${badges.length} pastilles pour ${planCards.length} cartes (${planCards.map((c) => `${c.title}=${c.badge || '∅'}`).join(', ')})`)
}
if (new Set(badges).size !== badges.length) {
  errors.push(`formule : deux formules portent la même pastille (${badges.join(', ')})`)
}

// Ce que la formule fait POUR le client est annonce en quantites — c'est la
// promesse qui separe le cle en main du sur-mesure, elle doit etre lisible sur
// chaque carte. Le detecteur qui suit prouve qu'aucune ne se chiffre en euros.
for (const card of planCards) {
  if (!card.lines.some((l) => /\d+ pages rédigées par nos soins/i.test(l))) {
    errors.push(`formule : la carte « ${card.title} » n'annonce pas ses pages rédigées`)
  }
  if (!card.lines.some((l) => /\d+ images d'illustration/i.test(l))) {
    errors.push(`formule : la carte « ${card.title} » n'annonce pas ses images d'illustration`)
  }
}
await checkLeak('formule')
await shot('70-formules')

// --- Descente vers le site modele ------------------------------------------
step('choix du site modèle')
await clickText('Choisir le site modèle')
// Un metier arrive avec ses modules : la descente en ferme, et elle doit le
// DIRE avant de le faire. La confirmation est donc attendue, pas subie.
if (/retire des fonctionnalités/i.test(await body())) {
  await clickText('Continuer', '.fixed button')
} else {
  errors.push('formule : la descente ne nomme pas les fonctionnalités qu\'elle retire')
}
const chosen = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button[aria-pressed="true"]')].find((b) => /Choisir le/.test(b.textContent))
  return el ? el.textContent.trim() : null
})
if (!chosen || !/site modèle/i.test(chosen)) errors.push(`formule : le choix ne se marque pas sur la carte (${chosen})`)

// --- Fonctionnalites : le seau des modules fermes ---------------------------
step('fonctionnalités fermées')
await go('/creer/fonctionnalites')
const features = await body()
if (!/Disponibles avec le site sur mesure/i.test(features)) {
  errors.push('fonctionnalités : le seau « Disponibles avec le site sur mesure » est absent')
}
await checkLeak('fonctionnalites')

const cartState = () => page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((h) => /disponibles avec/i.test(h.textContent))
  const section = heading?.closest('section')
  return {
    // Le panier est-il propose comme une case a cocher ordinaire ?
    active: [...document.querySelectorAll('button[aria-pressed="true"]')].some((b) => b.textContent.includes('Panier')),
    toggle: [...document.querySelectorAll('button[aria-pressed]')].some((b) => b.textContent.includes('Panier')),
    blocked: Boolean(section && section.textContent.includes('Panier')),
  }
})
const cartBefore = await cartState()
if (!cartBefore.blocked) errors.push('fonctionnalités : le panier n\'est pas rangé dans les fonctionnalités fermées')
if (cartBefore.toggle) errors.push('fonctionnalités : le panier reste une case à cocher ordinaire')
await shot('71-fonctionnalites-fermees')

// Le clic n'est jamais avale : il explique et propose la montee, il n'active
// rien en silence.
await page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((h) => /disponibles avec/i.test(h.textContent))
  const card = [...(heading?.closest('section')?.querySelectorAll('div') ?? [])]
    .find((d) => d.className.includes('cursor-pointer') && d.textContent.includes('Panier'))
  card?.click()
})
await wait(400)
const dialog = await body()
if (!/fait partie du site sur mesure/i.test(dialog)) {
  errors.push('fonctionnalités : le clic sur une fonctionnalité fermée n\'explique rien')
}
await clickText('Rester sur le site modèle')
const cartAfter = await cartState()
if (cartAfter.active) errors.push('fonctionnalités : le panier a été activé alors que la formule le ferme')
if (!cartAfter.blocked) errors.push('fonctionnalités : le panier a quitté le seau des fonctionnalités fermées')

// --- Builder : le plafond de pages ------------------------------------------
step('plafond de pages')
await go('/creer/site')
await checkLeak('builder')
await page.evaluate(() => document.querySelector('aside nav button[aria-label="Pages"]')?.click())
await wait(400)

const pagesPanel = () => page.evaluate(() => {
  const input = document.querySelector('input[placeholder="Nouvelle page"]')
  if (!input) return null
  const root = input.closest('div.p-4')
  return {
    count: root.querySelectorAll('ul > li').length,
    disabled: input.disabled,
    notice: root.innerText,
  }
})
const addPage = async (name) => {
  await page.evaluate((n) => {
    const input = document.querySelector('input[placeholder="Nouvelle page"]')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, n)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, name)
  await wait(120)
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Nouvelle page"]')
    input.parentElement.querySelector('button')?.click()
  })
  await wait(300)
}

const start = await pagesPanel()
if (!start) {
  errors.push('builder : panneau des pages introuvable')
} else {
  // On monte jusqu'au plafond sans le connaitre : le panneau se ferme de
  // lui-meme, et c'est cette fermeture qu'on mesure. La borne de boucle n'est
  // qu'un garde-fou.
  let panel = start
  for (let i = 1; !panel.disabled && i <= 12; i += 1) {
    await addPage(`Page ${i}`)
    panel = await pagesPanel()
  }
  const ceiling = panel.count
  if (!panel.disabled) errors.push(`pages : ${ceiling} pages créées sans que l'ajout se ferme`)
  if (!/6 pages — le site sur mesure n'a pas de limite\./i.test(panel.notice)) {
    errors.push('pages : le bandeau du plafond n\'annonce pas la limite ni le site sur mesure')
  }
  if (!/Passer au site sur mesure/i.test(panel.notice)) errors.push('pages : le bandeau ne propose pas la montée en gamme')
  // La suivante est refusee : le controle est desactive, et le compte ne bouge pas.
  await addPage('Page de trop')
  const after = await pagesPanel()
  if (after.count !== ceiling) errors.push(`pages : ${after.count} pages après le plafond de ${ceiling}`)
}
await shot('72-plafond-pages')

// --- Liens profonds vers les ecrans monetaires (§56) ------------------------
// Les scenarios marchent vers l'avant ; personne ne verifiait ce qui se passe
// quand on TAPE l'URL d'un ecran qui affiche des montants. C'est exactement par
// la qu'un devis a fui : un signet, un historique, une adresse recopiee.
step('liens profonds')
for (const route of ['/confirmation', '/paiement', '/creer/domaine']) {
  await go(route)
  // On traque un MONTANT et non le vocabulaire complet : la redirection tombe
  // sur la page finale, dont le bouton « Voir le prix de réalisation » emploie
  // legitimement une des tournures surveillees. Un chiffre suivi d'un euro, lui,
  // n'a rien a faire ici tant que le client n'a pas cliqué.
  const visibleMoney = await page.evaluate(() => {
    const clone = document.body.cloneNode(true)
    clone.querySelectorAll('.site-root').forEach((n) => n.remove())
    return (clone.textContent.replace(/\s+/g, ' ').match(/\d\s*€/) ?? [null])[0]
  })
  if (visibleMoney) errors.push(`lien profond ${route} : montant « ${visibleMoney} » avant la révélation`)
  const where = await hash()
  if (where.includes(route)) {
    errors.push(`lien profond ${route} : l'ecran s'ouvre alors que le prix n'a pas ete revele`)
  }
  if (!where.includes('/creer/final')) {
    errors.push(`lien profond ${route} : renvoie vers ${where} au lieu de la page finale`)
  }
  const visible = (await body()).trim().length
  if (visible < 40) errors.push(`lien profond ${route} : page blanche (${visible} caracteres)`)
}
await shot('76-liens-profonds')

// --- Page finale : le devis nomme la formule --------------------------------
step('page finale')
await go('/creer/final')
const checklist = await body()
if (!/Formule\s*—\s*Site modèle/i.test(checklist)) {
  errors.push('page finale : la checklist ne porte pas « Formule — Site modèle »')
}
const beforeReveal = await page.evaluate(() => {
  const clone = document.body.cloneNode(true)
  clone.querySelectorAll('.site-root').forEach((n) => n.remove())
  return /\d\s*€/.test(clone.textContent)
})
if (beforeReveal) errors.push('page finale : un montant est visible AVANT la révélation')
await shot('73-final-avant')

step('révélation')
await clickText('Voir le prix de réalisation')

const readQuote = () => page.evaluate(() => {
  const money = (root, label) => {
    const row = [...root.querySelectorAll('div')].find((d) => d.children.length === 2 && d.children[0].textContent.trim() === label)
    return row ? Number(row.children[1].textContent.replace(/[^\d]/g, '')) : null
  }
  const cards = [...document.querySelectorAll('aside .card')]
  // Le devis est la carte qui porte une ligne « Realisation ». La comparaison
  // n'est plus une carte a part : elle vit dans les onglets de cette carte.
  const quote = cards.find((c) => money(c, 'Réalisation') !== null)
  const tabs = quote ? [...quote.querySelectorAll('button')].filter((b) => /^Site /.test(b.textContent.trim())) : []
  return {
    plan: quote ? quote.innerText : '',
    firstLine: quote ? (quote.querySelector('li')?.innerText ?? '') : '',
    total: quote ? money(quote, 'Réalisation') : null,
    // Le devis ligne par ligne. Une ligne de service se PROUVE par sa presence
    // ou son absence, jamais par un montant : c'est ce qui rend les assertions
    // qui suivent indifferentes au bareme.
    lines: quote
      ? [...quote.querySelectorAll('ul > li')].map((li) => {
          const [label, ...rest] = li.children[0].innerText.split('\n')
          return { label: label.trim(), detail: rest.join(' ').replace(/\s+/g, ' ').trim() }
        })
      : [],
    // Onglets du selecteur : leur libelle, et celui qui porte la puce est la
    // formule REELLE du projet — les autres ne sont que regardees.
    tabs: tabs.map((b) => b.textContent.replace('•', '').trim()),
    current: (tabs.find((b) => b.textContent.includes('•')) ?? {}).textContent?.replace('•', '').trim() ?? null,
    // L'action proposee : « Demander la realisation » sur sa propre formule,
    // « Passer au … » sur une autre.
    action: quote ? ([...quote.querySelectorAll('button')].map((b) => b.textContent.trim())
      .find((t) => /^(Demander la réalisation|Passer au |Continuer)/.test(t)) ?? null) : null,
  }
})

/** Regarde une autre formule dans le selecteur, sans en changer. */
const showTab = async (label) => {
  await page.evaluate((t) => {
    const aside = [...document.querySelectorAll('aside')].pop()
    const el = [...aside.querySelectorAll('button')].find((b) => b.textContent.replace('•', '').trim() === t)
    if (!el) throw new Error('onglet introuvable : ' + t)
    el.click()
  }, label)
  await wait(350)
  return readQuote()
}
/** Une ligne du devis par son libelle, ou null si le moteur ne l'a pas emise. */
const lineOf = (quote, label) => quote.lines.find((l) => l.label === label) ?? null
const model = await readQuote()
if (model.total === null) errors.push('page finale : le devis ne se révèle pas')
if (!/Site modèle/i.test(model.plan)) errors.push('devis : la formule retenue n\'est pas nommée')
if (!/Site modèle/i.test(model.firstLine)) errors.push(`devis : la première ligne ne nomme pas la formule (« ${model.firstLine.split('\n')[0]} »)`)
// Le selecteur propose les trois formules, et marque celle du projet.
if (model.tabs.length !== 3) errors.push(`sélecteur : ${model.tabs.length} onglets au lieu de 3`)
if (model.current !== 'Site modèle') errors.push(`sélecteur : la formule marquée est « ${model.current} »`)
if (model.action !== 'Demander la réalisation') {
  errors.push(`sélecteur : sur sa propre formule, l'action est « ${model.action} »`)
}
// Regarder une autre formule recalcule le devis sur LE MEME projet.
const vuSurMesure = await showTab('Site sur mesure')
if (!(vuSurMesure.total > model.total)) {
  errors.push(`comparaison : ${vuSurMesure.total} pour le sur-mesure contre ${model.total} pour le modèle`)
}
if (vuSurMesure.current !== 'Site modèle') {
  errors.push('comparaison : regarder une formule a changé celle du projet')
}
if (!/^Passer au/.test(vuSurMesure.action ?? '')) {
  errors.push(`comparaison : aucune action pour adopter la formule regardée (« ${vuSurMesure.action} »)`)
}
// Services (§60) : en modele, le quota de redaction est cale sur le plafond de
// pages. On vient justement de remplir le site jusqu'au plafond ; aucune ligne
// « Redaction de pages » ne peut donc apparaitre, sous peine de facturer un
// depassement que la formule rend inatteignable.
const modelWriting = lineOf(model, 'Rédaction de pages')
if (modelWriting) {
  errors.push(`services : « Rédaction de pages » facturée en modèle (« ${modelWriting.detail} ») alors que le quota couvre le plafond`)
}
// --- Ce que la page finale doit montrer autour du devis ---------------------
// L'apercu doit etre manipulable (c'est le moment ou le client se projette) et
// la suite doit etre annoncee (il vient de voir un montant, il achete aussi une
// suite). Deux choses qui ne se voient pas dans un devis.
const page404 = await page.evaluate(() => {
  const section = document.querySelector('main section')
  const aside = [...document.querySelectorAll('aside')].pop()
  const boutons = section ? [...section.querySelectorAll('button')].map((b) => b.textContent.trim()) : []
  return {
    appareils: ['Ordinateur', 'Tablette', 'Mobile'].filter((v) => boutons.includes(v)).length,
    pages: boutons.filter((t) => ['Accueil', 'Services', 'Contact'].includes(t)).length,
    suite: /ce qui se passe ensuite/i.test(aside.innerText),
    // Compte fait DANS la frise seulement : « Realisation » est aussi une ligne
    // du devis, et la compter deux fois rendrait l'assertion complaisante.
    etapes: ((aside.innerText.split(/ce qui se passe ensuite/i)[1] ?? '')
      .match(/Acompte réglé|Nous vous appelons|Réalisation|Vous validez|Mise en ligne/g) ?? []).length,
    email: /Recevoir mon devis par email/.test(aside.innerText),
  }
})
if (page404.appareils !== 3) errors.push(`aperçu : ${page404.appareils} onglets d'appareil sur 3`)
if (page404.pages < 2) errors.push(`aperçu : la navigation entre pages est absente (${page404.pages})`)
if (!page404.suite) errors.push('page finale : « ce qui se passe ensuite » est absent')
if (page404.etapes < 4) errors.push(`page finale : ${page404.etapes} étapes annoncées après l'acompte`)
if (!page404.email) errors.push('page finale : pas de moyen de recevoir son devis par email')

// L'apercu change vraiment d'appareil : le cadre prend la largeur du mobile.
await page.evaluate(() => {
  const section = document.querySelector('main section')
  const el = [...section.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Mobile')
  el?.click()
})
await wait(500)
const largeurMobile = await page.evaluate(() => {
  const cadre = document.querySelector('main section .overflow-hidden > div')
  return cadre ? Math.round(cadre.getBoundingClientRect().width) : null
})
if (largeurMobile === null || largeurMobile > 500) {
  errors.push(`aperçu : le mode mobile rend un cadre de ${largeurMobile}px`)
}
await page.evaluate(() => {
  const section = document.querySelector('main section')
  const el = [...section.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ordinateur')
  el?.click()
})
await wait(400)

await shot('74-final-modele')

// --- Premier barreau : modele → sur mesure ----------------------------------
step('montée vers le sur-mesure')
await clickText('Passer au site sur mesure')
await wait(400)
const custom = await readQuote()
if (!(custom.total > model.total)) errors.push(`montée : devis à ${custom.total} contre ${model.total} en modèle`)
// Le montant annonce par la comparaison est celui qu'on obtient : elle portait
// bien sur SON site, pas sur un site type.
if (custom.total !== vuSurMesure.total) {
  errors.push(`montée : ${custom.total} obtenu alors que le sélecteur annonçait ${vuSurMesure.total}`)
}
if (!/Site sur mesure/i.test(custom.plan)) errors.push('montée : le devis ne nomme pas la nouvelle formule')
// Le sur-mesure n'est plus le haut de l'echelle : la carte doit desormais
// proposer le cle en main. Meme moteur, memes modules, memes plafonds — ce qui
// se paie en plus, c'est le travail humain, donc un devis plus eleve.
const vuCleEnMain = await showTab('Site clé en main')
if (!(vuCleEnMain.total > custom.total)) {
  errors.push(`comparaison : ${vuCleEnMain.total} pour le clé en main contre ${custom.total} pour le sur-mesure`)
}
await showTab('Site sur mesure')
await shot('75-final-sur-mesure')

// --- Services : la redaction se facture au-dela du quota --------------------
// Le sur-mesure n'a plus de plafond de pages : on depasse son quota de redaction
// et la ligne doit apparaitre, avec le BON compte. Ni le quota ni le tarif ne
// sont ecrits ici — le compte se relit dans le detail de la ligne et doit
// boucler avec le nombre de pages du site.
step('rédaction au-delà du quota')
await go('/creer/site')
await page.evaluate(() => document.querySelector('aside nav button[aria-label="Pages"]')?.click())
await wait(400)
const beforeWriting = await pagesPanel()
if (!beforeWriting) {
  errors.push('services : panneau des pages introuvable après la montée')
} else {
  if (beforeWriting.disabled) {
    errors.push('services : l\'ajout reste fermé alors que le site sur mesure n\'a pas de limite de pages')
  }
  for (let i = 1; i <= 7; i += 1) await addPage(`Rédaction ${i}`)
}
const written = await pagesPanel()
await go('/creer/final')
const writing = await readQuote()
const writtenLine = lineOf(writing, 'Rédaction de pages')
if (!writtenLine) {
  errors.push(`services : ${written?.count} pages en sur-mesure sans ligne « Rédaction de pages »`)
} else {
  const counts = writtenLine.detail.match(/(\d+) au-delà des (\d+)/)
  if (!counts) {
    errors.push(`services : le détail de la rédaction ne se lit pas (« ${writtenLine.detail} »)`)
  } else if (Number(counts[1]) + Number(counts[2]) !== written.count) {
    errors.push(`services : ${counts[1]} pages facturées + ${counts[2]} incluses ≠ ${written.count} pages du site`)
  }
}
if (!(writing.total > custom.total)) {
  errors.push(`services : le devis reste à ${writing.total} après ${written?.count - beforeWriting?.count} pages de plus`)
}
await shot('77-services-redaction')

// --- Dernier barreau : sur mesure → cle en main, puis plus rien -------------
step('montée vers le clé en main')
const promised = (await showTab('Site clé en main')).total
await clickText('Passer au site clé en main')
await wait(400)
const turnkey = await readQuote()
if (!/Site clé en main/i.test(turnkey.plan)) errors.push('clé en main : le devis ne nomme pas la formule')
if (turnkey.total !== promised) {
  errors.push(`clé en main : ${turnkey.total} obtenu alors que le sélecteur annonçait ${promised}`)
}
if (!(turnkey.total > writing.total)) {
  errors.push(`clé en main : ${turnkey.total} contre ${writing.total} en sur-mesure`)
}
// En haut de l'echelle, l'onglet du projet redevient celui qui agit : plus rien
// a proposer au-dessus, donc l'action est de lancer la realisation.
if (turnkey.current !== 'Site clé en main') {
  errors.push(`clé en main : la formule marquée est « ${turnkey.current} »`)
}
if (turnkey.action !== 'Demander la réalisation') {
  errors.push(`clé en main : l'action proposée est « ${turnkey.action} »`)
}
// Le meme site, avec le quota de redaction du haut de gamme : les pages qui se
// facturaient a l'unite en sur-mesure sont maintenant comprises. C'est
// exactement ce que le client achete en montant, et cela doit se voir.
const turnkeyWriting = lineOf(turnkey, 'Rédaction de pages')
if (turnkeyWriting) {
  errors.push(`clé en main : « Rédaction de pages » facturée (« ${turnkeyWriting.detail} ») alors que son quota couvre ${written?.count} pages`)
}
await shot('78-final-cle-en-main')

// --- Tarifs enregistres AVANT les formules ---------------------------------
// Une PricingRules d'avant §60 n'a pas de cle `plans` : ses montants sont ceux
// du sur-mesure et doivent le rester, sinon l'administrateur voit ses tarifs
// revenir aux valeurs d'usine au moment ou un client decouvre son prix.
step('tarifs hérités')
await page.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('service-web'); r.onsuccess = () => res(r.result) })
  const legacy = {
    basePrice: 450, includedPages: 5, pricePerExtraPage: 50,
    modulePrices: { services: 40, contact: 0 }, catalogTiers: [{ upTo: 20, price: 0 }],
    customThemeSurcharge: 80, domainSetupFee: 30, depositRate: 0.1, depositMinimum: 50, currency: 'EUR',
  }
  await new Promise((res) => {
    const t = db.transaction('settings', 'readwrite').objectStore('settings').put({ key: 'pricingRules', value: legacy })
    t.onsuccess = res
  })
})
await page.reload({ waitUntil: 'networkidle0' })
await wait(800)
const heritage = await page.evaluate(async () => {
  const pricing = await import('/src/engine/pricing.ts')
  const store = await import('/src/store/db.ts')
  const rules = await store.loadPricingRules()
  // Le tarif d'usine est RELU dans le moteur, jamais recopie ici : il a deja
  // double une fois, et un scenario qui fige un bareme finit par mesurer sa
  // propre copie plutot que le produit.
  const read = (plan) => ({
    stored: pricing.planPricing(rules, plan).basePrice,
    factory: pricing.DEFAULT_PRICING_RULES.plans[plan].basePrice,
  })
  return {
    website: read('website'),
    template: read('template'),
    turnkey: read('turnkey'),
    modules: rules.modulePrices.services,
  }
})
// 450 et 40 sont les montants que CE scenario vient d'ecrire dans la base :
// les attendre en dur est legitime, ils ne viennent pas du catalogue.
if (heritage.website.stored !== 450) errors.push(`tarifs hérités : base sur-mesure ${heritage.website.stored} au lieu de 450`)
if (heritage.modules !== 40) errors.push(`tarifs hérités : prix de module ${heritage.modules} au lieu de 40`)
for (const plan of ['template', 'turnkey']) {
  const { stored, factory } = heritage[plan]
  if (stored !== factory) {
    errors.push(`tarifs hérités : base ${plan} ${stored} au lieu du tarif d'usine ${factory}`)
  }
  // Le repli d'avant §60 ne vaut QUE pour le sur-mesure. Retrouver 450 sur une
  // autre formule signifierait qu'elle facture la base d'une voisine.
  if (stored === heritage.website.stored) {
    errors.push(`tarifs hérités : la formule ${plan} a hérité de la base du sur-mesure (${stored})`)
  }
}

await browser.close()
if (errors.length) {
  console.error('ECHECS :')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('OK — formules : trois cartes et trois pastilles, fonctionnalités fermées, plafond de pages, devis nommé, échelle modèle → sur mesure → clé en main, services facturés au-delà du quota, liens profonds gardés, tarifs hérités préservés')
