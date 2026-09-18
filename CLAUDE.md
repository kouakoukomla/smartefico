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
node scripts/build-guide.mjs       # après toute modification de scripts/guide/guide.html
node scripts/build-assistant.mjs   # après toute modification de index.html ou guide.html
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
balises Open Graph et Twitter, et données structurées JSON-LD. Elle vaut
**`https://smartefico.com`**, sans `www`, depuis le 17 septembre 2026 (avant :
`https://smartefico-z7.vercel.app`). Choix du propriétaire : Vercel sert
`smartefico.com` et redirige `www.smartefico.com` vers lui, chaîne de requête comprise.
Vercel avait d'abord été réglé à l'inverse ; le site a brièvement désigné `www`, puis
est revenu à l'adresse sans `www` le même jour. Les balises doivent toujours désigner
l'adresse finale, celle qui ne redirige pas. Un changement d'adresse doit tout couvrir
d'un coup, sinon les aperçus de partage LinkedIn pointent à côté :

- les pages : `index.html`, `cgv.html`, `cgc.html`, `guide.html`, `guide-merci.html` ;
- les constantes `SITE` de `sync-content.mjs` et `build-blog.mjs`, puis régénérer le
  blog ;
- `scripts/guide/guide.html`, puis `node scripts/build-guide.mjs` : le PDF porte
  l'adresse en clair et en lien ;
- hors du dépôt, dans Tally : la redirection de fin et le lien vers les CGC du
  formulaire `0Q47ZN`, et le lien vers le guide du formulaire `81VkKx`.

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
situation du visiteur et l'oriente vers `81VkKx` ou vers le guide
(`guide.html?utm_source=assistant`). Choisi parmi trois options — assistant IA sur
mesure, assistant guidé sans IA, outil tout fait — pour montrer sur son propre site ce
que l'agence vend : des agents IA qui qualifient.

- **Quatre fichiers.** `api/chat.js`, la fonction serveur ; `lib/contexte-assistant.js`,
  le texte du site qu'elle donne à Claude, **généré** par `scripts/build-assistant.mjs`
  à partir du `<main>` de `index.html` et de `guide.html` et de la liste des
  articles ; la pastille elle-même, entre les repères `ASSISTANT:START/END` de
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
À tenir vrai : installer un jour une mesure d'audience ou un pixel publicitaire
obligerait à réécrire cet article, avec son accord.

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

**Le menu est désormais plein à 70 rem.** À 1 120 px, le seuil où il s'affiche en
ligne, il reste 41 px entre la marque et les liens et 63 px avant « Contact », mesurés
sous Windows, où la graisse 800 tombe sur Arial Black, la plus large des polices de la
pile. Ces deux marges valaient 28 px et 36 px jusqu'au 18 septembre 2026, quand le
propriétaire a renommé « Actualités » en « Chaîne » — la section ne montre plus que sa
vidéo. Le mot plus court rend une quarantaine de pixels, pas de quoi ajouter un
huitième lien : celui-là ne tiendrait toujours pas sans relever le seuil.

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

**La photo de la signature se dévoile quand elle entre à l'écran**, demande du
propriétaire du 18 septembre 2026 : « que le personnage en bas commence à croiser les
bras et à sourire quand on arrive sur la page ». Une photographie ne bouge pas — il est
déjà bras croisés et souriant sur `Portrait3.jpg`. C'est le dévoilement qui fait le
geste : une bande qui descend, le visage d'abord, les épaules, puis les bras croisés,
avec un léger recul (1,06 → 1) et l'anneau jaune qui se pose avec elle, en 1,1 s et une
seule fois. Le `clip-path` rogne aussi l'ombre portée, donc l'anneau suit la bande sans
qu'on ait à l'animer à part. Pour un vrai mouvement — le personnage qui croise les bras
à l'écran — il faudrait une vidéo, à produire hors du dépôt et à poser dans le même
cadre rond.

Deux pièges, tous deux vérifiés dans le navigateur :

- **Un `clip-path` posé sur la cible ramène son taux de visibilité à zéro** pour
  `IntersectionObserver` dans Chrome — `intersectionRatio: 0` alors que
  `isIntersecting` vaut `true`. Un `threshold` de 0,35 n'est donc jamais franchi,
  aucun appel ne vient, et la photo reste cachée pour de bon. C'est ce qui s'est passé
  au premier essai. La marge négative (`rootMargin: '0px 0px -12% 0px'`) joue le rôle
  du seuil ; ne pas remettre de `threshold`.
- **L'état de départ n'est posé que par le script.** Sans JavaScript, sans
  `IntersectionObserver` ou sous `prefers-reduced-motion`, la photo est simplement là,
  entière, anneau compris : aucun portrait ne peut rester caché par accident.

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
- `pulsing-dot` sur `.assistant__msg--attente span` — les trois points ne vivent que
  pendant qu'une réponse de l'assistant se prépare, et disparaissent au premier
  morceau reçu : c'est un état réel et passager, pas une animation de décor. Consigné
  dans `.impeccable/config.json`. Les deux autres signalements levés par la pastille
  ont été corrigés : la mention passée de 11,5 à 12,8 px, et l'ombre du panneau
  retirée — sur le noir pur de la page, la bordure suffit.
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
