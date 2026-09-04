#!/usr/bin/env node
/**
 * Régénère les zones « pilotées par le back office » de index.html à partir des
 * fichiers de content/ (édités via Pages CMS) :
 *   - HERO_TITLE / HERO_SUB : accroche et sous-titre du hero (content/pages/accueil.md)
 *   - FAQ                    : questions fréquentes (content/faq/*.md)
 *   - MASTERCLASS            : évènements (content/masterclasses/*.md)
 *
 * Même principe que sync-legal.mjs : chaque zone est réécrite entre ses repères
 *   <!-- ZONE:START --> … <!-- ZONE:END -->
 * Ne rien écrire à la main entre ces repères : ce script l'écrase.
 * Aucune dépendance externe.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- utilitaires ------------------------------------------------------------
const escTexte = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cheminRelatif = (s = '') => String(s).trim().replace(/^\/+/, '');
// URL d'image sûre : encode les espaces (%20) tout en gardant les « / ».
const urlImage = (s = '') => encodeURI(cheminRelatif(s));
const versBool = (v) => v === undefined || v === true || v === 'true' || v === 'oui' || v === 'yes';

/** En-tête YAML minimal (clé: valeur) + corps. */
/**
 * Lit l'en-tête entre les deux --- d'un fichier de contenu.
 *
 * Le back office replie les valeurs longues sur plusieurs lignes indentées :
 *     title: Un titre qui depasse la largeur
 *       et se poursuit ici
 * Ces lignes de continuation sont recollées à la valeur précédente. Sans ce
 * recollage, un titre ou une accroche arrive tronqué sur le site — dans la
 * page, dans la balise <title> et dans les aperçus de partage — sans qu'aucun
 * message ne le signale.
 */
function analyser(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const donnees = {};
  let corps = md;
  if (m) {
    corps = m[2] || '';
    let cle = null;
    for (const ligne of m[1].split(/\r?\n/)) {
      const p = ligne.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (p) {
        cle = p[1];
        donnees[cle] = p[2].trim();
      } else if (cle && /^\s+\S/.test(ligne)) {
        donnees[cle] = (donnees[cle] + ' ' + ligne.trim()).trim();
      } else {
        cle = null;
      }
    }
    // Les guillemets encadrants ne se retirent qu'une fois la valeur complète.
    for (const k of Object.keys(donnees)) {
      const v = donnees[k];
      if (v.length > 1 &&
          ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))))
        donnees[k] = v.slice(1, -1);
    }
  }
  donnees.body = corps.trim();
  return donnees;
}

function lireFichier(rel) {
  const p = join(racine, rel);
  return existsSync(p) ? analyser(readFileSync(p, 'utf8')) : {};
}

function lireCollection(rel) {
  const dossier = join(racine, rel);
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.md'))
    .map((f) => analyser(readFileSync(join(dossier, f), 'utf8')));
}

/** Remplace le contenu entre <!-- MARQUE:START --> et <!-- MARQUE:END -->. */
function injecter(index, marque, contenu) {
  const debut = `<!-- ${marque}:START -->`;
  const fin = `<!-- ${marque}:END -->`;
  const i = index.indexOf(debut);
  const j = index.indexOf(fin);
  if (i === -1 || j === -1) throw new Error(`Repères ${marque} absents de index.html`);
  return index.slice(0, i + debut.length) + contenu + index.slice(j);
}

// L'accent des grands titres s'écrit *entre astérisques* dans le CMS.
const accent = (txt) => escTexte(txt).replace(/\*([^*]+)\*/g, '<em>$1</em>');

let index = readFileSync(join(racine, 'index.html'), 'utf8');
const resume = [];

// --- HERO (titre + sous-titre) ---------------------------------------------
const accueil = lireFichier('content/pages/accueil.md');
if (accueil.hero_title) {
  index = injecter(index, 'HERO_TITLE', accent(accueil.hero_title));
  resume.push('hero : accroche');
}
if (accueil.hero_subtitle) {
  index = injecter(index, 'HERO_SUB', escTexte(accueil.hero_subtitle));
  resume.push('hero : sous-titre');
}

