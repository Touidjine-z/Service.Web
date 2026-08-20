# Fonctionnement de Studio

Ce document décrit **tout ce que la plateforme sait faire aujourd'hui**, écran
par écran puis mécanisme par mécanisme. Il décrit l'existant, pas la cible : ce
qui reste à construire est listé à la fin.

La référence produit reste [`CLAUDE.md`](CLAUDE.md) ; les renvois `§n` pointent
vers ses sections.

---

## 1. Le tunnel, en une phrase

Un professionnel arrive sur la landing, choisit son métier, dit ce qu'il veut
obtenir, ajuste ses fonctionnalités, choisit un design et ses couleurs,
construit ses pages, ajoute son contenu, puis parcourt son site comme un vrai
visiteur. **À aucun moment il ne voit le prix de réalisation.**

```
Landing → Activité → Objectifs → Fonctionnalités → Thème → Couleurs
        → Builder (pages, sections, contenu) → Mode visiteur
        → [phase 3 : page finale, prix, acompte, paiement]
```

Une barre de progression en 7 étapes (Activité, Objectifs, Fonctionnalités,
Design, Contenu, Aperçu, Finalisation) suit le client sur tout le parcours. Elle
ne contient aucune information tarifaire (§49, §56).

---

## 2. Les écrans

### 2.1 Landing — `/`

Page de présentation : promesse, « Comment ça marche », aperçu des vingt
designs, argument métier, appel à l'action. Quatre repères sont mis en avant :
sans code, multi-supports, 20 designs professionnels, aperçu en temps réel. Le
bas de page rappelle que la création est libre, gratuite et sans engagement.

### 2.2 Activité — `/creer/activite` (§6)

**31 métiers répartis en 6 secteurs**, avec recherche instantanée :

| Secteur | Métiers |
| --- | --- |
| Restauration | Restaurant, Snack / Fast-food, Café / Salon de thé, Boulangerie / Pâtisserie, Traiteur, Food truck |
| Commerce | Épicerie, Boutique, Fleuriste, Opticien |
| Artisans | Menuisier, Plombier, Électricien, Peintre, Maçon, Serrurier |
| Santé | Médecin, Dentiste, Kinésithérapeute / Ostéopathe, Psychologue |
| Services | Avocat, Comptable, Consultant, Coach / Formateur, Agence / Freelance |
| Autres | Photographe, Garage automobile, Agent immobilier, Coiffeur / Institut, Architecte, Association |

Une entrée **« Autre activité »** en saisie libre couvre tout le reste : le
moteur n'a pas besoin de connaître un métier pour le servir.

Choisir un métier applique d'un coup : les objectifs suggérés, les modules par
défaut, le squelette de pages du métier, et la catégorie d'images la plus
pertinente.

### 2.3 Objectifs — `/creer/objectifs` (§7)

**14 objectifs** à cocher : présenter mon entreprise, mes services, mes produits,
mes réalisations, une galerie, recevoir des devis, des demandes de contact, des
rendez-vous, des commandes, vendre des produits, présenter un menu, afficher des
promotions, afficher mes tarifs, présenter mes avis clients.

Chaque objectif **débloque des modules**. « Afficher mes tarifs » désigne les
tarifs que le client montre à ses propres visiteurs — rien à voir avec le prix
du site.

### 2.4 Fonctionnalités — `/creer/fonctionnalites` (§8)

**20 modules** activables : Présentation, Services, Produits, Menu, Catégories,
Panier, Commande, Réalisations, Galerie, Témoignages, FAQ, Tarifs, Horaires,
Localisation, Contact, Demande de devis, Rendez-vous, Réseaux sociaux, Affichage
TV, QR Code.

Le module Contact est structurel et ne peut pas être retiré. Retirer un module
retire aussi les sections qu'il portait, sur toutes les pages.

### 2.5 Thème — `/creer/theme` (§10)

**Les 20 thèmes**, chacun présenté par une miniature fidèle qui rejoue ses vrais
tokens :

| | | |
| --- | --- | --- |
| Modern — épuré, aéré, universel | Premium — haut de gamme et rassurant | Minimal — le contenu, rien d'autre |
| Elegant — raffiné, typographie soignée | Dark — contraste fort, effet vitrine | Classic — intemporel et institutionnel |
| Creative — formes libres et couleurs vives | Corporate — structuré, orienté confiance | Luxury — noir, or et grands espaces |
| Urban — street, dense et graphique | Clean — lisible, doux, sans friction | Nature — végétal, chaleureux, artisanal |
| Fresh — coloré, gourmand, appétissant | Vintage — rétro, papier, authentique | Professional — sobre, sérieux, efficace |
| Bold — titres énormes, impact immédiat | Glass — transparences et profondeur | Editorial — magazine, colonnes, lecture |
| Dynamic — mouvement, diagonales, énergie | Custom — base neutre à personnaliser | |

