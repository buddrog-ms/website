/**
 * optimize-images.js
 *
 * Skrypt do optymalizacji zdjęć na potrzeby strony www.
 * Wykonuje następujące operacje:
 *   1. Backup oryginałów do images/originals/
 *   2. Auto-rotację na podstawie EXIF metadata (.rotate())
 *   3. Generowanie wersji wielorozdzielczościowych (600w, 1200w, 1920w) w WebP oraz JPEG
 *   4. Generowanie domyślnego pliku .webp i .jpg
 *
 * Wymagania:
 *   npm install sharp
 *
 * Użycie:
 *   node utils/optimize-images.js
 *   node utils/optimize-images.js --webp-only
 *   node utils/optimize-images.js --jpeg-only
 *   node utils/optimize-images.js --dir images/gallery
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ─── KONFIGURACJA ────────────────────────────────────────────────────────────
const CONFIG = {
    inputDirs: [
        'images/gallery',
        'images/realizations/building-demolition/photos',
        'images/realizations/material-transport/photos',
        'images/realizations/road-modernization/photos',
        'images/realizations/snow-removal/photos',
        'images/background',
    ],

    backupDir: 'images/originals',

    // Rozdzielczości w pikselach dla srcset
    sizes: [600, 1200, 1920],

    jpegQuality: 88,
    webpQuality: 88,

    inputExts: ['.jpg', '.jpeg', '.png', '.webp'],

    generateWebp: true,
    optimizeJpeg: true,
};
// ─────────────────────────────────────────────────────────────────────────────

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

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function ensureBackup(filePath) {
    if (!CONFIG.backupDir) return filePath;
    const rel = path.relative(path.join(PROJECT_ROOT, 'images'), filePath);
    const backupPath = path.join(PROJECT_ROOT, CONFIG.backupDir, rel);
    
    // Jeśli to już plik wygenerowany wariantu (np -600w), pomiń
    if (/-\d+w\.(webp|jpg|jpeg|png)$/i.test(filePath)) return null;

    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
    }
    // Zawsze zwracaj plik z backupu jako źródło, jeśli istnieje
    return fs.existsSync(backupPath) ? backupPath : filePath;
}

function formatKB(bytes) {
    if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(0) + ' KB';
}

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);

    // Pomiń pliki wewnątrz podkatalogów wariantowych oraz nieobsługiwane rozszerzenia
    if (/-\d+w$/i.test(baseName)) return null;
    if (!CONFIG.inputExts.includes(ext)) return null;

    const sourcePath = await ensureBackup(filePath);
    if (!sourcePath) return null;

    const sizeBefore = fs.statSync(sourcePath).size;
    const results = [];
    const dirName = path.dirname(filePath);

    // Dedykowany podkatalog dla danego obrazu, np. images/gallery/project1/
    const targetDir = path.join(dirName, baseName);
    fs.mkdirSync(targetDir, { recursive: true });

    console.log(`   Optymalizacja i ostrzenie obrazu: ${baseName}`);

    // Przetwarzanie dla każdego rozmiaru (600w, 1200w, 1920w) wewnątrz podkatalogu obrazu
    for (const targetWidth of CONFIG.sizes) {
        // WebP z filtrującym ostrzeniem Lanczos3 + .sharpen()
        if (CONFIG.generateWebp) {
            const webpName = `${targetWidth}w.webp`;
            const webpOutPath = path.join(targetDir, webpName);
            await sharp(sourcePath)
                .rotate() // Auto-orientacja EXIF
                .resize(targetWidth, targetWidth, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    kernel: sharp.kernel.lanczos3,
                })
                .sharpen({ sigma: 0.8, m1: 0.5, m2: 2.0 }) // Filtry zwiększające ostrość miniatur
                .webp({ quality: CONFIG.webpQuality, smartSubsample: true })
                .toFile(webpOutPath);

            const webpSize = fs.statSync(webpOutPath).size;
            results.push({
                file: `${baseName}/${webpName}`,
                type: 'WebP',
                width: targetWidth,
                before: sizeBefore,
                after: webpSize,
            });
        }

        // JPEG / PNG z ostrzeniem
        if (CONFIG.optimizeJpeg) {
            const jpgName = `${targetWidth}w.jpg`;
            const jpgOutPath = path.join(targetDir, jpgName);
            await sharp(sourcePath)
                .rotate()
                .resize(targetWidth, targetWidth, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    kernel: sharp.kernel.lanczos3,
                })
                .sharpen({ sigma: 0.8, m1: 0.5, m2: 2.0 })
                .jpeg({ quality: CONFIG.jpegQuality, mozjpeg: true })
                .toFile(jpgOutPath);

            const jpgSize = fs.statSync(jpgOutPath).size;
            results.push({
                file: `${baseName}/${jpgName}`,
                type: 'JPEG',
                width: targetWidth,
                before: sizeBefore,
                after: jpgSize,
            });
        }
    }

    // Wygeneruj domyślny plik full.webp i full.jpg
    if (CONFIG.generateWebp) {
        const fullWebpPath = path.join(targetDir, 'full.webp');
        await sharp(sourcePath)
            .rotate()
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .sharpen({ sigma: 0.5 })
            .webp({ quality: CONFIG.webpQuality, smartSubsample: true })
            .toFile(fullWebpPath);
    }

    if (CONFIG.optimizeJpeg) {
        const fullJpgPath = path.join(targetDir, 'full.jpg');
        await sharp(sourcePath)
            .rotate()
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .sharpen({ sigma: 0.5 })
            .jpeg({ quality: CONFIG.jpegQuality, mozjpeg: true })
            .toFile(fullJpgPath);
    }

    // Usuń stare płaskie pliki wariantów z katalogu nadrzędnego jeśli istniały
    for (const targetWidth of CONFIG.sizes) {
        const legacyWebp = path.join(dirName, `${baseName}-${targetWidth}w.webp`);
        const legacyJpg = path.join(dirName, `${baseName}-${targetWidth}w${ext}`);
        if (fs.existsSync(legacyWebp)) fs.unlinkSync(legacyWebp);
        if (fs.existsSync(legacyJpg)) fs.unlinkSync(legacyJpg);
    }

    return results;
}

async function processDir(dirPath) {
    const absDir = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(absDir)) {
        console.warn(`  [POMINIĘTO] Katalog nie istnieje: ${dirPath}`);
        return [];
    }

    // Znajdź wyłącznie pliki będące bezpośrednio w podanym katalogu (pomiń podkatalogi i wygenerowane warianty)
    const files = fs.readdirSync(absDir)
        .filter(f => {
            const fullPath = path.join(absDir, f);
            return fs.statSync(fullPath).isFile() && CONFIG.inputExts.includes(path.extname(f).toLowerCase());
        })
        .filter(f => !/-\d+w\.(webp|jpg|jpeg|png)$/i.test(f))
        .filter(f => !['full.webp', 'full.jpg', '600w.webp', '1200w.webp', '1920w.webp', '600w.jpg', '1200w.jpg', '1920w.jpg'].includes(f))
        .map(f => path.join(absDir, f));

    const uniqueMap = {};
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        if (!uniqueMap[baseName]) {
            uniqueMap[baseName] = file;
        }
    }
    const uniqueFiles = Object.values(uniqueMap);

    const allResults = [];
    for (const file of uniqueFiles) {
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
    console.log('=== optimize-images.js (EXIF Rotation + Multi-Resolution Sizing) ===');
    console.log(`Tryb: JPEG=${CONFIG.optimizeJpeg ? 'TAK' : 'NIE'}, WebP=${CONFIG.generateWebp ? 'TAK' : 'NIE'}`);
    console.log(`Warianty szerokości: ${CONFIG.sizes.map(s => s + 'w').join(', ')}`);
    if (CONFIG.backupDir) console.log(`Katalog backupu oryginałów: ${CONFIG.backupDir}/`);
    console.log('');

    let totalOriginalBytes = 0;
    let totalThumbnailBytes = 0;
    let totalFullWebpBytes = 0;
    let fileCount = 0;

    for (const dir of CONFIG.inputDirs) {
        console.log(`📁 ${dir}`);
        const results = await processDir(dir);

        // Grupuj po oryginalnym pliku źródłowym
        const mapByWidth = {};
        for (const r of results) {
            if (!mapByWidth[r.file]) {
                const saved = r.before - r.after;
                const pct = r.before > 0 ? Math.round((saved / r.before) * 100) : 0;
                console.log(`   ${r.type.padEnd(5)} ${r.file.padEnd(32)} ${formatKB(r.before).padStart(9)} → ${formatKB(r.after).padStart(9)} (-${pct}%)`);
            }
            if (r.width === 600 && r.type === 'WebP') {
                totalThumbnailBytes += r.after;
                totalOriginalBytes += r.before;
                fileCount++;
            }
            if (r.width === 1920 && r.type === 'WebP') {
                totalFullWebpBytes += r.after;
            }
        }

        if (results.length === 0) console.log('   (brak nowych plików do przetworzenia)');
        console.log('');
    }

    console.log('─'.repeat(70));
    console.log(`Przetworzone unikalne obrazy: ${fileCount}`);
    console.log(`Początkowy rozmiar oryginałów (JPEG/PNG): ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Rozmiar kart miniatury WebP (600w):        ${(totalThumbnailBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Rozmiar pełnego WebP (1920w):               ${(totalFullWebpBytes / 1024 / 1024).toFixed(2)} MB`);
    if (totalOriginalBytes > 0) {
        const savedThumb = totalOriginalBytes - totalThumbnailBytes;
        const pctThumb = Math.round((savedThumb / totalOriginalBytes) * 100);
        console.log(`Zaoszczędzono na ładowaniu kart w sieci:    ${(savedThumb / 1024 / 1024).toFixed(2)} MB (${pctThumb}% mniej danych!)`);
    }
}

main().catch(err => {
    console.error('Błąd krytyczny:', err.message);
    process.exit(1);
});

