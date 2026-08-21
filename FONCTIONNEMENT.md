# Fonctionnement de Studio

Ce document décrit **tout ce que la plateforme sait faire aujourd'hui**, écran
par écran puis mécanisme par mécanisme. Il décrit l'existant, pas la cible : ce
qui reste à construire est listé à la fin.

La référence produit reste [`CLAUDE.md`](CLAUDE.md) ; les renvois `§n` pointent
vers ses sections.

---

## 1. Le tunnel, en une phrase

Un professionnel arrive sur la landing, choisit son métier, choisit sa formule,
dit ce qu'il veut obtenir, ajuste ses fonctionnalités, choisit un design et ses
couleurs, construit ses pages, ajoute son contenu, puis parcourt son site comme
un vrai visiteur. **À aucun moment il ne voit le prix de réalisation.**

```
Landing → Activité → Formule → Objectifs → Fonctionnalités → Thème → Couleurs
        → Builder (pages, sections, contenu) → Mode visiteur
        → Page finale → Révélation du prix → Nom de domaine → Acompte → Paiement
        → Administration (projets, leads, paiements, tarification)
```

Une barre de progression en 8 étapes (Activité, Formule, Objectifs,
Fonctionnalités, Design, Contenu, Aperçu, Finalisation) suit le client sur tout
le parcours. Elle ne contient aucune information tarifaire (§49, §56).

Deux raccourcis mènent au même builder pour qui ne veut pas dérouler les six
étapes : l'**assistant en une phrase** (§39) et le **formulaire express**
`/creer/express`, qui monte le site d'un coup à partir des informations de
l'établissement.

---

## 2. Les écrans

**La largeur suit l'écran.** Les pages de la plateforme étaient bloquées à
1 152 px : sur un écran large, tout tenait dans une bande centrale. Le conteneur
grandit maintenant par paliers — plein écran jusqu'à 2 560 px, puis centré — et
les grilles gagnent des colonnes au lieu d'étirer leurs cartes : 4 métiers par
ligne à 1 366 px, 6 à 1 920, 7 au-delà. Les blocs de texte, eux, gardent leur
largeur de lecture : une phrase de 1 600 px ne se lit pas.

**La barre d'actions ne recouvre plus rien.** « Retour / Projet enregistré /
Continuer » était collée en bas de la fenêtre et passait par-dessus le contenu —
six vignettes à l'étape Design, trois blocs à l'étape Couleurs. Elle est repassée
dans le flux, sous une colonne flex : sur une étape courte elle se pose au bas de
l'écran, sur une étape longue elle attend la fin du contenu.

### 2.1 Vitrine — `/`

La page d'entrée reprend les codes des sites d'agence, mais elle prouve au lieu
de promettre. De haut en bas :

| Bloc | Ce qu'il fait |
| --- | --- |
| En-tête | Se rétracte au défilement, ancres vers les sections, fil de lecture en haut de page |
| Hero | Titre à métier tournant, deux appels à l'action, quatre repères de réassurance |
| **Démonstration** | Un **vrai projet construit par le moteur** — six métiers, six designs — rendu par `SiteRenderer` à l'échelle, avec balayage lent de la page et bascule ordinateur / tablette / mobile |
| Bandeau métiers | Les 31 activités défilent en continu |
| Chiffres | Designs, métiers, sections, fonctionnalités — comptés à l'écran, lus dans le moteur |
| Méthode | Les cinq étapes du parcours, en cartes avec lueur au survol |
| Designs | Galerie filtrable des 34 thèmes, vraies vignettes, clic = démarrage avec ce design |
| Différence | Comparaison frontale avec un site monté à la va-vite |
| Métiers | Recherche instantanée : le visiteur entre dans le parcours depuis la vitrine |
| Avis | Rail de témoignages avec notes |
| Questions | FAQ en accordéon, y compris la question du prix — traitée sans montant |
| Appel final | Bandeau sombre, halo animé, deux chemins d'entrée |

Deux points méritent d'être notés.

