#!/usr/bin/env node
/**
 * Régénère les zones « pilotées par le back office » de index.html à partir des
 * fichiers de content/ (édités via Pages CMS) :
 *   - HERO_TITLE / HERO_SUB : accroche et sous-titre du hero (content/pages/accueil.md)
 *   - VISUEL_*               : logo, image de partage (content/pages/visuels.md)
 *   - FAQ                    : questions fréquentes (content/faq/*.md)
 *
 * Les zones VIDEO, MASTERCLASS et VISUEL_PORTRAIT sont parties le 28 septembre
 * 2026 avec la section « Ma chaîne, en clair » et la signature, que le
 * propriétaire a fait retirer de l'accueil. L'historique git garde leur code.
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
const cheminRelatif = (s = '') => String(s).trim().replace(/^\/+/, '');
// URL d'image sûre : encode les espaces (%20) tout en gardant les « / ».
const urlImage = (s = '') => encodeURI(cheminRelatif(s));
const versBool = (v) => v === undefined || v === true || v === 'true' || v === 'oui' || v === 'yes';

/** En-tête YAML minimal (clé: valeur) + corps. */
/**
 * Lit l'en-tête entre les deux --- d'un fichier de contenu.
 *
 * Le back office écrit les valeurs longues de deux façons, qu'il faut savoir
 * lire toutes les deux, sans quoi un titre ou une accroche arrive tronqué sur
 * le site — dans la page, dans la balise <title> et dans les aperçus de
 * partage — sans qu'aucun message ne le signale.
 *
 * 1. Repliée sur des lignes indentées :
 *        title: Un titre qui depasse la largeur
 *          et se poursuit ici
 *    Les lignes de continuation sont recollées à la valeur précédente.
 *
 * 2. En bloc YAML, quand la valeur compte plusieurs paragraphes. L'annonce
 *    du bloc (>, >-, |, |- …) tient seule sur la ligne de la clé, la valeur
 *    étant sur les lignes indentées qui suivent, lignes vides comprises :
 *        excerpt: >-
 *          Un premier paragraphe.
 *
 *          Un second.
 *    Un « > » replie le tout en un seul paragraphe, un « | » garde les
 *    retours à la ligne. Sans ce cas, l'annonce elle-même était prise pour la
 *    valeur : le site affichait « >- » suivi du seul premier paragraphe.
 */
function analyser(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const donnees = {};
  let corps = md;
  if (m) {
    corps = m[2] || '';
    const lignes = m[1].split(/\r?\n/);
    let cle = null;
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const p = ligne.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (p) {
        cle = p[1];
        const val = p[2].trim();
        const bloc = val.match(/^([|>])(?:[-+]?\d*|\d*[-+]?)$/);
        if (bloc) {
          const morceaux = [];
          while (i + 1 < lignes.length &&
                 (lignes[i + 1].trim() === '' || /^\s/.test(lignes[i + 1]))) {
            morceaux.push(lignes[++i].trim());
          }
          let valeur = morceaux.join(bloc[1] === '>' ? ' ' : '\n');
          if (bloc[1] === '>') valeur = valeur.replace(/\s+/g, ' ');
          donnees[cle] = valeur.trim();
          cle = null;
          continue;
        }
        donnees[cle] = val;
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
        // YAML double l'apostrophe à l'intérieur d'une chaîne entre apostrophes.
        // Sans ce décodage, un titre saisi dans le back office ressortait avec
        // « l''IA » au lieu de « l'IA ».
        donnees[k] = v.startsWith("'")
          ? v.slice(1, -1).replace(/''/g, "'")
          : v.slice(1, -1);
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

// --- VISUELS (logo, image de partage) ----------------------------------------
// Les balises sont régénérées en entier : les dimensions viennent du CSS
// (.logo), donc changer d'image ne déforme jamais rien.
const SITE = 'https://smartefico.com';
const visuels = lireFichier('content/pages/visuels.md');

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
  // Toutes les questions sont fermées à l'arrivée, première comprise : demande
  // du propriétaire du 18 septembre 2026. Le « + » de chaque ligne dit qu'elles
  // s'ouvrent.
  const html =
    '\n' +
    faq
      .map(
        (q) =>
          `        <details class="qa">
          <summary>${escTexte(q.question || '')}</summary>
          <p>${escTexte(q.body || '')}</p>
        </details>`
      )
      .join('\n') +
    '\n        ';
  index = injecter(index, 'FAQ', html);
  resume.push(`FAQ : ${faq.length} questions`);
}

writeFileSync(join(racine, 'index.html'), index, 'utf8');
console.log(resume.join(' · '));
console.log('index.html mis à jour.');