Changer de thème applique par défaut la palette de ce thème. Une case
**« Conserver mes couleurs en changeant de thème »** permet de garder la palette
déjà personnalisée.

### 2.6 Couleurs — `/creer/couleurs` (§11)

**Neuf couleurs** réglables séparément : principale, secondaire, accent, fond,
texte, boutons, cartes, en-tête, pied de page.

Chaque champ accepte **HEX, RGB ou HSL** et se convertit à la volée. Un
générateur produit une palette complète à partir de la couleur principale selon
quatre harmonies : analogue, complémentaire, triadique, monochrome. Un **audit de
contraste WCAG** signale en continu les paires qui passent sous 4.5:1.

### 2.7 Builder — `/creer/site` (§9)

Trois zones : rail d'onglets à gauche, **aperçu en direct** au centre, panneau de
propriétés à droite.

Les onglets du rail s'adaptent aux modules actifs — un métier simple n'a pas
d'onglet Produits.

#### Pages (§13)

Ajouter, renommer, dupliquer, déplacer, supprimer, définir comme page d'accueil.
Les slugs restent uniques automatiquement ; la page d'accueil garde toujours un
slug vide. Le panneau de droite édite aussi le titre et la description pour les
moteurs de recherche.

#### Sections (§14)

Liste des sections de la page courante, **réorganisables au glisser-déposer**,
masquables une par une. Le bouton d'ajout propose les 17 sections ; celles dont
le module n'est pas actif sont grisées et indiquent quel module activer.

#### Produits (§15)

Catégories (création, suppression), puis pour chaque produit : nom, description,
image, catégorie, prix, disponibilité, **variantes** avec prix propre. Actions :
ajouter, modifier, supprimer, dupliquer, masquer, réorganiser. Dès qu'une
catégorie existe, le rendu regroupe les produits par catégorie.

#### Services (§16)

Nom, description, image, durée, prix éventuel. Mêmes actions que les produits.

#### Galerie (§17)

Images avec titre, description et catégorie, réorganisables.

#### Informations (§12)

Nom de l'entreprise, slogan, logo (import de fichier), téléphone, email, adresse,
ville, zone d'intervention, **horaires jour par jour** avec ouverture/fermeture,
et cinq réseaux sociaux. Tout se répercute immédiatement dans l'aperçu.

#### Paramètres (§19, §20)

- **Devise** : EUR, USD, GBP, CHF, CAD.
- **Afficher les prix** sur le site du client : ON/OFF, pour ceux qui préfèrent
  « sur devis ».
- **Grilles** : nombre de colonnes (2 à 5), taille des cartes, format des images
  (carré, paysage, portrait), espacement, alignement. Ces réglages s'appliquent
  aux produits, services, réalisations et galerie ; une section peut ensuite
  ajuster son propre nombre de colonnes.

#### Barre d'outils de l'aperçu

Annuler / Rétablir, état de la sauvegarde, sélecteur de support, accès au mode
visiteur.

#### Aperçu et sélection

L'aperçu est le **vrai rendu du site**, pas une simulation. Survoler une section
affiche son étiquette, cliquer la sélectionne et ouvre ses propriétés. Le rendu
est mis à l'échelle pour tenir dans l'espace disponible.

#### Panneau de propriétés

Généré à partir du catalogue de sections : champs texte, zones de texte,
interrupteurs, listes déroulantes, nombres, **listes répétables** (questions de
FAQ, avis clients, formules tarifaires) et **sélecteurs d'image**. Deux actions
directes : masquer la section, la supprimer.

### 2.8 Aperçu responsive (§21, §23, §24)

Quatre supports, aux vraies largeurs : **Ordinateur 1440 px, Tablette 834 px,
Mobile 390 px, TV 1920 px**. Ce ne sont pas que des largeurs : les tailles sont
mises à l'échelle (mobile 0,8× ; TV 1,5×) et le nombre de colonnes est plafonné
par support — une grille de 4 colonnes passe à 3 sur tablette et à 1 sur mobile.

### 2.9 Mode visiteur — `/apercu` (§22)

Le client parcourt son site **sans aucun repère d'édition** : navigation entre
les pages, sections telles qu'un visiteur les verra. Sur ordinateur, le site est
rendu à pleine largeur ; sur mobile, dans un cadre d'appareil. Une seule barre
flottante subsiste : retour à l'édition et choix du support.

C'est le moment de projection du produit (§54) — et donc, plus que partout
ailleurs, un écran sans le moindre prix de réalisation.

---

## 3. Le moteur

### 3.1 L'enchaînement

```
Métier  →  Objectifs suggérés  →  Modules  →  Sections disponibles  →  Pages
```

Chaque métier porte : ses objectifs suggérés, ses modules par défaut, son
squelette de pages, sa catégorie d'images, et la nature de son catalogue
(produits, menu, services ou aucun). Un restaurant démarre donc sur Accueil /
Menu / À propos / Galerie / Contact, un menuisier sur Accueil / Services /
Réalisations / À propos / Contact.

