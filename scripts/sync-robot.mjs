#!/usr/bin/env node
/**
 * Recopie le robot animé de index.html dans les autres pages écrites à la main.
 *
 * index.html est la source unique : son style entre les repères
 * BOT-CSS:START / BOT-CSS:END, son markup et son script entre
 * <!-- BOT:START --> et <!-- BOT:END -->. Chaque page reçoit le style dans un
 * <style data-robot> juste avant </head>, et le markup juste avant </body> ;
 * une seconde passe remplace les deux sans rien dupliquer.
 *
 * Le blog et les articles ne sont pas ici : build-blog.mjs les reprend lui-même.
 *
 * Usage : node scripts/sync-robot.mjs   (après toute retouche du robot)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['cgv.html', 'cgc.html', 'guide.html', 'guide-merci.html', 'guide-ia.html',
  'guide-ia-merci.html', 'exemples-ia.html', 'livres.html'];

const index = readFileSync(join(racine, 'index.html'), 'utf8');
const css = (index.match(/\/\* BOT-CSS:START[\s\S]*?\/\* BOT-CSS:END \*\//) || [])[0];
const html = (index.match(/<!-- BOT:START[\s\S]*?<!-- BOT:END -->/) || [])[0];
if (!css || !html) throw new Error('Repères du robot introuvables dans index.html');

for (const nom of PAGES) {
  const chemin = join(racine, nom);
  let t = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  t = t.replace(/<style data-robot>[\s\S]*?<\/style>\n?/, '');
  t = t.replace(/<!-- BOT:START[\s\S]*?<!-- BOT:END -->\n?/, '');
  const h = t.indexOf('</head>'), b = t.lastIndexOf('</body>');
  if (h < 0 || b < 0) throw new Error(`${nom} : </head> ou </body> introuvable`);
  t = t.slice(0, h) + `<style data-robot>\n${css}\n</style>\n` + t.slice(h);
  const b2 = t.lastIndexOf('</body>');
  t = t.slice(0, b2) + html + '\n' + t.slice(b2);
  writeFileSync(chemin, t);
  console.log(`robot → ${nom}`);
}
