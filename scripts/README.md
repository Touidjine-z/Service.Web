# Tests de parcours (navigateur)

Cinq scénarios joués dans un vrai navigateur, avec captures d'écran. Ils
vérifient ce qu'un typecheck ne peut pas voir : le parcours réel, les montants,
et surtout qu'aucun prix de réalisation ne fuit avant la page finale (§56).

| Script | Ce qu'il vérifie |
| --- | --- |
| `parcours.mjs` | Landing → activité → builder → mode visiteur, propagation de l'identité, grilles, détecteur de fuite tarifaire |
| `conversion.mjs` | Page finale, révélation du prix, règle d'acompte, lead, paiement, confirmation, persistance |
| `admin.mjs` | Dashboard, leads, paiements, édition des tarifs et sa répercussion sur les devis, détail projet, maquette |
| `commerce.mjs` | Catalogue, panier, quantités, commande, remontée côté propriétaire, écran TV alimenté |
| `avance.mjs` | Assistant de création, référencement, QR codes, format 16:9 de l'écran TV |

## Lancer

`puppeteer-core` n'est pas une dépendance du projet : il n'est utile qu'ici.

```bash
npm run dev -- --port 5199          # dans un terminal
npm i --no-save puppeteer-core@23   # une fois
node scripts/parcours.mjs /tmp/shots
```

Chaque script prend en argument le dossier où écrire ses captures, et sort en
code 1 en listant ce qui a échoué.

Chrome est attendu à `/usr/bin/google-chrome`. Chaque lancement part d'un profil
neuf, donc d'une base IndexedDB vide : chaque script crée les données dont il a
besoin.
