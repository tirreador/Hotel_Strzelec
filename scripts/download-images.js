/**
 * Strzelec Wrocław – Skrypt pobierania zdjęć z WordPress REST API
 *
 * Użycie:
 *   1. Pobierz listę mediów:
 *      curl "https://strzelecwroclaw.pl/wp-json/wp/v2/media?per_page=100" -o assets/img/source/media.json
 *
 *   2. Uruchom ten skrypt:
 *      node scripts/download-images.js
 *
 * Wymagania: Node.js 18+ (wbudowany fetch) lub starszy z node-fetch
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const MEDIA_JSON  = path.join(__dirname, '..', 'assets', 'img', 'source', 'media.json');
const OUTPUT_DIR  = path.join(__dirname, '..', 'assets', 'img', 'source');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      console.log(`  ⏭  Pominięto (istnieje): ${path.basename(destPath)}`);
      return resolve();
    }
    const client = url.startsWith('https') ? https : http;
    const file   = fs.createWriteStream(destPath);
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} dla ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(MEDIA_JSON)) {
    console.error(`\n❌ Brak pliku media.json w: ${MEDIA_JSON}`);
    console.error('Najpierw pobierz listę mediów:');
    console.error('  curl "https://strzelecwroclaw.pl/wp-json/wp/v2/media?per_page=100" -o assets/img/source/media.json\n');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const media = JSON.parse(fs.readFileSync(MEDIA_JSON, 'utf8'));
  console.log(`\n📥 Pobieranie ${media.length} plików...\n`);

  let ok = 0, skip = 0, err = 0;

  for (const item of media) {
    const srcUrl = item.source_url;
    if (!srcUrl) continue;

    const ext      = path.extname(new URL(srcUrl).pathname) || '.jpg';
    const filename = `${item.id}${ext}`;
    const destPath = path.join(OUTPUT_DIR, filename);

    try {
      if (fs.existsSync(destPath)) { skip++; continue; }
      process.stdout.write(`  ↓ ${filename}...`);
      await downloadFile(srcUrl, destPath);
      process.stdout.write(' ✓\n');
      ok++;
    } catch (e) {
      process.stdout.write(` ✗ (${e.message})\n`);
      err++;
    }
  }

  console.log(`\n✅ Gotowe! Pobrano: ${ok}, pominięto: ${skip}, błędy: ${err}`);
  console.log(`📁 Zdjęcia zapisano w: ${OUTPUT_DIR}\n`);
}

main();
