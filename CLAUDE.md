# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Site vitrine de SmartEfico (agence d'acquisition et d'automatisation IA), en français.
Trois pages HTML statiques, sans framework, sans étape de compilation. Le contenu de
`index.html` est directement ce qui est servi. Une seule pièce tourne côté serveur :
la fonction Vercel `api/chat.js`, qui fait parler l'assistant de discussion (voir
Architecture).

## Commandes

```bash
node scripts/sync-legal.mjs        # après toute modification de cgv.html ou cgc.html
node scripts/build-standalone.mjs  # régénère index-autonome.html
node scripts/build-guide.mjs guide     # après toute modification de scripts/guide/guide.html
node scripts/build-guide.mjs guide-ia  # après toute modification de scripts/guide/guide-ia.html
node scripts/build-assistant.mjs   # après toute modification de index.html, guide.html ou guide-ia.html
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

- L'image est désormais **`assets/og-smartefico-plat.jpg`** (1200 x 630, 96 Ko),
  sur le noir plat du site : le titre d'accueil entier, ses deux moitiés à égalité et
  ses mots accentués en Instrument Serif jaune ; le nom **SMARTEFICO** en jaune et le
  logo sans plaque ; le portrait **noir et blanc** de la signature à droite ; et, repris de l'ancienne image, « PME, ETI, grands comptes
  et dirigeants. » et le numéro, sur une pastille jaune. Sa source est
  `scripts/partage/partage.html`, photographiée par `node scripts/build-partage.mjs`
  (Chrome sans fenêtre, puis `sharp` en JPEG) ; le nom du fichier écrit est la
  constante `FICHIER` du script.
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
  balises de `guide.html` et `guide-ia.html`, et dans `build-blog.mjs` (image par
  défaut du blog et des articles sans couverture).
- Titre de l'aperçu (et de l'onglet) : « SmartEfico — Leads qualifiés et IA générative
  au service de votre performance ». Description : « Des rendez-vous qualifiés pour
  vos offres, et l'IA générative au service de votre performance : publicités
  pilotées, agents IA, formation et accompagnement de vos équipes. » La
  `meta description` pour les moteurs de recherche, qui parlait déjà des deux, n'a pas
  bougé.
- **Changer le nom du fichier à chaque refonte** : les réseaux gardent en mémoire
  l'image d'une adresse donnée. `og-cover.jpg`, `og-smartefico.jpg`,
  `og-smartefico-noir.jpg`, `og-smartefico-jaune.jpg`, `og-smartefico-nb.jpg`,
  `og-smartefico-blanc.jpg` et `og-smartefico-blanc-2.jpg` restent dans le dépôt,
  inutilisées — des partages anciens y pointent peut-être. **Cinq noms ont été brûlés
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

**« Ce qu'on vous apporte » (`#apport`) résume le titre d'accueil**, depuis le
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
réutilisent le composant `.pilier` de `#ia`. Le lien « Expertises » du menu y mène
toujours, et reste le premier : l'ordre du menu suit encore celui de la page.

Le même jour, « Ce à quoi vous engager » (`#chiffres`) et « Ne nous croyez pas sur
parole, observez » (`#preuves`) l'ont suivie, ensemble et toujours avant « Agents IA »,
à la demande du propriétaire. La seconde a été supprimée le 21 septembre 2026, elle
aussi à sa demande (voir « Plus de captures de preuves » dans Design). Puis, toujours
le même jour et à sa demande, « Agents IA » (`#agents`) est passé après « Ce qu'on
installe » (`#resultats`), puis après le bandeau des cinq étapes ; et « Avant, après »
(`#avant-apres`), qui suivait ce bandeau, est remonté juste avant « Ce qu'on
installe ». L'accueil enchaîne donc : hero, marques, `#apport`, `#chiffres`,
`#avant-apres`, `#resultats`, le bandeau des cinq étapes (`#methode`), `#ia`,
`#agents` (placés l'un contre l'autre le même jour, l'IA générative d'abord), « Trois
raisons » (`#pourquoi`), puis « Avec qui l'agence travaille » (`#public`), passée
après « Trois raisons » le même jour, toujours à sa demande. La première pile s'arrête
avant le bandeau, la seconde s'ouvre sur l'IA générative. Le menu suit l'ordre de la
page : « Avant/Après » y est passé devant « Services », sans rien changer à sa
largeur. Aucun texte visible ne dépend de cet ordre — « Les quatre scénarios plus
haut », dans « Trois raisons », désigne les agents, qui restent au-dessus.

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

