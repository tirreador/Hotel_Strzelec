/**
 * Strzelec Wrocław – Skrypt optymalizacji zdjęć do WebP
 *
 * Konwertuje zdjęcia z assets/img/source/ do WebP
 * w rozmiarach 480, 960 i 1440 px szerokości.
 *
 * Instalacja zależności:
 *   npm install sharp
 *
 * Użycie:
 *   node scripts/optimize-images.js
 *
 * Możesz też podać katalog wejściowy:
 *   node scripts/optimize-images.js assets/img/source/
 */

const fs   = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n❌ Brak modułu "sharp". Zainstaluj go komendą:');
  console.error('   npm install sharp\n');
  process.exit(1);
}

const INPUT_DIR  = path.resolve(process.argv[2] || 'assets/img/source');
const OUTPUT_DIR = path.resolve('assets/img/optimized');
const WIDTHS     = [480, 960, 1440];
const QUALITY    = 82;
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(/-+/g, '-');
}

async function processImage(filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const base = slugify(path.basename(filePath, ext));

  for (const width of WIDTHS) {
    const outName = `${base}-${width}w.webp`;
    const outPath = path.join(OUTPUT_DIR, outName);

    if (fs.existsSync(outPath)) {
      console.log(`  ⏭  Pominięto: ${outName}`);
      continue;
    }

    try {
      await sharp(filePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);
      console.log(`  ✓ ${outName}`);
    } catch (e) {
      console.error(`  ✗ Błąd przy ${outName}: ${e.message}`);
    }
  }
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`\n❌ Nie znaleziono katalogu wejściowego: ${INPUT_DIR}\n`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(INPUT_DIR, f));

  if (!files.length) {
    console.log(`\n⚠️  Brak zdjęć w ${INPUT_DIR}\n`);
    return;
  }

  console.log(`\n🖼  Optymalizacja ${files.length} zdjęć → ${WIDTHS.join(', ')} px, WebP jakość ${QUALITY}\n`);

  for (const file of files) {
    console.log(`📄 ${path.basename(file)}`);
    await processImage(file);
  }

  console.log(`\n✅ Gotowe! Pliki WebP zapisano w: ${OUTPUT_DIR}\n`);
  console.log('Następny krok: zaktualizuj src w HTML, np.:');
  console.log('<picture>');
  console.log('  <source srcset="assets/img/optimized/NAZWA-480w.webp 480w,');
  console.log('                  assets/img/optimized/NAZWA-960w.webp 960w,');
  console.log('                  assets/img/optimized/NAZWA-1440w.webp 1440w"');
  console.log('          type="image/webp" sizes="(max-width:480px) 480px,(max-width:960px) 960px,1440px">');
  console.log('  <img src="assets/img/optimized/NAZWA-960w.webp" alt="Opis zdjęcia" loading="lazy">');
  console.log('</picture>\n');
}

main();
