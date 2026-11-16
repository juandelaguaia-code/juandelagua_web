// Genera el apple-touch-icon a partir del favicon.
// Uso: node scripts/make-images.mjs
import sharp from 'sharp';

// public/og.jpg (1200x630) es una captura de la portada nueva (nombre, Juan y el mar): se regenera
// capturando la portada a 1200x630 sin encabezado ni texto lateral. Este script ya no la sobrescribe.

await sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('ok');
