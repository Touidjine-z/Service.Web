/**
 * Relais GoDaddy pour la verification des noms de domaine (§59).
 *
 * Le navigateur ne peut pas appeler l'API directement : la cle serait publique,
 * et l'API ne renvoie pas d'en-tetes CORS. Ce petit serveur garde le PAT et
 * expose une seule route, sans secret ni etat.
 *
 *   GODADDY_PAT=xxxxx node scripts/domain-proxy.mjs
 *   # puis, dans .env : VITE_DOMAIN_API_URL=http://localhost:5310/check
 *
 * Variables : GODADDY_PAT (obligatoire), PORT (5310), CORS_ORIGIN (*),
 * GODADDY_API_URL (bac a sable OTE).
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 5310)
const PAT = (process.env.GODADDY_PAT || '').trim()
const UPSTREAM = process.env.GODADDY_API_URL || 'https://api.godaddy.com/v3/domains/check-availability'
const ORIGIN = process.env.CORS_ORIGIN || '*'

const DOMAIN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,24})+$/

if (!PAT) {
  console.error('GODADDY_PAT manquant. Exemple : GODADDY_PAT=xxx node scripts/domain-proxy.mjs')
  process.exit(1)
}

const cors = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '600',
}

function json(res, status, payload) {
  res.writeHead(status, { ...cors, 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }
  if (req.method !== 'GET') return json(res, 405, { message: 'Méthode non autorisée.' })

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const domain = (url.searchParams.get('domain') || '').trim().toLowerCase()
  // Le domaine est recopie dans l'URL amont : on le valide avant, strictement.
  if (!DOMAIN.test(domain)) return json(res, 400, { message: 'Paramètre « domain » invalide.' })

  try {
    const upstream = await fetch(`${UPSTREAM}?domain=${encodeURIComponent(domain)}`, {
      headers: { authorization: `Bearer ${PAT}`, accept: 'application/json' },
    })
    const body = await upstream.text()
    console.log(`${upstream.status} ${domain}`)
    res.writeHead(upstream.status, { ...cors, 'content-type': 'application/json; charset=utf-8' })
    res.end(body)
  } catch (error) {
    console.error('amont injoignable :', error.message)
    json(res, 502, { message: 'GoDaddy est injoignable.' })
  }
})

server.listen(PORT, () => {
  console.log(`Relais domaine sur http://localhost:${PORT}/check?domain=example.com`)
  console.log(`Amont : ${UPSTREAM}`)
})