**La section « Ma chaîne, en clair » ne montre plus que la vidéo de la chaîne**,
depuis le 18 septembre 2026. Elle s'appelait « Blog et évènements à venir » ; le
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

**Un assistant de discussion répond aux visiteurs**, demandé par le propriétaire le
18 septembre 2026 : une pastille jaune « Une question ? » en bas à droite de
`index.html` ouvre un panneau branché sur Claude. Il répond sur SmartEfico, cerne la
situation du visiteur et l'oriente vers `81VkKx` ou vers celui des deux guides qui
répond à son besoin (`guide.html` ou `guide-ia.html`, avec `?utm_source=assistant`).
Choisi parmi trois options — assistant IA sur
mesure, assistant guidé sans IA, outil tout fait — pour montrer sur son propre site ce
que l'agence vend : des agents IA qui qualifient.

- **Quatre fichiers.** `api/chat.js`, la fonction serveur ; `lib/contexte-assistant.js`,
  le texte du site qu'elle donne à Claude, **généré** par `scripts/build-assistant.mjs`
  à partir du `<main>` de `index.html`, `guide.html` et `guide-ia.html` et de la
  liste des articles ; la pastille elle-même, entre les repères `ASSISTANT:START/END` de
  `index.html`, avec son style et son script dans la page comme tout le reste ; et
  `vercel.json`, qui donne 60 s à la fonction. GitHub Actions régénère le contexte
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
  une attaque. **Le vrai garde-fou est la limite de dépense mensuelle posée dans la
  console d'Anthropic**, et une clé réservée au site, révocable seule.
- **Coût estimé** : environ 5 000 tokens de préfixe, relus au dixième du prix à partir
  de la deuxième question, soit de l'ordre de 5 à 10 centimes pour une conversation
  de cinq questions. Chaque réponse laisse une ligne JSON dans les journaux de Vercel
  (`assistant: "reponse"`, tokens lus en cache, écrits, produits) sans rien du contenu
  échangé : `cache_lu` doit dépasser zéro dès la deuxième question, sinon le cache ne
  sert pas.
- **Rien n'est conservé par le site.** La page tient l'historique en mémoire et le
  renvoie entier à chaque question ; il disparaît avec l'onglet. Pas de cookie, rien
  ne part avant que le visiteur écrive, et la mention sous le champ dit que les
  réponses viennent d'une IA et qu'il ne faut pas y écrire de données sensibles.
  L'article 10 des CGC (« Sous-traitance IA ») le cite depuis le 18 septembre 2026 :
  une ligne proposée puis validée par le propriétaire, ajoutée à sa liste d'outils —
  « l'assistant de discussion du site, qui transmet les questions des visiteurs à
  Claude (Anthropic) pour en générer les réponses ; SmartEfico n'en conserve aucune
  copie ».
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
  posée.

