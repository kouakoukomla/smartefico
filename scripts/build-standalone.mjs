#!/usr/bin/env node
/**
 * Fabrique index-autonome.html : une copie de index.html dont toutes les images
 * sont encodées à l'intérieur du fichier.
 *
 *   node scripts/build-standalone.mjs
 *
 * À quoi ça sert : pouvoir envoyer le site par mail ou l'ouvrir depuis
 * n'importe quel dossier sans emporter assets/. Le fichier est volontairement
 * exclu du dépôt (.gitignore) — sur GitHub Pages il ferait doublon avec la
 * page d'accueil.
 *
 * Ce qui n'est PAS transformé : les URL absolues des balises Open Graph.
 * Elles doivent rester des URL, un data: n'y fonctionnerait pas. Le script ne
 * remplace que les références entre guillemets (src="assets/…").
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

let html = readFileSync(join(racine, 'index.html'), 'utf8');
let inlinees = 0;

for (const nom of readdirSync(join(racine, 'assets'))) {
  const chemin = join(racine, 'assets', nom);
  if (!statSync(chemin).isFile()) continue;

  const mime = TYPES[extname(nom).toLowerCase()];
  if (!mime) continue;

  const aiguille = `"assets/${nom}"`;
  if (!html.includes(aiguille)) continue;

  const b64 = readFileSync(chemin).toString('base64');
  html = html.split(aiguille).join(`"data:${mime};base64,${b64}"`);
  inlinees++;
}

const restantes = (html.match(/(?:src|href)="assets\//g) || []).length;
if (restantes > 0) {
  console.error(`Attention : ${restantes} référence(s) à assets/ non résolue(s).`);
  console.error('Le fichier ne sera pas autonome. Vérifiez que les fichiers existent.');
  process.exit(1);
}

const sortie = join(racine, 'index-autonome.html');
writeFileSync(sortie, html, 'utf8');

const ko = Math.round(statSync(sortie).size / 1024);
console.log(`${inlinees} image(s) encodée(s) — index-autonome.html : ${ko} Ko`);