// --- VISUELS (portrait, logo, image de partage) -----------------------------
// Les balises sont régénérées en entier : les dimensions viennent du CSS
// (.logo et .signature__photo), donc changer d'image ne déforme jamais rien.
const SITE = 'https://kouakoukomla.github.io/smartefico';
const visuels = lireFichier('content/pages/visuels.md');

if (visuels.portrait) {
  index = injecter(
    index,
    'VISUEL_PORTRAIT',
    `<img class="signature__photo" src="${urlImage(visuels.portrait)}" alt="Emmanuel Kouakou" loading="lazy">`
  );
  resume.push('visuel : portrait');
}
if (visuels.logo) {
  const logo = urlImage(visuels.logo);
  index = injecter(index, 'VISUEL_LOGO_NAV', `<img class="logo" src="${logo}" alt="SmartEfico">`);
  index = injecter(index, 'VISUEL_LOGO_PIED', `<img class="logo" src="${logo}" alt="">`);
  resume.push('visuel : logo');
}
if (visuels.og_image) {
  const og = `${SITE}/${urlImage(visuels.og_image)}`;
  index = injecter(index, 'VISUEL_OG', `<meta property="og:image" content="${og}">`);
  index = injecter(index, 'VISUEL_TWITTER', `<meta name="twitter:image" content="${og}">`);
  resume.push('visuel : image de partage');
}

// --- FAQ --------------------------------------------------------------------
const faq = lireCollection('content/faq')
  .filter((q) => versBool(q.published))
  .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
if (faq.length) {
  const html =
    '\n' +
    faq
      .map(
        (q, n) =>
          `        <details class="qa"${n === 0 ? ' open' : ''}>
          <summary>${escTexte(q.question || '')}</summary>
          <p>${escTexte(q.body || '')}</p>
        </details>`
      )
      .join('\n') +
    '\n        ';
  index = injecter(index, 'FAQ', html);
  resume.push(`FAQ : ${faq.length} questions`);
}

// --- MASTERCLASS ------------------------------------------------------------
const evenements = lireCollection('content/masterclasses')
  .filter((e) => versBool(e.published))
  .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

function carteMc(e) {
  const titre = escTexte(e.title || 'Masterclass');
  const date = escTexte(e.date_label || '');
  const desc = escTexte(e.body || '');
  const lien = escAttr((e.tally_url || '#appel').trim() || '#appel');
  const externe = /^https?:/i.test(lien) ? ' target="_blank" rel="noopener"' : '';
  const poster = e.poster ? urlImage(e.poster) : '';
  const affiche = poster
    ? `        <a class="mc__affiche" href="${lien}"${externe} aria-label="Affiche de la masterclass — s'inscrire">
          <img src="${poster}" alt="Affiche de la masterclass « ${escAttr(e.title || '')} »" loading="lazy">
        </a>\n`
    : '';
  const styleCarte = poster ? '' : ' style="grid-column:1/-1"';
  return (
    affiche +
    `        <article class="mc"${styleCarte}>
          <span class="mc__date mono">${date}</span>
          <h3>${titre}</h3>
          <p>${desc}</p>
          <a class="btn btn--line" href="${lien}"${externe}>S'inscrire</a>
        </article>`
  );
}

let mc;
if (evenements.length === 0) {
  mc = `        <article class="mc" style="grid-column:1/-1">
          <span class="mc__date mono">Aucune date ouverte pour le moment</span>
          <h3>Prochaine masterclass à venir</h3>
          <p>Inscrivez-vous pour être prévenu de la prochaine session.</p>
          <a class="btn btn--line" href="#appel">Être prévenu</a>
        </article>`;
} else {
  mc = evenements.map(carteMc).join('\n');
}
const avertMc =
  '\n        <!-- Section générée par scripts/sync-content.mjs à partir de\n' +
  '             content/masterclasses/*.md (back office). NE PAS éditer à la main. -->\n';
index = injecter(index, 'MASTERCLASS', avertMc + mc + '\n        ');
resume.push(`masterclass : ${evenements.length} évènement(s)`);

writeFileSync(join(racine, 'index.html'), index, 'utf8');
console.log(resume.join(' · '));
console.log('index.html mis à jour.');