**Aucune mesure d'audience, par choix.** Le 18 septembre 2026, le propriétaire a
demandé un tableau de bord des visites ; le site n'en mesurait aucune, et n'en mesure
toujours aucune. Entre Vercel Web Analytics (sans cookie), Google Analytics 4 et
Plausible, il a choisi Google Analytics, puis y a renoncé le même jour : « fais sans le
Google Analytics ». Ne pas installer de mesure sans sa demande. S'il y revient :
Google Analytics impose en France un bandeau de consentement, que le site n'a pas ;
Vercel Web Analytics s'en passe. Les chiffres disponibles sans rien installer : l'onglet
Observability du projet Vercel (volume de requêtes), les onglets Submissions et
Insights de chaque formulaire Tally, YouTube Studio, et les journaux de l'assistant
(tokens seulement, jamais le contenu).

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
formulaire oblige à retoucher cet article, avec son accord.

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
ajouter un, la méthode est celle décrite ci-dessus.

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
  `utm_source=site&utm_medium=section-ia` comme le bouton « Nous contacter » voisin :
  Tally range ces inscriptions à part. C'est le seul lien du site vers cette page ; le
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

**Le titre en est à sa cinquième écriture** : « Marques avec lesquelles j'ai
travaillé », puis « travaillées » — forme fautive après « avec lesquelles » —, puis
« Elles m'ont fait confiance. », puis, le 23 septembre 2026, « +10 CEOs & Entreprises
nous font confiance. », et **« CEOs & Entreprises nous font confiance. »** quelques
heures plus tard, le propriétaire ayant demandé de retirer le « +10 ». Le point final
est de Claude, pour que le titre s'aligne sur tous les autres de la page, qui en
portent un ; il n'a pas été discuté. Le mot en italique reste « confiance ».

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

**La photo de la signature ne bouge pas**, décision du propriétaire du 18 septembre
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
zone FAQ : c'est là qu'il faudrait le remettre, jamais dans `index.html`.

**Pas plus de vide qu'il n'en faut**, demande du propriétaire du 19 septembre 2026 :
« supprime les endroits où il y a trop d'espace ». Entre deux sections, la page
laisse environ 77 px à 1 440 px de large (`--gap` de la pile, plus l'interlignage).
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

La page d'accueil y perd de 270 à 430 px selon la largeur, et « Elles m'ont fait
confiance » entre dans le premier écran d'un ordinateur. Effet de bord réglé : sur
téléphone (35 rem et moins), où les boutons du hero prennent toute la largeur, ses
deux crochets d'angle jaunes sont masqués — celui du bas tombait sur le bouton du
téléphone. Pour remesurer : capturer la page entière, puis chercher les bandes
horizontales où aucun pixel ne dépasse `#1E1E1E` ; les cartes `#0E0E0E` passent pour
du vide, à retrancher à la main. Sur fond clair la méthode se renverse — les bandes
sans un pixel plus sombre que `#E0E0E0`, cartes à retrancher de même.

**Le jaune ne marque plus que deux choses**, depuis le 23 septembre 2026 au soir :
« Réduis le jaune sur le site ». C'est, dans l'esprit, la demande du 20 septembre,
qu'il avait défaite le 21 avant de la refaire ici. Les deux rôles qui restent :

- **ce qui se clique** : « Réserver un échange », « Recevoir », « Nous contacter »,
  « Réserver mon appel », « Lire le blog », le carré à la flèche du menu, le lien
  d'évitement et la pastille de l'assistant ;
- **les deux mots accentués du titre d'accueil** — `h1.display em` et non
  `.display em` : les titres de section sont des `h2` et passent au blanc. Les pages
  de guide et le blog gardent le jaune sur le leur, ce sont leurs `h1`.

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

- `cramped-padding` (~67) — le détecteur mesure le padding du conteneur, alors que ce
  sont les enfants qui le portent (38 px dans les cartes, 64 px dans le bloc contact).
  Ajouter du padding doublerait les marges.
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
- `tight-leading` — vise des titres à 1,15, où un interlignage serré est correct. Un
  troisième est mesuré à « 1,30 » sous une règle « il faut ≥ 1,30 ».

## Environnement Windows

- Node n'est pas dans le `PATH` de l'outil Bash. Préfixer :
  `export PATH="$PATH:/c/Program Files/nodejs"`.
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
