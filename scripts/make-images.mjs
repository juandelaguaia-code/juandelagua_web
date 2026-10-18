// Genera assets estáticos: imagen OG (1200x630) y apple-touch-icon.
// Uso: node scripts/make-images.mjs
import sharp from 'sharp';

const heroSrc = 'src/assets/img/juan-hero.jpg';

const text = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#0E2A43" stop-opacity="0"/>
      <stop offset=".45" stop-color="#0E2A43" stop-opacity=".55"/>
      <stop offset=".7" stop-color="#0E2A43" stop-opacity=".95"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="640" y="250" font-family="Georgia, serif" font-size="68" fill="#F5F3EC">Juan <tspan font-style="italic" fill="#5CC8BD">del Agua</tspan></text>
  <text x="642" y="318" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#F5F3EC" opacity=".85">Consultor de IA y marketing</text>
  <text x="642" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#F5F3EC" opacity=".85">para pymes de Chile</text>
  <rect x="642" y="410" width="64" height="3" fill="#1E9E93"/>
  <text x="642" y="460" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#5CC8BD">juandelagua.com</text>
</svg>`);

await sharp(heroSrc)
  .resize(1200, 630, { fit: 'cover', position: 'left top' })
  .composite([{ input: text }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/og.jpg');

await sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('ok');
