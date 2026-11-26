export interface Language {
  code: string;
  name: string;
  flag: string;
  accents: string[];
}

export const LANGUAGES: Language[] = [
  { code: "en-GB", name: "Englisch", flag: "🇬🇧", accents: [] },
  { code: "fr-FR", name: "Französisch", flag: "🇫🇷", accents: ["é", "è", "ê", "à", "â", "ç", "ô", "î", "ï", "û", "ù", "ë", "œ"] },
  { code: "es-ES", name: "Spanisch", flag: "🇪🇸", accents: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"] },
  { code: "la", name: "Latein", flag: "🏛️", accents: ["ā", "ē", "ī", "ō", "ū"] },
  { code: "it-IT", name: "Italienisch", flag: "🇮🇹", accents: ["à", "è", "é", "ì", "ò", "ù"] },
  { code: "nl-NL", name: "Niederländisch", flag: "🇳🇱", accents: ["ë", "ï", "é"] },
  { code: "ru-RU", name: "Russisch", flag: "🇷🇺", accents: [] },
  { code: "tr-TR", name: "Türkisch", flag: "🇹🇷", accents: ["ç", "ğ", "ı", "ö", "ş", "ü"] },
];

export const GERMAN_ACCENTS = ["ä", "ö", "ü", "ß"];

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? { code, name: code, flag: "🌍", accents: [] };
}

export const LIST_EMOJIS = ["📘", "🍎", "🐾", "🏠", "⚽", "🎒", "🌍", "🍕", "🎵", "🚲", "🌦️", "👕", "⏰", "🎨", "🧪", "🏰"];
