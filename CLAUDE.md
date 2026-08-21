# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Site vitrine de SmartEfico (agence d'acquisition et d'automatisation IA), en français.
Trois pages HTML statiques, sans framework, sans étape de compilation. Le contenu de
`index.html` est directement ce qui est servi.

## Commandes

```bash
node scripts/sync-legal.mjs        # après toute modification de cgv.html ou cgc.html
node scripts/build-standalone.mjs  # régénère index-autonome.html
npx --yes serve .                  # aperçu local sur http://localhost:3000
```

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
`https://kouakoukomla.github.io/smartefico`. Tout changement doit couvrir les trois
fichiers d'un coup, sinon les aperçus de partage LinkedIn pointent à côté.

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
dans la page. Jaune `#FFCC00`, blanc. Polices : Bricolage Grotesque (titres),
Schibsted Grotesk (texte), DM Mono (étiquettes).

Instrument Sans a été retirée parce qu'impeccable la signale comme sur-utilisée par les
interfaces générées. Ne pas y revenir, ni vers Inter, Roboto, Fraunces, Geist,
Plus Jakarta Sans ou Space Grotesk.

**Signalements d'impeccable à ne pas « corriger »**, vérifiés un par un dans le
navigateur :

- `cramped-padding` (~67) — le détecteur mesure le padding du conteneur, alors que ce
  sont les enfants qui le portent (38 px dans les cartes, 64 px dans le bloc contact).
  Ajouter du padding doublerait les marges.
- `flat-type-hierarchy` sur les pages légales — le détecteur ne sait pas lire `clamp()`
  et ne voit donc jamais les `h1` et `h2`. L'échelle réelle compte trois paliers nets.
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

## Déploiement

Dépôt `kouakoukomla/smartefico`, branche `main`, cible GitHub Pages depuis la racine.
Le dépôt est privé à ce jour, ce qui empêche Pages de publier sur un compte gratuit.
`index-autonome.html` est exclu du dépôt : servi par Pages, il ferait doublon avec la
page d'accueil.
