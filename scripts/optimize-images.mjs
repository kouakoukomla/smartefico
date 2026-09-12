#!/usr/bin/env node
/**
 * Optimise les images de assets/ (uploadées via le back office ou ajoutées à la
 * main) : réduit celles qui sont trop lourdes ou trop grandes, en gardant le
 * même nom de fichier (les références du site restent valides).
 *
 * - Ne touche PAS aux images déjà légères (pas de perte de qualité à répétition).
 * - N'écrit que si le résultat est réellement plus petit.
 * - Conserve le format (jpg/png/webp) et l'orientation EXIF.
 *
 * Tourne dans GitHub Actions à chaque changement dans assets/. Dépendance : sharp.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dossier = join(racine, 'assets');

const LARGEUR_MAX = 1400;          // aucune image affichée plus large que ~700px (x2)
const SEUIL_OCTETS = 350 * 1024;   // en dessous, on ne touche pas
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let optimisees = 0;
let gainTotal = 0;

for (const nom of readdirSync(dossier)) {
  const ext = extname(nom).toLowerCase();
  if (!EXTS.has(ext)) continue;

  const chemin = join(dossier, nom);
  const avant = statSync(chemin).size;
  const buf = readFileSync(chemin);

  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    continue; // fichier illisible : on laisse tel quel
  }

  const tropLarge = meta.width && meta.width > LARGEUR_MAX;
  const tropLourd = avant > SEUIL_OCTETS;
  if (!tropLarge && !tropLourd) continue;

  let pipeline = sharp(buf).rotate(); // applique l'orientation EXIF
  if (tropLarge) pipeline = pipeline.resize({ width: LARGEUR_MAX, withoutEnlargement: true });

  if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  else if (ext === '.webp') pipeline = pipeline.webp({ quality: 80 });
  else pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });

  const sortie = await pipeline.toBuffer();
  if (sortie.length < avant) {
    writeFileSync(chemin, sortie);
    optimisees++;
    gainTotal += avant - sortie.length;
    console.log(
      `${nom} : ${Math.round(avant / 1024)} Ko -> ${Math.round(sortie.length / 1024)} Ko`
    );
  }
}

console.log(
  optimisees
    ? `${optimisees} image(s) optimisée(s), ${Math.round(gainTotal / 1024)} Ko économisés.`
    : 'Aucune image à optimiser.'
);