Une section n'est rendue que si le module qui la porte est actif. Hero, Appel à
l'action et Carte sont toujours disponibles.

### 3.2 Les thèmes sont des tokens, pas des composants

Un thème décrit : polices de titre et de texte, graisse, casse, interlettrage,
disposition de la navigation (6 variantes), disposition du hero (7 variantes),
style de cartes (6), style de boutons (6), traitement des images (6), pied de
page (4), rayon des angles, densité verticale, largeur de contenu, animation, et
sa palette de départ.

`renderer/tokens.ts` traduit ces tokens en styles concrets. Les sections
n'appellent que ces helpers, jamais un identifiant de thème. C'est ce qui rend
deux thèmes réellement différents sans dupliquer une seule section.

### 3.3 Les 17 sections

Hero, Présentation, Services, Produits, Réalisations, Galerie, Témoignages, FAQ,
Tarifs, Horaires, Localisation, Contact, Demande de devis, Rendez-vous, Appel à
l'action, Réseaux sociaux, Carte.

Chaque section est décrite dans un catalogue déclaratif : son libellé, sa
description, ses champs éditables, et ses **valeurs par défaut calculées à partir
du projet**. Le titre du hero reprend le nom de l'entreprise, la section Produits
s'intitule « Notre carte » pour un restaurant et « Nos produits » ailleurs.

### 3.4 Contenu d'exemple

Tant que le client n'a rien saisi, les grilles affichent des exemples neutres
(« Première prestation », « Projet récent »). Une grille vide donnerait
l'impression d'un site inachevé et casserait la projection. Le premier produit
réel les fait disparaître.

### 3.5 Banque d'images (§18)

**Dix catégories** : Restauration, Entreprise, Bâtiment, Bois, Santé, Beauté,
Automobile, Immobilier, Technologie, Lifestyle — six visuels chacune, soit 60 au
total, avec recherche par titre et mots-clés. La catégorie du métier choisi est
présélectionnée à l'ouverture. Le client peut aussi **importer ses propres
photos**.

Les visuels fournis sont générés localement (compositions abstraites
déterministes) : pas de dépendance externe, pas de question de droits. La forme
des données est celle d'un vrai catalogue — brancher une banque réelle ou une
génération par IA ne demandera que de remplacer la fonction d'amorçage.

---

## 4. Données, sauvegarde et historique

### 4.1 Le projet

Un projet contient : identifiant et dates, métier, objectifs, modules, thème,
couleurs, police, identité complète, pages et leurs sections, catégories,
produits, services, galerie, devise, affichage des prix, réglages de grille,
étape en cours, indicateur de révélation du prix, et le lead éventuel.

### 4.2 Sauvegarde (§27)

Sauvegarde automatique en **IndexedDB** (Dexie), 600 ms après la dernière
modification, avec indicateur visible. Au retour, le dernier projet est rechargé
tout seul : **aucun compte, aucun email, aucun paiement n'est demandé pour
créer**.

Trois tables : projets, versions, leads.

### 4.3 Undo / Redo (§26)

Historique de 60 pas, boutons dans la barre d'outils et **Ctrl+Z / Ctrl+Maj+Z**.
Le raccourci ne vole pas l'annulation native d'un champ en cours de saisie. Trois
actions ne sont pas annulables : le chargement d'un projet, le changement
d'étape, la révélation du prix.

### 4.4 Versions (§45)

La base sait déjà stocker des instantanés restaurables d'un projet. L'écran qui
les expose reste à faire.

---

## 5. Pricing engine (§37, §38) — calculé, jamais affiché

Le devis est recalculé à chaque modification et disponible via
`useProject().quote`, mais **il n'est rendu nulle part** tant que
`project.priceRevealed` est faux.

Il se compose de : un prix de base incluant un nombre de pages, un supplément par
page additionnelle, un montant par module actif, un palier selon le volume du
catalogue, un supplément pour le design sur mesure. L'acompte vaut
`max(10 % du total, 50 €)`.

**Aucun montant n'est codé en dur dans un composant** : tout vient de
`PricingRules`, destiné à devenir éditable depuis l'administration. Les valeurs
actuelles sont des valeurs de départ, à valider avant la mise en service.

---

## 6. Ce qui n'existe pas encore

- **Phase 3 — conversion** : capture du lead, page « votre site est prêt »,
  révélation du prix, acompte, checkout et paiement.
- **Phase 4 — administration** : dashboard, liste des projets et des leads,
  paiements, édition des règles de tarification, statuts.
- **Phase 5 — avancé** : affichage TV et QR code (les modules existent, les
  écrans dédiés non), assistance IA, SEO avancé, interface de versioning.
- **Phase 6 — SaaS** : publication, hébergement, domaines, abonnements,
  multi-sites, statistiques.
- Panier et tunnel de commande côté site client : les modules sont activables et
  entrent dans le devis, mais ne sont pas encore rendus.
