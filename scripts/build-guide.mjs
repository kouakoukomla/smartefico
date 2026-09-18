#!/usr/bin/env node
/**
 * Fabrique les guides PDF offerts par les pages d'atterrissage du site :
 *
 *   guide     scripts/guide/guide.html    → assets/guide-5-etapes-smartefico.pdf
 *             (les 5 étapes, offert par guide.html)
 *   guide-ia  scripts/guide/guide-ia.html → assets/guide-ia-generative-smartefico.pdf
 *             (l'IA générative, offert par guide-ia.html)
 *
 *   node scripts/build-guide.mjs            # les deux
 *   node scripts/build-guide.mjs guide-ia   # un seul, par son nom
 *
 * Ne reconstruire que le guide modifié : Chrome date chaque PDF qu'il
 * imprime, et un guide réimprimé sans changement apparaît quand même modifié
 * dans git.
 *
 * Chaque source compte une page A4 par <section>, imprimée par Chrome (ou
 * Edge) sans fenêtre. Les guides gardent ainsi la typographie et les couleurs
 * du site, sans bibliothèque PDF à installer.
 *
 * Chrome est cherché aux emplacements habituels. Pour en imposer un autre :
 *   CHROME="C:/chemin/vers/chrome.exe" node scripts/build-guide.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const guides = {
  guide: 'guide-5-etapes-smartefico.pdf',
  'guide-ia': 'guide-ia-generative-smartefico.pdf',
};

const demandes = process.argv.slice(2);
const inconnus = demandes.filter((nom) => !(nom in guides));
if (inconnus.length) {
  console.error(`Guide inconnu : ${inconnus.join(', ')}. Noms possibles : ${Object.keys(guides).join(', ')}.`);
  process.exit(1);
}
const aFaire = demandes.length ? demandes : Object.keys(guides);

const chrome = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((c) => c && existsSync(c));
if (!chrome) {
  console.error('Chrome introuvable. Indiquez son chemin : CHROME="…" node scripts/build-guide.mjs');
  process.exit(1);
}

for (const nom of aFaire) {
  const source = join(racine, 'scripts', 'guide', `${nom}.html`);
  const sortie = join(racine, 'assets', guides[nom]);

  // Profil jetable : l'impression ne touche pas au navigateur de tous les jours.
  const profil = mkdtempSync(join(tmpdir(), 'guide-smartefico-'));
  const avant = existsSync(sortie) ? statSync(sortie).mtimeMs : 0;
  const r = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-pdf-header-footer',
    `--user-data-dir=${profil}`,
    // laisse le temps à Instrument Serif d'arriver de Google Fonts
    '--virtual-time-budget=8000',
    `--print-to-pdf=${sortie}`,
    pathToFileURL(source).href,
  ], { encoding: 'utf8', timeout: 120000 });
  try { rmSync(profil, { recursive: true, force: true }); } catch { /* Chrome peut tarder à lâcher le dossier */ }

  if (!existsSync(sortie) || statSync(sortie).mtimeMs === avant) {
    console.error(`assets/${guides[nom]} n’a pas été écrit.\n` + (r.stderr || r.error || ''));
    process.exit(1);
  }
  console.log(`assets/${guides[nom]} : ${Math.round(statSync(sortie).size / 1024)} Ko`);
}
