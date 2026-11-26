import type { Profile } from "./types";

export type ShopCategory = "voki" | "rahmen" | "tiere";
export type VokiSlot = "head" | "eyes" | "neck";

export interface ShopItem {
  id: string;
  name: string;
  /** Symbol für die Ladenliste; bei Tieren zugleich der Avatar */
  emoji: string;
  price: number;
  category: ShopCategory;
  slot?: VokiSlot;
  /** Erst ab diesem Level kaufbar */
  minLevel?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Voki anziehen (wird direkt in die Eule gezeichnet)
  { id: "cap", name: "Kappe", emoji: "🧢", price: 5, category: "voki", slot: "head" },
  { id: "bowtie", name: "Fliege", emoji: "🎀", price: 8, category: "voki", slot: "neck" },
  { id: "glasses", name: "Brille", emoji: "👓", price: 10, category: "voki", slot: "eyes" },
  { id: "scarf", name: "Schal", emoji: "🧣", price: 15, category: "voki", slot: "neck" },
  { id: "party", name: "Partyhut", emoji: "🥳", price: 20, category: "voki", slot: "head", minLevel: 2 },
  { id: "sunglasses", name: "Sonnenbrille", emoji: "🕶️", price: 25, category: "voki", slot: "eyes", minLevel: 3 },
  { id: "headphones", name: "Kopfhörer", emoji: "🎧", price: 30, category: "voki", slot: "head", minLevel: 4 },
  { id: "flowercrown", name: "Blumenkranz", emoji: "🌸", price: 35, category: "voki", slot: "head", minLevel: 5 },
  { id: "tophat", name: "Zylinder", emoji: "🎩", price: 45, category: "voki", slot: "head", minLevel: 6 },
  { id: "crown", name: "Krone", emoji: "👑", price: 70, category: "voki", slot: "head", minLevel: 8 },
  // Rahmen für den eigenen Avatar
  { id: "frame-sun", name: "Sonne", emoji: "🌞", price: 10, category: "rahmen" },
  { id: "frame-ocean", name: "Ozean", emoji: "🌊", price: 15, category: "rahmen", minLevel: 2 },
  { id: "frame-rainbow", name: "Regenbogen", emoji: "🌈", price: 30, category: "rahmen", minLevel: 4 },
  { id: "frame-galaxy", name: "Galaxie", emoji: "🌌", price: 45, category: "rahmen", minLevel: 6 },
  { id: "frame-gold", name: "Gold", emoji: "🏅", price: 80, category: "rahmen", minLevel: 9 },
  // Spezialtiere als neuer Avatar
  { id: "otter", name: "Otter", emoji: "🦦", price: 15, category: "tiere" },
  { id: "flamingo", name: "Flamingo", emoji: "🦩", price: 20, category: "tiere", minLevel: 2 },
  { id: "whale", name: "Wal", emoji: "🐳", price: 30, category: "tiere", minLevel: 3 },
  { id: "peacock", name: "Pfau", emoji: "🦚", price: 40, category: "tiere", minLevel: 5 },
  { id: "sloth", name: "Faultier", emoji: "🦥", price: 50, category: "tiere", minLevel: 7 },
  { id: "dragon", name: "Drache", emoji: "🐉", price: 90, category: "tiere", minLevel: 10 },
];

export const FRAME_STYLES: Record<string, string> = {
  "frame-sun": "linear-gradient(135deg, #ffe066, #ff9f1c)",
  "frame-ocean": "linear-gradient(135deg, #38bdf8, #22c55e)",
  "frame-rainbow": "conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)",
  "frame-galaxy":
    "radial-gradient(circle at 25% 30%, #fff 0 3%, transparent 4%), radial-gradient(circle at 75% 70%, #fff 0 2%, transparent 3%), radial-gradient(circle at 70% 20%, #fff 0 2%, transparent 3%), linear-gradient(135deg, #1e1b4b, #7c3aed, #db2777)",
  "frame-gold": "conic-gradient(#fde68a, #d97706, #fef3c7, #b45309, #fde68a)",
};

export type VokiOutfit = Partial<Record<VokiSlot, string>>;

export function getItem(id: string | undefined): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export function isEquipped(p: Pick<Profile, "outfit" | "frame" | "avatar">, item: ShopItem): boolean {
  if (item.category === "voki") return !!item.slot && p.outfit?.[item.slot] === item.id;
  if (item.category === "rahmen") return p.frame === item.id;
  return p.avatar === item.emoji;
}

/** Änderungen am Profil zum An- bzw. Ausziehen eines Gegenstands. */
export function toggleEquipChanges(
  p: Pick<Profile, "outfit" | "frame" | "avatar">,
  item: ShopItem,
  fallbackAvatar: string,
): Partial<Profile> {
  const on = isEquipped(p, item);
  if (item.category === "voki" && item.slot) {
    return { outfit: { ...p.outfit, [item.slot]: on ? undefined : item.id } };
  }
  if (item.category === "rahmen") return { frame: on ? undefined : item.id };
  return { avatar: on ? fallbackAvatar : item.emoji };
}

// Frühere Ladenartikel (Emoji-Accessoires) auf die neuen abbilden
const LEGACY_MAP: Record<string, string> = {
  cap: "cap",
  bow: "bowtie",
  glasses: "sunglasses",
  flower: "flowercrown",
  tophat: "tophat",
  headphones: "headphones",
  crown: "crown",
};
const LEGACY_REFUND: Record<string, number> = { rocket: 60, unicorn: 80 };

type LegacyProfile = Profile & { equippedItem?: string };

/** Bringt Profile aus älteren Versionen auf den neuen Laden; nicht übertragbare Käufe werden erstattet. */
export function migrateProfile(p: LegacyProfile): Profile {
  // Profile ab dieser Version haben immer ein outfit-Objekt
  if (p.outfit) return p;
  const known = new Set(SHOP_ITEMS.map((i) => i.id));
  let refund = 0;
  const items = new Set<string>();
  for (const id of p.unlockedItems) {
    if (LEGACY_MAP[id]) items.add(LEGACY_MAP[id]);
    else if (LEGACY_REFUND[id]) refund += LEGACY_REFUND[id];
    else if (known.has(id)) items.add(id);
  }
  const outfit: VokiOutfit = {};
  const equipped = getItem(LEGACY_MAP[p.equippedItem ?? ""]);
  if (equipped?.slot) outfit[equipped.slot] = equipped.id;
  const next = { ...p, unlockedItems: [...items], stars: p.stars + refund, outfit };
  delete (next as LegacyProfile).equippedItem;
  return next;
}
