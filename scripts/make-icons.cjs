// Erzeugt PNG-Icons aus public/icon.svg (node scripts/make-icons.cjs)
const { chromium } = require("playwright");
const { readFileSync } = require("node:fs");
const path = require("node:path");

(async () => {

const svg = readFileSync(path.join(__dirname, "../public/icon.svg"), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["apple-icon.png", 180, 0],
  ["icon-maskable-512.png", 512, 60],
]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - pad * 2;
  await page.setContent(
    `<body style="margin:0;background:#7c3aed;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body>`,
  );
  await page.screenshot({ path: path.join(__dirname, `../public/${name}`), omitBackground: false });
}
await browser.close();
})();
