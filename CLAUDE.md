# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Site vitrine de SmartEfico (agence d'acquisition et d'automatisation IA), en français.
Trois pages HTML statiques, sans framework, sans étape de compilation. Le contenu de
`index.html` est directement ce qui est servi.

## Commandes

```bash
node scripts/sync-legal.mjs        # après toute modification de cgv.html ou cgc.html
node scripts/build-standalone.mjs  # régénère index-autonome.html
node scripts/build-guide.mjs       # après toute modification de scripts/guide/guide.html
npx --yes serve .                  # aperçu local sur http://localhost:3000
```

`serve` redirige `/guide.html` vers `/guide` et perd la chaîne de requête au passage :
pour tester les paramètres `utm_…`, ouvrir directement `/guide?utm_source=…`. Vercel et
GitHub Pages ne font pas cette redirection.

Contrôle qualité du design (44 règles d'anti-patterns) :

```bash
npx --yes impeccable@latest detect index.html cgv.html cgc.html
```

Toujours passer par `npx`. Le script installé localement
(`.claude/skills/impeccable/scripts/detect.mjs`) tourne en mode dégradé — ses modules
d'analyse HTML sont absents, il retombe sur des expressions régulières et ne trouve
qu'une fraction des problèmes, en le signalant lui-même.

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
balises Open Graph et Twitter, et données structurées JSON-LD. Elle vaut aujourd'hui
`https://smartefico-z7.vercel.app`. Tout changement doit couvrir les trois fichiers
d'un coup, sinon les aperçus de partage LinkedIn pointent à côté.

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

**Une page d'atterrissage à part : `guide.html`**, demandée le 17 septembre 2026 sur le
modèle d'une page « Free download workbook ». Aucun lien du site n'y mène : elle se
partage en publicité ou sur LinkedIn. Elle offre un guide PDF contre un formulaire.

- Le formulaire est le Tally **`0Q47ZN`**, créé pour elle : prénom, nom, e-mail,
  téléphone facultatif (France par défaut), « Êtes-vous dirigeant(e) d'entreprise ? »,
  consentement obligatoire, et trois champs cachés `utm_source`, `utm_medium`,
  `utm_campaign` que la page remplit à partir de sa propre adresse. Il est intégré
  comme dans les articles (`data-tally-src`, `embed.js`, repli à 8 s), avec
  `transparentBackground=1` : le fond vient de la carte de la page.
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
  relire le guide, capturer `scripts/guide/guide.html` à 794 px de large : la mise en
  page est la même qu'à l'impression.

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

Noir pur `#000000` — et non un gris très sombre — pour que le fond du logo se fonde
dans la page. Jaune `#FFCC00`, blanc, et un violet `#9D4DFF` cantonné à un seul endroit.

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

**Plus de bandeau de mots-clés sous le hero.** La liste « Acquisition · Automatisation ·
IA · … · Conversion » (`.ticker`) a été retirée le 16 septembre 2026 à la demande du
propriétaire, avec son style. Ne pas la remettre.

**À sa place, les marques clientes défilent**, demande du même jour : sous le titre
« Elles m'ont fait confiance », un seul rang pleine largeur de grands carreaux noirs
arrondis, logos en silhouette blanche. Le titre était d'abord « Marques avec
lesquelles j'ai travaillé » ; le propriétaire a voulu « travaillées », forme fautive
après « avec lesquelles », puis a choisi cette reformulation. Un second rang, en sens
contraire, a été retiré à sa demande. Le HTML
n'écrit chaque logo qu'une fois (`.marques__piste`) ; le script les recopie jusqu'à
couvrir l'écran le plus large, en deux moitiés identiques, et masque les copies aux
lecteurs d'écran. Sans script ou sous `prefers-reduced-motion`, les deux carreaux
d'origine restent centrés, immobiles. Le survol arrête le rang. Ajouter une marque :
un `<li>` de plus. Voir PRODUCT.md pour les deux clients et leur droit d'être cités.

**Le jaune est rationné, mais il n'est plus interdit d'aplat.** Il tient quatre rôles,
et seulement ceux-là : le trait fin, l'icône, le mot en italique, et l'aplat de ce qui
se clique. Le blanc garde les puces et les étiquettes relevées, le reste est noir et
gris. Le jaune ne tient pas sur fond blanc (1,5:1) : dans une zone claire, il n'a pas
sa place.

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

**Le `.skip-link` suit la règle des aplats cliquables**, quelle qu'elle soit. Il avait
été épargné une première fois, au motif qu'il n'apparaît qu'à la navigation clavier et
doit être impossible à manquer à cet instant ; le propriétaire a tranché qu'il ferait
comme le reste. Passé au blanc avec les autres, il est repassé au jaune avec eux.
Ne pas le traiter à part.

**Polices, telles qu'elles sont réellement dans le code.** Une version précédente de
ce fichier annonçait Bricolage Grotesque, Schibsted Grotesk et DM Mono : aucune des
trois n'apparaît nulle part, ni dans `index.html`, ni dans le blog, ni dans les
articles, ni dans les pages légales.

- Titres et texte — `"Helvetica Now Text","Helvetica Neue",Helvetica,Arial,sans-serif`.
  Le display est en graisse 800, chasse `-.035em` (`-.042em` sur le `h1`),
  interlignage 1,02.
- Mots accentués — `"Instrument Serif","Times New Roman",Georgia,serif` en italique,
  dans les `<em>` des titres, en jaune. Les `<em>` du corps de texte restent en
  Helvetica, italiques et jaunes eux aussi. C'est la seule feuille Google Fonts
  chargée, et elle ne
  demande que l'italique (`family=Instrument+Serif:ital@1`) : un Instrument Serif
  droit n'existe pas sur ces pages.
- La classe `.mono` **ne porte aucune police monospace.** Elle vaut
  `font-family:inherit`, en capitales avec un fort suivi. Le nom trompe.

**Helvetica Now Text est commerciale, et rien ne la charge** — aucun `@font-face`,
aucune feuille distante. Elle ne s'affiche que chez les visiteurs qui la possèdent
déjà. Les autres descendent la pile : Helvetica Neue sur Apple, Arial sur Windows,
et sur Android, où aucune Helvetica n'existe, le `sans-serif` générique — c'est-à-dire
Roboto, que la liste ci-dessous proscrit. En pratique, presque personne ne voit la
police annoncée.

Instrument **Sans** a été retirée parce qu'impeccable la signale comme sur-utilisée
par les interfaces générées. À ne pas confondre avec Instrument **Serif** ci-dessus,
qui reste en place. Ne pas revenir vers Instrument Sans, ni vers Inter, Roboto,
Fraunces, Geist, Plus Jakarta Sans ou Space Grotesk.

**Signalements d'impeccable à ne pas « corriger »**, vérifiés un par un dans le
navigateur :

- `cramped-padding` (~67) — le détecteur mesure le padding du conteneur, alors que ce
  sont les enfants qui le portent (38 px dans les cartes, 64 px dans le bloc contact).
  Ajouter du padding doublerait les marges.
- `flat-type-hierarchy` sur les pages légales — le détecteur ne sait pas lire `clamp()`
  et ne voit donc jamais les `h1` et `h2`. L'échelle réelle compte trois paliers nets.
- `marquee` sur `.marques--defile .marques__piste` — la boucle horizontale est la
  demande explicite du propriétaire du 16 septembre 2026. Mouvement réduit et survol
  l'arrêtent déjà.
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

- `https://smartefico-z7.vercel.app/` — Vercel, l'adresse canonique depuis le
  12 septembre 2026.
- `https://kouakoukomla.github.io/smartefico/` — GitHub Pages, toujours actif.

Vérifié le 12 septembre 2026 : les deux répondent `200` et servent le même commit.
Ce n'est pas un problème de contenu dupliqué tant que la balise canonique de chaque
page désigne Vercel — c'est le cas, y compris sur la version servie par Pages, qui
renvoie donc le référencement vers Vercel. Si vous coupez GitHub Pages un jour, rien
d'autre n'est à changer ; si vous changez d'adresse canonique, il faut reprendre les
trois emplacements de chaque page (voir Architecture).

Conséquence à garder en tête : **tout ce qui est poussé sur `main` est visible de
tous**, code compris. Rien de secret ne doit entrer dans le dépôt.

`index-autonome.html` est exclu du dépôt : servi en ligne, il ferait doublon avec la
page d'accueil.
