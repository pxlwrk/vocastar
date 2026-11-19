# VocaStar ⭐

Eine mobile-first Webapp, mit der Kinder spielerisch Vokabeln lernen. Begleitet werden sie von **Voki**, einer kleinen Eule, die lobt, ermutigt und durch die App führt.

## Funktionen

- **Ohne Anmeldung, für mehrere Personen:** Beim Start wählt jedes Kind sein Profil (Tier-Avatar, Farbe, Name). Alle Daten liegen lokal im Browser (IndexedDB).
- **Klassenstufen 5 und 7:** Profile und Listen werden einer Klassenstufe zugeordnet; die Startseite zeigt zuerst die passenden Listen. Weitere Stufen lassen sich in `src/lib/levels.ts` ergänzen.
- **Einstellbare Schwierigkeit** (unabhängig von der Klasse), im Profil und vor jedem Spiel umschaltbar:

  | | 🐣 Leicht | 🦊 Mittel | 🦁 Schwer |
  |---|---|---|---|
  | Antwortoptionen | 3 | 4 | 5, ähnliche Wörter |
  | Tippfehler beim Schreiben | bis 2 | 1 | keine, Akzente zählen |
  | Richtung | Fremdsprache → Deutsch | Deutsch → Fremdsprache | gemischt |
  | Memory-Paare | 4 | 6 | 8 |
  | Blitzrunde | 90 s | 60 s | 45 s |
  | XP-Bonus | ×1 | ×1,5 | ×2 |

- **Vokabeln eingeben:** manuell (schnelle Eingabe mit Enter und Akzent-Tasten), per **Foto** (mehrere Fotos auf einmal) oder per **Text einfügen**. Vor dem Speichern prüft man alles in einer bearbeitbaren Tabelle.
- **7 Spiele:** Karteikarten (mit Wischen), Quiz, Memory, Buchstabensalat, Schreiben, Hör-Quiz und Blitzrunde.
- **Lernsystem:** Leitner-Karteikasten mit 5 Fächern; fällige und schwierige Wörter kommen zuerst dran.
- **Gamification:** XP und Level, 1 bis 3 Sterne pro Runde, Combo-Bonus, tägliche Serie 🔥, Tagesziel 🎯, 15 Abzeichen, Schatzladen mit Avatar-Extras und eine freundliche Familien-Bestenliste.
- **Sprachausgabe** über die Web Speech API, mit Sprechtempo „Schildkröte“ oder „Hase“.
- **Teilen & Sync:** Listen per Code teilen (z. B. `TIGER-482`) und Profile auf ein anderes Gerät übertragen. Zusätzlich gibt es eine Sicherung als JSON-Datei.
- **Elternbereich** hinter einer Rechenaufgabe: Profile verwalten, sichern, Sync-Codes erzeugen, Datenschutz-Infos.
- **PWA:** auf dem Homescreen installierbar; die App-Hülle funktioniert auch offline.

Sprachen: Englisch, Französisch, Spanisch, Latein, Italienisch, Niederländisch, Russisch und Türkisch (jeweils mit Deutsch).

## Entwicklung

```bash
npm install
npm run dev
```

Dann <http://localhost:3000> öffnen, am besten in der Handy-Ansicht der Entwicklertools.

```bash
npm test           # Unit-Tests (Vitest)
npm run lint       # ESLint
npm run build      # Produktions-Build
node e2e/smoke.cjs http://localhost:3000   # Rundgang mit Playwright (laufender Server nötig)
```

## Optionale Dienste

Die App funktioniert ohne jede Konfiguration. Zwei Funktionen werden besser, wenn Umgebungsvariablen gesetzt sind (siehe `.env.example`):

| Variable | Wirkung |
|---|---|
| `ANTHROPIC_API_KEY` | Fotos werden mit Claude ausgewertet (Standard: Claude Haiku 5.5, per `ANTHROPIC_OCR_MODEL` änderbar). Das klappt auch bei Schulbuchseiten mit Lautschrift und mehreren Spalten zuverlässig. Ohne Schlüssel läuft die Erkennung mit Tesseract.js direkt im Browser. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Aktiviert das Teilen von Listen und Sync-Codes für Profile. Die Variablen `KV_REST_API_URL`/`KV_REST_API_TOKEN` aus der Vercel-Integration werden ebenfalls erkannt. Codes gelten 180 Tage. |
| `NEXT_PUBLIC_TESSDATA_URL` | Eigene Quelle für die Tesseract-Sprachdaten (Standard: jsDelivr). |

## Deployment auf Vercel

1. Repository in Vercel importieren (Framework: Next.js, keine weiteren Einstellungen nötig).
2. Optional unter *Storage* eine **Upstash Redis**-Datenbank aus dem Marketplace verbinden. Die Variablen werden automatisch gesetzt.
3. Optional `ANTHROPIC_API_KEY` als Umgebungsvariable hinterlegen.

## Datenschutz

- Keine Konten, kein Tracking. Lernstände liegen nur im Browser des Geräts.
- Beim Teilen oder Synchronisieren wird eine Kopie (Vorname, Listen, Lernstand) für 180 Tage im Redis-Speicher abgelegt.
- Beim KI-Fotoimport wird das Foto einmalig an die Claude API übertragen und nicht gespeichert.

## Aufbau

```
src/app/            Seiten (Profilauswahl, Start, Listen, Spiele, Erfolge, Eltern, Teilen) und API-Routen
src/components/     Oberfläche, Voki, Spiele (src/components/games)
src/lib/            Datenbank (Dexie), Leitner, Schwierigkeit, Gamification, Sprache, OCR
e2e/smoke.cjs       Klick-Rundgang im iPhone-Format
```
