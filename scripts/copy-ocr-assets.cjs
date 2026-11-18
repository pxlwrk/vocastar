// Kopiert Tesseract-Worker und -Engine nach public/tesseract, damit die
// Texterkennung ohne fremdes CDN läuft (läuft automatisch vor dev/build).
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const out = path.join(root, "public", "tesseract");
fs.mkdirSync(out, { recursive: true });

const worker = require.resolve("tesseract.js/dist/worker.min.js", { paths: [root] });
fs.copyFileSync(worker, path.join(out, "worker.min.js"));

const coreDir = path.dirname(require.resolve("tesseract.js-core/package.json", { paths: [root] }));
for (const f of fs.readdirSync(coreDir)) {
  if (/lstm\.(wasm\.js|js|wasm)$/.test(f)) fs.copyFileSync(path.join(coreDir, f), path.join(out, f));
}
console.log("OCR-Dateien kopiert nach public/tesseract");
