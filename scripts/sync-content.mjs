#!/usr/bin/env node
/**
 * Régénère la section « Actualités / Masterclass » de index.html à partir des
 * fichiers de content/masterclasses/*.md (édités via le back office Pages CMS).
 *
 * Même principe que sync-legal.mjs : le contenu est réécrit entre les repères
 *   <!-- MASTERCLASS:START --> … <!-- MASTERCLASS:END -->
 * Ne rien écrire à la main entre ces repères : ce script l'écrase.
 *
 * Après ce script, lancer build-standalone.mjs pour régénérer index-autonome.html.
 * Aucune dépendance externe (comme les autres scripts du dépôt).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dossier = join(racine, 'content', 'masterclasses');

// --- petits utilitaires -----------------------------------------------------
const escTexte = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Chemin d'image relatif (jamais absolu : GitHub Pages sert sous /smartefico/).
const cheminRelatif = (s = '') => String(s).trim().replace(/^\/+/, '');

/** Analyse un fichier Markdown à en-tête YAML minimal (clé: valeur). */
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
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      donnees[p[1]] = val;
    }
  }
  donnees.body = corps.trim();
  return donnees;
}

const versBool = (v) => v === true || v === 'true' || v === 'oui' || v === 'yes';

// --- lecture des évènements -------------------------------------------------
let evenements = [];
if (existsSync(dossier)) {
  evenements = readdirSync(dossier)
    .filter((f) => f.endsWith('.md'))
    .map((f) => analyser(readFileSync(join(dossier, f), 'utf8')))
    .filter((e) => versBool(e.published ?? 'true'))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

// --- fabrication du HTML ----------------------------------------------------
function carte(e) {
  const titre = escTexte(e.title || 'Masterclass');
  const date = escTexte(e.date_label || '');
  const desc = escTexte(e.body || '');
  const lien = escAttr((e.tally_url || '#appel').trim() || '#appel');
  const externe = /^https?:/i.test(lien) ? ' target="_blank" rel="noopener"' : '';
  const poster = e.poster ? cheminRelatif(e.poster) : '';

  const affiche = poster
    ? `        <a class="mc__affiche" href="${lien}"${externe} aria-label="Affiche de la masterclass — s'inscrire">
          <img src="${escAttr(poster)}" alt="Affiche de la masterclass « ${escAttr(e.title || '')} »" loading="lazy">
        </a>\n`
    : '';

  // Sans affiche, la carte occupe toute la largeur.
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

let corpsHtml;
if (evenements.length === 0) {
  // État « aucune date » : la page ne reste jamais vide.
  corpsHtml =
    `        <article class="mc" style="grid-column:1/-1">
          <span class="mc__date mono">Aucune date ouverte pour le moment</span>
          <h3>Prochaine masterclass à venir</h3>
          <p>Inscrivez-vous pour être prévenu de la prochaine session.</p>
          <a class="btn btn--line" href="#appel">Être prévenu</a>
        </article>`;
} else {
  corpsHtml = evenements.map(carte).join('\n');
}

// --- injection entre les repères -------------------------------------------
const chemin = join(racine, 'index.html');
let index = readFileSync(chemin, 'utf8');
const debut = '<!-- MASTERCLASS:START -->';
const fin = '<!-- MASTERCLASS:END -->';
const i = index.indexOf(debut);
const j = index.indexOf(fin);
if (i === -1 || j === -1) throw new Error('Repères MASTERCLASS absents de index.html');

const avertissement =
  '\n        <!-- Section générée par scripts/sync-content.mjs à partir de\n' +
  '             content/masterclasses/*.md (back office). NE PAS éditer à la main. -->\n';

index =
  index.slice(0, i + debut.length) +
  avertissement +
  corpsHtml +
  '\n        ' +
  index.slice(j);

writeFileSync(chemin, index, 'utf8');
console.log(
  `Masterclass : ${evenements.length} évènement(s) publié(s). index.html mis à jour.`
);
