# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Site vitrine de SmartEfico (agence d'acquisition et d'automatisation IA), en français.
Trois pages HTML statiques, sans framework, sans étape de compilation. Le contenu de
`index.html` est directement ce qui est servi. Plus rien ne tourne côté serveur
depuis le 1er novembre 2026 : la fonction `api/chat.js` est partie avec l'assistant
de discussion (voir Architecture).

## Commandes

```bash
node scripts/sync-legal.mjs        # après toute modification de cgv.html ou cgc.html
node scripts/build-standalone.mjs  # régénère index-autonome.html
node scripts/build-guide.mjs guide     # après toute modification de scripts/guide/guide.html
node scripts/build-guide.mjs guide-ia  # après toute modification de scripts/guide/guide-ia.html
node scripts/build-partage.mjs     # après toute modification de scripts/partage/partage.html
npx --yes serve .                  # aperçu local sur http://localhost:3000
```

`serve` redirige `/guide.html` vers `/guide` (et `/guide-ia.html` vers `/guide-ia`) et
perd la chaîne de requête au passage : pour tester les paramètres `utm_…`, ouvrir
directement `/guide?utm_source=…`. Vercel et
GitHub Pages ne font pas cette redirection.

Contrôle qualité du design (44 règles d'anti-patterns) :

```bash
npx --yes impeccable@latest detect index.html cgv.html cgc.html
```

Toujours passer par `npx`. Le script installé localement
(`.claude/skills/impeccable/scripts/detect.mjs`) tourne en mode dégradé — ses modules
d'analyse HTML sont absents, il retombe sur des expressions régulières et ne trouve
qu'une fraction des problèmes, en le signalant lui-même.

`build-guide.mjs` sans argument réimprime les deux guides. Ne réimprimer que celui qui a
changé : Chrome date chaque PDF, et un guide réimprimé sans modification apparaît
quand même modifié dans git.

Ni tests, ni linter, ni build : il n'y a rien d'autre à exécuter.

## Architecture

**Pages autoportantes.** Aucun fichier CSS ou JS externe. Tout le style est dans un
`<style>` en tête de chaque page, les icônes des réseaux sociaux sont un sprite SVG
`<symbol>` en haut de `<body>` appelé par `<use>`, et le favicon est un PNG encodé en
base64 dans `<link rel="icon">`. Conséquence : ces pages n'ont besoin que de `assets/`
pour fonctionner, et rien ne peut casser à cause d'un fichier manquant.

**Les textes légaux existent en double, volontairement.** `cgv.html` et `cgc.html` sont
la source unique. Leur `<main>` est recopié dans deux `<dialog>` de `index.html`, entre
les repères `<!-- CGV:START -->` / `<!-- CGV:END -->` et leurs équivalents CGC. Ne jamais
éditer le texte entre ces repères : `sync-legal.mjs` l'écrase. Cette duplication existe
parce que `index-autonome.html` circule seul, sans les deux autres pages — sans elle,
ses liens CGV et CGC ne mèneraient nulle part.

**Un seul `<dialog>` par document, ouvert en JavaScript.** Les liens du pied de page
gardent un vrai `href` vers `cgv.html` / `cgc.html` : le site déployé et la navigation
sans JavaScript continuent de fonctionner, le script se contente d'intercepter le clic.

**`assets/` contient plus de fichiers que le dépôt n'en suit.** Une quinzaine de
fichiers (anciennes captures, icônes de réseaux au format image, miniatures YouTube)
sont listés nommément dans `.gitignore`, avec la raison. Ils restent sur le disque du
propriétaire. Ne pas les supprimer, ne pas les réintégrer sans raison.

**L'adresse du site est écrite en dur à trois endroits par page** : balise canonique,
balises Open Graph et Twitter, et données structurées JSON-LD. Elle vaut
**`https://smartefico.com`**, sans `www`, depuis le 17 septembre 2026 (avant :
`https://smartefico-z7.vercel.app`). Choix du propriétaire : Vercel sert
`smartefico.com` et redirige `www.smartefico.com` vers lui, chaîne de requête comprise.
Vercel avait d'abord été réglé à l'inverse ; le site a brièvement désigné `www`, puis
est revenu à l'adresse sans `www` le même jour. Les balises doivent toujours désigner
l'adresse finale, celle qui ne redirige pas. Un changement d'adresse doit tout couvrir
d'un coup, sinon les aperçus de partage LinkedIn pointent à côté :

- les pages : `index.html`, `cgv.html`, `cgc.html`, `guide.html`, `guide-merci.html`,
  `guide-ia.html`, `guide-ia-merci.html` ;
- les constantes `SITE` de `sync-content.mjs` et `build-blog.mjs`, puis régénérer le
  blog ;
- `scripts/guide/guide.html` et `scripts/guide/guide-ia.html`, puis
  `node scripts/build-guide.mjs` : les PDF portent l'adresse en clair et en lien ;
- hors du dépôt, dans Tally : la redirection de fin et le lien vers les CGC du
  formulaire `0Q47ZN`, les mêmes pour `LZ8MLz`, le lien vers le guide du
  formulaire `81VkKx`, et le lien vers les CGC du formulaire de contact `D4LJDR`.

**L'aperçu de partage** (ce qu'affichent WhatsApp, LinkedIn ou Facebook quand on
partage le lien) a été refait le 19 septembre 2026, à la demande du propriétaire :
« quand je partage le lien, voici ce que cela affiche […] Tu dois actualiser ».
L'ancienne image, `assets/og-cover.jpg` (12 septembre), montrait le portrait noir et
blanc et ne mettait en grand que la moitié « leads qualifiés » du titre ; le titre et
la description de l'aperçu ne parlaient eux aussi que des leads.