**La démonstration n'est pas une image.** Le moteur construit un projet complet
(métier, modules, pages, contenu d'exemple) et le renderer l'affiche exactement
comme dans le parcours. La vitrine ne peut donc pas mentir sur ce que la
plateforme sait faire : si une section change, la démonstration change avec.

**La conversation de qualification** (bouton flottant « Décrire mon projet »)
remplace le formulaire de contact. Six questions courtes — métier et ville en
une phrase, objectifs, délai, nom, email — puis la maquette s'ouvre déjà
configurée : activité, objectifs, thème suggéré, ville, lead enregistré.
L'analyse de la première phrase est celle de l'assistant (§39) : mots-clés,
aucune requête réseau, aucun modèle de langage. **Aucune question de budget**,
aucune fourchette : la vitrine reste vierge de tout montant (§56).

### 2.2 Activité — `/creer/activite` (§6)

**41 métiers répartis en 7 secteurs**, avec recherche instantanée :

| Secteur | Métiers |
| --- | --- |
| Restauration | Restaurant, Snack / Fast-food, Café / Salon de thé, Boulangerie / Pâtisserie, Traiteur, Food truck |
| Commerce | Épicerie, Boutique, Fleuriste, Opticien |
| Artisans | Menuisier, Plombier, Électricien, Peintre, Maçon, Serrurier |
| Automobile | Garage / Mécanique générale, Carrossier / Peintre auto, Centre auto, Pneus & jantes, Vitrage / Pare-brise, Contrôle technique, Dépannage / Remorquage, Lavage / Préparation esthétique, Garage moto / scooter, Vente de véhicules d'occasion, Centre de formation automobile |
| Santé | Médecin, Dentiste, Kinésithérapeute / Ostéopathe, Psychologue |
| Services | Avocat, Comptable, Consultant, Coach / Formateur, Agence / Freelance |
| Autres | Photographe, Agent immobilier, Coiffeur / Institut, Architecte, Association |

La recherche porte aussi sur des **mots-clés** déclarés par le métier, parce que
le client tape ce qu'il fait et non le libellé du catalogue : « carrosserie »
trouve « Carrossier / Peintre auto », « pneu » trouve « Pneus & jantes », « cpf »
trouve le centre de formation. Les accents ne comptent pas.

Une entrée **« Autre activité »** en saisie libre couvre tout le reste : le
moteur n'a pas besoin de connaître un métier pour le servir.

Choisir un métier applique d'un coup : les objectifs suggérés, les modules par
défaut, le squelette de pages du métier, la catégorie d'images la plus
pertinente, son catalogue de prestations d'exemple et ses **valeurs de section
propres au métier** (§3.3 ter).

### 2.2 bis Création express — `/creer/express` (§39)

Une porte d'entrée parallèle, pour le professionnel qui ne veut pas parcourir
les six étapes : **il remplit un formulaire, il valide, son site est monté.**

Le formulaire demande son activité (les 31 métiers ou la saisie libre), le nom
de sa boutique, un slogan éventuel, ses coordonnées — téléphone, email, adresse,
ville, zone d'intervention — et ses réseaux. Seuls le **nom** et l'**activité**
bloquent la validation ; le reste est facultatif, et n'est vérifié que s'il est
rempli (email plausible, numéro assez long).

Les champs sont décrits en données dans `src/engine/express.ts`
(`EXPRESS_GROUPS`), comme les sections le sont dans `sectionDefs.ts` : le
formulaire est généré, il n'y a pas un `<input>` écrit à la main par
information. Chaque champ porte son `autocomplete`, donc le navigateur peut
remplir la page seul.

Un panneau latéral montre en continu **ce que la validation va créer** : nom,
métier, ville, nombre de pages et de fonctionnalités, design retenu, liste des
pages. Ce n'est pas une promesse rédigée à la main, c'est le projet réellement
calculé par `buildExpressProject`, affiché sans être appliqué.

À la validation (`applyExpress`), le moteur enchaîne d'un coup : métier →
objectifs → modules → pages, thème et palette déduits du métier, identité,
slogan, présentation et FAQ rédigés depuis les informations saisies,
référencement de chaque page. Un écran de confirmation annonce « Le site de X
est prêt » et propose de le **voir** comme un visiteur ou de le **modifier**.

Un raccourci n'impose aucune formule : le projet démarre dans la formule par
défaut, le **site sur mesure** (§60). L'écran de confirmation renvoie d'ailleurs
vers l'étape **Formule** et non vers le builder — le chemin le plus rapide ne
doit pas rendre le site modèle inatteignable. L'assistant en une phrase et le
chat de la vitrine, eux, entrent plus loin dans le parcours : la formule se
change alors depuis l'onglet Paramètres du builder.

Ce qui n'est volontairement **pas** figé : le titre du hero, les titres de
sections et le pied de page continuent de se déduire de l'identité. Renommer sa
boutique met donc tout le site à jour, sans repasser par ce formulaire — qui se
rouvre d'ailleurs pré-rempli avec ce que le projet sait déjà.

### 2.2 ter Formule — `/creer/formule` (§60)

**Trois façons de faire son site**, choisies juste après le métier — donc avant
de construire quoi que ce soit. Le client construit ainsi d'emblée dans le bon
périmètre, au lieu de construire puis d'être amputé.

L'échelle ne porte **pas sur la quantité de logiciel** — le moteur est le même
pour les trois — mais sur **qui fait le travail**.

| Formule | Pour qui | Ce qu'elle contient | Qui fait le travail |
| --- | --- | --- | --- |
| **Site modèle** | Être trouvé, montrer ce qu'on fait, être appelé | Le site type du métier, monté avec ses textes, ses photos et ses couleurs | Le client part d'un site type et écrit ; nous réalisons |
| **Site sur mesure** | Vendre, prendre des commandes ou des rendez-vous | Le moteur entier : commande, rendez-vous, devis, pages et catalogue illimités | Nous dessinons ; le client fournit le contenu |
| **Site clé en main** | Ne pas avoir à rédiger, être trouvé sur Google dès le départ | Le même moteur que le sur mesure, aux mêmes limites | Nous dessinons **et** nous rédigeons ; le client n'a rien à fournir |

**Le clé en main n'ouvre aucune fonctionnalité de plus que le sur mesure** : ses
modules et ses plafonds sont identiques, ligne pour ligne. Ce qui l'en distingue,
ce sont les **services**, c'est-à-dire le travail humain que la formule comprend.

L'écran (« De quoi avez-vous besoin ? ») rend les **trois cartes** telles que le
catalogue `engine/plans.ts` les déclare : **pastille** (« Le plus simple », « Le
plus choisi », « Le plus complet »), phrase de situation, ce que la formule
contient, **ce que nous faisons pour vous**, ce qu'elle ne contient pas. La
pastille vient du champ `badge` du catalogue et non de l'écran : ajouter une
formule n'oblige donc pas à rouvrir un composant pour arbitrer laquelle porte
quel libellé (§48). **Aucun montant** (§56) : sous les cartes, une seule phrase
rappelle que la construction est gratuite et que le prix de réalisation sera
montré à la fin.

Le bloc **« Ce que nous faisons pour vous »** n'est pas rédigé, il est **déduit
des quotas** de la formule — deux lignes toujours (pages rédigées, images
d'illustration) et une troisième quand la formule pose des liens entrants.

| Formule | Pages rédigées | Images d'illustration | Liens entrants |
| --- | --- | --- | --- |
| Site modèle | 6 | 10 | — |
| Site sur mesure | 10 | 20 | 5 |
| Site clé en main | 20 | 40 | 12 |

Ce sont des **quantités**, jamais des montants : `PlanDef` ne déclare aucun champ
monétaire. Changer un de ces nombres dans `plans.ts` change ensemble l'écran de
choix, le devis et l'administration.

Le **site sur mesure est la formule par défaut**, et celle de tous les projets
enregistrés avant cette option : le défaut le plus permissif n'ampute personne.

**Ce que le site modèle ferme** — seize fonctionnalités, celles par lesquelles un
visiteur envoie de l'argent ou une donnée structurée, et celles qui demandent une
logique métier, une donnée réglementée ou un second support : Panier, Commande,
Modes de service, Rendez-vous, Demande de devis, Recrutement, Lettre
d'information, Fidélité, Recherche guidée, Établissements, Allergènes, Programme,
Financement, Avant / Après, Affichage TV, QR Code — plus le design entièrement
sur mesure. Cinq des quatorze objectifs tombent avec elles.

**Ses plafonds** : 6 pages, 20 éléments de catalogue (produits, services et
photos **cumulés**), pas de thème « Custom ». Le site sur mesure et le site clé
en main n'ont aucune limite : leurs plafonds sont identiques, module pour module.

**Changer d'avis reste possible jusqu'à la fin** : sur cet écran, depuis l'onglet
Paramètres du builder, sur chaque verrou rencontré en construisant, et sur la
page finale une fois le prix révélé. Un acompte encaissé fige la formule, et
l'écran le dit.

**Une descente ne détruit jamais de contenu.** Passer au site modèle ferme les
modules que la formule n'ouvre pas et retire les pages qui ne contenaient *que*
ces modules ; les unes et les autres sont **nommées** dans une confirmation avant
d'être appliquées. Une page déjà vide *avant* le changement n'a pas été vidée par
lui : elle reste. Textes, produits, services, photos, couleurs et identité
restent en place. Si le projet dépasse un plafond — trop de pages, trop
d'éléments — le changement est **refusé**, et l'écran liste ce qui bloque : c'est
au client de supprimer, pas à nous de tronquer son travail.

Cette garde existe deux fois. L'interface désactive le contrôle et explique ;
le reducer refuse l'action de toute façon, quel que soit le chemin emprunté.
C'est aussi lui qui porte le **gel après acompte** : un changement de formule
est refusé dès que le projet a atteint `deposit-paid`, et les verrous s'effacent
au lieu de proposer un bouton mort. Porté par un seul écran, il aurait suffi
d'entrer par un autre.

**Les écrans qui montrent des montants sont fermés tant que le prix n'est pas
révélé** (§56) : `/confirmation`, `/paiement` et `/creer/domaine` renvoient vers
la page finale quand on tape leur adresse directement — signet, historique, URL
recopiée. `/tv` fait de même quand la formule ne contient pas l'écran TV, en
expliquant et en proposant la montée plutôt qu'en opposant un mur. Le scénario
`formules.mjs` visite ces adresses avec un projet non révélé et échoue si un
chiffre suivi d'un euro y apparaît.

### 2.3 Objectifs — `/creer/objectifs` (§7)

**14 objectifs** à cocher : présenter mon entreprise, mes services, mes produits,
mes réalisations, une galerie, recevoir des devis, des demandes de contact, des
rendez-vous, des commandes, vendre des produits, présenter un menu, afficher des
promotions, afficher mes tarifs, présenter mes avis clients.

Chaque objectif **débloque des modules**. « Afficher mes tarifs » désigne les
tarifs que le client montre à ses propres visiteurs — rien à voir avec le prix
du site.

En **site modèle**, les cinq objectifs dont la fonctionnalité fondatrice est
fermée — devis, rendez-vous, commandes, vente de produits, promotions — restent
affichés, grisés et **cliquables** : le clic explique la fonctionnalité et
propose de passer au site sur mesure (§60). Caché, un objectif ne vendrait rien.

### 2.4 Fonctionnalités — `/creer/fonctionnalites` (§8)

**20 modules** activables : Présentation, Services, Produits, Menu, Catégories,
Panier, Commande, Réalisations, Galerie, Témoignages, FAQ, Tarifs, Horaires,
Localisation, Contact, Demande de devis, Rendez-vous, Réseaux sociaux, Affichage
TV, QR Code.

Le module Contact est structurel et ne peut pas être retiré. Retirer un module
retire aussi les sections qu'il portait, sur toutes les pages.

En **site modèle**, les modules fermés quittent les listes « recommandées » et
« autres » — mélangés aux modules actifs, ils ne seraient que des cases mortes —
pour un bloc à part, en bas de page : **« Disponibles avec le site sur mesure »**
(§60). Ils gardent leur icône et leur description, et s'ouvrent sur la feuille de
montée en gamme. Le bloc disparaît de lui-même en site sur mesure.

### 2.5 Thème — `/creer/theme` (§10)

**Les 34 thèmes**, chacun présenté par une miniature fidèle qui rejoue ses vrais
tokens :

| | | |
| --- | --- | --- |
| Modern — épuré, aéré, universel | Premium — haut de gamme et rassurant | Minimal — le contenu, rien d'autre |
| Elegant — raffiné, typographie soignée | Dark — contraste fort, effet vitrine | Classic — intemporel et institutionnel |
| Creative — formes libres et couleurs vives | Corporate — structuré, orienté confiance | Luxury — noir, or et grands espaces |
| Urban — street, dense et graphique | Clean — lisible, doux, sans friction | Nature — végétal, chaleureux, artisanal |
| Fresh — coloré, gourmand, appétissant | Vintage — rétro, papier, authentique | Professional — sobre, sérieux, efficace |
| Bold — titres énormes, impact immédiat | Glass — transparences et profondeur | Editorial — magazine, colonnes, lecture |
| Dynamic — mouvement, diagonales, énergie | Agence — bleu franc, blocs alternés, offre en avant | Repère — vert net, vignettes encadrées |
| Custom — base neutre à personnaliser | | |

Changer de thème applique par défaut la palette de ce thème. Une case
**« Conserver mes couleurs en changeant de thème »** permet de garder la palette
déjà personnalisée.

Un seul thème dépend de la formule : **Custom**, la base neutre que l'on dessine
soi-même. En site modèle, sa vignette reste visible, estompée et verrouillée —
« Le design entièrement sur mesure fait partie du site sur mesure » (§60).

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
d'onglet Produits. C'est ce qui rend les formules (§60) transitives : l'onglet
**QR Code** demande le module QR Code, exactement comme le format d'aperçu **TV**
demande l'écran TV. En site modèle, où ces deux modules sont fermés, l'onglet et
le format disparaissent d'eux-mêmes, sans qu'un seul écran ait à connaître la
formule.

#### Pages (§13)

Ajouter, renommer, dupliquer, déplacer, supprimer, définir comme page d'accueil.
Les slugs restent uniques automatiquement ; la page d'accueil garde toujours un
slug vide. Le panneau de droite édite aussi le titre et la description pour les
moteurs de recherche.

En **site modèle**, le plafond de la formule est atteint à la sixième page : le
champ et le bouton d'ajout se désactivent, et un bandeau dit pourquoi —
« 6 pages — le site sur mesure n'a pas de limite. » — avec le passage à l'autre
formule (§60). Le nombre vient du catalogue, pas du composant.

#### Sections (§14)

Liste des sections de la page courante, **réorganisables au glisser-déposer**,
masquables et duplicables une par une.

Le bouton d'ajout ouvre un catalogue **rangé par intention** — Essentielles,
Votre offre, Rassurer, Faire agir, Informations pratiques — avec un champ de
recherche. On n'y choisit pas un type technique mais une **variante** : « Hero —
avec chiffres », « Présentation — avec citation », « Contenu — trois arguments ».
Une variante ne fait que pré-remplir des champs déclarés et des blocs ; elle
n'introduit aucune mise en page à elle, qui reste celle du thème (§10). Les
sections dont le module n'est pas actif sont grisées et indiquent quel module
activer.

Le panneau de droite affiche les champs de la section, puis — quand la section
en accepte — l'**éditeur de blocs** : liste réordonnable au glisser-déposer,
chaque bloc masquable, supprimable, et dépliable pour éditer ses propres champs.
Un compteur rappelle le plafond de la section.

#### Produits (§15)

Catégories (création, suppression), puis pour chaque produit : nom, description,
image, catégorie, prix, disponibilité, **variantes** avec prix propre. Actions :
ajouter, modifier, supprimer, dupliquer, masquer, réorganiser. Dès qu'une
catégorie existe, le rendu regroupe les produits par catégorie.

#### Services (§16)

Nom, description, image, durée, prix éventuel. Mêmes actions que les produits.

#### Galerie (§17)

Images avec titre, description et catégorie, réorganisables.

En **site modèle**, produits, services et galerie tirent sur la **même réserve**
de 20 éléments. Un compteur « n / 20 » s'affiche en tête des trois panneaux, le
bouton d'ajout se désactive une fois la réserve épuisée, et le bandeau propose la
formule sans limite (§60). En site sur mesure, ni compteur ni plafond.

#### Informations (§12)

Nom de l'entreprise, slogan, logo (import de fichier), téléphone, email, adresse,
ville, zone d'intervention, **horaires jour par jour** avec ouverture/fermeture,
et cinq réseaux sociaux. Tout se répercute immédiatement dans l'aperçu.

#### Paramètres (§19, §20)

- **Votre formule** (§60) : son nom, sa phrase de présentation, et
  **« Changer de formule »** qui ramène à `/creer/formule`. Aucun montant.
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
Mobile 390 px, TV 1920 px** — le format TV n'apparaissant que si le module
Affichage TV est au projet, donc jamais en site modèle (§60). Ce ne sont pas que
des largeurs : les tailles sont mises à l'échelle (mobile 0,8× ; TV 1,5×) et le
nombre de colonnes est plafonné par support — une grille de 4 colonnes passe à 3
sur tablette et à 1 sur mobile.

### 2.9 Mode visiteur — `/apercu` (§22)

Le client parcourt son site **sans aucun repère d'édition** : navigation entre
les pages, sections telles qu'un visiteur les verra. Sur ordinateur, le site est
rendu à pleine largeur ; sur mobile, dans un cadre d'appareil. Une seule barre
flottante subsiste : retour à l'édition et choix du support.

C'est le moment de projection du produit (§54) — et donc, plus que partout
ailleurs, un écran sans le moindre prix de réalisation.

### 2.10 Page finale — `/creer/final` (§29, §30)

Le seul écran du parcours où un prix de réalisation a le droit d'exister — et
seulement après que le client a cliqué sur **« Voir le prix de réalisation »**.

**Deux colonnes, deux questions.** À gauche ce que le client a *fait* : la
maquette, puis le récapitulatif de ce qu'elle contient. À droite ce qu'elle
*coûte*. La liste tenait autrefois au-dessus du devis, à droite : sur un écran
large, elle laissait la moitié gauche vide sous l'aperçu.

**L'aperçu est manipulable.** Trois onglets — ordinateur, tablette, mobile — et
la liste des pages du site : le client change d'appareil et navigue dans sa
maquette sans quitter la page. C'est le moment où il se projette ; une image
figée n'y suffisait pas. Aucun composant nouveau, `SiteRenderer` savait déjà
rendre un viewport et remonter une navigation. La vignette se dimensionne sur la
place disponible au lieu d'un plafond fixe.

Avant le clic sur « Voir le prix » : le récapitulatif — **« Formule — Site
modèle »** en tête (§60), puis pages, fonctionnalités, design, version mobile,
responsive, produits et services. La formule y est nommée, jamais chiffrée.

Après le clic, trois choses apparaissent dans la colonne de droite.

**Le sélecteur de formule.** Les trois formules en onglets, celle du projet
marquée d'une puce. Chaque onglet recalcule le devis sur le **même projet** —
ses pages, ses fonctionnalités, son catalogue : ce n'est pas le tarif d'un site
type. Regarder ne change rien ; sur sa propre formule l'action est « Demander la
réalisation », sur une autre elle devient « Passer au … ». Une montée s'applique
directement, une descente **nomme** d'abord les modules et les pages qu'elle
retire, et un projet qui dépasse un plafond obtient la raison du refus au lieu
d'un clic avalé. Acompte réglé, le sélecteur compare encore mais ne change plus
rien : le paiement a figé total, acompte et solde. Cette comparaison remplace la
carte qui vivait en bas de colonne, hors écran — là où elle attendait d'être
découverte, le sélecteur travaille.

**Le devis, rangé par famille.** Votre formule, Fonctionnalités, Votre contenu,
Notre travail — avec un sous-total par famille, puis la **réalisation**,
l'**acompte pour démarrer** et le **solde restant**. Neuf lignes à la file
disaient ce que le client paie ; quatre familles disent ce qu'il achète. C'est le
moteur qui range : chaque ligne porte sa famille (`PriceGroup`), aucun écran ne
la devine.

**Ce qui se passe ensuite.** La frise des étapes qui suivent l'acompte — acompte
réglé, appel sous 24 h ouvrées, réalisation, validation, mise en ligne — cochées
au fur et à mesure que le projet avance. Elle est construite sur les statuts du
cycle de vie (§34) : ce qu'elle annonce au client est ce que l'administration
suivra. Dessous, **« Recevoir mon devis par email »** ouvre la même capture de
lead que l'enregistrement du projet (§28), pour celui qui doit en parler à son
associé avant de décider.

### 2.11 Enregistrer son projet (§28)

Aucune information personnelle n'est demandée pendant la création. Le formulaire
n'apparaît qu'au moment d'enregistrer — depuis le builder, ou au moment de
demander la réalisation : prénom, nom et email requis, téléphone et entreprise
facultatifs. Enregistrer suffit à devenir un lead.

### 2.12 Nom de domaine — `/creer/domaine` (§59)

Dernière décision qui appartient encore au client, entre la demande de
réalisation et l'acompte. L'écran vient **après** la révélation du prix : il
affiche des montants, il est donc gardé par `priceRevealed` comme le paiement.

Une adresse est proposée d'emblée à partir de l'enseigne — à défaut, du métier
et de la ville — et testée sur six extensions (`.fr`, `.com`, `.net`, `.eu`,
`.shop`, `.pro`). Chaque résultat affiche la disponibilité, le prix de la
première année et celui du renouvellement. Le client peut aussi taper un nom
complet avec son extension.

Trois issues, toutes acceptables, aucune bloquante :

- **Réserver ce domaine** — nous nous en chargeons ; le devis gagne une ligne
  « Nom de domaine » (`domainSetupFee`, 30 € par défaut) qui paie *notre*
  travail de réservation et de configuration. Le prix du domaine lui-même reste
  chez le registrar, dans sa devise, et n'entre pas dans le total : le mélanger
  fausserait le devis.
- **J'ai déjà un domaine** — il est vérifié puis simplement raccordé, sans frais.
- **Décider plus tard** — la réalisation n'attend pas le domaine.

Le choix est rappelé sur la page finale, au paiement (avec un lien « Modifier »),
sur la confirmation, et dans la fiche projet de l'administration — c'est
l'administrateur qui procède ensuite à la réservation.

**La disponibilité vient de l'API GoDaddy** (`GET /v3/domains/check-availability`),
appelée par `engine/domain.ts` dans l'un de trois modes :

| Mode | Déclencheur | Ce qui se passe |
| --- | --- | --- |
| `proxy` | `VITE_DOMAIN_API_URL` | Le relais `scripts/domain-proxy.mjs` détient le PAT, ajoute l'en-tête `Authorization: Bearer` et règle CORS. **Mode recommandé.** |
| `godaddy` | `VITE_GODADDY_PAT` | Appel direct depuis le navigateur. Pratique pour essayer, mais la clé finit dans le bundle : jamais en production. |
| `simulation` | rien de configuré | Disponibilités déterministes (un nom sur trois annoncé pris) et prix indicatifs. **L'écran l'annonce au client**, comme pour le paiement. |

Les montants renvoyés par GoDaddy sont en unités mineures — `1199` vaut 11,99 —
et c'est `parseCheckResponse()` qui connaît ce contrat, nulle part ailleurs.

### 2.13 Paiement de l'acompte — `/paiement`, `/confirmation` (§32)

Récapitulatif, formulaire de carte, puis confirmation avec référence de
transaction, montants et date.

**Le paiement est simulé et l'écran le dit** : aucune carte n'est débitée,
aucune donnée bancaire n'est transmise, et aucun email n'est réellement envoyé.
La transaction est écrite en base pour permettre de jouer le parcours complet.

### 2.14 Écran TV — `/tv` (§24)

Format 16:9, plein écran, alimenté par le vrai catalogue et les couleurs du
thème. Trois mises en page : **Carte** (colonnes par catégorie, pour un
restaurant), **Vitrine** (grille de produits avec images), **Mise en avant**
(un produit à la fois, en rotation).

### 2.15 Administration — `/admin` (§33 à §38)

Quatre onglets, avec recherche.

- **Projets** — client, entreprise, activité, **formule**, date, prix, acompte,
  statut ; filtres par étape du cycle de vie. Au-dessus du tableau, la
  répartition par formule de la liste **affichée** — filtres et recherche
  compris. Les projets d'avant les formules sont comptés dans celle qui les sert,
  mais signalés à part (« avant les formules ») : personne ne les a choisis
  (§60). Ouvrir un projet donne la vue complète
  (§35) : ce que le client a construit, ses couleurs, son logo, ses pages et
  sections, son catalogue, ses fonctionnalités, son devis, ses paiements, ses
  coordonnées, ses commandes reçues — et **« Voir la maquette »** dans les trois
  formats. Le statut se change librement ou passe à l'étape suivante (§34).
  Une version peut être enregistrée puis restaurée (§45).
- **Leads** (§36) — nom, entreprise, email, téléphone, activité, ville, date,
  prix estimé, acompte, statut.
- **Paiements** — transaction, client, date, total, acompte, solde, statut.
- **Tarification** (§38) — tous les montants sont éditables ici. **Une section
  par formule** (§60), désormais trois : prix de base, pages incluses, page
  supplémentaire et **coefficient appliqué aux modules**. Puis le **travail
  humain** — prix d'une page rédigée et d'une image d'illustration au-delà du
  quota, avec le rappel des quotas de chaque formule. Puis les montants communs
  aux trois : **prix de chaque module**, paliers de catalogue, design sur mesure,
  réservation du **nom de domaine**, taux et minimum d'acompte. Un encart
  **« Fourchette d'un devis »** recalcule à la frappe, pour chaque formule, sa
  bande sur les 41 métiers, sa médiane et son plafond théorique, et **nomme** les
  formules dont les bandes se recouvriraient. Chaque changement
  est horodaté dans un historique. Les règles enregistrées pilotent réellement
  le parcours client : le devis est calculé avec elles, pas avec les valeurs
  par défaut.

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

**La formule (§60) ne rajoute pas un maillon à cette chaîne**, elle pose un
plafond sur un maillon qui existe déjà : les modules. Fermer un module ferme donc
par transitivité ses sections, son onglet dans le builder et son entrée dans le
catalogue d'ajout — tout cela s'indexe déjà sur `project.modules`. C'est ce qui
permet à trois formules de tenir dans un fichier de données, `engine/plans.ts`,
sans un seul composant dédié ni un seul test de formule dans un écran (§48). La
troisième n'a coûté qu'une entrée de plus dans ce catalogue.

Projeter un projet dans sa formule (`enforcePlan`) est **idempotent et non
destructif** : cela ne touche qu'aux modules et au thème, jamais aux pages ni au
contenu. Pour tous les projets en site sur mesure — et pour tous ceux d'avant les
formules — c'est l'identité stricte, donc un traitement nul et un historique
undo/redo qui ne voit rien passer.

Seul un **changement explicite de formule** (`applyPlan`) a le droit de retirer
une page, et uniquement une page hors accueil devenue vide parce que tous ses
modules viennent d'être fermés. Elle est nommée dans la confirmation avant de
partir.

### 3.2 Les thèmes sont des tokens, pas des composants

Un thème décrit : polices de titre et de texte, graisse, casse, interlettrage,
disposition de la navigation (6 variantes), disposition du hero (7 variantes),
style de cartes (6), style de boutons (6), traitement des images (6), pied de
page (4), rayon des angles, densité verticale, largeur de contenu, animation, et
sa palette de départ.

`renderer/tokens.ts` traduit ces tokens en styles concrets. Les sections
n'appellent que ces helpers, jamais un identifiant de thème. C'est ce qui rend
deux thèmes réellement différents sans dupliquer une seule section.

Le vocabulaire s'est élargi : cartes `ribbon` (filet de marque en tête), `inset`
(en creux) et `stamp` (ombre portée dure, colorée) ; boutons `soft` (lavis
teinté) et `block` (bloc typographique en capitales) ; images `leaf` (rayons
opposés) ; et un token entièrement nouveau, **`sectionEdge`**, qui donne enfin au
thème la main sur la séparation entre deux sections — filet, filet de marque,
fondu ou coupe diagonale. Le thème « Dynamic » s'annonçait « mouvement,
diagonales, énergie » depuis l'origine sans produire une seule diagonale ; il en
produit une maintenant.

Un garde-fou accompagne cet élargissement : `tokens.ts` traduit désormais les
cartes, boutons, images et séparations par des `Record<…>` **exhaustifs**.
Ajouter une variante sans écrire son rendu fait échouer la compilation, au lieu
de la laisser tomber silencieusement dans un `else`. C'est exactement le défaut
qui a fait rendre `nav: 'sidebar'` comme `inline` et `footer: 'large'` comme
`columns` pendant vingt thèmes — les deux ont maintenant leur rendu propre : un
vrai rail latéral pour le premier, l'enseigne en très grand pour le second.

### 3.3 Les 41 sections

Hero, Présentation, Contenu libre, Services, Produits, Réalisations, Galerie,
Témoignages, FAQ, Tarifs, Horaires, Localisation, Contact, Demande de devis,
Rendez-vous, Appel à l'action, Réseaux sociaux, Carte.

Six sections de réassurance complètent le catalogue, celles qu'on trouve sur
tous les sites d'agence :

| Section | Ce qu'elle apporte | Module |
| --- | --- | --- |
| Chiffres clés | Valeurs comptées à l'écran (années, clients, délai) | `stats`, via « présenter mon entreprise » |
| Méthode | Les étapes d'une collaboration, en frise numérotée | `process`, via « présenter mes services » |
| Équipe | Les visages de l'entreprise, initiales à défaut de photo | `team`, à activer soi-même |
| Références | Bandeau défilant de clients ou partenaires | `logos`, via « présenter mes avis clients » |
| Avant / Après | Comparateur glissant entre deux photos | `beforeafter`, via « présenter mes réalisations » |
| Bandeau d'annonce | Message court, défilant, en haut de page | `banner`, via « afficher des promotions » |

Six sections de restauration complètent l'ensemble, reprises de ce que font les
enseignes (menu, commande, offres, fidélité, adresses, allergènes) :

| Section | Ce qu'elle apporte | Module |
| --- | --- | --- |
| Modes de service | Livraison / à emporter / sur place, délai annoncé, champ d'adresse | `ordermodes`, via « recevoir des commandes » |
| Offres | Cartes de promotions : prix barré, pastille, code promo | `offers`, via « afficher des promotions » |
| Formules | Menus à prix fixe, composition ligne à ligne, formule mise en avant | `formulas`, via « présenter un menu » |
| Établissements | Vos adresses, recherche par ville, services par point de vente | `venues`, activé par le métier (fast-food, food truck) |
| Allergènes | Rappel des quatorze allergènes et tableau calories / allergènes **lu dans le catalogue** | `allergens`, via « présenter un menu » |
| Fidélité | Programme de points, carte à tampons, renvoi vers l'application | `loyalty`, via « afficher des promotions » |

Trois sections viennent des sites d'entretien automobile et de formation, où le
visiteur doit d'abord se situer avant qu'on lui montre quoi que ce soit :

| Section | Ce qu'elle apporte | Module |
| --- | --- | --- |
| Recherche guidée | Une barre de critères (marque / modèle / motorisation, ou largeur / hauteur / diamètre), plus une saisie directe facultative — plaque, référence, dimension | `finder`, activé par le métier |
| Programme | Un parcours détaillé, module par module, numéroté, avec la durée de chacun | `program`, activé par le métier |
| Financement | Les dispositifs de prise en charge et les facilités de paiement, sans aucun montant | `funding`, activé par le métier |

Aucune des trois ne connaît l'automobile : ce sont des briques de tunnel, tout
aussi valables pour une agence immobilière (budget, surface, secteur) ou un
opticien (correction, monture, budget).

Chaque section est décrite dans un catalogue déclaratif : son libellé, sa
description, ses champs éditables, et ses **valeurs par défaut calculées à partir
du projet**. Le titre du hero reprend le nom de l'entreprise, la section Produits
s'intitule « Notre carte » pour un restaurant et « Nos produits » ailleurs.

Ce calcul va plus loin pour la restauration : le bouton du hero devient
« Réserver une table » ou « Commander », le rendez-vous devient une réservation
avec nombre de couverts, le bandeau parle de livraison. Rien de tout cela n'est
un `if` sur un identifiant de métier : la bascule lit `catalogKind` du catalogue
métier et les modules actifs (§48).

### 3.3 ter Le métier habille les sections, sans code

Les props effectives d'une section se composent en trois couches :

```
valeurs par défaut du catalogue  →  valeurs du métier choisi  →  saisie du client
```

La couche du milieu (`Activity.sectionDefaults`) est de la **donnée**, pas du
code. C'est elle qui fait qu'un centre auto ouvre sur « Sélectionnez votre
véhicule » avec marque, modèle, motorisation et plaque, qu'un spécialiste du
pneu ouvre sur largeur / hauteur / diamètre / indice, qu'un carrossier propose
« Votre devis en trois photos », et qu'un centre de formation affiche le
programme d'un CAP avec ses volumes horaires. Les sections `offers` et
`loyalty`, écrites pour la restauration, sont rhabillées de la même façon quand
un centre auto les active : promotions d'atelier et carnet d'entretien, au lieu
de menus du midi.

Le même mécanisme sert à **réutiliser** les sections des autres verticales
plutôt qu'à en écrire de nouvelles : les métiers de l'automobile empruntent
`certifications` (engagements du garage, agrément assurances du carrossier,
agrément préfectoral du contrôle technique), `events` pour les rentrées d'un
centre de formation, `coverage` pour la zone d'un dépanneur — en minutes de
route et non en kilomètres — et `documents` pour le programme et le dossier de
candidature.

Aucune section n'a de branche par métier, et ajouter un métier reste une entrée
dans `src/engine/activities.ts` (§48).

### 3.3 bis Les blocs, le contenu que le client compose

Une section a des champs ; certaines ont en plus des **blocs**. Un bloc est un
morceau de contenu typé que le client ajoute *dans* une section, déplace, masque
ou supprime. Dix types existent, communs à toutes les sections : titre,
paragraphe, liste à puces, bouton, image, chiffre clé, citation, argument,
pastille, espace.

| Section | Blocs acceptés | Plafond |
| --- | --- | --- |
| Hero | pastille, liste, chiffre, bouton, paragraphe | 6 |
| Présentation | paragraphe, liste, chiffre, citation, pastille, bouton, titre | 8 |
| Appel à l'action | pastille, bouton, paragraphe, liste | 5 |
| Contenu libre | les dix | 14 |

**Contenu libre** est la section née de ce mécanisme : elle n'a presque aucun
champ, tout son contenu vient de ses blocs. C'est la réponse à « je veux juste un
paragraphe de plus » sans ajouter un type de section au moteur à chaque demande.

Deux règles rendent le résultat correct quelle que soit la suite de blocs
choisie, sans que le client ait la moindre mise en page à gérer :

- les blocs qui vont naturellement en ligne — pastilles, boutons — se regroupent
  sur une même rangée ;
- ceux qui vont naturellement en grille — chiffres, arguments — se regroupent en
  colonnes, dans la limite que le viewport peut tenir.

Comme les sections, les blocs sont décrits dans un catalogue déclaratif
(`renderer/blockDefs.ts`) : leur éditeur est **généré**, ajouter un type de bloc
ne demande aucun formulaire. Et comme les sections, ils ne connaissent ni métier
ni thème : ils lisent leurs props et les tokens (§48).

Tant que le client n'a touché à aucun bloc, la section n'en stocke aucun et le
catalogue fournit les siens. Les projets enregistrés avant l'arrivée des blocs
restent donc valides, et une section ajoutée sans variante n'est jamais vide.

### 3.3 quater La grille fluide, quand le client dessine sa section

Une section **dessinable** ne se contente plus d'empiler ses blocs : elle les
pose sur une grille de **24 colonnes** — 8 en mobile. Le client attrape un bloc
dans l'aperçu, le déplace, l'étire par l'une de ses huit poignées, et tire le
bord bas de la section pour réserver du blanc. Tout est aimanté à la cellule.
« Contenu libre » est aujourd'hui la seule section dessinable : les autres
portent une mise en page qui vient du thème, et la libérer reviendrait à ne plus
rien garantir (§10). Le panneau propose toujours la bascule **Libre / Empilée**.

La position est enregistrée en **cellules**, jamais en pixels — `{x, y, w, h}` —
donc elle survit à un changement de thème, de largeur de conteneur ou d'appareil.
Deux points de rupture seulement sont stockés, `desktop` et `mobile` ; tablette
et TV lisent la disposition large.

Quatre règles suffisent à rendre la grille prévisible :

- **Rien ne bouge tant que rien n'est déplacé.** Une position absente est
  *déduite*, et la déduction reproduit exactement l'empilement classique. Une
  section existante passe donc à la grille sans que le client voie son site
  changer — il ne le découvre qu'en attrapant un bloc.
- **Le premier bloc déplacé fige les autres.** Sinon, bouger un bloc ferait
  glisser toute la section sous les yeux du client.
- **Un bloc ajouté ensuite tombe sous l'existant**, pleine largeur, au lieu de
  s'inviter au milieu de la composition.
- **Le mobile se déduit de l'ordre de lecture de l'ordinateur** — de haut en bas,
  puis de gauche à droite — et devient indépendant dès que le client y touche.
  « Réinitialiser » rend la main à la déduction, point de rupture par point de
  rupture.

Les blocs ont le droit de se **superposer** : c'est tout l'intérêt d'une grille
libre. L'ordre de la liste décide alors de celui qui passe devant. Une ligne
s'étire quand son contenu déborde (`minmax(rowHeight, auto)`) : un bloc dessiné
trop court repousse la suite au lieu de la recouvrir, et la section ne coupe
jamais son propre contenu.

La géométrie est isolée dans `renderer/fluid.ts` — pure, sans JSX ni store — et
le rendu dans `renderer/BlockGrid.tsx`. Le builder prête à la grille cinq verbes
(sélectionner, déplacer, redimensionner la section, dupliquer, supprimer) par un
contexte React : sans lui, le même composant redevient une grille CSS inerte.
**Le visiteur ne reçoit donc aucune poignée, aucun écouteur** — ce qu'il voit est
exactement ce que le client a dessiné (§22).

Deux détails d'exécution méritent d'être notés, parce qu'ils décident du confort
réel : l'aperçu du builder est mis à l'échelle, et les lignes de la grille ne
sont pas toutes de la même hauteur. Le glissement lit donc les hauteurs de lignes
**réellement calculées par le navigateur** et le facteur d'échelle, au lieu d'un
pas théorique ; le bloc suit le curseur cellule par cellule même sur une grille
inégale. Les flèches du clavier déplacent d'une cellule, Maj + flèches étirent.

### 3.3 ter La carte, en trois mises en page

La section Produits accepte trois mises en page, choisies dans le panneau de
propriétés :

- **Grille** — le catalogue classique, celui de tous les autres métiers ;
- **Carte à onglets** — barre de catégories collante puis grandes cartes, la
  mise en page des enseignes de restauration rapide ; c'est le défaut dès que le
  métier sert une carte ;
- **Ardoise** — la carte en liste, nom, pointillés, prix à droite, comme au
  restaurant.

Un produit porte désormais, en plus de ses champs habituels, un **prix barré**,
des **étiquettes** (nouveau, le plus commandé, offre, végétarien, épicé), des
**calories** et ses **allergènes**. Calories et allergènes ne sont proposés dans
le builder qu'aux métiers qui servent une carte, et alimentent directement le
tableau de la section Allergènes ainsi que l'écran TV.

Huit dernières complètent le catalogue. Le moteur savait *présenter*, *prouver*,
*convertir* et *servir à table* ; il ne savait ni montrer un autre média qu'une
image, ni vivre dans le temps, ni rassurer par le droit, ni dire jusqu'où on se
déplace, ni garder le contact après la visite :

| Section | Ce qu'elle apporte |
| --- | --- |
| Vidéo | Lecteur en pleine largeur, côte à côte ou encadré, avec couverture et durée |
| Actualités | Fil daté en cartes, avec rubriques filtrables |
| Agenda | Prochaines dates, en liste datée ou en cartes, avec étiquette de statut |
| Recrutement | Offres avec contrat, lieu, missions et profil, plus la candidature spontanée |
| Documents | Plaquette, tarifs, notices : fichiers à télécharger, datés et pesés |
| Certifications et garanties | Labels, assurances et engagements écrits, avec organisme et validité |
| Zone d'intervention | Rayon, délai, communes couvertes, champ « votre commune » et plan |
| Lettre d'information | Capture d'adresse, avec promesse, fréquence et mention sur les données |

**Aucune n'est rattachée à un objectif**, et c'est délibéré : un module gouverné
par un objectif est injecté sur l'accueil de tous les métiers qui cochent cet
objectif (`addSectionsForModules`). Rattacher « Recrutement » à « présenter mon
entreprise » aurait mis une page carrière sur le site de chaque artisan. Elles
s'activent donc à la main, dans « Autres fonctionnalités disponibles ».

Deux règles éditoriales tiennent leurs valeurs par défaut : **aucun label réel**
(on ne pré-remplit jamais une certification que le client ne détient pas) et
**aucun montant** — la maquette du client ne doit jamais afficher de prix
inventé, et le détecteur de fuite des tests s'en assure.

### 3.4 Les animations suivent le thème

`theme.motion` — `none`, `subtle` ou `lively` — n'était jusqu'ici qu'un token
déclaré. Il pilote désormais l'entrée des sections du site du client :
`renderer/Motion.tsx` est le seul endroit où il devient du CSS, exactement comme
`tokens.ts` pour les couleurs. Un thème `none` ne bouge pas, `subtle` glisse,
`lively` glisse plus loin, cascade ses cartes plus nettement et fait défiler les
bandeaux plus vite.

Trois garde-fous :

- **En édition, tout est coupé.** Rien ne doit bouger sous le curseur pendant
  qu'on compose : `SiteRenderer` désactive les animations dès que `editable`
  est vrai, et une vignette figée peut les couper explicitement (`animate`).
- **`prefers-reduced-motion` est respecté**, y compris pour ce que le CSS ne
  peut pas arrêter seul : compteurs, rotation du hero, balayage de la
  démonstration.
- **Sans `IntersectionObserver`**, le contenu s'affiche directement plutôt que
  de rester invisible.

Côté plateforme, les mêmes primitives vivent dans `ui/motion.tsx` : apparition
au défilement, compteur, bandeau défilant, inclinaison, aimantation du curseur,
lueur, mot tournant, parallaxe, avancée de lecture. Aucune dépendance n'a été
ajoutée pour cela.

### 3.5 La typographie est un token de plus

`project.fontPair` existait dans le modèle depuis le début sans être lu nulle
part : le client héritait forcément des polices de son thème. **Douze
appairages** (`engine/fonts.ts`) le rendent vivant — neutre et lisible,
classique, raffiné, du caractère, affiche, robuste, géométrique, technique,
éditorial, atelier, contre-pied — chacun présenté avec ses vraies polices, pas
avec un nom de fonte.

Le point d'application compte : `createTokens` surcharge **l'objet thème
lui-même** (`themeWithFonts`), pas seulement `tokens.heading()`. Plusieurs
sections lisent `tokens.theme.headingFont` directement ; sans cette précaution,
elles seraient restées sur la police du thème pendant que le reste suivait le
choix du client. Le premier appairage, « Polices du thème », rend la main au
thème et reste la valeur par défaut.

Le choix se fait à l'étape « Vos couleurs et votre typographie », et **aussi
depuis le builder** : un onglet « Design » y réunit thème, typographie et
couleurs, avec l'aperçu du site à côté qui se met à jour à chaque clic. Avant,
changer de thème obligeait à remonter le parcours, donc à quitter l'aperçu — le
seul endroit où un design se juge vraiment.

### 3.6 Contenu d'exemple

Tant que le client n'a rien saisi, les grilles affichent des exemples neutres
(« Première prestation », « Projet récent »). Une grille vide donnerait
l'impression d'un site inachevé et casserait la projection. Le premier produit
réel les fait disparaître.

Les exemples suivent le métier. Un métier qui sert une carte reçoit une **vraie
carte d'exemple** — huit références réparties en Burgers, Accompagnements,
Desserts et Boissons, avec prix, calories, allergènes et étiquettes — et une
galerie qui parle de salle, de cuisine et d'assiettes. C'est ce qui permet à la
maquette d'un restaurant d'être crédible avant même la première saisie : les
onglets de catégories, le tableau des allergènes et l'écran TV sont alimentés
dès la première seconde.

Le même principe vaut hors restauration : un métier peut déclarer son propre
**catalogue de prestations d'exemple**. Un garage affiche « Vidange et filtres »,
« Distribution », « Diagnostic électronique » ; un carrossier « Débosselage sans
peinture » ; un centre de formation ses six formations. Les prix, eux, ne sont
jamais inventés : ils appartiennent au client.

### 3.7 Panier et commande

Quand le module Panier ou Commande est actif, le site du client accepte les
commandes en mode visiteur : bouton d'ajout sur chaque produit, quantités,
retrait, puis un formulaire (nom, email, téléphone, précisions).

Si aucun produit n'a de prix — un professionnel qui préfère « sur devis » —
la commande devient une **demande de devis** sans rien changer au parcours.

Quand le module Modes de service est actif, le tunnel demande en plus le **mode
de service** et le **créneau**. Les modes ne sont pas une liste figée : ils sont
lus dans la section « Modes de service » telle que le client l'a réglée, donc un
restaurant qui ne fait pas de livraison ne la propose jamais.

Les commandes reçues remontent dans la vue projet de l'administration, avec leur
statut — nouvelle, acceptée, traitée, annulée — et le mode de service retenu.

### 3.8 QR codes (§25)

Site, carte, commande, vitrine, et un code par table, téléchargeables en PNG.
Ils pointent vers l'adresse du futur site, saisie dans le panneau en attendant
la publication.

### 3.9 Référencement (§40)

Par page : titre, description, adresse, avec compteurs de longueur et **aperçu
du rendu dans Google**. Pour tout le site : favicon et aperçu du partage sur les
réseaux (Open Graph).

### 3.10 Assistant de création (§39)

« Créer automatiquement mon site » analyse une phrase — *« Je suis menuisier à
Blois et je fabrique des meubles sur mesure »* — et propose le métier, la ville,
un thème assorti, une palette, un slogan, une présentation et une FAQ. Deux
autres boutons dans le builder : **Améliorer ce texte** et **Proposer** sur les
listes.

La même mécanique sert au formulaire express (2.2 bis) : là, le métier et la
ville ne sont pas devinés mais saisis, et les gabarits de textes sont les mêmes.

**Aucun modèle de langage n'est utilisé.** L'analyse est locale, par mots-clés,
et les textes viennent de gabarits ; l'écran l'annonce plutôt que de laisser
croire à une IA. L'interface `AssistantProvider` est la couture prévue pour
brancher un vrai modèle : l'appelant ne changera pas.

### 3.11 Banque d'images (§18)

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

Un projet contient : identifiant et dates, métier, **formule**, objectifs,
modules, thème, couleurs, police, identité complète, pages et leurs sections,
catégories, produits, services, galerie, devise, affichage des prix, réglages de
grille, étape en cours, indicateur de révélation du prix, et le lead éventuel.

La formule est **facultative** dans le modèle de données : les projets
enregistrés avant cette option n'en portent pas, et le moteur les résout tous en
site sur mesure (§60). Aucun projet déjà construit n'est amputé au rechargement.

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
catalogue, **le travail humain au-delà du quota de la formule**, un supplément
pour le design sur mesure, et la réservation du nom de domaine quand le client en
demande un (§59). L'acompte vaut `max(10 % du total, 50 €)`.

**Le prix de base, les pages incluses et le prix de la page supplémentaire
appartiennent à la formule** (§60), et sa première ligne porte le nom de la
formule retenue. Le catalogue des modules, lui, reste **unique et partagé** :
chaque formule n'en facture qu'une **part**, réglée par un coefficient. Deux
tableaux de prix à tenir, ce sont deux tableaux qui divergent.

**Le travail humain se facture à l'unité, et seulement au-delà du quota** (§60).
Deux lignes peuvent apparaître :

- **« Rédaction de pages »** — les pages du projet au-delà des pages rédigées que
  la formule comprend ;
- **« Images d'illustration »** — les images au-delà de celles que la formule
  achète. Le compte porte sur des **URL distinctes** : logo, galerie, produits,
  services, images de sections et de blocs forment un seul ensemble, et une même
  photo posée sur deux pages ne s'achète qu'une fois.

Les **quotas** vivent dans le catalogue des formules, les **prix unitaires** dans
les règles de tarification : le premier n'a pas le droit de connaître le second.
Le site modèle, lui, ne peut pas produire de ligne « pages supplémentaires » —
ses pages incluses sont déjà son plafond, et sa page supplémentaire vaut zéro.

**Les trois bandes de prix ne se recouvrent pas.** Mesurées sur les 41 métiers du
catalogue, chacun monté avec les fonctionnalités et les pages de son modèle —
c'est-à-dire ce qui est réellement devisé :

| Formule | Bande | Médiane |
| --- | --- | --- |
| Site modèle | 670 – 950 € | 770 € |
| Site sur mesure | 1 460 – 2 960 € | 1 760 € |
| Site clé en main | 3 160 – 4 660 € | 3 460 € |

Un montant suffit donc à dire quelle formule a été vendue. L'administration refait
cette mesure à chaque frappe. Le **plafond théorique** d'une formule — toutes ses
fonctionnalités cochées en même temps — y est affiché à part et étiqueté comme
tel : aucun métier ne le demande, et ces plafonds se chevauchent d'une formule à
l'autre sans que les devis réels le fassent.

La dépendance ne va que dans un sens : le moteur de tarification lit le catalogue
des formules, le catalogue des formules ignore les tarifs. C'est ce qui rend §56
structurel plutôt que rédactionnel — un écran qui affiche les formules n'a aucun
montant à sa portée.

Le prix du domaine chez le registrar n'est **pas** dans ce total : il est
facturé par lui, dans sa devise, et affiché à part.

**Aucun montant n'est codé en dur dans un composant** : tout vient de
`PricingRules`, désormais éditable depuis l'administration (§38) et persistée.
Les valeurs par défaut ne servent que de repli au premier lancement — **elles
restent à valider avant la mise en service**.

---

## 6. Ce qui n'existe pas encore

Tout ce qui reste demande une infrastructure que le navigateur ne peut pas
fournir : un serveur, des comptes, des noms de domaine, un compte Stripe.

- **Paiement réel** : le contrat de données `Payment` est celui attendu par
  Stripe (projet, client, total, acompte, solde, date, transaction, statut) ;
  il manque la clé, l'appel serveur et le webhook de confirmation.
- **Emails transactionnels** : confirmation de commande, de paiement, relances.
  Le bouton **« Recevoir mon devis par email »** de la page finale enregistre le
  lead et annonce un envoi sous 24 h ouvrées ; aujourd'hui cet envoi est fait à
  la main depuis l'administration, aucun email ne part tout seul.
- **Comptes et authentification** : l'administration est aujourd'hui accessible
  à qui connaît l'adresse `/admin`. **Elle doit être protégée avant toute mise
  en ligne.**
- **Backend persistant** : tout vit dans l'IndexedDB du navigateur. Un client
  qui change d'appareil ne retrouve pas son projet, et l'administration ne voit
  que les projets créés sur la même machine. C'est la première brique à poser
  pour passer du prototype au produit.
- **Réservation effective du domaine** : la disponibilité et les prix viennent
  de GoDaddy, mais l'achat reste manuel, côté administration. Sans clé
  configurée, la vérification est simulée et l'écran le dit.
- **Phase 6 — SaaS** : publication du site, hébergement, gestion des domaines
  achetés, abonnements, multi-sites, statistiques.
- **Interface de comparaison des versions** : enregistrer et restaurer existent
  (§45), comparer non.

## 7. Vérification

Les scénarios de `scripts/` (voir son `README`) sont joués dans un vrai
navigateur : parcours de création, conversion, administration, commerce,
fonctions avancées, restauration, création express, blocs, grille fluide, et
automobile —
sélecteur de véhicule, forfaits, recherche de pneus, devis carrosserie,
programme et financement d'un centre de formation, recherche par mots-clés. Ils contrôlent notamment la règle d'acompte, la répercussion
des tarifs sur les devis, le choix du nom de domaine et sa ligne au devis, et
l'absence de tout montant avant la révélation.
