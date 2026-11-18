// End-to-End-Rundgang im Handy-Format: node e2e/smoke.cjs [baseUrl] [screenshotDir]
const { chromium, devices } = require("playwright");
const fs = require("node:fs");

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3];
if (OUT) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const shot = async (name) => OUT && page.screenshot({ path: `${OUT}/${name}.png` });
  const step = (s) => console.log("•", s);

  step("Profilauswahl");
  await page.goto(BASE);
  await page.getByText("Neues Profil").click();
  await shot("01-start");

  step("Profil-Wizard");
  await page.getByLabel("Dein Vorname").fill("Mia");
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByLabel("Tier 🐼").click();
  await shot("02-wizard-tier");
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("radio", { name: "Klasse 7" }).click();
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("radio", { name: /Leicht/ }).click();
  await page.getByRole("button", { name: /Los geht/ }).click();
  await page.waitForURL("**/home**");
  await page.getByText("Willkommen, Mia").waitFor();
  await shot("03-home-leer");

  step("Liste anlegen");
  await page.getByRole("link", { name: /Erste Liste anlegen/ }).click();
  await page.getByLabel("Name der Liste").fill("Unit 1: Animals");
  await page.getByRole("button", { name: /Englisch/ }).click();
  await page.getByRole("button", { name: "Bild 🐾" }).click();
  await shot("04-neue-liste");
  await page.getByRole("button", { name: /Wörter eintippen/ }).click();
  await page.waitForURL(/\/listen\/[^/]+\?neu=1/);

  step("Wörter manuell eingeben");
  const vocab = [
    ["the dog", "der Hund"],
    ["the cat", "die Katze"],
    ["the bird", "der Vogel"],
    ["the horse", "das Pferd"],
    ["the mouse", "die Maus"],
    ["the fish", "der Fisch"],
  ];
  for (const [en, de] of vocab) {
    await page.locator("#w-foreign").fill(en);
    await page.locator("#w-foreign").press("Enter");
    await page.locator("#w-de").fill(de);
    await page.locator("#w-de").press("Enter");
  }
  await page.getByText("6 Wörter").waitFor({ timeout: 5000 }).catch(async (e) => { await page.screenshot({ path: "/tmp/claude-0/-home-user-vocastar/31570639-857d-5bf4-a32f-2da0cf27c767/scratchpad/fail.png" }); console.log((await page.locator("body").innerText()).slice(0, 800)); throw e; });
  await shot("05-liste");

  step("Text-Import (Bulk)");
  const listUrl = page.url().split("?")[0];
  await page.getByRole("link", { name: "📸 Foto" }).click();
  await page.getByText("Oder Text einfügen").click();
  await page.locator("textarea").fill("the rabbit - das Kaninchen\nthe cow = die Kuh\nthe pig\tdas Schwein");
  await page.getByRole("button", { name: "Übernehmen" }).click();
  await page.getByRole("button", { name: /3 Wörter speichern/ }).waitFor();
  await shot("06-import-pruefen");
  await page.getByRole("button", { name: /3 Wörter speichern/ }).click();
  await page.waitForURL(listUrl);
  await page.getByText("9 Wörter").waitFor();

  step("Spielmenü");
  await page.getByRole("link", { name: /Spielen!/ }).click();
  await page.getByText("Welches Spiel").waitFor();
  await shot("07-spielmenue");

  const words = Object.fromEntries([...vocab, ["the rabbit", "das Kaninchen"], ["the cow", "die Kuh"], ["the pig", "das Schwein"]]);
  const reverse = Object.fromEntries(Object.entries(words).map(([a, b]) => [b, a]));

  step("Quiz (Leicht: Englisch → Deutsch)");
  await page.getByRole("link", { name: /^Quiz/ }).click();
  for (let i = 0; i < 8; i++) {
    const prompt = (await page.locator(".card .font-display.text-4xl").filter({ visible: true }).first().textContent()).trim();
    const answer = words[prompt] ?? reverse[prompt];
    if (i === 0) await shot("08-quiz");
    if (i === 2) {
      // absichtlich falsch
      const wrong = page.locator("button.min-h-16").filter({ hasNotText: answer }).first();
      await wrong.click();
      await page.getByRole("button", { name: /Weiter/ }).click();
    } else {
      await page.getByRole("button", { name: answer, exact: true }).click();
    }
    await page.waitForTimeout(1000);
  }
  await page.getByText(/Sterne|richtig/).first().waitFor();
  const score = await page.locator("text=/\\d+\\/\\d+/").filter({ visible: true }).first().textContent();
  if (score.trim() !== "7/8") throw new Error("Quiz-Ergebnis falsch: " + score);
  await page.waitForTimeout(1600);
  await shot("09-ergebnis");

  step("Schwierigkeit umstellen und Schreiben spielen");
  await page.getByRole("link", { name: /Anderes Spiel/ }).click();
  await page.getByRole("radio", { name: /Mittel/ }).click();
  await page.getByRole("link", { name: /Schreiben/ }).click();
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(300);
    if (await page.getByText("Nochmal spielen").filter({ visible: true }).isVisible()) break;
    const prompt = (await page.locator(".card .font-display.text-4xl").filter({ visible: true }).first().textContent()).trim();
    const answer = words[prompt] ?? reverse[prompt];
    await page.getByLabel("Deine Antwort").fill(i === 1 ? answer.slice(0, -1) : answer);
    if (i === 0) await shot("10-schreiben");
    await page.getByRole("button", { name: /Prüfen/ }).click();
    const next = page.getByRole("button", { name: /Weiter/ });
    if (await next.isVisible().catch(() => false)) {
      if (i === 1) await shot("11-fast-richtig");
      await next.click();
    }
    await page.waitForTimeout(1000);
  }
  await page.getByText("Nochmal spielen").filter({ visible: true }).waitFor();

  step("Memory");
  await page.getByRole("link", { name: /Anderes Spiel/ }).click();
  await page.getByRole("link", { name: /Memory/ }).click();
  await page.waitForTimeout(500);
  await shot("12-memory");
  // Kartentexte stehen auf der Rückseite im DOM: Paare gezielt aufdecken
  const cards = page.locator("button.flip-scene").filter({ visible: true });
  const texts = (await cards.allTextContents()).map((t) => t.replace("⭐", "").trim());
  const used = new Set();
  let firstMiss = true;
  for (let i = 0; i < texts.length; i++) {
    if (used.has(i)) continue;
    const partner = words[texts[i]] ?? reverse[texts[i]];
    const j = texts.findIndex((t, k) => k !== i && !used.has(k) && t === partner);
    if (firstMiss) {
      // einmal absichtlich daneben tippen
      const wrong = texts.findIndex((t, k) => k !== i && k !== j && !used.has(k));
      await cards.nth(i).click();
      await cards.nth(wrong).click();
      await page.waitForTimeout(1200);
      firstMiss = false;
    }
    await cards.nth(i).click();
    await cards.nth(j).click();
    used.add(i).add(j);
    await page.waitForTimeout(250);
    if (used.size === 4) await shot("12b-memory-halb");
  }
  await page.getByText("Nochmal spielen").filter({ visible: true }).waitFor({ timeout: 20000 });

  step("Buchstabensalat und Karteikarten kurz öffnen");
  for (const name of [/Buchstabensalat/, /Karteikarten/, /Hör-Quiz/, /Blitzrunde/]) {
    await page.goto(listUrl.replace("/listen/", "/spielen/"));
    await page.getByRole("link", { name }).click();
    await page.waitForTimeout(1200);
    await shot(`13-${String(name).replace(/\W/g, "")}`);
  }

  step("Erfolge und Schatzladen");
  await page.goto(BASE + "/erfolge");
  await page.getByText("Level").first().waitFor();
  await shot("14-erfolge");
  await page.getByRole("button", { name: /Schatzladen/ }).click();
  await shot("15-laden");

  step("Zweites Profil, Datentrennung");
  await page.goto(BASE + "/einstellungen");
  await page.getByRole("button", { name: /Profil wechseln/ }).click();
  await page.getByText("Neues Profil").click();
  await page.getByLabel("Dein Vorname").fill("Ben");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: /Los geht/ }).click();
  await page.waitForURL("**/home**");
  const benLists = await page.getByText("Unit 1: Animals").count();
  if (benLists !== 0) throw new Error("Bens Profil sieht Mias Liste");
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: /Mia/ }).filter({ visible: true }).waitFor();
  await page.getByRole("button", { name: /Ben/ }).filter({ visible: true }).waitFor();
  await page.waitForTimeout(600);
  await shot("16-profilauswahl");

  step("Elternbereich");
  await page.goto(BASE + "/eltern");
  const task = await page.locator(".text-4xl.font-bold").textContent();
  const [a, b] = task.match(/\d+/g).map(Number);
  await page.getByLabel("Ergebnis").fill(String(a * b));
  await page.getByRole("button", { name: "Öffnen" }).click();
  await page.getByText("Profile auf diesem Gerät").waitFor();
  await shot("17-eltern");

  await browser.close();
  const relevant = errors.filter((e) => !/favicon|Failed to load resource.*(404|501)/.test(e));
  if (relevant.length) {
    console.log("Konsolenfehler:\n" + relevant.join("\n"));
    process.exitCode = 1;
  } else console.log("✓ Rundgang erfolgreich");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
