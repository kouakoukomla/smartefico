#!/usr/bin/env node
/**
 * Fabrique l'image affichée quand le lien du site est partagé (LinkedIn,
 * WhatsApp, Facebook…) : assets/og-smartefico-noir.jpg depuis le passage du
 * site au noir profond, le 20 septembre 2026. La version du noir pur,
 * assets/og-smartefico.jpg, reste dans le dépôt pour les partages déjà faits.
 *
 *   node scripts/build-partage.mjs
 *
 * La source est scripts/partage/partage.html, en 1200 x 630 : Chrome (ou Edge)
 * sans fenêtre la photographie, puis sharp la compresse en JPEG. Même
 * principe que build-guide.mjs, avec une capture au lieu d'une impression.
 *
 * L'image est déclarée dans le back office (content/pages/visuels.md, champ
 * og_image), d'où sync-content.mjs la recopie dans index.html. À chaque
 * refonte, lui donner un nouveau nom : les réseaux gardent en mémoire l'image
 * d'une adresse donnée : changer alors FICHIER, puis les adresses qui le
 * citent (voir CLAUDE.md, « L'aperçu de partage »).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'scripts', 'partage', 'partage.html');
const FICHIER = 'og-smartefico-noir.jpg';
const sortie = join(racine, 'assets', FICHIER);

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
  console.error('Chrome introuvable. Indiquez son chemin : CHROME="…" node scripts/build-partage.mjs');
  process.exit(1);
}

const dossier = mkdtempSync(join(tmpdir(), 'partage-smartefico-'));
const capture = join(dossier, 'capture.png');
const r = spawnSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  `--user-data-dir=${join(dossier, 'profil')}`,
  '--window-size=1200,630',
  // laisse le temps à Instrument Serif d'arriver de Google Fonts
  '--virtual-time-budget=8000',
  `--screenshot=${capture}`,
  pathToFileURL(source).href,
], { encoding: 'utf8', timeout: 120000 });

if (!existsSync(capture)) {
  console.error('La capture n’a pas été faite.\n' + (r.stderr || r.error || ''));
  process.exit(1);
}
const { width, height } = await sharp(capture).metadata();
if (width !== 1200 || height !== 630) {
  console.error(`Capture de ${width} x ${height} au lieu de 1200 x 630.`);
  process.exit(1);
}
await sharp(capture).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toFile(sortie);
try { rmSync(dossier, { recursive: true, force: true }); } catch { /* Chrome peut tarder à lâcher le dossier */ }
console.log(`assets/${FICHIER} : 1200 x 630, ${Math.round(statSync(sortie).size / 1024)} Ko`);
