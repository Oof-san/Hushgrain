import sharp from 'sharp';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('Provide a JSON array of { name, path } source images.');
const sources = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
const names = {
  'flat-white': 'house-flat-white',
  cortado: 'honey-oat-cortado',
  mocha: 'sea-salt-mocha',
  'citrus-tonic': 'citrus-tonic-espresso',
  kouign: 'brown-butter-kouign',
  croissant: 'yuzu-almond-croissant',
  scone: 'cacao-nib-scone',
  toast: 'tomato-ricotta-toast',
  'mushroom-melt': 'miso-mushroom-melt',
  'maple-latte': 'smoked-maple-latte',
};
for (const source of sources) {
  if (!source.path) throw new Error(`Missing source image: ${source.name}`);
  const target = resolve('client/public/images', `${names[source.name] || source.name}.webp`);
  await sharp(source.path)
    .resize({
      width: ['hero', 'interior'].includes(source.name) ? 1600 : 900,
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 5 })
    .toFile(target);
  console.log(
    `${names[source.name] || source.name}.webp · ${Math.round((await stat(target)).size / 1024)} KB`,
  );
}
