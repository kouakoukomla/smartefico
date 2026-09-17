#!/usr/bin/env node
/**
 * Fabrique assets/guide-5-etapes-smartefico.pdf, le guide offert par guide.html.
 *
 *   node scripts/build-guide.mjs
 *
 * La source est scripts/guide/guide.html : une page A4 par <section>, imprimée
 * par Chrome (ou Edge) sans fenêtre. Le guide garde ainsi la typographie et
 * les couleurs du site, sans bibliothèque PDF à installer.
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
const source = join(racine, 'scripts', 'guide', 'guide.html');
const sortie = join(racine, 'assets', 'guide-5-etapes-smartefico.pdf');

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
  console.error('Le PDF n’a pas été écrit.\n' + (r.stderr || r.error || ''));
  process.exit(1);
}
console.log(`assets/guide-5-etapes-smartefico.pdf : ${Math.round(statSync(sortie).size / 1024)} Ko`);
