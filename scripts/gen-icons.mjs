/**
 * Generates PNG icons for PWA from the SVG source.
 * Run once: node scripts/gen-icons.mjs
 * Requires: npm install -D sharp (temporary)
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'));

for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, `public/icons/icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}
