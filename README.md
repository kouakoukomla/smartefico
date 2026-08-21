# Site SmartEfico

Site vitrine de SmartEfico — génération de leads qualifiés et IA générative.
Trois pages en HTML/CSS statique, sans framework, sans dépendance à installer.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | La page principale |
| `cgv.html` | Conditions générales de vente |
| `cgc.html` | Conditions générales de confidentialité |
| `assets/` | Logo, photo, image de partage, captures des agents IA |

Les trois pages se lient entre elles et pointent toutes vers `assets/`.
**Il faut donc les déployer ensemble**, sinon les liens et les images tombent en 404.

## Adresse du site

Le site est configuré pour **https://kouakoukomla.github.io/smartefico**.

Cette adresse figure dans `index.html` (balise canonique, balises de partage,
données structurées) et en haut de `cgv.html` et `cgc.html`. Le jour où vous prenez
un vrai nom de domaine, un chercher-remplacer sur les trois fichiers suffit —
sans quoi l'aperçu au partage LinkedIn continuera de pointer vers l'ancienne adresse.

## Déployer avec GitHub Pages

1. Onglet **Settings** du dépôt → **Pages**
2. *Source* : **Deploy from a branch**
3. *Branch* : `main`, dossier `/ (root)` → **Save**

La page est en ligne une à deux minutes plus tard, à l'adresse
`https://<votre-compte>.github.io/<nom-du-depot>/`.

Pour brancher un nom de domaine : *Settings → Pages → Custom domain*.

> GitHub Pages ne publie que les dépôts **publics** sur les comptes gratuits.

## Déployer avec Netlify

Alternative sans ligne de commande : sur [app.netlify.com](https://app.netlify.com),
*Add new site → Import an existing project*, puis choisir ce dépôt. Chaque `git push`
redéploie le site automatiquement. Netlify accepte les dépôts privés.

## Les documents légaux

Les CGV et les CGC existent à deux endroits :

- **`cgv.html` et `cgc.html`** — les pages complètes, celles que Google indexe
- **une fenêtre dans `index.html`** — le même texte, affiché sans quitter la page

La fenêtre existe pour que le contenu reste accessible même quand `index.html`
voyage seul (fichier envoyé par mail, aperçu, page ouverte hors du site).

**Les pages restent la source unique.** Après les avoir modifiées :

```bash
node scripts/sync-legal.mjs
```

Le script recopie leur contenu dans les fenêtres. Ne modifiez jamais le texte
directement entre les repères `<!-- CGV:START -->` et `<!-- CGV:END -->` :
la prochaine synchronisation l'écraserait.

## Mettre à jour

### Le logo
Remplacer `assets/logo.png` par un autre fichier du même nom : il se met à jour dans
l'en-tête et le pied de page. L'icône d'onglet, elle, est encodée directement dans le
HTML et se change dans la balise `<link rel="icon">`.

### Le formulaire de réservation
Il pointe vers `https://tally.so/embed/81VkKx`. Pour en changer, remplacer cet
identifiant dans la section `#appel` de `index.html`, à deux endroits (le cadre intégré
et le lien de secours).

### Les images
`assets/` contient des fichiers déjà redimensionnés et compressés pour le web.
En cas de remplacement, viser 1100 px de large au maximum pour les captures.

## Bon à savoir

- Le site est en noir pur (`#000000`) pour que le fond du logo se fonde dans la page.
- Les icônes des réseaux sociaux sont des SVG écrits dans le fichier : aucun fichier
  externe à charger, donc rien qui puisse casser.
- Les polices viennent de Google Fonts (Bricolage Grotesque, Instrument Sans, DM Mono).
- Aucun script de suivi n'est installé aujourd'hui.
