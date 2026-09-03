#!/usr/bin/env node
/**
 * Génère le blog du site à partir de content/articles/*.md (édités via Pages CMS) :
 *   - blog.html          : la page d'index (liste des articles)
 *   - article-<slug>.html : une page autoportante par article
 *
 * Les pages du blog RÉUTILISENT le <style> de index.html (extrait à la volée) :
 * une seule source de vérité pour le design, et des pages autoportantes comme
 * le reste du site. Le markdown est converti en HTML avec « marked ».
 *
 * Dépendance : marked (installée par GitHub Actions ; « npm install » en local).
 * Après ce script, build-standalone.mjs n'a pas besoin de tourner : le blog est
 * indépendant de index-autonome.html.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marked } from 'marked';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dossierArticles = join(racine, 'content', 'articles');
const SITE = 'https://kouakoukomla.github.io/smartefico';

// --- utilitaires ------------------------------------------------------------
const escTexte = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cheminRelatif = (s = '') => String(s).trim().replace(/^\/+/, '');

function analyser(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const donnees = {};
  let corps = md;
  if (m) {
    corps = m[2] || '';
    for (const ligne of m[1].split(/\r?\n/)) {
      const p = ligne.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (!p) continue;
      let val = p[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      donnees[p[1]] = val;
    }
  }
  donnees.body = corps.trim();
  return donnees;
}

const versBool = (v) => v === undefined || v === true || v === 'true' || v === 'oui' || v === 'yes';

function slugDe(nomFichier) {
  return nomFichier
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
}

function dateFr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

// --- morceaux repris de index.html (une seule source de design) -------------
const index = readFileSync(join(racine, 'index.html'), 'utf8');
const styleSite = (index.match(/<style>[\s\S]*?<\/style>/) || ['<style></style>'])[0];
const favicon = (index.match(/<link rel="icon"[^>]*>/) || [''])[0];

const styleBlog = `<style>
.blog-top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-block:1.4rem}
.blog-top__brand{display:flex;align-items:center;gap:.6rem;text-decoration:none;color:var(--ink);font-weight:700}
.blog-top__brand img{width:2rem;height:2rem}
.blog-top__back{color:var(--ink-2);text-decoration:none}
.blog-top__back:hover{color:var(--yellow)}
.post-list{display:grid;gap:1rem;grid-template-columns:1fr;margin-top:.5rem}
@media(min-width:46rem){.post-list{grid-template-columns:repeat(2,1fr)}}
.post-card{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:.75rem;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .2s ease,transform .2s ease}
.post-card:hover{border-color:var(--yellow);transform:translateY(-2px)}
.post-card__cover{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:var(--noir-2)}
.post-card__body{padding:1.25rem;display:flex;flex-direction:column;gap:.5rem}
.post-card__date{color:var(--ink-3)}
.post-card h2{font-size:1.2rem;letter-spacing:-.02em}
.post-card p{color:var(--ink-2);font-size:.95rem}
.article{max-width:44rem;padding-block:clamp(1.5rem,4vw,2.5rem)}
.article__back{display:inline-block;color:var(--ink-2);text-decoration:none;margin-bottom:1.5rem}
.article__back:hover{color:var(--yellow)}
.article__meta{color:var(--ink-3);margin:0 0 .6rem}
.article__title{font-size:clamp(1.8rem,4vw,2.8rem);line-height:1.1;letter-spacing:-.02em;margin:0 0 1.3rem}
.article__cover{width:100%;border-radius:.9rem;border:1px solid var(--line);margin-bottom:1.6rem}
.article__body{color:var(--ink);font-size:1.08rem;line-height:1.7}
.article__body h2{font-size:1.5rem;margin:2rem 0 .6rem;letter-spacing:-.02em}
.article__body h3{font-size:1.2rem;margin:1.6rem 0 .5rem}
.article__body p{margin:0 0 1.1rem;color:var(--ink-2)}
.article__body ul,.article__body ol{color:var(--ink-2);margin:0 0 1.1rem;padding-left:1.3rem;display:flex;flex-direction:column;gap:.4rem}
.article__body a{color:var(--ink);text-decoration:underline;text-underline-offset:3px}
.article__body a:hover{color:var(--yellow)}
.article__body blockquote{border-left:3px solid var(--yellow);margin:1.4rem 0;padding:.3rem 0 .3rem 1.1rem;color:var(--ink-2);font-style:italic}
.article__body img{max-width:100%;height:auto;border-radius:.6rem;margin:1.2rem 0}
.article__body code{background:var(--noir-2);padding:.15em .4em;border-radius:4px;font-size:.9em}
.blog-foot{border-top:1px solid var(--line);margin-top:3rem;padding-block:2rem;display:flex;justify-content:space-between;gap:1rem;color:var(--ink-2)}
.blog-foot a{color:var(--ink-2);text-decoration:none}
.blog-foot a:hover{color:var(--yellow)}
</style>`;

function tete({ titre, description, url, image }) {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escTexte(titre)}</title>
<meta name="description" content="${escAttr(description)}">
<meta name="author" content="Emmanuel Kouakou">
<link rel="canonical" href="${escAttr(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="SmartEfico">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${escAttr(url)}">
<meta property="og:title" content="${escAttr(titre)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:image" content="${escAttr(image)}">
<meta name="twitter:card" content="summary_large_image">
${favicon}
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&amp;display=swap">
${styleSite}
${styleBlog}
</head>`;
}

const entete = `  <header class="blog-top wrap">
    <a class="blog-top__brand" href="index.html">
      <img src="assets/logo-clair.png" alt="SmartEfico" width="512" height="512">
      <span class="mono">SmartEfico</span>
    </a>
    <a class="blog-top__back mono" href="index.html">Retour au site ↗</a>
  </header>`;

const pied = `  <footer class="wrap blog-foot">
    <span class="mono">© ${new Date().getFullYear()} SmartEfico</span>
    <a class="mono" href="index.html">Accueil</a>
  </footer>`;

// --- lecture des articles ---------------------------------------------------
let articles = [];
if (existsSync(dossierArticles)) {
  articles = readdirSync(dossierArticles)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const a = analyser(readFileSync(join(dossierArticles, f), 'utf8'));
      a.slug = slugDe(f);
      a.page = `article-${a.slug}.html`;
      return a;
    })
    .filter((a) => versBool(a.published))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// --- génération des pages d'article -----------------------------------------
const pagesGenerees = new Set();
for (const a of articles) {
  const titre = a.title || 'Article';
  const description = a.excerpt || '';
  const url = `${SITE}/${a.page}`;
  const cover = a.cover ? cheminRelatif(a.cover) : '';
  const image = cover ? `${SITE}/${cover}` : `${SITE}/assets/og-cover.jpg`;
  const corpsHtml = marked.parse(a.body || '');

  const html = `<!doctype html>
<html lang="fr">
${tete({ titre, description, url, image })}
<body>
${entete}
  <main class="wrap article">
    <a class="article__back mono" href="blog.html">← Tous les articles</a>
    <p class="article__meta mono">${escTexte(dateFr(a.date))}</p>
    <h1 class="article__title">${escTexte(titre)}</h1>
${cover ? `    <img class="article__cover" src="${escAttr(cover)}" alt="${escAttr(titre)}">\n` : ''}    <div class="article__body">
${corpsHtml}
    </div>
    <p style="margin-top:2.5rem"><a class="btn btn--line" href="index.html#appel">Me contacter</a></p>
  </main>
${pied}
</body>
</html>
`;
  writeFileSync(join(racine, a.page), html, 'utf8');
  pagesGenerees.add(a.page);
}

// --- génération de blog.html (l'index) --------------------------------------
let cartes;
if (articles.length === 0) {
  cartes = `      <p class="lead" style="text-align:center;margin-inline:auto">Les premiers articles arrivent bientôt.</p>`;
} else {
  cartes = articles
    .map((a) => {
      const cover = a.cover ? cheminRelatif(a.cover) : '';
      return `        <a class="post-card" href="${escAttr(a.page)}">
${cover ? `          <img class="post-card__cover" src="${escAttr(cover)}" alt="" loading="lazy">\n` : ''}          <div class="post-card__body">
            <span class="post-card__date mono">${escTexte(dateFr(a.date))}</span>
            <h2>${escTexte(a.title || 'Article')}</h2>
            <p>${escTexte(a.excerpt || '')}</p>
          </div>
        </a>`;
    })
    .join('\n');
}

const blog = `<!doctype html>
<html lang="fr">
${tete({
  titre: 'Blog — SmartEfico',
  description: "Articles et idées sur l'acquisition, l'IA et l'automatisation, par Emmanuel Kouakou (SmartEfico).",
  url: `${SITE}/blog.html`,
  image: `${SITE}/assets/og-cover.jpg`,
})}
<body>
${entete}
  <main class="wrap">
    <div class="head head--centre">
      <span class="head__eyebrow mono">Blog</span>
      <h1 class="display">Articles &amp; <em>idées</em>.</h1>
      <p class="lead">Ce que j'apprends en installant des systèmes d'acquisition et d'automatisation par l'IA.</p>
    </div>
    <div class="post-list">
${cartes}
    </div>
  </main>
${pied}
</body>
</html>
`;
writeFileSync(join(racine, 'blog.html'), blog, 'utf8');
pagesGenerees.add('blog.html');

// --- nettoyage des pages d'articles supprimées ------------------------------
let supprimees = 0;
for (const f of readdirSync(racine)) {
  if (/^article-.*\.html$/.test(f) && !pagesGenerees.has(f)) {
    unlinkSync(join(racine, f));
    supprimees++;
  }
}

console.log(
  `Blog : ${articles.length} article(s) généré(s), ${supprimees} page(s) obsolète(s) supprimée(s). blog.html mis à jour.`
);
