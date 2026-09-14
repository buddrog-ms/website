/**
 * optimize-images.js
 *
 * Skrypt do optymalizacji zdjęć na potrzeby strony www.
 * Wykonuje dwie operacje:
 *   1. Backup oryginałów do images/originals/
 *   2. Kompresja + resize JPEG (max 1920px, jakość 80%)
 *   3. Generowanie wersji WebP obok każdego JPEG
 *
 * Wymagania:
 *   npm install sharp
 *
 * Użycie:
 *   node utils/optimize-images.js
 *   node utils/optimize-images.js --webp-only       (tylko WebP, bez kompresji JPEG)
 *   node utils/optimize-images.js --jpeg-only       (tylko kompresja JPEG, bez WebP)
 *   node utils/optimize-images.js --dir images/gallery
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ─── KONFIGURACJA ────────────────────────────────────────────────────────────
const CONFIG = {
    // Katalogi ze zdjęciami do przetworzenia (względem katalogu projektu)
    inputDirs: [
        'images/gallery',
        'images/realizations/building-demolition/photos',
        'images/realizations/material-transport/photos',
        'images/realizations/road-modernization/photos',
        'images/realizations/snow-removal/photos',
        'images/background',
    ],

    // Katalog na backup oryginałów (null = brak backupu)
    backupDir: 'images/originals',

    // Maksymalna szerokość/wysokość po resize (zachowuje proporcje)
    maxSize: 1920,

    // Jakość JPEG (0-100)
    jpegQuality: 80,

    // Jakość WebP (0-100)
    webpQuality: 82,

    // Rozszerzenia wejściowe do przetworzenia
    inputExts: ['.jpg', '.jpeg'],

    // Czy tworzyć wersje WebP obok JPEG?
    generateWebp: true,

    // Czy kompresować i resize'ować JPEG?
    optimizeJpeg: true,
};
// ─────────────────────────────────────────────────────────────────────────────

// Obsługa argumentów linii poleceń
const args = process.argv.slice(2);
if (args.includes('--webp-only')) {
    CONFIG.optimizeJpeg = false;
    CONFIG.generateWebp = true;
}
if (args.includes('--jpeg-only')) {
    CONFIG.optimizeJpeg = true;
    CONFIG.generateWebp = false;
}
const dirArg = args.find(a => a.startsWith('--dir'));
if (dirArg) {
    const dir = dirArg.split('=')[1] || args[args.indexOf(dirArg) + 1];
    if (dir) CONFIG.inputDirs = [dir];
}

// Katalog projektu = katalog nadrzędny względem utils/
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function backupFile(filePath) {
    if (!CONFIG.backupDir) return;
    const rel = path.relative(path.join(PROJECT_ROOT, 'images'), filePath);
    const dest = path.join(PROJECT_ROOT, CONFIG.backupDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) {
        fs.copyFileSync(filePath, dest);
    }
}

function formatKB(bytes) {
    return (bytes / 1024).toFixed(0) + ' KB';
}

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!CONFIG.inputExts.includes(ext)) return null;

    const sizeBefore = fs.statSync(filePath).size;
    await backupFile(filePath);

    const results = [];

    if (CONFIG.optimizeJpeg) {
        await sharp(filePath)
            .resize(CONFIG.maxSize, CONFIG.maxSize, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: CONFIG.jpegQuality, mozjpeg: true })
            .toFile(filePath + '.tmp');

        fs.renameSync(filePath + '.tmp', filePath);
        const sizeAfter = fs.statSync(filePath).size;
        results.push({
            file: path.basename(filePath),
            type: 'JPEG',
            before: sizeBefore,
            after: sizeAfter,
        });
    }

    if (CONFIG.generateWebp) {
        const webpPath = filePath.replace(/\.(jpg|jpeg)$/i, '.webp');
        await sharp(filePath)
            .resize(CONFIG.maxSize, CONFIG.maxSize, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: CONFIG.webpQuality })
            .toFile(webpPath);

        const webpSize = fs.statSync(webpPath).size;
        results.push({
            file: path.basename(webpPath),
            type: 'WebP',
            before: sizeBefore,
            after: webpSize,
        });
    }

    return results;
}

async function processDir(dirPath) {
    const absDir = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(absDir)) {
        console.warn(`  [POMINIĘTO] Katalog nie istnieje: ${dirPath}`);
        return [];
    }

    const files = fs.readdirSync(absDir)
        .filter(f => CONFIG.inputExts.includes(path.extname(f).toLowerCase()))
        .map(f => path.join(absDir, f));

    const allResults = [];
    for (const file of files) {
        try {
            const results = await processFile(file);
            if (results) allResults.push(...results);
        } catch (err) {
            console.error(`  [BŁĄD] ${path.basename(file)}: ${err.message}`);
        }
    }
    return allResults;
}

async function main() {
    console.log('=== optimize-images.js ===');
    console.log(`Tryb: JPEG=${CONFIG.optimizeJpeg ? 'TAK' : 'NIE'}, WebP=${CONFIG.generateWebp ? 'TAK' : 'NIE'}`);
    if (CONFIG.backupDir) console.log(`Backup: ${CONFIG.backupDir}/`);
    console.log('');

    let totalBefore = 0;
    let totalAfter = 0;
    let fileCount = 0;

    for (const dir of CONFIG.inputDirs) {
        console.log(`📁 ${dir}`);
        const results = await processDir(dir);

        for (const r of results) {
            const saved = r.before - r.after;
            const pct = r.before > 0 ? Math.round((saved / r.before) * 100) : 0;
            const sign = saved >= 0 ? '-' : '+';
            console.log(`   ${r.type.padEnd(5)} ${r.file.padEnd(35)} ${formatKB(r.before).padStart(8)} → ${formatKB(r.after).padStart(8)}  (${sign}${Math.abs(pct)}%)`);
            totalBefore += r.before;
            totalAfter += r.after;
            fileCount++;
        }

        if (results.length === 0) console.log('   (brak plików do przetworzenia)');
        console.log('');
    }

    const totalSaved = totalBefore - totalAfter;
    const totalPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;

    console.log('─'.repeat(60));
    console.log(`Przetworzone pliki: ${fileCount}`);
    console.log(`Łącznie przed:     ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Łącznie po:        ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Zaoszczędzono:     ${(totalSaved / 1024 / 1024).toFixed(1)} MB (${totalPct}%)`);
}

main().catch(err => {
    console.error('Błąd krytyczny:', err.message);
    process.exit(1);
});
