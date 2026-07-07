/**
 * Generate properly-sized PWA icons from logo.png
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'public', 'logo.png');
const ICONS_DIR = join(ROOT, 'public', 'icons');

const BG_COLOR = { r: 250, g: 250, b: 249, alpha: 1 }; // #FAFAF9 matches manifest background_color

const sizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from logo.png...\n');
  
  // Get source image metadata
  const metadata = await sharp(SOURCE).metadata();
  console.log(`📏 Source image: ${metadata.width}x${metadata.height}`);

  for (const { name, size } of sizes) {
    const outputPath = join(ICONS_DIR, name);
    
    // Resize the logo to fit within the icon with 15% padding
    const innerSize = Math.round(size * 0.80);
    
    const resizedLogo = await sharp(SOURCE)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();
    
    // Create the final icon with background color and centered logo
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR,
      }
    })
      .composite([{
        input: resizedLogo,
        gravity: 'centre',
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`  ✅ ${name} (${size}x${size})`);
  }
  
  // Generate maskable icon (512x512 with more padding for safe zone)
  const maskableSize = 512;
  const maskableInner = Math.round(maskableSize * 0.60); // 60% to stay in safe zone
  
  const maskableResized = await sharp(SOURCE)
    .resize(maskableInner, maskableInner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: BG_COLOR,
    }
  })
    .composite([{
      input: maskableResized,
      gravity: 'centre',
    }])
    .png()
    .toFile(join(ICONS_DIR, 'maskable-icon-512x512.png'));
  
  console.log(`  ✅ maskable-icon-512x512.png (512x512)`);
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
});
