#!/usr/bin/env node
/**
 * Écrit lib/contexte-assistant.js : le texte du site que l'assistant de
 * discussion (api/chat.js) reçoit en contexte.
 *
 * L'assistant ne sait de SmartEfico que ce que ce fichier lui dit. On le tire
 * donc du site lui-même plutôt que de le rédiger à part : une offre, une
 * question de la FAQ ou un article changent, l'assistant suit dès la
 * régénération suivante. GitHub Actions le relance après chaque enregistrement
 * du back office ; après une modification de index.html à la main, le relancer
 * soi-même.
 *
 * Quatre sources :
 *   - le <main> de index.html, sans les deux textes légaux ni la bulle de
 *     l'assistant elle-même ;
 *   - le <main> de guide.html et celui de guide-ia.html, pour décrire les deux
 *     guides gratuits ;
 *   - la liste des articles publiés, titre et adresse.
 *
 * Aucune dépendance. Écrit en LF, comme tous les scripts du dépôt.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://smartefico.com';

const ENTITES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’',
  lsquo: '‘', rdquo: '”', ldquo: '“', laquo: '«', raquo: '»', hellip: '…',
  mdash: '—', ndash: '–', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
};

function decoder(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X'
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : tout;
    }
    return ENTITES[code.toLowerCase()] ?? tout;
  });
}

/** Retire une zone entre deux repères de commentaire, repères compris. */
function sansZone(html, marque) {
  return html.replace(
    new RegExp(`<!-- ${marque}:START -->[\\s\\S]*?<!-- ${marque}:END -->`, 'g'),
    ''
  );
}

/** Le texte lisible d'un fragment HTML, paragraphes séparés par une ligne. */
function texte(html) {
  let t = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|svg|template|noscript|dialog|iframe)\b[\s\S]*?<\/\1>/gi, '')
    // Les retours à la ligne du code source ne sont que de la mise en page :
    // ce sont les balises de bloc, plus bas, qui font les paragraphes.
    .replace(/\s+/g, ' ')
    // Les images ne comptent que par leur texte de remplacement : c'est là
    // que vivent, par exemple, les noms des deux clients du rang de logos.
    .replace(/<img\b[^>]*\balt="([^"]+)"[^>]*>/gi, ' $1 ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(p|h[1-6]|li|div|section|article|summary|details|ul|ol|header|footer|nav|figure|blockquote|aside|form|label)>/gi, '\n')
    // Une balise de texte (italique, lien…) colle à ses voisins : la remplacer
    // par une espace donnerait « l' IA » ou « confiance . ».
    .replace(/<\/?(em|strong|b|i|span|a|data|abbr|small|sup|sub|mark|time)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  t = decoder(t)
    .split('\n')
    .map((ligne) => ligne.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t;
}

function main(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : html;
}

// --- 1. la page d'accueil ------------------------------------------------------
let accueil = readFileSync(join(racine, 'index.html'), 'utf8');
for (const zone of ['CGV', 'CGC', 'ASSISTANT']) accueil = sansZone(accueil, zone);
const texteAccueil = texte(main(accueil));

// --- 2. les pages des deux guides gratuits ----------------------------------------
const texteGuide = texte(main(readFileSync(join(racine, 'guide.html'), 'utf8')));
const texteGuideIA = texte(main(readFileSync(join(racine, 'guide-ia.html'), 'utf8')));

// --- 3. les articles publiés -----------------------------------------------------
// Même lecture de l'en-tête que build-blog.mjs, réduite à ce qu'il faut ici :
// le titre (éventuellement replié sur plusieurs lignes), la date, et le
// drapeau de publication.
function entete(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const d = {};
  if (!m) return d;
  let cle = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    const p = ligne.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (p) { cle = p[1]; d[cle] = p[2].trim(); }
    else if (cle && /^\s+\S/.test(ligne)) d[cle] = `${d[cle]} ${ligne.trim()}`.trim();
    else cle = null;
  }
  for (const k of Object.keys(d)) {
    const v = d[k];
    if (v.length > 1 && /^(["']).*\1$/.test(v)) d[k] = v.slice(1, -1).replace(/''/g, "'");
  }
  return d;
}

function listerMd(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listerMd(join(dossier, e.name))
      : e.name.endsWith('.md') ? [join(dossier, e.name)] : []
  );
}

const slug = (f) => basename(f).replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'article';

const articles = listerMd(join(racine, 'content', 'articles'))
  .map((f) => ({ f, d: entete(readFileSync(f, 'utf8')) }))
  .filter(({ d }) => !['false', 'non', 'no'].includes(String(d.published).toLowerCase()))
  .sort((a, b) => String(b.d.date || '').localeCompare(String(a.d.date || '')))
  .map(({ f, d }) => `- ${d.title || 'Article'} (${d.date || 'sans date'}) : ${SITE}/article-${slug(f)}.html`);

// --- assemblage ------------------------------------------------------------------
const contexte = [
  '=== Page d\'accueil de smartefico.com ===',
  texteAccueil,
  '',
  '=== Page du guide gratuit « Les 5 étapes » (smartefico.com/guide.html) ===',
  texteGuide,
  '',
  '=== Page du guide gratuit « L\'IA générative » (smartefico.com/guide-ia.html) ===',
  texteGuideIA,
  '',
  '=== Articles du blog (smartefico.com/blog.html) ===',
  articles.length ? articles.join('\n') : 'Aucun article publié.',
].join('\n');

const sortie = `// Fichier généré par scripts/build-assistant.mjs à partir de index.html,
// guide.html, guide-ia.html et content/articles/. NE PAS éditer à la main : relancer le script.
// Ce texte est le contexte que l'assistant de discussion (api/chat.js) reçoit.
export const CONTEXTE_SITE = ${JSON.stringify(contexte)};
`;

mkdirSync(join(racine, 'lib'), { recursive: true });
writeFileSync(join(racine, 'lib', 'contexte-assistant.js'), sortie, 'utf8');
console.log(
  `Assistant : contexte écrit dans lib/contexte-assistant.js — ` +
    `${contexte.length} caractères, ${articles.length} article(s).`
);
