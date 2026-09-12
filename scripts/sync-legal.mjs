#!/usr/bin/env node
/**
 * Recopie le texte de cgv.html et cgc.html dans les fenêtres de index.html.
 *
 * Les pages légales restent la source unique : on les modifie, puis on lance
 *   node scripts/sync-legal.mjs
 * et le contenu des fenêtres est régénéré à l'identique.
 *
 * Sans ça, le fichier index-autonome.html (tout-en-un) n'aurait aucun moyen
 * d'afficher les CGV et les CGC, puisqu'il n'a pas les autres fichiers à côté.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

const documents = [
  { source: 'cgv.html', marque: 'CGV' },
  { source: 'cgc.html', marque: 'CGC' },
];

function extraireMain(html, nom) {
  const m = html.match(/<main>([\s\S]*?)<\/main>/);
  if (!m) throw new Error(`Aucune balise <main> trouvée dans ${nom}`);
  return m[1].trim();
}

let index = readFileSync(join(racine, 'index.html'), 'utf8');
const resume = [];

for (const { source, marque } of documents) {
  const page = readFileSync(join(racine, source), 'utf8');
  let contenu = extraireMain(page, source);

  // Les renvois d'un document à l'autre ouvrent la fenêtre voisine
  // plutôt que de quitter la page.
  contenu = contenu
    .replace(/href="cgv\.html"/g, 'href="cgv.html" data-doc="cgv"')
    .replace(/href="cgc\.html"/g, 'href="cgc.html" data-doc="cgc"');

  const debut = `<!-- ${marque}:START -->`;
  const fin = `<!-- ${marque}:END -->`;
  const i = index.indexOf(debut);
  const j = index.indexOf(fin);
  if (i === -1 || j === -1) throw new Error(`Repères ${marque} absents de index.html`);

  index = index.slice(0, i + debut.length) + '\n' + contenu + '\n    ' + index.slice(j);

  const sections = (contenu.match(/<h2>/g) || []).length;
  resume.push(`${marque} : ${sections} articles, ${Math.round(contenu.length / 1024)} Ko`);
}

writeFileSync(join(racine, 'index.html'), index, 'utf8');
console.log(resume.join('\n'));
console.log('index.html mis à jour.');
