import sharp from 'sharp';

// Silhouettes blanches sur transparence, pour le mur de logos du hero.
//
// Les operateurs de sharp ont ete ecartes un par un : threshold() ecrase tout
// a zero apres un negate(), et linear() ne rendait que 0,5 % de pixels opaques
// la ou l'histogramme en annoncait 21. Le masque est donc calcule ici, pixel
// par pixel, sur les valeurs brutes.
//
// Regle : la luminance sert d'alpha inverse. Sous 170 le pixel est de l encre,
// il devient blanc opaque ; au-dessus de 225 c est le fond du JPEG, il
// disparait ; entre les deux une rampe garde l'anticrenelage des bords.
//
// Les seuils viennent de l'histogramme des deux fichiers :
//   log 1  fond a 87,7 % au-dessus de 240 ; encre marine vers 55, cercle or
//          vers 160.
//   log 2  fond a 77,5 % ; marine vers 40, bleu clair du monogramme vers 135.
const OPAQUE = 170;
const VIDE = 225;

const travaux = [
  ['log 1.jpg', 'assets/client-ambassade-togo.png', 'Ambassade du Togo au Maroc'],
  ['log 2.jpg', 'assets/client-menouveve.png', 'Menouveve Logistique']
];

for (const [source, sortie, nom] of travaux) {
  const { data, info } = await sharp(source).removeAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width: L, height: H, channels: C } = info;

  const alpha = new Uint8Array(L * H);
  let x0 = L, y0 = H, x1 = -1, y1 = -1, opaque = 0;

  for (let y = 0, p = 0; y < H; y++) {
    for (let x = 0; x < L; x++, p++) {
      const i = p * C;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      let a = 0;
      if (lum <= OPAQUE) a = 255;
      else if (lum < VIDE) a = Math.round((VIDE - lum) / (VIDE - OPAQUE) * 255);
      alpha[p] = a;
      if (a > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        if (a > 200) opaque++;
      }
    }
  }
  if (x1 < 0) throw new Error(nom + ' : masque vide');

  // blanc uni, l'alpha porte toute la forme
  const rgba = Buffer.alloc(L * H * 4, 255);
  for (let p = 0; p < alpha.length; p++) rgba[p * 4 + 3] = alpha[p];

  const zone = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  await sharp(rgba, { raw: { width: L, height: H, channels: 4 } })
    .extract(zone)
    .png({ compressionLevel: 9 })
    .toFile(sortie);

  console.log('  ' + nom.padEnd(28) + L + 'x' + H + ' -> ' +
    zone.width + 'x' + zone.height +
    '   encre ' + (opaque / (L * H) * 100).toFixed(1) + ' % de la source');
}