- L'image est désormais **`assets/og-smartefico-metiers.jpg`** (1200 x 630, 78 Ko),
  **sans portrait** depuis le 28 septembre 2026 (« Enlève aussi mon portrait de
  l'image de partage »), le jour où la signature a quitté l'accueil, et **avec la
  pastille des métiers** du hero, ajoutée le même jour (« Ajoute la pastille des
  métiers dans l'image de partage »). Sur le noir plat du site : le logo sans plaque
  et le nom **SMARTEFICO** en jaune ; la pastille « LEAD · CONSEIL · FORMATION ·
  AUTOMATISATION · OUTILS SUR MESURE » ; le titre d'accueil entier, ses deux moitiés
  à égalité et ses mots accentués en Instrument Serif jaune ; et, repris de l'ancienne
  image, « PME, ETI, grands comptes et dirigeants. » et le numéro, sur une pastille
  jaune. Sa source est
  `scripts/partage/partage.html`, photographiée par `node scripts/build-partage.mjs`
  (Chrome sans fenêtre, puis `sharp` en JPEG) ; le nom du fichier écrit est la
  constante `FICHIER` du script.
- **Sans la photo, le texte court sur toute la carte** (64 px de marge des deux
  côtés, au lieu de s'arrêter à 630 px) et le titre passe de 54 à **78 px**, en quatre
  lignes égalisées par `text-wrap:balance` : à 66 px, il s'arrêtait vers 920 px et
  laissait à droite le vide de l'ancienne photo. Pour que le bloc tienne en hauteur,
  le logo passe de 78 à 64 px et les écarts verticaux se resserrent.
- **La pastille des métiers coûte une ligne de hauteur**, rendue par le titre
  (78 → 70 px) et le logo (64 → 56 px) : il reste environ 40 px au-dessus et
  au-dessous du bloc. Elle reprend `.hero__metiers` — capitales espacées, filet et
  voile jaunes à faible opacité, Poppins 500 (seule police de l'image chargée pour
  elle) — mais en 17 px au lieu de 12, l'image étant réduite de moitié dans un fil
  LinkedIn. **Le jaune y paraît donc quatre fois** : le nom, la pastille des
  métiers, les deux mots du titre et la pastille du numéro.
- **`assets/Portrait3.jpg` n'est plus servi par rien** : ni page, ni image. Il reste
  dans le dépôt, comme le portrait couleur avant lui.

Ce qui suit retrace les versions précédentes, avec portrait.
- **Le portrait noir et blanc et la fin du filet**, 23 septembre 2026, deux demandes
  du propriétaire à la suite : « Refais l'image de partage avec le portrait noir et
  blanc », puis « Enlève le cadre jaune de l'image ». Le portrait est
  `assets/Portrait3.jpg`, celui que la page d'accueil venait de reprendre. Ses
  proportions (900 x 1200) sont presque celles du panneau (470 x 630) : `cover` ne
  rogne que deux pixels de large, la photo paraît entière, et le point de mire de
  12 % qui gardait le visage du portrait couleur n'a plus rien à corriger — il est
  revenu à 50 %. Le filet de 8 px qui séparait le texte de la photo est parti avec la
  seconde demande : le fond gris clair du noir et blanc tranche seul sur le noir de la
  carte, et l'arête se voit sans qu'on la dessine. **Le jaune n'y paraît donc plus que
  trois fois** : le logo et le nom SMARTEFICO, les deux mots accentués du titre, et la
  pastille du numéro. La ligne d'audience reste blanche, c'est du texte courant.
- **Elle a suivi le site au fond blanc le 23 septembre, puis au noir plat le soir
  même** — cinquième et dernière demande de la journée sur cette image (« Refais
  l'image de partage en noir »). Sur la carte noire, le jaune redevient de l'encre :
  le nom **SMARTEFICO** et les deux mots accentués du titre le portent, et la pastille
  du numéro ne change pas — **trois emplois**. Le trait de surligneur et le halo jaune
  du temps de la carte blanche sont repartis avec elle : le fond est plat, comme la
  page, sans le moindre dégradé.
- **Le logo y est sans plaque** (`assets/logo-clair.png`) : sur la carte noire, son
  contour blanc se détache seul. Il n'avait porté sa plaque que le temps de la carte
  blanche, quelques heures.
- **Aucun filet ne sépare plus le texte de la photo**, et il ne faut pas en remettre un
  sans sa demande : il l'a fait retirer le jour même. Sur la carte blanche, le fond
  gris clair du portrait noir et blanc suffit à poser l'arête, plus discrètement que
  sur le noir. Le revers, signalé au propriétaire avant qu'il ne redemande le blanc :
  **une carte claire se fond dans un fil de LinkedIn**, qui est blanc lui aussi, là où
  la carte sombre s'en détachait. C'est son choix, assumé.
- Elle a suivi les fonds du site : `og-smartefico.jpg` (noir pur, 19 septembre),
  `og-smartefico-noir.jpg` (noir profond, jaune réduit, 20 septembre),
  `og-smartefico-jaune.jpg` (portrait couleur, filet jaune, 21 septembre) et
  `og-smartefico-nb.jpg` (fond noir, portrait noir et blanc, sans filet) et
  `og-smartefico-blanc.jpg` (fond blanc, logo sans plaque) et
  `og-smartefico-blanc-2.jpg` (fond blanc, logo complet) — ces trois-là du
  23 septembre, en ligne moins d'une heure chacune —, qui restent toutes dans le dépôt
  parce que des partages y pointent peut-être. Une première version sur fond blanc avait existé le
  19 septembre sans jamais être mise en ligne — le fond du site avait changé avant —
  et n'a pas été gardée : l'historique git la retrouve.
- Elle se déclare dans le back office (`content/pages/visuels.md`, champ `og_image`),
  d'où `sync-content.mjs` la recopie dans les zones `VISUEL_OG` et `VISUEL_TWITTER` de
  l'accueil. Elle est aussi écrite en dur dans le JSON-LD de `index.html`, dans les
  balises de `guide.html`, `guide-ia.html` et `exemples-ia.html`, et dans
  `build-blog.mjs` (image par défaut du blog et des articles sans couverture).
- Titre de l'aperçu (et de l'onglet) : « SmartEfico — Leads qualifiés et IA générative
  au service de votre performance ». Description : « Des rendez-vous qualifiés pour
  vos offres, et l'IA générative au service de votre performance : publicités
  pilotées, agents IA, formation et accompagnement de vos équipes. » La
  `meta description` pour les moteurs de recherche, qui parlait déjà des deux, n'a pas
  bougé.
- **`<meta property="fb:app_id" content="1145110034608876">` est sur toutes les pages**
  depuis le 4 novembre 2026, à sa demande : l'identifiant de son application Meta,
  public, écrit en dur dans chaque page et dans `build-blog.mjs`. Une page ajoutée doit
  le reprendre. Il ne change rien à l'aperçu : il évite seulement l'avertissement de
  l'outil de débogage de Facebook.
- **Changer le nom du fichier à chaque refonte** : les réseaux gardent en mémoire
  l'image d'une adresse donnée. `og-cover.jpg`, `og-smartefico.jpg`,
  `og-smartefico-noir.jpg`, `og-smartefico-jaune.jpg`, `og-smartefico-nb.jpg`,
  `og-smartefico-blanc.jpg`, `og-smartefico-blanc-2.jpg`, `og-smartefico-plat.jpg`
  (noir plat avec portrait, du 23 au 28 septembre) et `og-smartefico-texte.jpg`
  (sans portrait ni pastille, en ligne quelques minutes le 28 septembre) restent
  dans le dépôt, inutilisées — des partages anciens y pointent peut-être. **Cinq noms ont été brûlés
  le 23 septembre** : il a fait refaire l'image cinq fois dans la journée, le fond du
  site ayant lui-même changé deux fois. Chaque refonte lui coûte un passage par le
  Post Inspector, donc grouper ce qui peut l'être avant de régénérer — et, quand le
  fond du site est en discussion, attendre qu'il soit arrêté. Après une refonte, les aperçus déjà mis en
  cache ne changent pas d'eux-mêmes : LinkedIn se rafraîchit par son Post Inspector,
  Facebook par son outil de débogage (« Scrape again ») ; WhatsApp n'a pas d'outil et
  garde son aperçu un moment — partager en attendant une adresse légèrement
  différente, comme `https://smartefico.com/?v=2`, l'oblige à relire la page.

**Le formulaire Tally n'est plus incrusté dans la page.** Sur demande du propriétaire,
la section Contact ne contient plus d'`iframe` : un bouton « Réserver mon appel » mène
à `https://tally.so/r/81VkKx` dans un nouvel onglet.

**Le bloc contact (« Devenez rentable maintenant ! ») est carré et sans fond depuis
le 5 novembre 2026**, à sa demande (« supprimer les arrondis ou le fond ») :
`.contact{border:0;border-radius:0;background:none}` dans le bloc de thème. **Plus
de filet non plus**, le même jour (« supprime le filet arrondis qui encadre ceci ») :
le texte se pose directement sur la page.

**Et cette section ne fait plus rien d’autre.** Le 14 septembre 2026, le propriétaire
l'a ramenée à un titre, une phrase et ce bouton. Le téléphone et les deux adresses
email qui y vivaient sont partis : le téléphone reste dans le hero, `contact.aintegrate`
dans le pied de page. Ne pas les y remettre sans sa demande.

**En revanche il est incrusté dans un article de blog**, et là sa hauteur est
négociée. Un article dont l'en-tête porte un `tally_url` reçoit le formulaire en fin de
page, monté par `build-blog.mjs` ; le champ est éditable dans le back office.

Le cadre porte `data-tally-src` — et non `src` — avec `dynamicHeight=1`, et la page
charge `tally.so/widgets/embed.js`, qui appelle `Tally.loadEmbeds()`. C'est cette
bibliothèque parente qui manquait aux tentatives précédentes : elle pose la source
elle-même, répond au cadre enfant, et tient la hauteur à jour. Le formulaire peut donc
gagner ou perdre des questions dans Tally sans rien à remesurer ici.

`embed.js` ne monte le cadre que lorsqu'il entre dans le champ de vision, par un
`IntersectionObserver`. Un repli se déclenche au bout de huit secondes si rien ne
s'est produit : la source est posée à la main et `.tally__frame--repli` rend au cadre
une hauteur fixe. Ces paliers-là viennent de mesures sur le formulaire `BzJr5Q` —
cadre de 280 px → 3326 px de haut, 350 → 2954, 420 → 2763, 480 → 2547, 560 → 2475,
704 → 2243 — et ne valent que pour lui. Ils ne servent que sur ce chemin de secours.

**La négociation de hauteur est confirmée** : le propriétaire a ouvert l'article le
5 septembre 2026 et constaté que le cadre s'arrête net sous le dernier champ, sans
vide. Le repli ne se déclenche donc pas en usage normal. Ne pas revenir à une hauteur
mesurée : l'aperçu intégré à Claude Code ne déclenche aucun `IntersectionObserver`,
le formulaire n'y monte jamais, et le repli s'y affiche à tort — ce n'est pas un bug
du site.

Sont partis avec lui : les paliers de hauteur de `.book__frame` et leurs six requêtes
média, le panneau `.book__done` et son écouteur `message`, et le `position:sticky` de
`.book__aside`. Le formulaire faisait quatre fois la hauteur de cette colonne, ce qui
était la seule raison de la rendre collante ; la contrainte « pas d'`overflow` sur
`.book`, `.book__grille` ou `.wrap` » tombe avec elle.

**Si le formulaire devait revenir dans la page**, sachez que Tally n'émet aucune
hauteur : ses évènements `Tally.FormLoaded` et `Tally.FormPageView` ne portent que
l'identifiant du formulaire, et son enfant iframe-resizer 5.5.9 attend une poignée de
main que seule sa bibliothèque parente sait faire. Deux impasses vérifiées : ajouter
`dynamicHeight=1` ne change rien, et charger `tally.so/widgets/embed.js` par-dessus un
`src` classique fait retomber le cadre à 1 px. Il faudrait donc reposer une hauteur en
dur, mesurée en ouvrant le formulaire seul. Les mesures de la version précédente,
à titre de repère : cadre de 239 px → 1532 px de haut, 294 → 1389, 493 → 1268,
807 → 1208. Elles sont à refaire, le formulaire ayant pu changer depuis.

**« Ce qu'on vous apporte » tient en une seule phrase depuis le 7 novembre 2026**, à sa
demande (« Résume cette partie et sois clair dans la promesse ») : « Nous démultiplions
vos ventes moyenne et haute gamme en *moins de 3 mois*, et nous mettons l'IA générative
au travail dans vos équipes. » Réécriture de Claude, sans rien ajouter : le délai reste
le sien et ne porte que sur les ventes. Sont partis « On fait deux choses, et on les
fait bien » et « Si c'est ce que vous cherchez, on est l'agence qu'il vous faut. »

**La carte de « Ce qu'on vous apporte » tient en un bloc centré depuis le 4 novembre
2026**, à sa demande (« Résume ces informations et met cela au milieu »). Résumé de
Claude, sans rien ajouter à ses deux blocs : « On fait deux choses, et on les fait
bien : démultiplier vos ventes moyenne et haute gamme en *moins de 3 mois*, et mettre
l'IA générative au travail dans vos équipes. », puis « Si c'est ce que vous cherchez,
on est l'agence qu'il vous faut. » Sont partis : « Rien d'autre. », « C'est ce qu'on
apporte à chacun de nos clients. », la mention des rendez-vous high ticket, les deux
volets, le filet et `.manifeste__bloc`. La carte garde toute la largeur ; la phrase
forte s'arrête à 56 ch. **Sans contour depuis le 5 novembre 2026**, à sa demande (« enlève
le filet ici aussi ») : `border:0`, le fond `--surface` dessine seul la carte. **Plus de fond
non plus**, le même jour (« supprime le fond d'écran de… ») : `background:none`, le
texte se pose directement sur la page. Ce qui suit décrit les états précédents.

**« Ce qu'on vous apporte » (`#apport`) est revenue le 28 septembre 2026**, à la
demande du propriétaire, juste avant « Ce à quoi vous engager » : « Avant "ce à quoi
vous engager" mettre la partie », suivie de son texte, qui est repris **mot pour
mot** — c'est le manifeste de la première version du site (20 août), augmenté de
« On n'est pas ici pour vous rendre "famous" », « On ne fait qu'une chose et on le
fait bien… high ticket. », « Rien d'autre. » et « Quelques chiffres : ».

- **Forme** : le titre « Ce qu'on vous *apporte*. » (l'italique est celui de la
  version supprimée), la phrase « famous » en chapô, sans point final, comme dans
  son texte ; puis une seule carte centrée (`.manifeste`, 46 rem au plus), en trois
  blocs séparés par un filet court. Chaque bloc s'ouvre sur une phrase forte, dans
  la pile et la graisse des grands titres, suivie de lignes en gris.
- **Le manifeste a été adapté le jour même**, à sa demande : « Modifie ceci et
  adapte-le […] de sorte que cela cadre avec mon thème : "Générez des leads qualifiés
  pour vos offres et mettez l'IA générative au service de votre performance." » Son
  texte ne parlait que des leads, et « On ne fait qu'une chose » contredisait la
  seconde moitié du titre. Il tient désormais en **quatre blocs** :
  1. la thèse, sur les deux moitiés — « On fait deux choses, et on les fait bien :
     vous rapporter des rendez-vous qualifiés pour vos offres high ticket, et mettre
     l'IA générative au service de votre performance. », puis son « Rien d'autre. » ;
  2. les leads, **ses phrases intactes** — « Personne ne vous connaîtra… *cash*… »,
     « Le buzz, très peu pour nous. », « Les ventes, c'est ce qui nous fait
     vibrer. » ;
  3. l'IA, **sur le même modèle** — « L'IA ne remplacera personne chez vous, mais
     elle fera gagner du *temps* à vos équipes. » (écrite par Claude le 19 septembre
     pour l'ancien manifeste, et validée alors), « L'IA gadget, très peu pour
     nous. », « Des outils que vos équipes utilisent vraiment, c'est ce qui nous
     fait vibrer. » ;
  4. la promesse — sa phrase « Démultiplier vos ventes haute gamme en *moins de
     3 mois* », prolongée de « , et mettre l'IA générative au travail dans vos
     équipes. », puis ses deux phrases de fin, « C'est ce qu'on apporte à chacun de
     nos clients. » et « Si c'est ce que vous cherchez, alors on est l'agence qu'il
     vous faut. », qui passe en dernier pour clore.

  **Aucun chiffre ni aucune promesse n'a été ajouté** : le seul délai reste le sien,
  et il ne porte que sur les ventes. Le titre et le chapô « famous » n'ont pas bougé.
  Les phrases fortes passent de 34 à 40 ch de large, sans quoi la première tenait
  sur cinq lignes ; « rendez-vous » est protégé de la coupure à son trait d'union
  (`.manifeste__bloc`), et « high ticket » par une espace insécable.
- **Puis ramené à son seul dernier bloc**, toujours le 28 septembre, à sa demande :
  il a fait supprimer les trois premiers (thèse, leads, IA), phrases collées à
  l'appui. **La carte ne porte plus que** « Démultiplier vos ventes haute gamme en
  *moins de 3 mois*, et mettre l'IA générative au travail dans vos équipes. », « C'est
  ce qu'on apporte à chacun de nos clients. » et « Si c'est ce que vous cherchez,
  alors on est l'agence qu'il vous faut. ». Sont partis avec les blocs : les filets
  qui les séparaient (`.manifeste hr`) et `.manifeste__bloc`, qui protégeait
  « rendez-vous ». « Personne ne vous connaîtra… *cash* » et « Le buzz, très peu pour
  nous » — les deux phrases les plus anciennes du site — ne paraissent donc plus nulle
  part, pas plus que « L'IA ne remplacera personne… ». Les blocs décrits ci-dessus
  sont dans l'historique git.
- **État actuel, dernière demande du 28 septembre** : il a fourni lui-même le texte
  entier de la carte, **en deux blocs**. La thèse d'abord — « On fait deux choses, et
  on les fait bien : vous rapporter des rendez-vous qualifiés pour vos offres high
  ticket, et mettre l'IA générative au service de votre performance. », puis « Rien
  d'autre. » —, un filet court, puis la promesse, où **« haute gamme » devient
  « moyenne et haute gamme »** (écho du « middle & haute gamme » du 20 août) :
  « Démultiplier vos ventes moyenne et haute gamme en *moins de 3 mois*, et mettre
  l'IA générative au travail dans vos équipes. », « C'est ce qu'on apporte à chacun
  de nos clients. », « Si c'est ce que vous cherchez, alors on est l'agence qu'il vous
  faut. ». Le filet (`.manifeste hr`) et `.manifeste__bloc` sont revenus avec le
  premier bloc.
- **Plus de chapô** : « On n'est pas ici pour vous rendre “famous” » est parti le même
  soir, à sa demande (« supprime "On n'est pas ici pour vous rendre “famous”" »). Le
  titre « Ce qu'on vous *apporte*. » mène droit à la carte.
- **Pleine largeur depuis le 29 septembre 2026**, à sa demande (« Tu dois étendre
  cette partie sur la page ») : la carte ne s'arrête plus à 46 rem, elle prend les
  74 rem de la page comme les autres sections. Pour que les phrases ne courent pas
  sur 1 000 px, chaque bloc est enveloppé dans un `.manifeste__volet` et les deux se
  mettent **côte à côte dès 52 rem** — la thèse à gauche, la promesse à droite —,
  séparés par un filet vertical `--mur`. Sous 52 rem, ils s'empilent comme avant,
  avec le filet court horizontal (`hr`), masqué au-dessus. **Deux détours pour
  impeccable**, qui levait `cramped-padding` sur le second volet : sa marge latérale
  est en valeur fixe (1,75 rem) et non en `clamp()`, et le filet vertical est une
  ombre intérieure (`box-shadow:inset 1px 0 0`) et non une `border-left` — même
  rendu au pixel près, mais le détecteur ne la prend plus pour une bordure collée
  au texte.
- **Mise en forme de Claude**, pour le reste : l'italique sur « cash » et « moins de
  3 mois », repris de la version du 20 août ; les espaces insécables avant « : » et
  dans « 3 mois ». Les guillemets “famous” sont les siens, laissés à l'anglaise.
- **« Quelques chiffres : » est reparti le jour même** (« supprime "Quelques
  chiffres :" »). Il était posé en étiquette `.mono` sous la carte, pour annoncer la
  section suivante ; la carte mène désormais droit à « Ce à quoi vous engager ».
- **« Démultiplier vos ventes haute gamme en moins de 3 mois »** est une promesse de
  résultat. Elle est de lui et figurait déjà sur le site jusqu'au 23 septembre ;
  l'assistant, lui, garde sa consigne de n'en faire aucune.
- **Pas de lien au menu, par choix** : la question lui a été posée, il a répondu
  « pas de lien au menu ». Ne pas en ajouter sans sa demande, même si la place existe
  depuis le départ de « Chaîne ».
- La section fait **284 px** à 1 280 px de large depuis la pleine largeur (carte de
  1 184 px, 251 px de haut à 900 px, 421 px sur téléphone) ; la page tombe à
  **6 903 px**. Pour mémoire : 586 px avec le texte d'origine, 626 px avec
  « Quelques chiffres : », 809 px avec quatre blocs, 317 px avec le seul dernier,
  484 px avec deux blocs et le chapô, 451 px sans le chapô, en carte de 46 rem.
  Sa marge intérieure est écrite en valeurs fixes, pas en `clamp()`, pour que le
  détecteur d'impeccable la lise.

Ce qui suit décrit sa version précédente et son retrait.

**« Ce qu'on vous apporte » (`#apport`) a été supprimée le 23 septembre 2026**, à la
demande du propriétaire, qui réduisait le nombre de sections. Ce qui suit décrit ce
qu'elle était, parce que son manifeste peut resservir et que l'historique git le
garde. Elle résumait le titre d'accueil depuis le
19 septembre 2026. Le propriétaire l'a fait remonter juste après les marques, avant
« Agents IA », et a demandé de la résumer « de sorte que cela exprime mieux mon grand
titre » : « Générez des leads qualifiés pour vos offres et mettez l'IA générative au
service de votre performance. » Elle tient désormais en trois blocs, tous tirés de son
texte d'origine, resserré :

- une accroche, « Le buzz, très peu pour nous. Les ventes, c'est ce qui nous fait
  vibrer. » (sa troisième phrase d'introduction, sans « Si c'est ce que vous
  cherchez… ») ;
- deux cartes qui reprennent les deux moitiés du titre, avec ses mots en italique :
  « Des *leads qualifiés* pour vos offres » (ses rendez-vous qualifiés, et le système
  en trois étiquettes) et « L'*IA générative* au service de votre performance » (ce
  qu'elle fait, qu'elle sert sans remplacer, et les cinq prestations en étiquettes :
  Formation, Conseil, Sensibilisation, Déploiement, Accompagnement) ;
- le manifeste en bandeau, en quatre phrases sur deux volets face à face, demande du
  même jour (« 2 lignes parlant de la génération de lead et 2 autres lignes parlant
  de l'IA générative au service de la performance ») : à gauche ses deux phrases,
  « Personne ne vous connaîtra grâce à nous, mais vous ferez du *cash* avec nos
  systèmes. » et « Démultiplier vos ventes middle & haute gamme en *moins de 3
  mois*. » ; à droite deux phrases proposées par Claude sur le même modèle — une
  opposition, puis un résultat —, « L'IA ne remplacera personne chez vous, mais elle
  fera gagner du *temps* à vos équipes. » et « Mettre l'IA générative au service de
  votre *performance*, de la formation de vos équipes au suivi de vos outils. » La
  phrase « C'est ce qu'on apporte à chacun de nos clients. » est partie pour tenir
  en quatre lignes.

Sont partis : les deux premiers paragraphes d'introduction, fondus dans les cartes, et
les six panneaux dépliants `.livrable` avec leurs textes cachés, dont le détail vit
désormais dans `#ia` — l'historique git les garde si on voulait y revenir. Les cartes
réutilisaient le composant `.pilier` de `#ia`, qui reste en place.

**Ce qui est parti avec elle, le 23 septembre 2026** : son markup, son style
(`.apports`, `.apport__manifeste`, `.apport__volet`, et `.manifesto` tout entier, que
rien d'autre n'appelait), la règle `.manifesto .punch em` du bloc de thème, et **le
lien « Expertises » du menu**, qui pointait sur elle et n'aurait plus mené nulle part.
Le menu passe donc à six liens plus « Contact », et respire d'autant — jusqu'au
25 septembre 2026, où « Exemples » a repris la place libérée. L'ordre du menu suit
toujours celui de la page.

**Le manifeste est parti avec la section** : ses quatre phrases — deux du propriétaire
sur les leads, deux de Claude sur l'IA générative, écrites le 19 septembre — ne
paraissent plus nulle part. Il a été prévenu. Le bloc se replacerait ailleurs d'un
seul tenant si l'envie revenait : c'était un `div.manifesto` autonome, avec son fond
noir et ses deux volets.

Le même jour, « Ce à quoi vous engager » (`#chiffres`) et « Ne nous croyez pas sur
parole, observez » (`#preuves`) l'ont suivie, ensemble et toujours avant « Agents IA »,
à la demande du propriétaire. La seconde a été supprimée le 21 septembre 2026, elle
aussi à sa demande (voir « Plus de captures de preuves » dans Design). Puis, toujours
le même jour et à sa demande, « Agents IA » (`#agents`) est passé après « Ce qu'on
installe » (`#resultats`), puis après le bandeau des cinq étapes ; et « Avant, après »
(`#avant-apres`), qui suivait ce bandeau, est remonté juste avant « Ce qu'on
installe ». L'accueil enchaîne donc : hero, marques, `#apport` (revenue le
28 septembre 2026), `#chiffres`,
`#avant-apres`, `#resultats`, le bandeau des cinq étapes (`#methode`), `#ia`,
`#exemples` (venue s'intercaler le 25 septembre 2026, « juste avant agent IA »),
`#pour-qui` (« Pour *qui* ? », venue s'intercaler à son tour le 28 septembre 2026,
voir plus bas),
`#agents` (que l'IA générative précédait déjà, placés l'un contre l'autre le même
jour), puis la FAQ, le contact et le pied de page. **« Trois raisons, *pas une de
plus* » (`#pourquoi`), qui suivait les agents, a été supprimée le 28 septembre
2026**, à sa demande, avec son style (`.why`) : ses trois cartes — « L'ordre n'est pas
négociable », « Les agents tournent déjà », « On se branche sur vos outils » — ne
paraissent plus nulle part, et la page passe de 7 400 à **7 070 px**. Un signalement
d'impeccable est parti avec elle (`flat-type-hierarchy`). « Ma
chaîne, en clair » (`#agenda`), entre « Trois raisons » et la FAQ, et la signature,
sous l'appel au blog, ont été **supprimées le 28 septembre 2026** (voir plus bas).
**L'appel au blog lui-même** (`.blog-cta` : « Le blog », « Envie d'aller plus
loin ? Découvrez mes articles sur le blog. », bouton « Lire le blog »), entre le
contact et le pied de page, est parti le même jour, à sa demande, avec son style. Le
blog n'est plus annoncé sur l'accueil que par le lien « Blog » du menu ; la page
passe de 7 407 à **7 226 px** à 1 280 px de large. « Avec qui l'agence travaille » (`#public`) suivait
« Trois raisons » depuis le 19 septembre ; elle a été **supprimée le 23 septembre
2026** (voir plus bas). La première pile s'arrête
avant le bandeau, la seconde s'ouvre sur l'IA générative. Le menu suit l'ordre de la
page : « Avant/Après » y est passé devant « Services », sans rien changer à sa
largeur. Aucun texte visible ne dépend de cet ordre — « Les quatre scénarios plus
haut », dans « Trois raisons », désignait les agents, et la section est partie.

**« Avant, après » parle des deux moitiés du titre d'accueil depuis le
25 septembre 2026**, à la demande du propriétaire : « adapte cette partie à mon
activité principale ». Elle ne parlait que d'acquisition. Son chapô nomme désormais
les deux pièges — le pipeline instable, et les équipes prises par des tâches que l'IA
sait déjà prendre — et **une sixième paire de lignes** a été ajoutée sur l'IA
générative : « Chacun essaie l'IA dans son coin, sans méthode ni règles communes. »
face à « Vos équipes sont formées, outillées et tenues par des règles d'usage
claires. » — ce que promettent les leviers Former et Sensibiliser de `#ia`. Les cinq
paires d'origine, qui sont de lui, n'ont pas bougé d'un mot. Les deux colonnes se
lisent ligne à ligne : **une ligne ajoutée d'un côté en appelle une de l'autre**,
sinon l'appariement se décale. La section passe de 507 à 580 px.

**Les quatre cartes de `#resultats` sont sans fond et résumées depuis le 5 novembre
2026**, à sa demande (« Enlève les fond […] et résume pour que cela soit simple à
comprendre ») : `#resultats .offer` et `#resultats .kpi` perdent leur fond, le
filet des cartes reste. Textes de Claude, titres inchangés : « Repère et relance vos
prospects sur Meta, LinkedIn et TikTok, automatiquement. » (Prospects repérés par
semaine) ; « L'IA trie les demandes selon vos règles : vos vendeurs ne parlent qu'à
des clients prêts à acheter. » (Rendez-vous vraiment qualifiés) ; « Réponses aux
emails et aux questions fréquentes, 24 h/24, avec votre ton. » (Demandes traitées
sans vous) ; « Un seul contenu de départ, publié sur tous vos canaux. » (Contenus
publiés et temps gagné). Le mot « closers » ne paraît plus. 544 px à 1 280 px.

**`#resultats` s'appelle « Notre *méthode*. » depuis le 4 novembre 2026**, à sa demande
(« au lieu de "Notre méthode ClientlyEfico." met plutot "Notre méthode" ») : le nom
« ClientlyEfico » ne paraît plus nulle part sur le site, et l'italique passe sur
« méthode », pour suivre les autres titres. Ce qui suit décrit l'état précédent.

**`#resultats` s'est appelée « Notre méthode *ClientlyEfico*. » à partir du
28 septembre 2026**, à la demande du propriétaire, en deux temps le même jour : « Au lieu de "Ce
que nous installons se mesure." mets plutôt "Notre méthode SmartClient" », puis
« remplace "smartclient" par "ClientlyEfico" » — graphie reprise telle qu'il l'a
écrite, C et E capitales. Le point final et l'italique sur le nom de la méthode
sont de Claude, pour suivre tous les autres titres de la page,
qui portent chacun les deux ; son texte n'en avait pas. Tient sur une ligne, à
1 280 px comme sur téléphone. L'ancre `#resultats` et le chapô (« Chaque système
arrive avec son tableau de bord… ») n'ont pas bougé. **Le lien du menu qui y mène
s'appelle « Méthode » depuis le même jour** (« Renomme le lien "Services" du menu en
"Méthode" ») : il s'appelait « Services », nom sous lequel il apparaît dans les
paragraphes plus anciens de ce fichier. Plus court d'une lettre, il ne change rien à
la tenue de la barre — 60 px et 99 px de marge au seuil de 1 120 px. À
noter : le bandeau qui suit s'appelle « Cinq étapes, du système au multi-scaling »
et son ancre est `#methode` — deux « méthodes » se suivent désormais.

**Avant cela, `#resultats` s'appelait « Ce que nous installons se *mesure*. »**,
depuis le 25 septembre 2026, à la demande du propriétaire. Elle s'appelait « Ce qu'on
installe, et ce qu'on *mesure dessus*. », sur deux lignes que séparait un `<br>` ;
c'est sous cet ancien nom qu'elle apparaît dans l'historique des déplacements
ci-dessus. Le titre passe au « nous » du reste du site, tient sur une ligne — le
`<br>` est parti avec —, garde le point final de tous les titres de la page, et
l'italique se resserre sur « mesure ». L'ancre, le lien « Services » du menu et le
texte de la section n'ont pas bougé.

**« Pour *qui* ? » (`#pour-qui`), depuis le 28 septembre 2026**, juste avant « Agents
IA », à la demande du propriétaire : « avant "agent ia" tu dois mettre "Pour qui ?" ;
dans pour qui tu dois mettre des clients middle et haute gamme et ceux qui ont besoin
d'intégrer l'ia dans leur process (fais une bonne reformulation) ». **Tout le texte
est de Claude**, à partir de cette consigne et de phrases que le site portait déjà :

- chapô : « Deux profils d'entreprises, et bien souvent, les deux à la fois. » ;
- carte 1, « Vous vendez des offres *moyenne et haute gamme* » (« moyenne », comme
  dans le manifeste, où il a lui-même remplacé « middle ») : le besoin — « Vos offres
  ne s'achètent pas en un clic. Il vous faut moins de contacts, mais les bons : des
  interlocuteurs qui ont le besoin, le budget et le pouvoir de décider. » —, puis trois
  situations : un rendez-vous ou un devis avant la vente, un client gagné qui justifie
  un vrai suivi, un pipeline qui « dépend encore de l'effort fourni ce mois-ci »
  (écho d'une ligne à lui dans « Avant, après ») ;
- carte 2, « Vous voulez intégrer l'*IA* dans vos process » : « L'IA doit travailler
  pour vos équipes, et non l'inverse : des cas d'usage choisis, des outils qui
  s'ajoutent aux vôtres, des équipes formées pour s'en servir. », puis : des tâches
  répétées chaque jour, « Chacun essaie l'IA dans son coin, sans méthode ni règles
  communes » (repris d'« Avant, après »), et l'envie de garder ses outils (écho de
  « On se branche sur vos outils », dans « Trois raisons », supprimée le même soir :
  la ligne tient seule).

**Résumées le 5 novembre 2026**, à sa demande (« Résume cette partie pour que cela
soit simple et facile à comprendre ; surtout ne mets pas de filet ») : chaque carte
garde son titre, une phrase et **deux** situations au lieu de trois. Texte de Claude.
Carte 1 : « Vos clients prennent le temps de décider. Il vous faut moins de contacts,
mais les bons : ceux qui ont le besoin, le budget et le pouvoir de dire oui. » ;
« Vous vendez sur rendez-vous ou sur devis. », « Vos ventes varient trop d'un mois à
l'autre. » Carte 2 : « L'IA doit faire gagner du temps à vos équipes, avec les outils
que vous avez déjà. » ; « Vos équipes refont chaque jour les mêmes tâches. »,
« Chacun essaie l'IA dans son coin, sans règles communes. » **Plus de filet** au-dessus
des listes (`border-top` retiré), et les tirets des puces sont devenus des points :
n'en remettre aucun sans sa demande. 301 px à 1 280 px. **Puis encore résumées, et
sans contour**, le même jour (« enlève les contours pour ceci, résume mais fais de
sorte qu'on distingue les deux ») : `.pour-qui .pilier{border:0}`, et les deux cartes
se distinguent par leur fond et par un numéro **01** / **02** (`.pilier__tete`,
`.pilier__no`, lu « 01 — » par les lecteurs d'écran). Carte 1 : « Il vous faut moins
de contacts, mais des clients prêts à acheter. » ; « Vente sur rendez-vous ou sur
devis. », « Des ventes qui varient d'un mois à l'autre. » Carte 2 : « L'IA doit faire
gagner du temps à vos équipes, avec vos outils actuels. » ; « Les mêmes tâches,
refaites chaque jour. », « Chacun teste l'IA dans son coin. » 177 px par carte à
1 280 px. **Puis sans fond**, toujours le 5 novembre 2026 (« Fais la même chose
pour cette partie aussi », après les cartes de `#resultats`) : `background:none`,
ni fond ni contour, les numéros 01 / 02 et l'écart de grille distinguent les deux
profils. Chapô : « Deux profils, souvent les deux à la fois. » Carte 1 : « Moins de
contacts, mais des clients prêts à acheter. » ; « Vente sur rendez-vous ou devis. »,
« Ventes irrégulières d'un mois à l'autre. » Carte 2 : « Du temps gagné pour vos
équipes, avec vos outils actuels. » ; « Des tâches répétées chaque jour. », « Chacun
teste l'IA dans son coin. » **Le contour est revenu le même jour** (« Mets juste des
limites à cela comme au niveau de "Notre méthode" ») : sans fond, avec le filet
`--line` de `.pilier`, comme les cartes de `#resultats`. **Coins carrés** sur ces deux sections,
le même jour (« ne mets pas arrondis, mets des carrés ») : `border-radius:0`, les
autres cartes du site gardent leurs 18 px. Ce qui suit décrit la première version.

**Les secteurs n'y sont pas, volontairement** : ils vivent dans la FAQ (« Avec quel
type d'entreprises travaillez-vous ? »), et les recopier referait le doublon qui a
fait supprimer « Avec qui l'agence travaille ». Aucun chiffre, aucun montant, aucune
promesse. Deux cartes `.pilier` dans une grille `.pour-qui` (deux colonnes dès
46 rem) ; le mot en italique des titres de carte en Instrument Serif ; les trois
situations en liste à tirets (`.pour-qui__signes`), calée en bas de carte par
`margin-top:auto` pour que les deux listes s'alignent. 351 px à 1 280 px, 808 px sur
téléphone ; la page passe à **7 400 px**. Pas de lien au menu, qui n'en a pas reçu
la demande.

**Plus de section « Avec qui l'agence travaille ».** Le propriétaire a demandé le
23 septembre 2026 de réduire le nombre de sections de l'accueil, qui en comptait
quinze. Quatre répétaient ce qu'une autre disait déjà — « Avec qui l'agence
travaille », « Ce à quoi vous engager », « Ce qu'on vous apporte » et « Trois
raisons » ; il a choisi la première, et elle seule.

C'était la seule duplication littérale : ses huit types de clients sont repris **mot
pour mot** par la question « Avec quel type d'entreprises travaillez-vous ? » de la
FAQ, qui paraît quelques centaines de pixels plus bas. Rien n'a donc été perdu, et la
page gagne 297 px. Sont partis avec elle son style `.aud` et son `.aud li:hover` de la
règle de survol commune ; aucun lien de menu ne pointait dessus, et aucun texte ne la
citait. L'historique git la garde.

**Il a demandé « Ce qu'on vous apporte » dans la foulée**, prévenu qu'elle portait le
manifeste. Elle coûtait 697 px, la plus lourde des quatre. L'accueil est donc passé de
quinze à **treize sections** dans la soirée, et de 9 546 à **8 552 px**.

**« Trois raisons » est partie le 28 septembre 2026**, à sa demande, malgré la raison
notée ci-dessous : c'était son choix, et le paragraphe reste pour mémoire.

**Les deux dernières candidates restaient, et les raisons de les garder étaient
notées** :
« Ce à quoi vous engager » porte les compteurs animés, un argument visuel que rien ne
remplace ; « Trois raisons » est la seule section qui formule une objection et y
répond. Aucune des deux n'est une duplication : les retirer, c'est choisir de ne plus
dire quelque chose.

**La section « L'IA générative au service de votre performance » (`#ia`)**, demandée
le 18 septembre 2026, s'est d'abord placée juste avant la chaîne. Le 19, à la demande
du propriétaire, elle a rejoint « Agents IA » (« juste avec "Agent IA" tu mettras
toutes les informations relatives à "L'IA générative au service de votre
performance" »), d'abord après eux, puis juste avant (« toute la partie "Agent IA"
doit être après toute la partie "L'IA générative…" »), sans rien changer à son
contenu. Titre, accroche, textes et
étiquettes sont ceux du propriétaire, mot pour mot : cinq cartes `.pilier` — 01 Former,
02 Conseiller, 03 Sensibiliser, 04 Déployer, 05 Accompagner —, puis une sixième,
`.pilier--appel`, « Prêt à intégrer l'IA dans votre activité ? ». Trois colonnes sur
deux rangs, comme la grille de la méthode que `.guide-lien` complète de la même façon.
Les numéros reprennent le traitement de `.step__no` (jaune, gras, serré) ; le numéro
affiché est masqué aux lecteurs d'écran, qui lisent « 01 — Former » dans le titre. La
sixième carte se distingue par un filet jaune — le « trait fin », l'un des quatre rôles
du jaune — et son bouton « Nous contacter » ouvre le formulaire `D4LJDR` dans un nouvel
onglet, avec `utm_source=site&utm_medium=section-ia`. Pas de lien dans le menu, qui
est plein. Sous la grille, sur toute sa largeur, un encart mène à son propre guide
gratuit (voir `guide-ia.html` plus bas).

**La sixième carte a été supprimée le 28 septembre 2026**, à la demande du
propriétaire, avec son titre, sa phrase (« Commençons par identifier les tâches que
vous pouvez automatiser… »), son bouton « Nous contacter » et sa mention « Formulaire
Tally · nouvel onglet ». Sont partis avec elle `.pilier--appel`, `.pilier__action`,
`.pilier__note` et la ligne `.pilier--appel` du bloc « NOIR PLAT ». **L'accueil ne
mène donc plus au formulaire `D4LJDR`** : il reste accessible depuis la dernière page
du guide PDF de l'IA, `guide-ia-merci.html` et `exemples-ia.html`.

**L'encart du guide a pris la case vide le même jour**, à sa demande (« met le guide
[…] juste dans le trou à droite de "Accompagner" ») : il était en pleine largeur sous
la grille, il en est désormais la sixième case, comme `.guide-lien` dans la grille des
cinq étapes. Un modificateur `.guide-lien--case` (`grid-column:auto`) le fait, sans
toucher à `.guide-lien--large`, que l'encart « Explorer les cas d'usage » de
`#exemples` garde en pleine largeur. Sa marge verticale passe à 0,4 rem et son
interlignage à 1,22 pour qu'il ait la hauteur d'un levier fermé : **62 px des deux
côtés à 1 280 px et au-delà**. Entre 1 120 et 1 280 px, sa phrase passe sur trois
lignes et il dépasse de 13 px ; en deux colonnes, de 4 px ; sur téléphone il suit 05,
bouton sous le texte, comme avant. La section tombe à **321 px** à 1 280 px (400 avec
l'encart sous la grille), et la page à **6 999 px**. Ce qui suit décrit la carte
d'appel telle qu'elle était.

**Son titre tient sur deux lignes**, demande du propriétaire du 25 septembre 2026, par
une largeur maximale de 26 ch sur le seul `#ia` — pas un `<br>`, qui couperait toujours
au même mot quelle que soit la taille de l'écran. `text-wrap:balance`, hérité de
`.display`, répartit les deux lignes : « L'IA générative au service » / « de votre
performance. » À 1 280 px, la bande des deux lignes se joue entre 22 et 30 ch, d'où
les 26 ch, au milieu — assez de marge pour une police de substitution plus large. Deux
lignes de 480 px jusqu'aux plus grands écrans ; trois en dessous, comme avant, le
titre faisant 48 caractères.

**Les cinq leviers se replient depuis le 25 septembre 2026**, à la demande du
propriétaire : « tu mettras les informations […] dans des onglets cachés comme tu as
mis les éléments sous "Cinq étapes, du système au multi-scaling" ». Chacun est devenu
un `<details class="pilier pilier--repli">` : le `<summary>` porte le numéro, le titre
et le chevron, et le `.pilier__corps` cache le texte et les quatre étiquettes. Rien du
texte n'a bougé.

- **Même mécanique que `.step`, mais pas sa peau.** Le chevron est le même dessin, une
  seule déclaration pour les deux composants, et les marges du sommaire reprennent
  celles de `.step__tete` au pixel près (1,05 rem / 1,2 rem) : les deux accordéons de
  la page se lisent à la même densité. La surface, elle, reste celle de la section
  (`--surface`, filet `--line`), sinon les cinq leviers se seraient détachés de la
  carte d'appel et de l'encart du guide, qui restent des cartes pleines.
- **La marge passe de la carte au sommaire**, sans quoi un panneau fermé matelasse
  deux fois. C'est ce que `.pilier--repli` fait, et lui seul : les cartes `.pilier` de
  `#exemples`, qui n'ont pas ce modificateur, ne bougent pas.
- **Un panneau fermé ne s'étire pas à la hauteur de sa rangée** (`align-self:start`) :
  sans cela, 04 et 05 prenaient celle de la carte d'appel, à côté.
- **La carte d'appel est devenue un bandeau pleine largeur**, posé juste au-dessus de
  l'encart du guide. Elle était la seule chose haute de sa rangée et laissait 250 px de
  vide sous les panneaux — ce que des panneaux repliés sont précisément censés
  supprimer. Son texte se met en ligne au-dessus de 46 rem (titre, phrase, puis le
  bouton et sa mention, regroupés dans un `.pilier__action` pour ne jamais se séparer)
  et se réempile en dessous. Le `justify-content:center` de la carte a dû être défait
  en mode ligne : il centrait le bouton quand il passait à la ligne suivante.
- **Aucun panneau n'est ouvert à l'arrivée**, comme les cinq étapes et la FAQ (voir
  Design). À 1 280 px, un panneau fermé fait 86 px contre 245 px ouvert, la section
  tombe à 605 px et l'accueil reprend **310 px**.

**« Exemples » n'est plus une section depuis le 4 novembre 2026** : à sa demande
(« Ajoute toute cette partie dans un petit onglet de "L'IA générative au service de
votre performance." »), c'est un panneau replié de `#ia`
(`details.pilier--repli.exemples-onglet`). **Il tient la sixième case, à droite
d'« Accompagner », depuis le même jour** : à sa demande, il y remplace l'encart « Le
guide gratuit » (« supprime […] et remplace par l'onglet »), parti avec son style
`.guide-lien--case`. Fermé, son titre resserré tient sur deux lignes à la hauteur des
leviers ; ouvert, il prend toute la largeur (`[open]{grid-column:1/-1}`), une case
étant trop étroite pour ses trois cartes. **Son sommaire est un aplat jaune depuis le
même jour** (« rends très visible cette partie »), texte `--on-yellow`, Poppins 600,
le seul des six : c'est le rôle du jaune, ce qui se clique. `guide-ia.html` reste accessible par « Recevoir
le guide gratuitement », à l'intérieur du panneau. Ses inscriptions ne viennent donc
plus de `utm_medium=section-ia`, mais de `section-exemples`. L'ancre
`#exemples` passe sur ce panneau ; **le lien « Exemples » du menu l'ouvre**, par un
script en bas de page, comme une adresse `/#exemples`. Son contenu n'a pas changé : le
titre tient dans le sommaire et ses trois cartes passent au noir pour se détacher du
panneau. Elles portent un `h4` sans `.pilier__tete`, que `.pilier--repli` rendrait
cliquable. La page tombe à **5 449 px** à 1 280 px. Ce qui suit décrit la section.

**« Exemples d'applications de l'IA » (`#exemples`) et sa page**, demandées le
25 septembre 2026 : « juste avant agent IA je veux créer un onglet "Exemples
d'applications de l'IA par secteur, département et métier, Explorez les différents cas
d'usage de l'intelligence artificielle" […] tu mettras les informations de cette page
[…] Tu dois résumer et après créer une page qui illustre tout cela », sur le modèle de
`demarretonaventure.com/ex-applications-ia`.

- **La section résume, la page développe.** Sur l'accueil, entre `#ia` et `#agents` :
  le titre et l'accroche du propriétaire mot pour mot, trois cartes — Par secteur, Par
  département, Par métier —, et l'encart pleine largeur qui mène à `exemples-ia.html`.
  **« secteur, département et métier » est en italique** depuis le 25 septembre 2026,
  à sa demande : c'est le plus long `<em>` de tous les titres de la page, mais il est
  blanc — `.display em` — et non jaune, le jaune ne restant qu'aux `h1`. La coupe des
  deux lignes tombe juste devant lui, l'italique tient donc la seconde ligne entière.
  Le `h1` de `exemples-ia.html` n'a pas suivi : son `<em>` est jaune, et quatre mots
  jaunes au lieu d'un y changeraient la dose de couleur de la page.
  **Elle n'introduit aucun style** : les cartes sont des `.pilier` sans numéro et
  l'encart est le `.guide-lien--large` de la section voisine, avec une icône de grille
  à quatre carreaux au lieu de la flèche de téléchargement. Elle coûte 535 px, plus
  l'écart de 50 px.
- **La page est autoportante**, feuille propre comme les CGV, les CGC et les deux
  guides, en-tête et pied repris du blog. Neuf parties : ce qui rend un exemple
  utilisable (cinq conditions), six familles d'usages, neuf secteurs, seize
  départements, quinze métiers, le tableau « apport / contrôle indispensable », trois
  repères officiels (CNIL, EUR-Lex, ANSSI — vérifiés, le lien ANSSI redirige vers
  `messervices.cyber.gouv.fr`), les cinq étapes qui mènent de l'exemple au projet, et
  la FAQ. Elle finit sur le formulaire `D4LJDR`, en `utm_medium=page-exemples`.
- **La source n'est pas recopiée.** Son hub aligne près de 280 pages « département » et
  autant de « métier » ; on en a gardé la charpente et l'idée directrice — un exemple
  ne vaut que relié à un processus, des données, un risque, une validation humaine et
  un indicateur —, et tout le texte a été réécrit. Les usages sont décrits au
  conditionnel de la capacité (« peut », « aide à ») et chaque carte de secteur porte
  son point de vigilance : aucun chiffre de résultat, aucun montant, aucun client, et
  rien qui délègue une qualification juridique, fiscale, médicale ou une notation de
  personne.
- **Un septième lien est revenu au menu**, « Exemples », entre « Services » et
  « Chaîne » — l'ordre du menu suit toujours celui de la page. Il rend au menu
  exactement la largeur qu'il avait avant le retrait d'« Expertises » : mesuré à
  1 120 px, il reste **62 px** entre la marque et les liens et **103 px** avant
  « Contact » (63 et 106 px du temps d'« Expertises », qui était un peu plus large).
  Le menu est de nouveau plein : un huitième lien reste hors de portée.
- **Elle est le quatrième lien du site vers `guide-ia.html`** — en-tête, accroche et
  pied de la page —, en `utm_medium=page-exemples`. L'encart de `#ia` n'est donc plus
  le seul chemin vers ce guide, contrairement à ce qui est écrit plus bas.
- **Un petit onglet « Recevoir le guide gratuitement » clôt la section d'accueil**,
  demandé le 9 octobre 2026 (« ajouter un petit onglet "recevoir le guide
  gratuitement" »). Une pastille jaune centrée sous l'encart « Explorer les cas
  d'usage » (`.exemples__guide`), icône de téléchargement et même taille que le
  bouton des encarts voisins ; elle mène à `guide-ia.html` — le guide de l'IA
  générative, celui qui colle au sujet de la section, et non celui des cinq étapes —
  avec `utm_source=site&utm_medium=section-exemples`, pour que Tally range ces
  inscriptions à part. C'est le seul style que la section ajoute : un aplat jaune de
  ce qui se clique, l'un des deux rôles permis du jaune. Une ligne sur téléphone, sans
  débordement ; aucun nouveau signalement d'impeccable.
- **L'assistant la connaît** : `build-assistant.mjs` lit désormais son `<main>` comme
  ceux de l'accueil et des deux guides, et `api/chat.js` porte un `LIEN_EXEMPLES` avec
  une consigne — quand le visiteur demande ce que l'IA ferait dans son secteur, son
  département ou son métier, l'orienter vers cette page. Le contexte passe d'environ
  21 000 à **31 300 caractères** : c'est le préfixe mis en cache, relu au dixième du
  prix à partir de la deuxième question, mais il est à savoir si l'on compte les
  centimes.
- **Signalements d'impeccable propres à la page**, tous vérifiés faux dans le
  navigateur : `cramped-padding` sur `.dept` (13,6 px de marge verticale mesurés),
  sur les `<li>` de `.etapes` (18,4 px sur les quatre côtés, la même valeur que
  `.carte`, qui n'est pas signalée) et sur les conteneurs à filet `.depts` et `.faq`
  — c'est la famille déjà connue, où le détecteur attribue la marge au mauvais
  élément. Le `all-caps-body` de l'étiquette d'accroche, lui, était juste : elle est
  passée de 42 à 19 caractères.

**Le formulaire de contact `D4LJDR`** (https://tally.so/r/D4LJDR), créé le même jour
sur le modèle fourni par le propriétaire : titre « Passez à la vitesse supérieure avec
l'IA. », texte d'introduction, Nom complet, Email, Sujet et Message obligatoires ;
Téléphone (France par défaut), « Comment nous avez-vous connu ? » et la case newsletter
facultatifs ; bouton « Envoyer le message ». Trois choix sont de Claude et se
modifient dans Tally : les options de **Sujet** (les cinq piliers, « Acquisition et
publicités », « Autre ») et de **« Comment nous avez-vous connu ? »** (LinkedIn,
YouTube, Recherche Google, Recommandation, Guide gratuit, Autre), que le modèle ne
donnait pas ; le titre « Newsletter » au-dessus de la case, Tally exigeant un intitulé
de question ; et une ligne sur les données personnelles avec le lien vers les CGC, comme
dans `0Q47ZN`. Trois champs cachés `utm_source`, `utm_medium`, `utm_campaign`. Même
style que `0Q47ZN` (Arimo, jaune `#FFCC00`, texte blanc) mais fond `#000000` : il
s'ouvre en pleine page et non dans une carte. Les réglages avancés (bouton pleine
largeur, champs arrondis) ne s'appliquent qu'avec Tally Pro. Pas de redirection de fin
: la page de remerciement de Tally suffit. L'assistant de discussion, lui, oriente
toujours vers `81VkKx`. Le guide de l'IA générative y renvoie depuis sa dernière page
(`utm_source=guide-ia-pdf`) et depuis sa page de remerciement (`utm_source=guide-ia`) :
ses sujets sont justement les cinq leviers du guide.

**« Ma chaîne, *en clair*. » (`#chaine`) est revenue le 13 octobre 2026**, à la
demande du propriétaire : « Je veux mettre cette vidéo […] avant "Ce qu'on me demande
avant de commencer." », avec https://www.youtube.com/watch?v=Uge1VlfPbd8 (« Générez
des leads qualifiés pour vos offres et mettez l'IA générative à votre service »). Elle
reprend la place, le titre et le cadre de l'ancienne section, entre `#agents` et la
FAQ, **sans chapô, sans rail, sans lien au menu**, avec le bouton « Voir la chaîne »
vers `@smartefico`. Trois différences voulues :

- **elle démarre seule, en sourdine, quand elle entre à l'écran** — et non à
  l'arrivée sur la page, comme l'ancienne, où posée si bas elle serait déjà entamée
  (elle dure 31 s). Mise en ligne d'abord en lecture au clic, puis, le même jour, à
  sa demande : « Fais démarrer la vidéo toute seule, en sourdine ». Un script en bas
  de page retire la source du lecteur tant qu'il est hors de vue, puis la repose
  avec `autoplay=1&mute=1&playsinline=1` quand le cadre passe le dernier quart de
  l'écran ; `allow="autoplay; …"` l'autorise. Sans script, sans
  `IntersectionObserver` ou sous `prefers-reduced-motion`, le lecteur garde sa
  source d'origine (`loading="lazy"`) : lecture au clic. Dans l'aperçu de Claude
  Code, le démarrage n'a lieu que si le panneau est affiché ;
- **écrite en dur** dans `index.html`, hors du back office : la zone `VIDEO` de
  `sync-content.mjs` n'a pas été remise ;
- **ancre `#chaine`** et non `#agenda` : le lien « masterclass » de l'article
  « Bienvenue sur le blog » mène toujours en haut de l'accueil.

Le style `.video-scene` revient, directement à l'état noir plat (ombre portée, sans
halo). 610 px à 800 px de large ; aucun signalement nouveau d'impeccable. **L'article 9
des CGC nomme de nouveau YouTube** (voir « Aucune mesure d'audience »), dans une phrase
proposée par Claude et validée par lui le jour même (« Je valide la phrase »).

**Plus de section « Ma chaîne, en clair », ni de signature, depuis le 28 septembre
2026.** Le propriétaire a demandé les deux d'un coup : « supprime la partie et la vidéo
youtube "Ma chaîne, en clair" […] Tu vas supprimer aussi ma photo en bas et mes
informations ». Ce qui suit sur la chaîne, les masterclass et le portrait décrit donc
ce qui a existé ; l'historique git garde tout.

- **Sont partis de `index.html`** : la section `#agenda` (vidéo YouTube, rail des
  masterclass, bouton « Voir la chaîne »), la section `.signature` (portrait, nom,
  « Fondateur de SmartEfico », phrase), leur style (`.rail`, `.mc`, `.video-scene`,
  `.signature`, et leurs lignes du bloc « NOIR PLAT »), le script du rail, et le lien
  **« Chaîne »** du menu. Le menu passe à six liens plus « Contact ».
- **Et du back office** : les zones `VIDEO`, `MASTERCLASS` et `VISUEL_PORTRAIT` de
  `sync-content.mjs` (sans quoi le script, qui échoue sur un repère absent, aurait
  cassé le workflow au premier enregistrement), les formulaires « masterclass »,
  « Vidéo » et « Photo de profil » de `.pages.yml`, et les fichiers
  `content/pages/video.md` et `content/masterclasses/…` — la seule masterclass,
  celle du 3 octobre 2026, était déjà dépubliée.
- **Restent** : l'icône YouTube du pied de page, qui mène toujours à la chaîne ; le
  fondateur dans le JSON-LD, invisible ; `assets/Portrait3.jpg`, dans le dépôt mais
  plus servi par rien — l'image de partage l'a perdu le même jour, à sa demande
  (voir « L'aperçu de partage »).
- **La page passe de 8 924 à 7 590 px** à 1 280 px de large (697 px pour la chaîne,
  537 px pour la signature, et deux écarts de pile). La copie autonome tombe de 530 à
  369 Ko sans le portrait encodé.
- **L'article « Bienvenue sur le blog »** renvoie encore aux « masterclass » par
  `index.html#agenda` : l'ancre n'existe plus, le lien mène en haut de l'accueil. Son
  texte est celui du propriétaire, à retoucher dans le back office s'il le souhaite.
- Le texte de l'accueil reste à la première personne (« Ce qu'on me demande », « mes
  articles ») sans plus dire qui parle : la signature était ce qui nommait le « je ».

**La section « Ma chaîne, en clair » ne montrait plus que la vidéo de la chaîne**,
du 18 au 28 septembre 2026. Elle s'appelait « Blog et évènements à venir » ; le
propriétaire a vidé son rail en trois temps :
les articles adossés à un évènement, puis la carte du dernier article publié — posée la
veille, dans une zone `ARTICLE_UNE` placée avant les masterclass — puis celle du blog.
Reste un lecteur YouTube en 16:9, centré, 54 rem au plus, et le bouton « Voir la
chaîne ». Le rail ne porte plus que les masterclass et son script le masque tant qu'il
est vide ; sans JavaScript, il ne laisse qu'une douzaine de pixels noirs.

Le titre et l'accroche ont suivi le même jour, l'ancien texte annonçant des articles
au-dessus d'une seule vidéo : « Ma chaîne, *en clair*. » et « Des méthodes concrètes
pour mettre l'IA au travail dans votre activité. Les prochaines masterclass
s'afficheront ici. » Le propriétaire a choisi cette formulation entre deux proposées.
L'ancre reste `#agenda` et le lien du menu s'appelle toujours « Actualités » : le
renommer est son choix, pas une correction à faire d'office.

**La vidéo démarre seule, en sourdine**, demande du même jour. Trois paramètres dans
l'adresse d'incrustation — `autoplay=1&mute=1&playsinline=1` — et `allow="autoplay; …"`
sur le cadre, sans quoi un cadre d'un autre domaine n'a pas le droit de lancer la
lecture. Le `loading="lazy"` est parti avec : le lecteur doit être prêt à l'arrivée, pas
à l'approche. Le son sans geste du visiteur n'existe sur aucun navigateur — `mute=1`
n'est pas un choix, c'est la condition de l'autoplay — et YouTube affiche ses sous-titres
quand il démarre muet. Ce bloc est écrit par `sync-content.mjs` depuis
`content/pages/video.md` (zone VIDEO) : il se modifie là, jamais à la main.

**Ce qui est parti avec les cartes**, et qu'il faudrait refaire pour revenir en arrière :
les zones `ARTICLE_UNE` et `ARTICLES` de `index.html` ; l'injection de `build-blog.mjs`
dans `index.html`, qui ne touche donc plus qu'à `blog.html` et aux pages d'articles ;
l'interrupteur `home` du back office, qui écartait un article de l'accueil sans le
retirer du blog ; et les règles `.mc--blog` et `.mc__affiche--video`. Le reste de la
carte — `.mc`, `.mc__affiche`, `.mc__corps` — sert toujours aux masterclass.

**Le cadrage d'une affiche appartient à l'image**, pas au composant : une vignette montre
une bande 2:1 d'une source souvent carrée ou verticale. 12 % par défaut, mesuré sur les
affiches à visage, où le sujet occupe le cinquième supérieur ; 50 % pour un visuel déjà
large, comme le 16:9 de l'article du 17 septembre 2026, où la bande centrée ne rogne que
du vide. Le champ « Cadrage de la vignette » du back office (`cover_position`) le règle
article par article. Il ne sert plus que sur `blog.html`, depuis que l'accueil n'affiche
plus de vignette d'article ; les affiches de masterclass, elles, gardent le 12 % du CSS.
Une photo dont le sujet occupe toute la hauteur y perd forcément quelque chose : la
pancarte de l'article du 5 septembre 2026 porte le visage en haut et son texte en bas, et
la bande n'en prend que la moitié. Elle est cadrée à 0 % : le visage est net, et il ne
reste de la pancarte qu'un liseré blanc et le haut des lettres de sa première ligne.
12 % en montrait deux lignes, dont une coupée par le milieu. Aucune valeur ne les évite
toutes — la bande fait la moitié d'une image carrée, et le texte commence avant cette
moitié.

Le champ `date` du back office ne porte que le jour, sans heure : deux articles
publiés le même jour se départagent par l'ordre des fichiers, et non par l'heure
d'enregistrement — c'est le cas des deux articles du 5 septembre 2026. Pour décider
lequel paraît en premier sur `blog.html`, il faut changer une date.

**Une page `livres.html`, depuis le 4 novembre 2026**, à la demande du propriétaire
(« je veux mettre mes livres en vente sur mon site web »). Ses choix, par questions
posées : **la vente passe par Amazon**, une page dédiée, un lien « Livres » au menu.

- **Aucun prix sur la page** : la règle « Aucun montant, nulle part » tient, Amazon
  affiche le prix et gère paiement, impression et livraison. Les CGV n'ont donc pas
  bougé, et l'article 9 des CGC non plus : un simple lien ne charge rien d'Amazon. Une
  vente directe demanderait au contraire des prix, un compte de paiement et des CGV
  pour les particuliers, avec son accord.
- **Six livres, dans une seule grille de deux colonnes** : Claude rendu simple, le
  Manuel ChatGPT de la TPE, ChatGPT et Claude pour les artisans, le Copywriting avec
  l'IA, L'agent immobilier augmenté et le coloriage « Mon coin cosy », ajouté à sa
  demande. Avec six cartes, les deux sections d'abord prévues auraient laissé un trou.
  Un nombre impair de livres en rouvrirait un.
- **Un septième livre depuis le 5 novembre 2026 : « Venue d'ailleurs », de Gifty
  Kouakou** (`B0GCCPRF2Z`), sur toute la largeur en bas de grille (`.livre--large`) :
  c'est le seul livre de la page dont il n'est pas l'auteur, d'où son nom sur la carte.
  Texte résumé par Claude à partir de la présentation fournie. La couverture
  (`venue-d-ailleurs.jpg`, 304 x 345) vient d'une capture d'écran d'Amazon, recadrée
  pour retirer ses boutons, ce qui retire aussi le nom de l'autrice : la remplacer par le
  fichier d'origine si le propriétaire le fournit. **La page s'appelle « La *librairie*. »
  depuis ce jour** : l'ancien titre, « Des livres pour mettre l'IA au *travail*. », ne
  valait plus pour un témoignage. Le titre d'onglet, les descriptions et le chapô ont
  suivi.
- **L'agent immobilier augmenté a son lien depuis le 5 novembre 2026**
  (`B0HQGLMMK4`), après un jour en « Bientôt disponible ». L'EPUB du 4 novembre portait
  encore des « [À compléter] » : le propriétaire en a été prévenu, la version publiée
  n'a pas pu être contrôlée d'ici.
- **Textes de Claude, à relire par le propriétaire**, tirés des seules couvertures et
  des sommaires : aucune promesse ajoutée. Les couvertures, elles, portent les
  siennes (« gagner 10 heures par semaine »).
- **Les couvertures** sont dans `assets/livres/`, en 520 px de large. Celle de « Mon
  coin cosy » a été extraite de son PDF, seul fichier disponible.
- **Pour brancher un livre** : le `<span class="btn btn--attente">` de sa carte cède
  la place au même `<a class="btn btn--solid">` que les autres, en adresse courte
  (`https://www.amazon.fr/dp/` puis l'ASIN), sans les paramètres de recherche. Amazon
  n'est pas consultable d'ici, ni par le navigateur intégré ni par les outils de
  lecture : c'est le propriétaire qui fournit les liens et qui contrôle leur
  destination.
- **« Librairie Amazon » remplace « Livres » depuis le 4 novembre 2026**, à sa demande
  (« Au lieu de "Livres" […] met l'icone "Librairie amazon" et met le lien sur la
  première façade du site très visible ») : dans le menu, avec un livre ouvert au trait
  (symbole `i-livres`), au pied de l'accueil et dans l'en-tête et le pied du blog
  (`build-blog.mjs`), sur ces deux derniers sans icône. **Un bouton jaune du même nom
  est entré dans le hero**, entre « Réserver un échange » et le téléphone : trois
  boutons sur une ligne dès 900 px, empilés sur téléphone. Le logo d'Amazon n'est pas
  repris : c'est une marque déposée, et le bouton mène à `livres.html`, pas à Amazon.
- **« Guide gratuit » a quitté le menu de l'accueil le même jour**, à sa demande. Il
  reste au pied de l'accueil, dans la sixième case des cinq étapes, et dans l'en-tête
  et le pied du blog. **Le menu tombe à cinq liens** — Méthode, Exemples, Blog,
  Librairie Amazon, FAQ — plus « Contact » : 74 et 127 px de marge à 900 px de large.

**« Ce à quoi vous engager » (`#chiffres`) et « Avant, après » (`#avant-apres`) ont été
supprimées le 4 novembre 2026**, à sa demande. Sont partis avec elles leur style
(`.figures`, `.figure`, `.compteur__*`, `.ba`), le script des compteurs et le lien
« Avant/Après » du menu. L'accueil passe de « Ce qu'on vous apporte » à « Notre méthode
*ClientlyEfico*. » et fait **6 070 px** à 1 280 px. Ce qui est écrit dans ce fichier sur
ces deux sections, leurs compteurs et leur sixième paire de lignes décrit ce qui a
existé ; l'historique git les garde.

**Plus d'assistant de discussion depuis le 1er novembre 2026**, à la demande du
propriétaire (« je veux que tu supprime le bot du site »), le jour de l'audit de
sécurité qui avait montré qu'on pouvait l'appeler hors du site. Tout est parti : la
pastille, son style et son script (entre les anciens repères `ASSISTANT:START/END`),
`api/chat.js`, `lib/contexte-assistant.js`, `scripts/build-assistant.mjs`,
`scripts/assistant/journal.gs`, l'étape du workflow, l'entrée `functions` de
`vercel.json`, les dépendances `@anthropic-ai/sdk` et `@vercel/functions` (et
l'`override` de `zod` qui les suivait), et l'exception `pulsing-dot` d'impeccable.
Le blog a été régénéré, sa feuille recopiant celle de l'accueil. **Restent hors du
dépôt, à la charge du propriétaire** : la clé `cle_smartefico` dans Vercel et dans la
console Anthropic (à révoquer), la variable `ASSISTANT_GOOGLE_SHEET`, et la feuille
Google des conversations, dont le script continue de purger chaque nuit les lignes de
plus de six mois. **La ligne de l'article 10 des CGC** qui décrivait l'assistant et
le tableur est partie le même jour, sur proposition validée par lui (« Oui,
retire-la ») ; la liste ne nomme plus que les quatre autres outils. Ce qui suit décrit
l'assistant tel qu'il était ; l'historique git le garde entier.

**Un assistant de discussion répondait aux visiteurs**, demandé par le propriétaire le
18 septembre 2026 : une pastille jaune « Une question ? » en bas à droite de
`index.html` ouvre un panneau branché sur Claude. Il répond sur SmartEfico, cerne la
situation du visiteur et l'oriente vers `81VkKx` ou vers celui des deux guides qui
répond à son besoin (`guide.html` ou `guide-ia.html`, avec `?utm_source=assistant`).
Choisi parmi trois options — assistant IA sur
mesure, assistant guidé sans IA, outil tout fait — pour montrer sur son propre site ce
que l'agence vend : des agents IA qui qualifient.

- **Son icône est un casque-micro** depuis le 6 octobre 2026 (« je veux changer
  l'icône du bot »), choisi par le propriétaire parmi quatre pistes rendues à taille
  réelle sur la pastille, avec et sans libellé : un robot, la bulle à trois points, le
  casque-micro et le logo SmartEfico (dont le sigle jaune ne se lit plus à 21 px).
  Même dessin au trait, 1,8 de graisse, bouts ronds. Ce qui suit décrit la bulle au
  point d'interrogation qu'il remplace.
- **Son icône était une bulle au point d'interrogation**, au trait et à bouts ronds
  comme les autres icônes du site, du 23 septembre 2026 (« tu peux installer un
  icône plus parlant ») au 6 octobre. L'ancienne était une bulle en aplat, muette : elle disait
  « message » et laissait le libellé porter le sens — ce qui ne marche pas sur
  téléphone, où `.assistant__etiquette` est masquée sous 30 rem et où l'icône reste
  seule. **C'est à cette taille-là qu'il faut juger une icône ici**, pas agrandie :
  une étincelle, qui aurait annoncé l'IA, s'y empâtait, et le propriétaire l'a écartée
  sur rendu à taille réelle, avec une variante à deux bulles. Le dessin vit dans le
  markup, entre les repères `ASSISTANT:START/END`.
- **Quatre fichiers.** `api/chat.js`, la fonction serveur ; `lib/contexte-assistant.js`,
  le texte du site qu'elle donne à Claude, **généré** par `scripts/build-assistant.mjs`
  à partir du `<main>` de `index.html`, `guide.html`, `guide-ia.html` et
  `exemples-ia.html` et de la liste des articles ; la pastille elle-même, entre les
  repères `ASSISTANT:START/END` de `index.html`, avec son style et son script dans la
  page comme tout le reste ;
  `vercel.json`, qui donne 60 s à la fonction ; et, hors du site, le script de la
  feuille des conversations, `scripts/assistant/journal.gs` (voir plus bas). GitHub Actions régénère le contexte
  après chaque enregistrement du back office ; après une retouche de `index.html` à la
  main, relancer `build-assistant.mjs` avant de pousser.
- **La clé n'est jamais dans le dépôt**, qui est public : c'est une variable du projet
  Vercel `smartefico`, en Production. Le propriétaire l'a enregistrée le 18 septembre
  2026 sous le nom **`cle_smartefico`** ; la fonction lit `ANTHROPIC_API_KEY` d'abord,
  puis ce nom-là. Sans l'une ou l'autre, elle répond 503 et la pastille affiche « pas
  encore en service ». Une variable ajoutée dans Vercel ne vaut qu'à partir du
  déploiement suivant. Il a fallu cinq allers-retours pour la poser : elle n'arrivait
  pas dans ce projet, puis sous un autre nom. Pour vérifier, ouvrir
  https://vercel.com/emmanuel-kouakou/smartefico/settings/environment-variables,
  onglet **Project** — la liste se charge avec plusieurs secondes de retard et « No
  Environment Variables Added » peut s'afficher avant elle.
- **La requête** : `claude-opus-5`, effort `low` (réflexion active, au plus bas :
  latence et coût d'une discussion courte), `max_tokens` 2048, en flux. Le secours
  `fallbacks: "default"` (en-tête `server-side-fallback-2026-07-01`) fait repasser
  par l'API elle-même une question anodine que les filtres de sécurité de Claude
  auraient déclinée. Le cache porte sur le préfixe fixe — consignes, puis contenu du
  site, le repère sur ce second bloc — et, par le cache automatique de la requête,
  sur la conversation qui grandit. Rien de variable (date, identifiant) ne doit entrer
  dans `SYSTEME` : il invaliderait le cache à chaque question.
- **Les consignes reprennent les contraintes de contenu** de ce fichier : aucun
  montant, aucune promesse de résultat, aucun chiffre hors du site, les deux seuls
  clients citables sans rien leur attribuer, aucune ville, et le rappel qu'il est une
  IA. Toute demande hors sujet est ramenée à SmartEfico en une phrase — c'est aussi une
  protection : l'adresse est publique, et sans cette règle elle servirait de Claude
  gratuit à n'importe qui. Une règle de contenu nouvelle ici doit aussi entrer dans
  `CONSIGNES`.
- **Contre l'abus**, dans l'ordre où la fonction les applique : les origines admises
  (`smartefico.com`, `www`, `smartefico-z7.vercel.app`, `kouakoukomla.github.io`,
  plus `ASSISTANT_ORIGINES_EN_PLUS`) ; vingt messages par adresse IP et par dix
  minutes ; 21 messages, 1 200 caractères par question et 16 000 au total ; la
  génération coupée quand le visiteur quitte la page. Le compteur d'IP vit dans la
  mémoire d'une instance que Vercel recycle : il arrête un visiteur trop pressé, pas
  une attaque. La liste d'origines non plus : un script hors navigateur écrit
  l'en-tête `Origin` qu'il veut (vérifié le 1er novembre 2026, voir Sécurité). **Le vrai garde-fou est la limite de dépense mensuelle posée dans la
  console d'Anthropic**, et une clé réservée au site, révocable seule.
- **Coût estimé** : environ 5 000 tokens de préfixe, relus au dixième du prix à partir
  de la deuxième question, soit de l'ordre de 5 à 10 centimes pour une conversation
  de cinq questions. Chaque réponse laisse une ligne JSON dans les journaux de Vercel
  (`assistant: "reponse"`, tokens lus en cache, écrits, produits) sans rien du contenu
  échangé : `cache_lu` doit dépasser zéro dès la deuxième question, sinon le cache ne
  sert pas.
- **Les conversations sont enregistrées dans une feuille Google, six mois**, depuis
  le 6 octobre 2026. Le propriétaire a demandé à les lire (« comment faire pour voir
  les discussions que le bot fait »), puis a choisi Google Sheets, les conversations
  complètes et six mois de conservation. Jusque-là, rien n'était conservé nulle part.
  - **Le chemin** : `api/chat.js` envoie, après chaque réponse, la question et la
    réponse telle que le visiteur l'a lue à un script Apps Script collé dans la
    feuille (`scripts/assistant/journal.gs`, qui documente sa mise en place). Son
    adresse de déploiement `/exec` est la variable Vercel **`ASSISTANT_GOOGLE_SHEET`** :
    sans elle, rien n'est enregistré et la discussion marche comme avant. Cette
    adresse suffit pour écrire dans la feuille — elle ne vit que dans Vercel. L'envoi
    passe par `waitUntil` (`@vercel/functions`) : le visiteur n'attend pas le
    tableur, et un tableur en panne laisse une ligne `assistant: "journal"` dans les
    journaux sans casser la réponse.
  - **Une ligne par échange** : date, numéro de conversation, question, réponse. Le
    numéro est tiré au hasard par la page à chaque visite et regroupe les questions
    d'un même visiteur ; **rien d'autre ne l'identifie** — ni IP, ni page, ni
    navigateur. Une réponse interrompue ou absente est notée entre crochets. Un texte
    qui commence par `=`, `+`, `-` ou `@` reçoit une apostrophe, sans quoi un visiteur
    ferait calculer une formule à la feuille.
  - **Six mois** : le script efface chaque nuit, vers 3 h, les lignes plus anciennes,
    où qu'elles soient dans la feuille. Changer `CONSERVATION_MOIS` oblige à changer
    les deux textes qui l'annoncent, avec son accord.
  - **Les deux textes, proposés par Claude et validés par lui le 6 octobre 2026**
    (« Je valide les textes ») :
    la mention sous le champ — « Les échanges sont conservés six mois pour améliorer
    le service : n'y écrivez pas d'informations sensibles. » — et la fin de la ligne
    de l'article 10 des CGC (« Sous-traitance IA »), qui disait « SmartEfico n'en
    conserve aucune copie » depuis le 18 septembre 2026 et dit désormais
    « SmartEfico enregistre les échanges dans un tableur Google Sheets, sans
    l'adresse IP ni aucun autre identifiant du visiteur, pour améliorer le service,
    et les supprime au bout de six mois ».
  - **Ce qui ne change pas** : la page tient toujours l'historique en mémoire et le
    renvoie entier à chaque question, pas de cookie, rien ne part avant que le
    visiteur écrive, et l'assistant ne demande ni nom, ni e-mail, ni téléphone — ce
    qui limite ce que la feuille peut contenir de personnel. Un visiteur peut
    toujours en écrire de lui-même.
- **La pastille appelle toujours `https://smartefico.com/api/chat`**, y compris depuis
  les copies servies par `vercel.app` et Pages : d'où la liste d'origines. Les autres
  projets Vercel reliés au dépôt déploient eux aussi la fonction, mais sans clé ;
  personne ne les appelle. La copie autonome, ouverte depuis le disque, masque la
  pastille.
- **Tester sans rien dépenser** : le SDK suit `ANTHROPIC_BASE_URL`. Un faux serveur de
  l'API Messages qui répond en SSE, un petit serveur Node qui sert `api/chat.js`
  (la fonction lit elle-même son corps quand `req.body` manque, elle tourne donc hors
  de Vercel) et, dans Chrome sans fenêtre, un `fetch` détourné vers ce serveur ont
  suffi à éprouver le 18 septembre 2026 le flux, les liens, l'historique, les erreurs,
  le débit et le refus. Le premier vrai appel se fait en production, une fois la clé
  posée. Le journal s'éprouve de même, avec une fausse feuille qui répond comme Apps
  Script (un 302, puis `{"statut":"ok"}`) ; `journal.gs` lui-même, avec un faux
  `SpreadsheetApp` dans un `vm` de Node.

**Aucune mesure d'audience, par choix.** Le 18 septembre 2026, le propriétaire a
demandé un tableau de bord des visites ; le site n'en mesurait aucune, et n'en mesure
toujours aucune. Entre Vercel Web Analytics (sans cookie), Google Analytics 4 et
Plausible, il a choisi Google Analytics, puis y a renoncé le même jour : « fais sans le
Google Analytics ». Ne pas installer de mesure sans sa demande. S'il y revient :
Google Analytics impose en France un bandeau de consentement, que le site n'a pas ;
Vercel Web Analytics s'en passe. Les chiffres disponibles sans rien installer : l'onglet
Observability du projet Vercel (volume de requêtes), les onglets Submissions et
Insights de chaque formulaire Tally, YouTube Studio, les journaux de l'assistant
(tokens seulement, jamais le contenu) et, depuis le 6 octobre 2026, sa feuille Google
des conversations (voir plus haut).

L'article 9 des CGC (« Cookies & tracking ») annonçait des « cookies analytiques,
marketing et techniques » que le site ne posait pas. Sur proposition, le propriétaire
a validé le 18 septembre 2026 une seule phrase à la place : « Le site SmartEfico ne
dépose aucun cookie de mesure d'audience ni de publicité. » La phrase qui suivait
(« Le client peut s'y opposer via son navigateur ») est partie avec, faute d'objet.
Le même jour, un second paragraphe, dans la version détaillée qu'il a choisie, y
nomme les services tiers : la vidéo YouTube en mode de confidentialité renforcée, qui
peut enregistrer des informations dès l'arrivée puisqu'elle se lance seule ; Tally,
qui héberge les formulaires ; Google Fonts, qui reçoit l'adresse IP du visiteur au
chargement des polices du site — il a préféré le déclarer plutôt que de les héberger
lui-même. **« des polices du site » a remplacé « de la police des titres » le
23 septembre 2026**, avec son accord explicite, le jour où Poppins est arrivée sur le
corps du texte et sur les pages légales elles-mêmes : la phrase d'avant restait vraie
sur le fond mais ne décrivait plus le bon usage. À tenir vrai : installer une mesure
d'audience ou un pixel, couper l'autoplay, héberger les polices ou changer d'outil de
formulaire oblige à retoucher cet article, avec son accord. **C'est le cas depuis le
28 septembre 2026** : la vidéo est partie avec « Ma chaîne, en clair », et plus
aucune page n'intègre YouTube. La phrase qui la décrit (« La vidéo de la page
d'accueil est servie par YouTube… dès son arrivée. ») était devenue fausse ; son
retrait lui a été proposé le jour même, et il l'a validé (« Valide la phrase des
CGC »). L'article ne nomme donc plus que Tally et Google Fonts. Si une vidéo revient
sur le site, la phrase doit revenir avec elle, avec son accord. **C'est fait depuis le
13 octobre 2026**, avec le retour de la vidéo (lecture au clic, cette fois) : « La vidéo
de la page d'accueil est servie par YouTube en mode de confidentialité renforcée ; son
lecteur se charge à l'approche de la vidéo, et YouTube peut alors enregistrer des
informations sur le terminal du visiteur. » Validée par lui (« Je valide la phrase »).

**Une page d'atterrissage à part : `guide.html`**, demandée le 17 septembre 2026 sur le
modèle d'une page « Free download workbook ». Elle n'a pas de menu et se partage en
publicité ou sur LinkedIn. Elle offre un guide PDF contre un formulaire. Sept liens
du site y mènent, ajoutés le même jour à la demande du propriétaire :

- `.guide-lien`, la sixième case de la grille des cinq étapes (`#methode`), qui comble
  la case vide que cinq panneaux laissaient sur trois colonnes ;
- « Guide gratuit » dans le menu de l'accueil, juste après « Blog » — les deux pages à
  part se suivent, le reste du menu garde l'ordre de la page ;
- « Guide gratuit » dans le pied de page de l'accueil, devant « CGV | CGC », sans
  `data-doc` : c'est une vraie page, pas une fenêtre ;
- « Guide gratuit » dans l'en-tête du blog et de chaque article, avant « Retour au
  site », et dans leur pied de page, avant « Accueil ». Les deux sont écrits par
  `build-blog.mjs` (`entete` et `pied`) : c'est là qu'ils se modifient, jamais dans
  les pages générées ;
- « Guide gratuit » dans le pied de page de `cgv.html` et `cgc.html`, devant le lien
  vers l'autre document. Ce pied est hors du `<main>` : `sync-legal.mjs` ne le recopie
  pas dans les fenêtres de l'accueil, et le texte légal n'a pas bougé. La barre du haut
  de ces deux pages garde son seul « ← Retour au site » ;
- « Guide gratuit » dans le pied de page de `guide-merci.html`, pour transmettre la
  page d'inscription — le PDF lui-même y est déjà proposé par deux boutons.

Le PDF lui-même y renvoie, dix fois : le pied de chaque page intérieure et une ligne
« Partager » en dernière page mènent à
`https://smartefico.com/guide.html?utm_source=guide-pdf`. Le fichier circule
de main en main ; chaque lecteur peut s'inscrire, et Tally range ces inscriptions sous
`utm_source = guide-pdf`. L'adresse est écrite en clair pour les exemplaires imprimés.
Si le domaine change, ces liens sont dans `scripts/guide/guide.html`.

Le formulaire de rendez-vous **`81VkKx`** (« Automatisez vos process », derrière le
bouton « Réserver mon appel ») y renvoie aussi, depuis le 17 septembre 2026 : une ligne
« En attendant notre réponse, recevez le guide gratuit » à la fin de sa page 2, juste
après « Nous revenons vers vous sous 24 h ouvrées », vers
`guide.html?utm_source=tally-rdv`. Ce réglage vit dans Tally, pas dans le dépôt. Le
formulaire du guide (`0Q47ZN`) n'a pas reçu de lien : dans la landing page, il ferait
doublon.

Sur `guide.html` même, le « Guide gratuit » du pied de page pointe vers `#formulaire` :
un lien vers la page la rechargerait, et **aucun lien de cette page ne doit mener
directement au PDF**, qui ne se donne qu'après l'inscription.

**Le menu respire de nouveau depuis Poppins.** À 1 120 px, le seuil où il s'affiche en
ligne, il reste **63 px** entre la marque et les liens et **106 px** avant
« Contact » — mesurés sur une capture de la barre, en relevant les colonnes qui
portent de l'encre. Ces marges valaient 41 px et 63 px la veille encore : la graisse
800 tombait alors sur Arial Black sous Windows, la plus large des polices de la pile,
là où Poppins 800 est nettement plus étroite. Elles valaient 28 px et 36 px jusqu'au
18 septembre 2026, quand le propriétaire a renommé « Actualités » en « Chaîne ».

**Un huitième lien reste hors de portée** malgré ces 106 px : il faudrait aussi tenir
sur les écrans juste au-dessus du seuil, et la marge y fond. Remesurer avant d'en
ajouter un, la méthode est celle décrite ci-dessus. Le septième est revenu le
25 septembre 2026 avec « Exemples » — 62 px et 103 px —, après le retrait
d'« Expertises » qui l'avait libéré ; le menu est donc de nouveau plein.
**La barre elle-même a raccourci le même jour**, à sa demande (« réduis cette bande,
c'est trop long ») : `.nav__in` est plafonné à **56 rem** (896 px) et centré, au lieu
de suivre les 74 rem de la page. Elle faisait 1 184 px à 1 280 px de large, dont
environ 430 de vide autour des liens. Mesuré sur les boîtes : 56 px entre la marque
et les liens et 90 px avant « Contact » à 1 280 px ; 61 et 100 px au seuil de
1 120 px, où la barre tient toujours sur une ligne. Sous 56 rem, rien ne change, et
le menu du téléphone s'ouvre comme avant. **Les chiffres qui suivent sont donc
périmés, et un septième lien ne tiendrait plus** sans élargir la barre d'autant.

**« Chaîne » est parti le 28 septembre 2026** avec sa section : six liens, et la
place d'un septième de nouveau libre. Mesurées sur les boîtes des éléments (et non
sur l'encre, comme les chiffres ci-dessus, qui en sont un peu plus courts) : environ
87 px entre la marque et les liens, 154 px avant « Contact ».

**Les liens tiennent en ligne dès 56 rem (896 px) depuis le 1er novembre 2026**, et
non plus 70 rem (1 120 px) : « Ramène-moi les noms sur le haut de l'onglet, là où il
y a "contact" ». Sur son écran, la barre ne montrait que la marque, le bouton du menu
et « Contact » — un portable de 1 366 px réglé à 125 % n'affiche que 1 093 px. Le seuil
change à trois endroits : `@media (min-width:56rem)` sur `.nav__links`, le
`max-width:55.99rem` du menu déroulant, et le `matchMedia` du script qui referme ce
menu. Mesuré sur les boîtes : 61 et 101 px de marge à 1 093 px, 49 et 79 px à
900 px ; à 820 px il n'en restait que 24, d'où le seuil. Sous 56 rem, bouton du menu
comme avant. Les liens restent au centre de la barre.

- Le formulaire est le Tally **`0Q47ZN`**, créé pour elle : prénom, nom, e-mail,
  téléphone facultatif (France par défaut), « Êtes-vous dirigeant(e) d'entreprise ? »,
  consentement obligatoire, et trois champs cachés `utm_source`, `utm_medium`,
  `utm_campaign` que la page remplit à partir de sa propre adresse. Il est intégré
  comme dans les articles (`data-tally-src`, `embed.js`, repli à 8 s), avec
  `transparentBackground=1` : le fond vient de la carte de la page, restée noire sur
  la page blanche (voir Design).
- Ses couleurs et sa police (Arimo, la plus proche d'Helvetica chez Google Fonts —
  Tally n'accepte qu'elles, et Inter est proscrite) sont réglées dans Tally. Les
  réglages avancés (arrondis, bouton pleine largeur, fond des champs) y sont aussi
  posés mais ne s'appliquent qu'avec Tally Pro.
- Une fois envoyé, il mène à **`guide-merci.html`** (`noindex`), qui porte le lien du
  PDF. Deux chemins y conduisent : le réglage « Redirect on completion » de Tally, et un
  écouteur `message` de `guide.html` qui réagit à `Tally.FormSubmitted` venant de
  `https://tally.so`. Vérifié en simulant l'évènement ; aucune vraie inscription n'a été
  envoyée pendant les essais.
- Le guide est **`assets/guide-5-etapes-smartefico.pdf`** (11 pages A4). Sa source est
  `scripts/guide/guide.html`, imprimée par Chrome sans fenêtre (`build-guide.mjs`) :
  même typographie que le site, sans bibliothèque PDF. Couverture et dernière page
  noires, pages intérieures blanches pour être imprimées et remplies au stylo — le jaune
  n'y sert qu'en aplat sous du texte sombre. Tout son contenu reprend ce que le site dit
  déjà (méthode, agents, indicateurs) : aucun chiffre de résultat, aucun montant.
- Aucun outil de rendu PDF n'est installé sur la machine (ni Python, ni poppler). Pour
  relire un guide, capturer sa source (`scripts/guide/guide.html` ou `guide-ia.html`)
  à 794 px de large : la mise en page est la même qu'à l'impression. Chaque `.page` a
  `overflow:hidden` : un contenu trop long y est rogné sans bruit, et le pied de page
  disparaît le premier. Comparer `scrollHeight` et `clientHeight` de chaque page le
  révèle.

**Un second guide et sa page : `guide-ia.html`**, demandés le 18 septembre 2026. L'encart
posé le même jour sous la section `#ia` menait d'abord au guide des 5 étapes ; le
propriétaire a voulu un guide propre à la section, avec sa propre page d'atterrissage,
qui « contienne toutes les informations » des cinq cartes et parle de chacune « dans
3 pages maximum ». Lu comme trois pages au plus par levier : chacun en a deux.

- Le guide est **`assets/guide-ia-generative-smartefico.pdf`** (14 pages A4), imprimé
  depuis `scripts/guide/guide-ia.html` par `node scripts/build-guide.mjs guide-ia`,
  avec la mise en page du premier. Couverture ; mode d'emploi et tableau des cinq
  leviers ; fiche 0, « Où en êtes-vous ? » ; puis deux pages par levier. La première
  prend le texte de la carte, mot pour mot, en chapeau, ses quatre étiquettes en quatre
  cartes, une règle et « Pour commencer cette semaine » ; la seconde est la fiche à
  remplir — plan de formation et modèle de consigne ; diagnostic des processus,
  matrice impact/effort et calcul du temps rendu ; charte d'utilisation ; premier
  workflow ; tableau de suivi et journal des cas d'usage. Dernière page noire, vers
  `D4LJDR`.
- Hors des textes des cartes, tout est de Claude, sur la règle du premier guide : rien
  que le site ne dise déjà en substance, aucun chiffre de résultat, aucun montant,
  aucun client cité, et la typographie française (espace insécable avant « ? », « : »,
  et dans les guillemets). Le propriétaire est invité à le relire.
- L'encart `.guide-lien--large` de `#ia` y mène, avec
  `utm_source=site&utm_medium=section-ia`, comme le faisait le bouton « Nous
  contacter » voisin jusqu'à son retrait le 28 septembre 2026 : Tally range ces
  inscriptions à part. Ce fut le seul lien du site vers cette page
  jusqu'au 25 septembre 2026, où `exemples-ia.html` lui en a donné trois de plus
  (en-tête, accroche, pied), en `utm_medium=page-exemples` ; le
  menu, le pied de page, le blog et la sixième case de la méthode désignent toujours le
  guide des 5 étapes. Sa ligne dit « Les 5 leviers de l'IA générative et leurs fiches à
  remplir, en PDF ». Sur téléphone, le bouton « Recevoir » passe sous le texte.
- Le formulaire est le Tally **`LZ8MLz`**, copie de `0Q47ZN` : mêmes champs, mêmes
  champs cachés, même style. Seul le consentement change, « au sujet de l'IA dans mon
  activité » au lieu de l'acquisition. Tally lui avait posé d'office le logo de
  l'espace de travail : retiré, pour qu'il ressemble à l'autre.
- Envoyé, il mène à **`guide-ia-merci.html`** (`noindex`) par les deux mêmes chemins :
  « Redirect on completion » dans Tally et l'écouteur `message` de `guide-ia.html`.
  Vérifié en simulant l'évènement — ignoré quand il ne vient pas de `https://tally.so`.
  Aucune vraie inscription n'a été envoyée.
- Le PDF renvoie à `guide-ia.html?utm_source=guide-pdf` (pied des pages intérieures et
  « Partager ») : le formulaire étant distinct, ces inscriptions ne se mêlent pas à
  celles du premier guide.
- Même règle que `guide.html` : aucun lien de `guide-ia.html` ne mène directement au
  PDF.
- L'assistant de discussion connaît les deux guides et propose celui qui répond au
  besoin du visiteur (`LIEN_GUIDE_IA` dans `api/chat.js`).

## Contraintes de contenu

Ces règles viennent de décisions explicites du propriétaire. Les enfreindre publierait
des affirmations fausses sur son entreprise.

- **Aucun montant, nulle part.** Les tarifs, seuils de budget publicitaire et durées
  d'engagement minimales ont été retirés des CGV à sa demande. Ne pas les réintroduire.
- **Aucune ville ni adresse.** Créteil a été retiré partout, y compris du JSON-LD, où
  il ne reste que `addressCountry`.
- **Pas de CV.** Les sections parcours professionnel et formations ont été supprimées :
  c'est un site d'entreprise, pas un portfolio.
- **La section « Résultats » annonce ce qui est *mesuré*, pas ce qui a été *atteint*.**
  Aucun chiffre de performance client n'est vérifié à ce jour. N'en inventer aucun, et
  ne pas reprendre ceux d'autres agences.
- **Les CGV et CGC sont son texte.** Les reformater, jamais les réécrire.

## Design

**Tout ce qui se clique porte un signe depuis le 4 novembre 2026**, à sa demande (« Tous
les icones cliquables sur le site doit revêtir un signe »), en CSS sur toutes les feuilles :

- **Boutons** : une flèche `→` en `::after` (`.btn`, `.contact__btn`,
  `.guide-lien__bouton`, `.exemples__guide a`), `↓` pour un téléchargement. Elle glisse au
  survol. Les `↗` écrits à la main dans ces boutons sont partis : **n'en plus écrire**.
  `.btn--attente` n'en a pas, il ne se clique pas.
- **Icônes des réseaux** : contour jaune seul. La pastille `↗` qu'elles portaient est
  partie le 5 novembre 2026, à sa demande (« enlève les flèches […] uniquement sur les
  icones de réseaux sociaux »).
- **Panneaux** : chevrons et « + » de la FAQ passent en jaune.
- **Cartes du blog** : « Lire l'article → » en bas de carte (`styleBlog`).

Non touchés : les liens de texte du menu et des pieds de page, et le `↗` d'« exemples-ia »
dans les repères, qui fait partie du texte.

**Le menu de l'accueil a changé le 5 novembre 2026**, à sa demande : « Exemples »
devient « IA & Performance » (toujours vers `#exemples`, qui ouvre le panneau dans
`#ia`), et « Blog » devient « Outils », vers `#agents` (« Déploiement Agent IA »).
Le blog, qui n'avait plus d'autre lien sur l'accueil, a été ajouté au pied de page
le même jour, à sa demande, devant « Guide gratuit ». Menu : Méthode,
IA & Performance, Outils, Librairie, FAQ, plus « Contact » ; 66 et 112 px de marge
à 900 px.

**Le hero n'a plus que deux boutons jaunes le même jour**, à sa demande : « Librairie »
et « Écrire sur WhatsApp ». « Réserver un échange » en est parti : la section Contact
reste accessible par « Contact » dans le menu. **« Librairie » remplace « Librairie
Amazon » partout**, nom sous lequel elle apparaît ailleurs dans ce fichier.

**`#agents` s'appelle « Déploiement *Agent IA*. » depuis le 4 novembre 2026**, à sa
demande. Son chapô, de Claude sur sa consigne (« sois simple et compréhensible ») :
« Voici quatre exemples d'agents IA que nous mettons en place. » Il remplace « Ce ne
sont pas des maquettes : ce sont les scénarios réellement construits… ». Le point final
et l'italique sont de Claude, pour suivre les autres titres.

**Le bouton du téléphone est devenu un lien WhatsApp le 4 novembre 2026**, à sa demande
(« Remplace mon numéro de téléphone par mon lien whatsapp »). Dans le hero, « Écrire sur
WhatsApp » (icône `i-whatsapp`) mène à `https://wa.me/33751599636` dans un nouvel onglet ;
le numéro de l'article du 5 septembre 2026 porte le même lien. **Gardent le numéro
d'appel** : le JSON-LD (`telephone`), l'image de partage et les deux guides PDF, qu'il
faudrait refaire. Les passages de ce fichier qui parlent du « téléphone » du hero
décrivent ce bouton avant ce changement.

**Le titre d'accueil a changé le 4 novembre 2026**, à sa demande : « Générez des
*leads qualifiés* et mettez l'*IA* à votre service. » remplace la phrase longue, citée
ailleurs dans ce fichier sous sa forme d'alors. Le point final, les deux mots accentués
et l'espace insécable de « leads qualifiés » sont de Claude. Le texte vit dans
`content/pages/accueil.md`, d'où `sync-content.mjs` l'écrit dans la zone `HERO_TITLE`.
« Rend ce titre plus visible » : `.hero__in h1.display` passe en Poppins 500, de
70 à 95 px à 1 280 px, 41,6 px sur téléphone. La règle se limite au hero, le blog
recopiant cette feuille.

**L'aperçu de partage l'a suivi le même jour**, à sa demande (« Oui, aligne-les »).
L'image est désormais **`assets/og-smartefico-accroche.jpg`** (68 Ko) : titre court en
Poppins 500 à 92 px, comme l'accueil, le reste inchangé. `og-smartefico-metiers.jpg`
reste dans le dépôt pour les partages déjà faits. Titre d'onglet et d'aperçu :
« SmartEfico — Générez des leads qualifiés et mettez l'IA à votre service ». Description
d'aperçu : « Des leads qualifiés pour vos offres, et l'IA à votre service : publicités
pilotées, agents IA, formation et accompagnement de vos équipes. » La `meta description`
dit de même « met l'IA à votre service », et le texte `alt` de l'image suit sur toutes
les pages. **Gardent l'ancienne formule, volontairement** : la section `#ia`, le guide
de l'IA générative, qui porte ce titre, et le manifeste, qui est le texte du
propriétaire. Les paragraphes de « L'aperçu de partage » plus haut décrivent l'image
précédente pour le titre long.

**Fond entièrement noir depuis le 4 novembre 2026** (« Mets mon site en fond totalement
noir »), sur les dix pages, le blog et les articles compris. Sont partis : le calque de
grille (`body::before`), son `mask-image` sur les CGV, les CGC et les articles, le
carreau de la barre du menu, et tout `.hero__bg` — halo jaune et crochets d'angle.
`--noir` (accueil), `--black` (pages légales) et le fond de `.appel` passent de
`#0A0A0A` à `#000000` : le bandeau des cinq étapes, le bloc contact et les barres
légales se fondent donc dans la page. **Restent relevées, par choix** : les cartes
(`--surface`), sans quoi seul leur filet les dessinerait, et le contour animé du menu.
`assets/fond-grille.svg` reste dans le dépôt, inutilisé. Le jeton `--plaque` et l'aplat
noir sous les écrits restent aussi, désormais invisibles : ne les retirer que si la
grille est écartée pour de bon. Pour revenir à la grille : `git revert` du commit de ce
changement, puis `node scripts/build-blog.mjs`. Ce qui suit sur la grille et le halo
décrit ce qui a existé.

**Fond à grille sur tout le site, 2 novembre 2026**, sur une image fournie par le
propriétaire : « là où il y a des endroits sans écrits sur le site tu peux mettre ce
fond ». Mesurée : grille de 72 px en traits de 2 px `#161616`, grands arcs et
diagonales en pointillés `#333` sur le noir.

- **`assets/fond-grille.svg`**, un carreau de 1 440 px redessiné en vecteur (pas
  l'image elle-même, qui ne se raccorde pas : 211 px de haut pour une grille de 72),
  qui se raccorde sur ses quatre bords — les tracés sont dessinés une fois puis
  recopiés décalés de 1 440 px dans les huit directions. Pour le retoucher, garder
  la grille multiple de 72 et le carreau multiple de 72.
- **Un calque fixe** (`body::before`, `position:fixed`, `z-index:-1`), calé en haut
  au centre de l'écran : la grille ne défile pas, le contenu passe dessus. Les
  cartes, opaques, la recouvrent ; les textes posés sur la page reçoivent un
  aplat noir depuis le même jour (voir le paragraphe suivant).
  La barre du menu de l'accueil, opaque pour cacher ce qui défile dessous, porte
  le même carreau au même calage : la grille passe sous elle sans couture. La règle
  pointillée du hero est partie, doublon de la grille.
- **Effacée sous les colonnes de lecture** : sur les CGV, les CGC (colonne de
  52 rem) et les pages d'articles (44 rem, par `body:has(.article)` dans
  `styleBlog`), un `mask-image` la retire sous le texte et ne la laisse que dans
  les marges — le texte y court sur toute la colonne. Sur téléphone, ces pages n'en
  montrent donc presque plus.
- **Reste sans grille, par choix** : le bandeau des cinq étapes (`.invert`), panneau
  plein `#0A0A0A` qui se lit désormais comme une bande calme ; la barre du haut des
  pages légales ; les fenêtres CGV/CGC. Le rendre transparent suffirait à y faire
  passer la grille.
- `index-autonome.html` l'embarque en base64, `build-standalone.mjs` remplaçant
  toute chaîne `"assets/…"`, CSS compris. Aucun signalement d'impeccable de plus
  (87 avant, 87 après, sur dix pages).

**Fond noir sous les écrits, 2 novembre 2026**, à sa demande, le même jour :
« n'importe où il y a une écriture, tu mettras un fond noir avant de mettre les
écrits ». La grille ne passe plus derrière aucun texte.

- **Un aplat noir prolongé d'une ombre noire**, le jeton `--plaque`
  (`0 0 1.25rem .75rem`) déclaré dans chaque feuille : la grille s'efface en
  fondu autour des mots au lieu de s'arrêter net. Le fondu est un choix de
  Claude ; un bord franc ne demanderait que de retirer l'ombre.
- **Ce qui le reçoit** : sur l'accueil, les en-têtes de section (`.head>*`) et le
  pied (marque, copyright, liens) ; sur le blog et les articles, en plus,
  l'en-tête et le pied (`styleBlog`) ; sur les deux guides, la marque, l'accroche,
  la colonne de texte (`.offre__texte`) et le pied ; sur leurs pages de
  remerciement, la marque, le titre, le chapô et le pied ; sur
  `exemples-ia.html`, l'en-tête, l'accroche, les en-têtes de section, la liste des
  départements et le tableau d'un seul tenant, et le pied. Les CGV, les CGC et
  la colonne des articles n'avaient déjà plus de grille sous le texte.
- **Dans le hero, l'aplat passe sous le halo jaune** : posé en `::before` au rang
  -1, entre la grille et le décor, il efface l'une sans éteindre l'autre. D'où
  `.hero__in{z-index:auto}` : il ne doit plus former de contexte d'empilement.
- **Les pastilles et boutons de verre posés sur la grille deviennent opaques**
  (`.hero__metiers`, `.btn--line`, `.etiquette`, le bouton secondaire des pages
  de remerciement) : même teinte, celle du verre sur du noir. Leur survol est
  intact.
- **Sur `exemples-ia.html`, les en-têtes alignés à gauche** prennent la largeur
  de leur texte (`align-items:flex-start`), sans quoi l'aplat du titre courait
  sur toute la page. Sur l'accueil, le titre de `#exemples`, sur deux lignes
  équilibrées, garde une boîte pleine largeur : son aplat aussi.
- **Vérifié** par un relevé de tous les textes dont aucun ancêtre n'a de fond
  opaque, à 1 280 px, sur l'accueil, les deux guides, leurs pages de
  remerciement, les exemples, le blog, un article et les CGV (dans la colonne
  sans grille) : il n'en reste plus, hors titre et chapô
  du hero (leur aplat est un pseudo-élément, que le relevé ne voit pas, vérifié
  à l'œil). Aucun débordement à 375 px. impeccable : 61 signalements avant,
  61 après, sur les huit pages touchées.
- **Pour la suite** : un texte ajouté hors d'une carte doit rejoindre la liste
  de sélecteurs de la règle `--plaque` de sa feuille, sinon la grille repasse
  derrière lui.

**Style « Dopamine » sur tout le site depuis le 1er novembre 2026 au soir** :
« essaie d'adapter mon site à ceci : https://www.dopaminestudio.io/ », puis, sur le
rendu, « Mets-le en ligne » pour l'accueil (commit `deb8781`), puis « Oui, tout le
site ». Sur l'accueil, tout tient dans le bloc « DOPAMINE », à la fin du `<style>`,
plus IBM Plex Mono et la graisse 300 de Poppins dans le lien Google Fonts ; le blog
et les articles le reçoivent en recopiant cette feuille.

- **Les autres pages** ont chacune leur bloc « Style Dopamine » en fin de feuille,
  avec le même lien de polices : `cgv.html`, `cgc.html`, `guide.html`,
  `guide-ia.html`, leurs deux pages de remerciement et `exemples-ia.html`. Le blog
  a aussi le sien, dans `styleBlog` de `build-blog.mjs`, dont le lien de polices a
  été aligné sur l'accueil — sans quoi il retombait sur la monospace du système.
  Titres en Poppins 400 partout, y compris `.article__title` et le `h1` des pages
  légales ; numéros d'article des CGV et CGC (et de leurs fenêtres sur l'accueil)
  en pastille de verre monospace ; étiquettes des guides en pastille de verre.
- **N'ont pas suivi** : les deux guides PDF et l'image de partage, qui sont des
  images — les refaire voudrait une demande, et pour l'image un nouveau nom.
- **La pile Helvetica ne sert plus à aucun titre** : les paragraphes de ce fichier
  qui la décrivent pour les grands titres (« Polices, telles qu'elles sont… ») sont
  périmés sur ce point.

- **Relevé dans les feuilles de la référence**, le navigateur intégré refusant le
  site : noir plat, titres sans gras (graisse 400, 120 % d'interligne), texte en 300,
  étiquettes en IBM Plex Mono sur pastille de verre, boutons en pilule, cartes
  arrondies, FAQ en cartes séparées.
- **Ce qui change** : les grands titres quittent la pile Helvetica 800 pour Poppins
  400 (interligne 1,04, mesuré sans contact entre les lignes) — la consigne « Ne
  touche pas aux grands titres » du 23 septembre cède à cette demande-ci ; les h2
  passent de 41 à 44 px ; numéros, puces, menu, étiquettes et pastille des métiers
  en IBM Plex Mono ; chiffres clés en 300 ; cartes arrondies à 18 px ; bouton
  secondaire en verre ; FAQ en cartes.
- **N'entrent pas** : son vert fluo `#CCFF00` (charte noir, jaune, blanc, comme pour
  aicliently.com), Space Grotesk (proscrite), sa photo de hero en pleine hauteur,
  ses étiquettes au-dessus de chaque titre de section (retirées du site à sa
  demande, voir plus bas) et son logo géant en pied de page.
- **Mesuré** : la page passe d'environ 6 685 à 6 860 px à 1 280 px ; menu à 61 et
  102 px de marge à 1 280 px, 55 et 90 px à 900 px ; rien ne déborde à 375 px.
  impeccable : aucun signalement nouveau, deux de moins (`italic-serif-display`).
  Sur les dix pages ensemble : 99 signalements avant les autres pages, 87 après,
  aucun nouveau ; rien ne déborde à 375 px (le tableau d'`exemples-ia.html` défile
  dans son cadre, comme avant).
- **Pour revenir en arrière** : `git revert` des deux commits, celui de l'accueil
  (`deb8781`) et celui des autres pages, puis `node scripts/build-blog.mjs`.

**Plus de marques ni de vidéo depuis le 1er novembre 2026**, à la demande du
propriétaire : « Supprime maintenant "Ils nous ont fait confiance" et supprime aussi
la vidéo Youtube ». Sont partis de `index.html` la section `.marques` (titre, deux
logos clients, rangs qui défilent), son style et son script, et la section `#chaine`
(lecteur YouTube, bouton « Voir la chaîne »), son style `.video-scene` et son script
de démarrage en sourdine. L'accueil passe du hero directement à « Ce qu'on vous
apporte », et de « Agents IA » à la FAQ ; il fait **6 589 px** à 1 280 px. Restent :
l'icône YouTube du pied de page, les logos clients dans `assets/` et dans PRODUCT.md.
Ce qui est écrit plus bas sur les marques et la vidéo décrit ce qui a existé.
**La phrase YouTube de l'article 9 des CGC est repartie le même jour**, sur
proposition validée par lui (« Oui, retire-la ») : l'article ne nomme plus que Tally
et Google Fonts. Si une vidéo revient, la phrase revient avec elle, avec son accord.
**Un lien vers la vidéo est revenu le même soir** (« ramène le lien qui amène vers la
vidéo Youtube ») : un bouton à filet « Voir la vidéo sur YouTube ↗ » (`.lien-video`),
centré entre « Agents IA » et la FAQ, vers `youtube.com/watch?v=Uge1VlfPbd8` dans un
nouvel onglet. Un simple lien ne charge rien de YouTube : l'article 9 n'a pas à en
parler.

**Tous les italiques sont jaunes depuis le 1er novembre 2026** (« Tu dois écrire en
couleur jaune les écrits qui sont en italique ») : les mots des titres de section
(`h2`), des titres de carte, du manifeste et du texte courant (« closers »,
« setter »…), et plus seulement ceux du titre d'accueil. Une règle
`em,.display em,h1.display em{color:var(--yellow)}` dans le bloc « NOIR PLAT » de
`index.html` (donc le blog et les articles), et `em{color:var(--yellow)}` dans les
feuilles de `cgv.html`, `cgc.html`, des deux guides, de leurs pages de remerciement et
d'`exemples-ia.html`. Le paragraphe « Le jaune ne marque plus que deux choses » plus
bas ne vaut donc plus pour les italiques.

**Noir plat de nouveau depuis le 1er novembre 2026 au soir.** Dans la même journée,
le site est passé en blanc, jaune et rouge (commits `bb3e190`, `3587f1a`), puis ses
blocs noirs au blanc avec les titres en surligneur jaune (`7922b7c`), tout cela mis en
ligne ; le propriétaire l'a ensuite jugé « pas joli » et a demandé « tout en noir ».
Les trois commits ont été annulés d'un seul `git revert` : le site est revenu, au
caractère près (hors ce fichier), à l'état du commit `7bf56ed` — noir plat, violet dans
le contour du menu, `logo-clair.png` dans le champ `logo`. **Ce qui suit sur le blanc
et le rouge décrit donc un état annulé**, gardé dans l'historique git ; le « noir
plat » plus bas redevient l'état en vigueur. Leçon : sur ce site, **un changement de
couleur se montre en maquette avant d'être mis en ligne**, et la mise en ligne ne
vaut validation que pour ce qui a été vu.

**Un fond blanc a été essayé et annulé le 5 octobre 2026.** À sa demande (« mets le
fond du site en blanc et adapte les autres couleurs aux différentes palettes »), tout
le site est passé au blanc — bloc « FOND BLANC » à la place de « NOIR PLAT », îlots
noirs pour le menu, les marques, le manifeste, le bandeau des cinq étapes, le contact,
le pied et l'assistant, surligneur jaune sous les mots du titre — et a été mis en ligne
(commit `48d6506`), puis annulé le jour même (« reviens sur le précédent site, j'annule
ceci ») par un `git revert`. Le noir plat ci-dessous reste l'état en vigueur. Si le
blanc revient, tout est dans ce commit.

**Noir plat depuis le 23 septembre 2026, au soir**, sur tout le site. Le propriétaire
a donné un modèle — « Tu peux adapter mon site au fond d'écran de celui-ci :
aicliently.com. Ne mets pas en ligne, montre-moi juste le rendu » — puis a validé la
maquette de l'accueil d'un « passe tout le site dessus », comme le 20 septembre.

**Ce que fait la référence, relevé dans son navigateur** et non à l'œil : un seul bloc
de fond sur toute la page (10 614 px de haut) en `#000000`, **aucun `background-image`
nulle part** — un balayage de tous ses éléments en compte zéro —, et des cartes
relevées d'un cran à `#0E0E0E`. Son accent vert `#00D18B` **n'a pas été repris** : la
charte SmartEfico est noir, jaune, blanc, et elle vient de lui.

Palette : fond `#000000`, cartes `#0E0E0E`, texte `#FFFFFF`, gris `#B4B4B0` et
`#8A8A86`, filets `#1F1F1F`, et `--mur` `#333333`, le gris des survols et des
soulignés ; jaune `#FFCC00`, et un violet `#9D4DFF` cantonné à un seul endroit. La
balise `theme-color` de chaque page vaut `#000000`.

**Le site a changé de fond cinq fois en cinq jours** : noir pur `#000000` jusqu'au
19 septembre, blanc le 19 (une journée), noir profond le 20, blanc de nouveau le 23,
noir plat le 23 au soir. Chaque fois à sa demande. **Ne jamais traiter un fond comme
acquis** : l'historique git garde les quatre états précédents, et le bloc de thème se
remplace d'un bloc.

- **Sur `index.html`, la feuille décrit le noir pur et le bloc final ne fait presque
  plus que l'ajuster** : ses jetons (`--ground`, `--surface`, `--ink`…) portent déjà
  les valeurs d'origine, et le bloc « NOIR PLAT », à la fin du `<style>`, ne change
  que la surface des cartes (`#0E0E0E` au lieu de `#161616`), les filets, et les
  règles du jaune. Le blog et les articles recopient cette feuille. Les autres pages
  (`cgv.html`, `cgc.html`, les deux guides et leurs pages de remerciement) ont leur
  feuille propre : leurs jetons y sont directement écrits.
- **Il n'y a plus d'îlots.** Le fond blanc en avait imposé une dizaine (menu, marques,
  manifeste, bandeaux, contact, pied de page, assistant, barre des pages légales,
  carte du formulaire des guides), tous revenus au régime commun. Le formulaire Tally
  des guides, texte blanc sur fond transparent, se pose de nouveau sur la carte sans
  rien de particulier.
- **Le fond est plat**, c'est ce qui distingue ce noir du « noir profond » du
  20 septembre : pas de `radial-gradient` sur `body`, et le halo de la vidéo est
  retiré — il ne lui reste que son ombre portée. Le hero garde le sien, en jaune à
  10 % : c'est un décor de section, pas le fond de la page.
- **N'ont pas changé** : les deux guides PDF, qui sont des images. L'image d'aperçu de
  partage, elle, a rejoint le noir dans la foulée (« Refais l'image de partage en
  noir »), en `assets/og-smartefico-plat.jpg` — sixième nom de la journée. Voir
  « L'aperçu de partage » ; rafraîchir les aperçus déjà en cache reste au propriétaire,
  Claude n'a de session sur aucun réseau.
- **Deux fichiers de logo, et le fond décide lequel.** `assets/logo.png` est le logo
  complet : contour blanc épais sur sa plaque noire. `assets/logo-clair.png` est le
  même sans la plaque, sur transparence — son contour blanc ne se voit donc que sur du
  sombre, et sur du blanc il ne reste que l'hexagone noir au sigle jaune. Le
  23 septembre 2026, le propriétaire a demandé de remettre le blanc (« Remets le logo
  blanc sur le fond blanc », puis « … dans l'image de partage aussi ») : `logo.png`
  est alors passé sur les en-têtes du blog, des articles, des deux pages de guide et
  de leurs pages de remerciement, et dans l'image de partage. **Le noir plat du même
  soir les a tous rendus à `logo-clair.png`** : la plaque n'a plus lieu d'être quand
  la page est noire. Seules exceptions qui gardent `logo.png` : la barre du haut des
  pages légales, qui l'utilisait déjà avant tout cela, et l'image de partage, restée
  blanche. La règle tient en une phrase et survit à tous les changements de fond :
  **plaque noire sur fond clair, transparence sur fond sombre.** Le menu et le pied
  de page de l'accueil sont renseignés par le champ `logo` du back office : ne pas
  basculer ce champ, il vaut pour deux emplacements toujours sombres.

**Le violet n'existe que dans le contour animé de la barre de navigation**, demandé par
le propriétaire le 14 septembre 2026 : un filet dégradé jaune et violet, et deux éclats —
un jaune, un violet — qui en font le tour en 7 s. Ne pas l'employer ailleurs.

C'est un SVG posé sur la bordure de `.nav__in`, et non un `conic-gradient` qui tourne. La
barre est vingt fois plus large que haute : un dégradé conique y concentrerait tout son
mouvement au milieu des grands côtés et laisserait le reste presque figé.
`stroke-dashoffset` avance au contraire à vitesse constante sur le périmètre d'un
`<rect>`, et `pathLength="100"` rend ce périmètre indépendant de la largeur d'écran.
Vérifié dans le navigateur : un seul éclat par couleur, et le contour suit la barre quand
le menu mobile l'allonge. Sous `prefers-reduced-motion`, les éclats disparaissent et le
filet reste.

**Les chiffres de « Ce à quoi vous engager » défilent**, demande du propriétaire du
16 septembre 2026. Chaque `<data class="compteur" value="…">` repart de zéro et monte
jusqu'à sa valeur en 1,4 s, une seule fois, quand il entre à l'écran — les cartes qui
entrent ensemble se suivent à 120 ms. La valeur finale reste écrite dans le HTML : sans
script, sans `IntersectionObserver` ou sous `prefers-reduced-motion`, rien ne bouge.
Pendant le défilement, le lecteur d'écran lit `.compteur__lu` (valeur finale, cachée) et
ignore `.compteur__vu` ; à la fin, le script rend le texte d'origine. Aucun chiffre n'a
été ajouté : ce sont les quatre qui y étaient. D'où aussi `.figure > span` au lieu de
`.figure span`, qui aurait rapetissé et grisé les span du compteur. Ce sélecteur, plus
spécifique que `.figure__ico`, laissait aussi les quatre icônes en gris au lieu du jaune
prévu : l'icône est désormais visée par `.figure .figure__ico`. Dans l'aperçu de
Claude Code, le défilement ne part que si le panneau est affiché : masqué, la page ne
se redessine pas et les compteurs attendent à zéro.

**Plus de captures de preuves.** La section « Ne nous croyez pas sur parole,
observez » (`#preuves`) a été supprimée le 21 septembre 2026 à la demande du
propriétaire : ses trois captures de tableaux de bord — 790 leads, 672 leads et
17 créatives, 625 leads et 624 deals —, leurs légendes à compteurs et la couche SVG
qui les animait depuis le 19 septembre. Sont partis avec elle son style
(`.preuves`, `.preuve`, `.preuve__anim`…), son script et le `.preuve:hover` de la
règle de survol commune. L'accueil passe donc de « Ce à quoi vous engager » à
« Avant, après ».

Les trois images restent dans `assets/` (`preuve-leads.png`, `preuve-tracking.png`,
`preuve-pipeline.png`), suivies par git mais plus servies par aucune page, comme
`og-cover.jpg`. Elles étaient recadrées avant publication : la table qui portait le
nom, l'email et le téléphone d'un lead avait été retirée du fichier lui-même, de même
que les barres latérales nommant les espaces clients. Une quatrième capture, celle
des coûts publicitaires, avait été écartée le 14 septembre 2026 — adresse e-mail
personnelle en étiquette d'axe, et montants en euros que la règle « aucun montant,
nulle part » interdit. Y revenir demanderait de reprendre l'historique git : la
couche animée portait, écrits en pixels de chaque image, les centres et rayons des
anneaux, la zone des courbes, et les boîtes et couleurs des huit grands chiffres.

**Plus de bandeau de mots-clés sous le hero.** La liste « Acquisition · Automatisation ·
IA · … · Conversion » (`.ticker`) a été retirée le 16 septembre 2026 à la demande du
propriétaire, avec son style. Ne pas la remettre.

**À sa place, les marques clientes défilent**, demande du même jour : un rang pleine
largeur de grands carreaux noirs arrondis, logos en silhouette blanche.

**Le titre en est à sa sixième écriture** : « Marques avec lesquelles j'ai
travaillé », puis « travaillées » — forme fautive après « avec lesquelles » —, puis
« Elles m'ont fait confiance. », puis, le 23 septembre 2026, « +10 CEOs & Entreprises
nous font confiance. », puis « CEOs & Entreprises nous font confiance. » quelques
heures plus tard, le propriétaire ayant demandé de retirer le « +10 », et enfin
**« Ils nous ont fait confiance. »**, le 25 septembre 2026, à sa demande. Il revient
ainsi, au pronom près, à la troisième écriture : le passé composé, et plus personne de
nommé. Le point final est de Claude, pour que le titre s'aligne sur tous les autres de
la page, qui en portent un ; il n'a jamais été discuté, et il a survécu aux six
écritures. Le mot en italique reste « confiance » depuis la troisième.

**Le retrait du « +10 » referme un écart signalé** : le rail ne porte que deux logos,
les deux seuls que PRODUCT.md autorise à citer, et le titre en annonçait plus de dix
juste au-dessus. Claude le lui avait dit le jour même ; le titre ne chiffre plus rien.
S'il voulait y remettre un nombre, la règle reste la même : c'est une affirmation sur
sa propre activité, elle l'engage, et il vaut mieux que les logos suivent.

**Deux rangs en sens contraires, filet blanc sur carreau noir**, depuis le
21 septembre 2026 : « Dans cette section "Elles m'ont fait confiance" tu mettras
2 menus déroulants, le 1er dans un sens et le deuxième dans le sens opposé. Les cadres
déroulant doivent être en jaune. » Le second rang avait existé le 16 septembre et
avait été retiré le même jour, à sa demande ; il revient, et va vers la droite quand
le premier va vers la gauche.

« Les cadres en jaune » a changé trois fois dans la journée : d'abord un **aplat
plein** — carreau jaune, logos noircis au filtre ; puis un **filet jaune** sur carreau
noir (« Mets plutôt le filet jaune sur carreau noir ») ; puis le **filet blanc**, état
d'aujourd'hui (« mets juste le filet plutôt en blanc »). Carreau `--ground`, contour
`--ink` de 2 px, logos blancs d'origine. **Le jaune a donc quitté cette section** : il
n'y reste que le mot en italique du titre. Les deux états précédents sont dans
l'historique git.

**Le fond blanc du 23 septembre l'avait fait passer à l'intérieur du carreau**
(`box-shadow:inset 0 0 0 2px #FFFFFF`) : par l'extérieur, un filet blanc se fondait
dans la page claire et le carreau n'avait plus l'air d'en porter un. Le noir plat du
même soir a rendu la bordure à sa place, à l'extérieur, où elle se détache de nouveau.
Retenir la règle plutôt que le code : **le filet doit se voir contre le fond de la
page, pas seulement contre le carreau.**

- **Le sens contraire est un `animation-direction:reverse`** sur la même image-clé :
  la piste va de `-50%` à `0` au lieu de l'inverse. Comme chaque piste porte deux
  moitiés identiques, elle boucle aussi bien dans un sens que dans l'autre.
- **Le second rang est fabriqué par le script**, qui recopie le premier. Le HTML
  n'écrit donc toujours chaque logo qu'une fois (`.marques__piste`) : **ajouter une
  marque reste un `<li>` de plus**, et les deux rangs le prennent. Le second est
  décoratif : `aria-hidden`, `alt` vidés. Seuls les carreaux d'origine du premier rang
  sont lus par les lecteurs d'écran, comme avant.
- Ses carreaux démarrent **décalés d'un cran** (le premier `<li>` passe à la fin) :
  sans cela, les deux rangs s'aligneraient verticalement.
- **Carreaux et filet ont maigri le 23 septembre 2026 au soir**, à sa demande
  (« Tu dois diminuer la taille des logos et des filets »). Le carreau passe de
  `clamp(14rem,26vw,28rem)` à `clamp(9rem,16vw,17rem)`, et **les logos suivent tout
  seuls** : leur hauteur est un `calc()` sur `--tuile`, il n'y a donc qu'une valeur à
  changer. Le filet passe de 2 px à 1 px — les 2 px venaient d'un carreau une fois et
  demie plus grand, où un pixel se perdait. Les logos restent les silhouettes blanches
  d'origine. Le temps de l'aplat
  jaune, il avait fallu les noircir par un `filter:brightness(0)` — blanc sur jaune ne
  se voit pas (1,07:1) ; ce filtre est parti avec l'aplat, et le site n'en porte de
  nouveau aucun.
- **Le survol n'arrête plus que le rang.** Le filet étant déjà blanc, il n'y a rien de
  plus clair à lui donner sur ce noir, et l'arrêt suffit comme retour. `.marque:hover`
  reste sorti de la règle de survol commune du bloc de thème, qui cernerait le carreau
  d'encre — invisible sur son noir.
- Sans script ou sous `prefers-reduced-motion`, il n'y a qu'un rang : les deux
  carreaux d'origine, centrés et immobiles.
- **La piste ne se remplit que si le carreau est posé.** `construire()` renonce quand
  son pas mesuré n'est pas un nombre positif, et repasse au `load` et à chaque
  redimensionnement. Sans ce garde-fou, une page qu'aucune fenêtre ne dessine rendait
  une largeur nulle et une marge vide, donc un pas `NaN` : la piste restait à ses deux
  carreaux et `--duree` recevait « NaNs », que le navigateur rejette au profit des
  60 s par défaut. C'est ce que montre l'aperçu de Claude Code quand le panneau est
  masqué — il se remplit dès qu'on l'affiche.

Voir PRODUCT.md pour les deux clients et leur droit d'être cités.

**La signature, portrait compris, a été supprimée le 28 septembre 2026** (voir
Architecture). Les deux paragraphes qui suivent la décrivent telle qu'elle était. Le
portrait a quitté l'image de partage le même jour : plus rien ne l'affiche.

**La photo de la signature ne bougeait pas**, décision du propriétaire du 18 septembre
2026. Le même jour, il avait demandé que « le personnage en bas commence à croiser les
bras et à sourire quand on arrive sur la page » ; une photo ne bouge pas, et le geste
avait été rendu par un dévoilement de haut en bas, visage d'abord, bras croisés
ensuite. Il l'a fait retirer quelques heures plus tard : « elle ne doit pas bouger ».
Ne pas remettre d'animation sur ce portrait sans sa demande. Pour un vrai mouvement,
il faudrait une vidéo, à produire hors du dépôt.

**Le portrait est de nouveau le noir et blanc**, `assets/Portrait3.jpg`, depuis le
23 septembre 2026, à la demande du propriétaire (« Remplace l'image de "Emmanuel
Kouakou" en mettant plutôt celle-ci : Portrait3 »). **800 x 1067, 111 Ko**, allégé le
même jour, toujours à sa demande (« allège Portrait3 ») : il arrivait à 900 x 1200 et
196 Ko, là où le site tourne plutôt autour de 50. Réencodé sur place — l'historique
git garde l'original —, en JPEG progressif mozjpeg de qualité 84. 800 px suffisent :
la photo ne s'affiche jamais plus large que 24 rem, soit 384 px, et 768 px sur un
écran à double densité. Le passage en vrai niveau de gris a été mesuré et écarté :
l'image est déjà parfaitement neutre (écart R/V/B nul), ses plans de chrominance ne
coûtent donc presque rien et la conversion ne gagnait qu'un kilo-octet. Comparés au
format d'affichage, l'avant et l'après sont indiscernables. Le cadrage
du cercle, `object-position: center 18%`, lui convient sans retouche : le visage
garde de l'air au-dessus et les bras croisés tiennent dans le bas du disque. Son
fond gris clair se pose sans heurt sur la page blanche, à l'intérieur de l'anneau
jaune.

Il se déclare dans le back office (`content/pages/visuels.md`, champ `portrait`) et
non dans `index.html`, que `sync-content.mjs` réécrit. Après le changement :
`node scripts/sync-content.mjs`, puis `node scripts/build-standalone.mjs`, qui
réencode l'image en base64 dans la copie autonome. Celle-ci était montée de 446 à
638 Ko avec le portrait d'origine ; elle retombe à 524 Ko une fois celui-ci allégé.

Le portrait couleur qu'il remplace, `assets/portrait-emmanuel-kouakou.jpg` (900 px,
53 Ko), vient de « Mon image.jpg » (dans son dossier `IMG/` et à la racine du site,
ignoré par git), en couleur sur fond ocre, réduit depuis les 3,6 Mo de l'original.
Il avait tenu du 18 au 23 septembre et reste dans le dépôt, inutilisé — comme
`Portrait3.jpg` l'était avant lui. Il a paru quelques heures de plus dans l'image
d'aperçu de partage, que le propriétaire a fait refaire le même jour avec le noir et
blanc : plus aucune page ni aucune image ne le cite.

Un piège relevé pendant cet essai, et qui vaut pour toute animation future : **un
`clip-path` posé sur la cible d'un `IntersectionObserver` ramène son taux de
visibilité à zéro dans Chrome** — `intersectionRatio: 0` alors que `isIntersecting`
vaut `true`. Un `threshold` supérieur à zéro n'est alors jamais franchi et l'élément
reste caché pour de bon ; une marge négative (`rootMargin`) fait office de seuil.

**Aucun panneau dépliant n'est ouvert à l'arrivée**, demande du propriétaire du
18 septembre 2026, en deux temps : d'abord « 01 Création du système » dans les cinq
étapes de la méthode (`.step`), puis « Des rendez-vous qualifiés » dans « Ce qu'on
vous apporte » (`.livrable`, panneaux retirés le lendemain avec la réécriture de la
section) et la première question de la FAQ (`.qa`). Chacun portait
`open` pour montrer que les autres se déplient ; le chevron ou le « + » de chaque
titre le dit seul. Celui de la FAQ était posé par `sync-content.mjs`, qui écrit la
zone FAQ : c'est là qu'il faudrait le remettre, jamais dans `index.html`. **Les cinq
leviers de `#ia`, repliables depuis le 25 septembre 2026, suivent la même règle** :
aucun `open` dans le markup.

**Pas plus de vide qu'il n'en faut**, demande du propriétaire du 19 septembre 2026 :
« supprime les endroits où il y a trop d'espace ». Entre deux sections, la page
laissait environ 77 px à 1 440 px de large (`--gap` de la pile, plus l'interlignage)
— environ 58 px depuis le 23 septembre 2026, voir plus bas.
Mesuré sur toute la page à quatre largeurs, quatre endroits dépassaient nettement :

- **le hero**, qui avait une hauteur minimale (`min(42rem,80svh)`) supérieure à son
  contenu : le surplus se centrait autour du texte, et il y avait 180 px entre les
  boutons et le titre des marques sur ordinateur, plus de 100 px au-dessus
  et au-dessous du texte sur tablette. Hauteur minimale retirée, marges ramenées à
  `clamp(2rem,4.5vw,3.5rem)` en haut et `clamp(.75rem,1.5vw,1.25rem)` en bas ;
- **le bandeau des cinq étapes** (`.invert`) : la pile de part et d'autre et le
  panneau additionnaient 135 px. Les deux `<div class="stack">` qui l'encadrent ne
  lui laissent plus qu'un demi-écart (style en ligne) ; la marge intérieure du
  panneau, alignée sur `.contact`, n'a pas bougé ;
- **le bas de page** : la seconde pile ajoutait son écart sous le pied de page, qui a
  déjà le sien. Remis à zéro ;
- **les cartes de `#ia`** : les étiquettes calées en bas laissaient 70 px de trou au
  milieu des cartes 02 et 03. Elles suivent désormais le texte, un peu plus serrées
  (0,8 rem), deux par ligne ; la première rangée perd 60 px.

**Les en-têtes de section ont resserré à leur tour le 23 septembre 2026**, à sa
demande (« Réduis aussi l'espace des titres de section »), juste après l'interlignage
du titre d'accueil. Leur interlignage avait déjà suivi, la règle étant commune
(`.display`, 0,95) ; restait l'air autour. `.head` passe d'un écart de `.8rem` à
`.55rem` entre le titre et le chapô, et d'une marge basse de
`clamp(1.25rem,2.4vw,2rem)` à `clamp(.85rem,1.6vw,1.35rem)`. Mesuré à 1 280 px : le
blanc titre-chapô tombe de 17 à 13 px, et le blanc chapô-contenu de 77 à 67 px. L'écart
entre deux sections ne bouge pas : c'est `--gap`, et il tient le rythme de toute la
page.

**Les marges intérieures des cartes ont suivi**, dans la foulée et à sa demande
(« Réduis aussi la marge intérieure des cartes ») : c'est de là que venait la moitié
des 67 px restants. Toute la famille est rabotée d'un quart, en gardant les écarts
relatifs entre composants — `.figure` (2rem → 1,5rem au plus large), `.offer`
(2,2 → 1,65), `.ba__col`, `.pilier`, `.why article` (2,1 → 1,55),
`.guide-lien--large` et `.mc__corps` (1,5 → 1,15). Les valeurs `vw` des `clamp()`
suivent le même quart. Le blanc chapô-contenu passe alors à **59 px**.

**Le bloc contact a suivi**, quatrième demande de la série (« Réduis aussi la marge du
bloc contact ») : sa marge verticale passe de `clamp(2.25rem,6vw,4.5rem)` à
`clamp(1.6rem,4.2vw,3rem)`, soit 72 px à 48 px à 1 280 px. **Sa marge horizontale ne
bouge pas** : sur un panneau pleine largeur elle ne pèse rien en hauteur, et la rogner
collerait le texte au bord sur téléphone.

**Le bandeau des cinq étapes a fermé la série** (« Réduis aussi la marge du bandeau
des cinq étapes ») : `.invert` passe de `clamp(2rem,4.5vw,3.5rem)` à
`clamp(1.4rem,3vw,2.35rem)`, soit 56 px à 38 px à 1 280 px. C'est son second
resserrement, après celui du 19 septembre. **Le rapport au bloc contact est
conservé** — le bandeau reste à peu près aux trois quarts de sa marge, comme avant :
deux panneaux noirs qui ne se traitent pas l'un sans l'autre.

**`--gap` a fini par y passer aussi** (« Réduis aussi l'écart entre les sections »),
sixième et dernière demande de la série. Il passe de `clamp(2.5rem,5.4vw,4.5rem)` à
`clamp(1.8rem,3.9vw,3.25rem)`, soit 69 px à 50 px à 1 280 px. **Claude avait
conseillé de le laisser** — c'est le seul réglage de la page dont l'effet se voit
partout à la fois, la pile l'applique quinze fois — et le propriétaire a écarté
l'avis. À 288 px gagnés d'un seul jeton, il avait le meilleur rendement de la série.

**Ce que les six resserrements du 23 septembre rendent ensemble** : la page d'accueil
passe de 10 436 px à **9 546 px** à 1 280 px de large, soit **890 px**, sans qu'aucun
contenu ne disparaisse. Il ne reste plus de réserve de vide évidente sur cette page :
la suite se paierait en marges de composants, c'est-à-dire en lisibilité.

La page d'accueil y perd de 270 à 430 px selon la largeur, et « Elles m'ont fait
confiance » entre dans le premier écran d'un ordinateur. Effet de bord réglé : sur
téléphone (35 rem et moins), où les boutons du hero prennent toute la largeur, ses
deux crochets d'angle jaunes sont masqués — celui du bas tombait sur le bouton du
téléphone. La règle pointillée verticale du hero (`.hero__bg .ruler`) part, elle,
sous 60 rem ; **elle ne partait pas du 14 au 28 septembre 2026** : une accolade `}`
orpheline, laissée juste avant sa requête média, faisait jeter la requête entière au
navigateur, et la ligne traversait le texte sur téléphone. Retirée à la demande du
propriétaire. Une accolade de trop dans une feuille ne produit aucune erreur : elle
annule en silence la règle qui la suit. Pour remesurer : capturer la page entière, puis chercher les bandes
horizontales où aucun pixel ne dépasse `#1E1E1E` ; les cartes `#0E0E0E` passent pour
du vide, à retrancher à la main. Sur fond clair la méthode se renverse — les bandes
sans un pixel plus sombre que `#E0E0E0`, cartes à retrancher de même.

**Le jaune ne marque plus que deux choses**, depuis le 23 septembre 2026 au soir :
« Réduis le jaune sur le site ». C'est, dans l'esprit, la demande du 20 septembre,
qu'il avait défaite le 21 avant de la refaire ici. Les deux rôles qui restent :

- **ce qui se clique** : « Réserver un échange », « Recevoir »,
  « Réserver mon appel », le carré à la flèche du menu, le lien
  d'évitement et la pastille de l'assistant ;
- **les deux mots accentués du titre d'accueil** — `h1.display em` et non
  `.display em` : les titres de section sont des `h2` et passent au blanc. Les pages
  de guide et le blog gardent le jaune sur le leur, ce sont leurs `h1`.

**Une exception, voulue : la pastille des métiers du hero** (`.hero__metiers`),
demandée le 28 septembre 2026 — « écrire ceci en caractère très petit au milieu :
Lead / Conseil / Formation / Automatisation / Outils sur mesure », avant le titre
d'accueil. D'abord posée en gris, avec ses barres ; puis, le même jour, sur un modèle
qu'il a fourni (une pastille bleue « OPEN SOURCE · MIT LICENSE · … ») : « au lieu des
slash met cet exemple […] mais en couleur jaune or ». D'où les points médians, les
capitales espacées (`.16em`), le filet et le fond jaunes à faible opacité (32 % et
6 %), le texte en `--yellow`. **C'est le seul jaune de la page qui ne se clique pas**,
hors titre d'accueil : son choix, pas un oubli de la règle ci-dessus. Écrite en dur
dans `index.html`, hors des zones de `sync-content.mjs`. Des espaces insécables avant
chaque point et dans « Outils sur mesure » : sur téléphone, elle passe sur deux lignes
et coupe après « Formation · », jamais au milieu d'un métier. **Réduite le
30 septembre 2026**, à sa demande (« réduis ceci et son filet ») : texte de 12 à
**11 px** (`.6875rem`) — **seule exception au plancher de 12 px du site**, tolérable
pour une étiquette de capitales espacées —, suivi de `.16em` à `.14em`, cadre resserré
(marges `.55rem`/`1.15rem` → `.38rem`/`.85rem`). Le filet garde son 1 px et sa teinte.
La pastille passe à 496 × 31 px à 1 280 px ; aucun nouveau signalement d'impeccable.

**Sont rentrés** : les titres de section, les quatre chiffres de « Ce à quoi vous
engager » (`.figure b`) et leurs icônes, les numéros 01 à 05 des trois grilles
(`.step__no`, `.pilier__no`, `.offer__no`), les mots du manifeste
(`.manifesto .punch em`) et les coches des deux pages de guide. Numéros en gris
(`--ink-3`), icônes et chiffres en blanc — le réglage du 20 septembre, repris tel
quel.

**Les pastilles et les disques du fond blanc sont partis avec lui** : ils n'avaient de
raison d'être que là où le jaune ne se lit pas en texte. Ne pas les remettre sur fond
sombre.

**Reste hors du jaune**, et doit y rester : les italiques du corps de texte ; tous les
survols, qui prennent `--mur` pour un filet ou le blanc pour un aplat ; le cercle de
la photo de la signature ; les soulignés du pied de page et des pages légales ; et
l'icône de l'encart « Guide gratuit ». Les aplats cliquables, eux, sont jaunes partout
(voir ci-dessous).

**Contrastes** : `#FFCC00` donne 15,3:1 sur le fond `#000000` et 14,4:1 sur les cartes
`#0E0E0E` — très au-dessus du seuil AAA de 7:1. Ce n'est donc pas la lisibilité qui
l'a fait reculer, c'est sa quantité. Le blanc
`#FFFFFF` donne 21:1, les gris `#B4B4B0` et `#8A8A86` 11,4:1 et 6,6:1. Le texte posé
sur un aplat jaune reste `--on-yellow` (#141414), soit 12,18:1.

Les six règles qui se sont succédé, pour mémoire : jusqu'au 20 septembre, le jaune
tenait quatre rôles — le trait fin, l'icône, le mot en italique, l'aplat de ce qui se
clique ; le 20, il n'a gardé que l'aplat et le titre d'accueil ; le 21, il a repris le
titre de section, l'icône et le chiffre ; le 23 au matin, le fond blanc l'a ramené à
l'aplat seul ; le 23 au soir, le noir plat lui a rendu le trait, puis « Réduis le
jaune » l'a remis au réglage du 20. **Deux allers-retours en trois jours : ne pas
s'attacher à un réglage, et le garder dans le seul bloc de thème.** Toutes les retouches
vivent dans le bloc « NOIR PLAT » de `index.html`, que le blog et les articles
recopient — sauf les coches, qui sont un SVG en ligne dans la feuille propre de chaque
page de guide.

**Les aplats cliquables sont jaunes**, depuis le 14 septembre 2026. Le propriétaire
est revenu sur le retrait des aplats en nommant le carré à la flèche de la barre du
haut ; laisser les autres en blanc aurait eu l’air d’un oubli, donc la famille entière
a suivi : lien d’évitement, carré de la barre du haut, boutons pleins, survol des
boutons à filet, flèches du rail, bouton du blog, bouton « Réserver mon appel »,
survol des icônes de réseaux, et le survol du lien de contact des pages légales.
Le texte posé dessus est `--on-yellow` (#141414), soit 12,18:1.

**Tous les italiques sont jaunes**, depuis le 14 septembre 2026. La règle ne valait
jusque-là que pour le titre d'accueil ; le propriétaire l'a étendue à tout le site.
Une seule déclaration la porte, `em{color:var(--yellow)}`, présente dans la feuille
de `index.html` — que le blog et les articles recopient — et dans celles de `cgv.html`
et `cgc.html`, qui sont indépendantes. L'italique reste rare : quinze occurrences sur
la page d'accueil, une sur le blog, une dans les CGV. Toutes ont été mesurées sur leur
fond réel, entre 11,97:1 et 13,89:1.

**Ce n'est plus vrai depuis le 20 septembre 2026** : les italiques du corps de texte
sont blancs, seuls ceux des grands titres restent jaunes. Le fond blanc du
23 septembre les avait tous mis à l'encre, soulignés d'un trait de surligneur jaune ;
le noir plat du même soir a rendu cette écriture inutile et elle est repartie avec
lui — l'historique git la garde, elle a déjà servi deux fois. La règle vit dans chaque
feuille : le bloc « NOIR PLAT » de `index.html`, puis les feuilles de `cgv.html`,
`cgc.html`, des deux guides et de leurs pages de remerciement.

**Le `.skip-link` suit la règle des aplats cliquables**, quelle qu'elle soit. Il avait
été épargné une première fois, au motif qu'il n'apparaît qu'à la navigation clavier et
doit être impossible à manquer à cet instant ; le propriétaire a tranché qu'il ferait
comme le reste. Passé au blanc avec les autres, il est repassé au jaune avec eux.
Ne pas le traiter à part.

**Polices, telles qu'elles sont réellement dans le code.** Une version précédente de
ce fichier annonçait Bricolage Grotesque, Schibsted Grotesk et DM Mono : aucune des
trois n'apparaît nulle part, ni dans `index.html`, ni dans le blog, ni dans les
articles, ni dans les pages légales.

**Deux polices, et c'est le niveau de titre qui décide**, depuis le 23 septembre 2026
au soir. Le propriétaire a fourni une capture et une description — « une sans-serif
moderne, géométrique et épurée, comme Poppins, Montserrat, Inter ou Proxima Nova » —
avec une consigne précise : « **Ne touche pas aux grands titres.** Pour les autres, tu
dois utiliser ce type de caractère. »

- **Grands titres — la pile Helvetica**, inchangée :
  `"Helvetica Now Text","Helvetica Neue",Helvetica,Arial,sans-serif`, graisse 800,
  chasse `-.035em` (`-.042em` sur le `h1`), **interlignage 0,95** depuis le
  23 septembre 2026 — il valait 1,02, et le propriétaire l'a trouvé trop lâche
  (« Il y a trop d'espace dans ce grand titre »), toujours sur le modèle
  d'aicliently.com, dont le titre d'accueil est à 65 px sur 65 px d'interligne,
  soit un rapport de 1,00 avec une graisse noire. Le rapport n'est pas
  transposable tel quel : nos lignes tombent sur Arial Black sous Windows, dont
  la boîte de ligne est plus haute. **Mesuré plutôt que calculé** — on relève sur
  une capture les lignes d'image qui portent de l'encre : à 1 280 px, le pas est
  passé de 84–88 px à 78–83 px, et le blanc entre deux lignes de 21 px à 2 px.
  Vérifié à 1 280, 900, 760, 600 et 520 px : le plus petit écart tombe à 1 px,
  jamais en dessous — les lignes se frôlent sans jamais se chevaucher. Descendre
  sous 0,95 les ferait collisionner. Elle ne vit plus que
  sur quatre déclarations : `.display` (accueil, guides, pages de remerciement, titre
  du blog), le `h1` des pages légales, et `.article__title` dans `build-blog.mjs`.
  **Toute nouvelle règle de titre doit la redéclarer**, sinon elle hérite de Poppins.
- **Tout le reste — Poppins**, posée devant la pile Helvetica et non à sa place :
  `"Poppins","Helvetica Now Text",…`. Si Google Fonts ne répond pas, la page retombe
  sur la typographie d'avant, intacte. Graisses chargées : 400, 500, 600, 700 et 800
  sur l'accueil, les guides et le blog ; 400 à 700 sur les pages légales, qui n'ont
  pas de 800. **Poppins a été choisie parce que c'est le premier exemple de sa
  description et le seul de sa liste qui ne soit pas proscrit ici — Inter l'est.**
- **Mots accentués — `"Instrument Serif","Times New Roman",Georgia,serif`** en
  italique, dans les `<em>` des titres, en jaune sur le titre d'accueil seulement
  depuis « Réduis le jaune ». La feuille ne demande que l'italique
  (`family=Instrument+Serif:ital@1`) : un Instrument Serif droit n'existe pas sur ces
  pages.
- La classe `.mono` **ne porte aucune police monospace.** Elle vaut
  `font-family:inherit`, en capitales avec un fort suivi. Le nom trompe.
- **`.nav__links a` porte un `word-spacing:.1em`** que Poppins a rendu nécessaire : son
  espace-mot est étroite, et en capitales grasses « GUIDE GRATUIT » se lisait presque
  d'un seul mot. Un dixième de cadratin rouvre l'espace sans pousser le menu.

**Toutes les tailles de texte ont perdu 15 % le 28 septembre 2026**, en deux demandes
du propriétaire le même jour : « Regarde tout le site et réduis la taille de tous les
écrits du site ; les caractères sont trop grands », d'abord appliqué à −10 % et mis en
ligne, puis « Réduis encore de 15 % », qu'il a précisé, sur question, comme −15 % au
total par rapport aux tailles d'origine — et non 15 % de plus, qui aurait mis le
texte courant à 12,2 px. Poppins, à grand œil, paraît plus grosse que l'Helvetica
d'avant à taille égale. La règle appliquée, pour qu'une retouche future reste
cohérente :

- **chaque `font-size` en rem, px ou vw est multiplié par 0,85** à partir des tailles
  d'origine (celles du commit `511eb61`), et non par-dessus le −10 %, pour ne pas
  empiler deux arrondis ; bornes et terme
  central des `clamp()` compris, sur toutes les feuilles du site : `index.html` (donc
  le blog et les articles, qui la recopient), le CSS propre de `build-blog.mjs`,
  `cgv.html`, `cgc.html`, les deux guides, leurs deux pages de remerciement et
  `exemples-ia.html` ;
- **plancher de 12 px** : rien ne descend dessous, et ce qui y était déjà ne bouge
  pas — la pastille des métiers reste à 12 px, les étiquettes `.72rem` de
  `exemples-ia.html` à 11,5 px, comme avant ;
- **ne bougent pas** : les tailles en `em` et en `%`, qui suivent leur parent ; le
  texte des schémas SVG des agents (`.flux__mot`, 13 px), qui vit dans le repère de
  son `viewBox` ; les guides PDF et l'image de partage, qui sont des images ;
- **ni les marges ni les largeurs** : seules les lettres rapetissent. Les boutons du
  hero gardent leur `min-width` de 14 rem et leur `min-height` de 3,25 rem.

Mesuré à 1 280 px : texte courant 16 → **13,6 px**, chapô du hero 18,4 → 15,6 px,
titre d'accueil 82 → **70 px**, titres de section 48 → 41 px, menu 14,1 → 12 px
(plancher) ; pages légales 15 → 12,75 px. La page d'accueil passe de 7 590 à
**6 906 px**. Le titre de `#ia` tient toujours sur deux lignes (26 ch, qui suivent la
police). Aucun débordement à 375 px, aucun texte visible sous 12 px sur l'accueil.

**Le plancher de 12 px commence à tasser le bas de l'échelle** : sur l'accueil, 74
textes y sont désormais — menu, étiquettes `.mono`, mentions, dates —, qui étaient
entre 12,8 et 14 px à l'origine et ne se distinguent plus par la taille. Réduire
encore ne toucherait plus qu'aux titres et au texte courant, et écraserait la
hiérarchie par le bas : au-delà, il faudrait baisser le plancher, c'est-à-dire la
lisibilité. **Les marges du menu relevées plus haut sont périmées** : les liens ont
rétréci, il y a davantage de place — remesurer avant d'ajouter un lien.

**Une réduction de « tout sauf le texte » de 15 % a été essayée et annulée le
30 septembre 2026.** À sa demande (« réduis la taille de tout le site de 15% », lu
avec lui comme « tout sauf le texte »), la racine est passée à `85%` sur toutes les
feuilles, les `font-size` en rem compensées (÷ 0,85), les `vw` hors police réduits
d'autant, et la barre de menu rouverte à 61,5 rem ; mise en ligne (commit
`57309b4`), puis annulée le jour même (« annule cette réduction de 15% ») par un
`git revert` qui rend exactement l'état d'avant. Si elle revient, tout est dans ce
commit — dont le piège du plancher : à racine 85 %, 12 px s'écrit `.8824rem`, et
`.882rem` tombe à 11,995 px.

**Les pages légales chargent désormais une police distante**, elles qui n'en
chargeaient aucune : elles n'avaient pas besoin d'Instrument Serif, leurs italiques
étant du texte courant. C'est la seule entorse nouvelle à la règle des pages
autoportantes. **L'article 9 des CGC a été corrigé en conséquence**, le même jour et
sur accord explicite du propriétaire : « la police des titres » y est devenue « les
polices du site ». La phrase d'avant restait vraie sur le fond — Google Fonts est bien
utilisé, il reçoit bien l'adresse IP — mais elle ne décrivait plus le bon usage,
puisque c'est désormais le corps du texte, et sur toutes les pages, y compris celle
que le visiteur lit à ce moment-là. Le texte vit dans `cgc.html` ; `sync-legal.mjs` le
recopie dans la fenêtre de l'accueil.

**Helvetica Now Text est commerciale, et rien ne la charge** — aucun `@font-face`,
aucune feuille distante. Elle ne s'affiche que chez les visiteurs qui la possèdent
déjà. Les autres descendent la pile : Helvetica Neue sur Apple, Arial sur Windows,
et sur Android, où aucune Helvetica n'existe, le `sans-serif` générique — c'est-à-dire
Roboto, que la liste ci-dessous proscrit. En pratique, presque personne ne voit la
police annoncée.

Instrument **Sans** a été retirée parce qu'impeccable la signale comme sur-utilisée
par les interfaces générées. À ne pas confondre avec Instrument **Serif** ci-dessus,
qui reste en place. Ne pas revenir vers Instrument Sans, ni vers Inter, Roboto,
Fraunces, Geist, Plus Jakarta Sans ou Space Grotesk. **Cette liste a servi le
23 septembre 2026** : le propriétaire proposait « Poppins, Montserrat, Inter ou
Proxima Nova », Inter est proscrite, Proxima Nova est commerciale et absente de Google
Fonts — restaient Poppins et Montserrat, et Poppins était son premier exemple.

**Signalements d'impeccable à ne pas « corriger »**, vérifiés un par un dans le
navigateur :

- `cramped-padding` — le détecteur mesure le padding du conteneur, alors que ce sont
  les enfants qui le portent (24 px dans les cartes et 48 px dans le bloc contact
  depuis le 23 septembre 2026 ; 38 px et 72 px avant). Ajouter du padding doublerait
  les marges.
- `flat-type-hierarchy` sur les pages légales — le détecteur ne sait pas lire `clamp()`
  et ne voit donc jamais les `h1` et `h2`. L'échelle réelle compte trois paliers nets.
- `marquee` sur `.marques--defile .marques__piste` — la boucle horizontale est la
  demande explicite du propriétaire du 16 septembre 2026, et les deux rangs en sens
  contraires celle du 21. Mouvement réduit et survol l'arrêtent déjà.
- `cramped-padding` sur les quatre `<p>` des figures — même cause : le padding est
  porté par les enfants. Le détecteur ne le lève que sur fond sombre : absent les deux
  journées de fond blanc, revenu avec le noir.
- `pulsing-dot` sur `.assistant__msg--attente span` — les trois points ne vivent que
  pendant qu'une réponse de l'assistant se prépare, et disparaissent au premier
  morceau reçu : c'est un état réel et passager, pas une animation de décor. Consigné
  dans `.impeccable/config.json`. Les deux autres signalements levés par la pastille
  ont été corrigés : la mention passée de 11,5 à 12,8 px, et l'ombre du panneau
  retirée — sur le noir de la page, la bordure suffit. L'ombre que le fond blanc avait
  rendue à la pastille est repartie avec lui.
- Sur `scripts/guide/guide.html`, `tight-leading` (« 0,13 »), `oversized-h1`
  (« 7392px ») et `all-caps-body` — le détecteur lit mal les unités d'impression (pt,
  mm). Les étiquettes en capitales, là comme dans `guide.html`, font une trentaine de
  caractères, comme `.mono` sur le site.
- `all-caps-body` sur `.hero__metiers` (« 63 chars ») — les capitales espacées sont
  celles du modèle fourni par le propriétaire le 28 septembre 2026. Non consigné dans
  `.impeccable/config.json` : la règle ne s'y écarte que pour tout un fichier, et
  elle doit continuer de surveiller le reste de l'accueil.
- `tight-leading` — vise des titres à 1,15, où un interlignage serré est correct. Un
  troisième est mesuré à « 1,30 » sous une règle « il faut ≥ 1,30 ».

## Environnement Windows

- Node n'est pas dans le `PATH` de l'outil Bash. Préfixer :
  `export PATH="$PATH:/c/Program Files/nodejs"`. Le 28 septembre 2026, ce dossier
  n'existait plus ; le Node livré avec l'éditeur Zed a servi à sa place, `npx`
  compris : `export PATH="/c/Users/kouak/AppData/Local/Zed/node/node-v24.11.0-win-x64:$PATH"`.
  Le numéro de version change avec les mises à jour de Zed.
- L'aperçu de Claude Code (`.claude/launch.json`, ignoré par git) lance `serve` par
  le `node.exe` de Zed, sur le `build/main.js` resté dans le cache de npx
  (`npm-cache/_npx/…/node_modules/serve`) : lancé par `npx.cmd`, il échouait, Node
  n'étant pas dans le `PATH`. Si le cache est vidé, relancer une fois
  `npx --yes serve .` depuis Bash (avec le `PATH` ci-dessus) et corriger le chemin.
- Git Bash convertit `origin/main:.gitignore` en chemin Windows. Utiliser
  `MSYS_NO_PATHCONV=1 git show origin/main:.gitignore`.
- PowerShell 5.1 lit les `.ps1` en ANSI : un chemin accentué s'y corrompt. Résoudre le
  dossier par joker — `(Resolve-Path "…\Mon Deuxi*me site web").Path` — plutôt que de
  l'écrire en clair.

**Les fins de ligne sont en LF partout**, imposées par `.gitattributes` :

```
* text=auto eol=lf
```

Dépôt, disque et scripts écrivent tous en LF. Les images, PDF et polices sont marqués
`binary` pour qu'aucune conversion ne les approche.

Cette règle existe parce que deux sources écrivaient en sens contraire. Les scripts
(`sync-content.mjs`, `sync-legal.mjs`, `build-blog.mjs`, `build-standalone.mjs`)
produisent du LF ; les fichiers déposés par l'interface web de GitHub arrivent en CRLF.
Les deux se mélangeaient dans un même fichier, et chaque enregistrement depuis le back
office produisait des dizaines de lignes « modifiées » dont seul le retour chariot
changeait. Le contenu était identique ; le bruit, lui, noyait les vraies modifications.
`index.html` en a compté jusqu'à 268 d'un coup.

Conséquence pratique : **tout script qui écrit un fichier du dépôt doit émettre du LF.**
Un `join('\r\n')` réintroduirait le problème — le fichier serait enregistré en LF malgré
tout, mais `git status` le signalerait modifié en permanence, sans rien à enregistrer.

`.git-blame-ignore-revs` fait sauter à `git blame` le commit de normalisation, qui a
touché 6 608 lignes sans changer un caractère. GitHub le lit tout seul ; en local,
`git config blame.ignoreRevsFile .git-blame-ignore-revs`.

## Déploiement

Dépôt `kouakoukomla/smartefico`, branche `main`. **Le site est servi par deux hôtes
à la fois**, tous deux alimentés par `main` :

- `https://smartefico.com/` — Vercel, projet **`smartefico`** de l'équipe
  `emmanuel-kouakou`, l'adresse canonique depuis le 17 septembre 2026. Domaine acheté
  ce jour-là via Vercel (registraire Name.com), serveurs DNS `ns1/ns2.vercel-dns.com`,
  échéance le 17 septembre 2027. `www.smartefico.com` redirige vers `smartefico.com`
  en 308. Réglages : https://vercel.com/emmanuel-kouakou/smartefico/settings/domains
- `https://smartefico-z7.vercel.app/` — projet `smartefico-z7`, l'ancienne adresse de
  référence (12-17 septembre 2026). Elle ne porte pas le domaine, mais des liens déjà
  partagés y mènent : la garder tant qu'ils circulent.
- `https://kouakoukomla.github.io/smartefico/` — GitHub Pages, toujours actif.

**Le dépôt est relié à quatre projets Vercel**, constaté le 17 septembre 2026 :
`smartefico` (celui du domaine), `smartefico-z7` (l'ancienne adresse), `smartefico-42`
et `smartefico-ca`. Chaque envoi sur `main` construit donc le site quatre fois, et
chacun le sert sur son `*.vercel.app`. Les deux derniers ne servent à rien ; leur
suppression revient au propriétaire. **Ne jamais supprimer `smartefico`.** Le domaine
a d'abord été cherché dans `smartefico-z7`, à tort : pour savoir quel projet porte
quoi, ouvrir la page Domains de chacun. Les statuts de commit publics de GitHub
donnent le nom de chaque projet.

Le propriétaire a demandé le 17 septembre 2026 la suppression de `smartefico-42` et
`smartefico-ca` ; elle revient à lui, dans son navigateur. **Vérifier une suppression
sans se fier à la page d'accueil** de `*.vercel.app`, servie depuis le cache de Vercel
(`X-Vercel-Cache: HIT`) : demander une page qui n'existe pas. `X-Vercel-Error:
DEPLOYMENT_NOT_FOUND` veut dire que le projet ne sert plus rien ; `NOT_FOUND`, qu'un
déploiement répond encore. Pour savoir si un projet est encore relié au dépôt, pousser
un commit et lire ses statuts GitHub : seuls les projets reliés y apparaissent.

**Le tableau de bord Vercel ne marche pas dans le navigateur intégré** de Claude Code.
La page des réglages Git y tourne en boucle (erreurs React 418 et 419, des milliers de
requêtes), Vercel finit par répondre `429`, et les confirmations envoyées se perdent.
Le réglage des domaines, lui, y est passé. Pour le reste, le propriétaire opère dans
son navigateur habituel.

Ce n'est pas un problème de contenu dupliqué tant que la balise canonique de chaque
page désigne `smartefico.com` — c'est le cas, y compris sur les versions servies par
`vercel.app` et par Pages, qui renvoient donc le référencement vers le domaine. Si vous
coupez GitHub Pages un jour, rien d'autre n'est à changer ; si vous changez d'adresse
canonique, voir la liste complète dans Architecture.

Conséquence à garder en tête : **tout ce qui est poussé sur `main` est visible de
tous**, code compris. Rien de secret ne doit entrer dans le dépôt.

`index-autonome.html` est exclu du dépôt : servi en ligne, il ferait doublon avec la
page d'accueil.

## Sécurité

Audit demandé par le propriétaire le 1er novembre 2026 (« vérifie mon site pour voir
s'il y a un souci de sécurité »). **Aucune faille grave.** Ce qui a été vérifié et
tenu : aucun secret dans le dépôt ni dans son historique (clé, jeton, adresse
`/exec` du journal) ; la clé Anthropic seulement côté serveur ; la bulle de
l'assistant n'écrit qu'en `textContent` et ne fait des liens que des adresses
`http(s)` ; l'écouteur `message` des pages de guide filtre l'origine `tally.so` ; le
journal neutralise les formules ; le workflow ne se déclenche que sur `push`.

**Ce risque a disparu avec l'assistant, retiré le soir même** (voir Architecture) :
le site n'a plus aucune fonction serveur. Ce qui suit est l'état constaté pendant
l'audit.

**Le seul risque réel est financier** : l'assistant peut être appelé hors du site.
Un `curl` avec `Origin: https://smartefico.com` passe la vérification d'origine —
constaté en production avec un corps invalide, arrêté en 400, donc sans appel payant.
Le débit par IP ne tient pas face à des adresses tournantes. **Le plafond de dépense
mensuel de la console Anthropic reste le seul vrai garde-fou** ; il n'a pas pu être
vérifié d'ici, c'est au propriétaire de s'assurer qu'il est posé et bas. Pour aller
plus loin : une règle de limitation de débit du pare-feu Vercel sur `/api/chat`, ou
un compteur partagé (Redis).

Trois corrections, faites le même jour à sa demande (« Oui, corrige-les ») :

- **En-têtes de sécurité** dans `vercel.json`, sur toutes les réponses :
  `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`,
  `Permissions-Policy` (caméra, micro, position) et une `Content-Security-Policy`
  **volontairement partielle** — `frame-ancestors`, `base-uri`, `object-src`,
  `form-action`, `upgrade-insecure-requests`. Elle ne restreint ni les scripts, ni les
  styles, ni les cadres, ni les connexions : tout le site est en `<script>` et
  `<style>` en ligne, et Tally, YouTube et Google Fonts chargent leurs propres
  ressources. Une liste blanche complète demanderait des empreintes de chaque script,
  à refaire à chaque retouche. Ne pas mettre `autoplay`, `accelerometer` ou
  `gyroscope` dans `Permissions-Policy` : le lecteur YouTube de `#chaine` les
  demande. Vérifié dans un serveur local qui applique ces en-têtes : accueil, guide,
  article à formulaire, assistant, aucune violation dans la console. **GitHub Pages
  ne lit pas `vercel.json`** : sa copie reste sans ces en-têtes.
- **`.vercelignore`** retire du site ce qui n'en fait pas partie : `CLAUDE.md`,
  `PRODUCT.md`, `README.md`, `.pages.yml`, `.github`, `scripts`, `content`… Ils
  étaient tous servis sur smartefico.com. Rien de secret — le dépôt est public —
  mais `CLAUDE.md` y décrivait les limites de l'assistant. **Ne jamais y ajouter
  `api`, `lib`, `assets` ni `package*.json`** : la fonction de l'assistant en a
  besoin. GitHub Pages, lui, sert toujours tout. **Vérifié en production le jour
  même** : `.vercelignore` vaut bien pour les déploiements depuis Git — `CLAUDE.md`,
  `.pages.yml`, `scripts/` et `.github/` répondent 404, les pages et `assets/` 200, et
  `/api/chat` répond toujours.
- **Dépendances** : `sharp` passe de 0.33 à **0.35.5** (failles de libvips, libheif
  et librsvg), et `zod` est forcé à **4.6.6 ou plus** par `overrides` dans
  `package.json` (épuisement de mémoire) — il vient du SDK d'Anthropic et de
  `@vercel/functions`, qui ne l'utilisent pas sur les messages des visiteurs.
  `npm audit` : 0 vulnérabilité. sharp 0.35 demande Node 20.9 ou plus : le workflow
  passe à **Node 24**, Node 20 n'étant plus maintenu depuis avril 2026. Éprouvé :
  les appels de sharp des trois scripts sur des copies, `optimize-images.mjs` (rien à
  optimiser, aucun fichier touché), et `api/chat.js` contre une fausse API Messages.

**Le reste de la sécurité tient aux comptes**, pas au code : le back office est le
compte GitHub, la clé vit chez Vercel, les conversations dans Google. La double
authentification sur GitHub, Vercel, Google, Anthropic et Tally lui a été conseillée.
