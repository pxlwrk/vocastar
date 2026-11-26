/** Kindgerechte, gut lesbare Codes wie "TIGER-482". */
export const CODE_WORDS = [
  "TIGER", "PANDA", "KOALA", "ZEBRA", "HUMMEL", "FUCHS", "OTTER", "PINGU", "DRACHE", "EULE",
  "LAMA", "ROBBE", "HASE", "BIBER", "DELFIN", "IGEL", "KATZE", "LOEWE", "MAUS", "WAL",
];

export function generateCode(rand: () => number = Math.random): string {
  const word = CODE_WORDS[Math.floor(rand() * CODE_WORDS.length)];
  const num = String(Math.floor(rand() * 900) + 100);
  return `${word}-${num}`;
}

export function normalizeCode(input: string): string {
  const up = input.toUpperCase().replace(/Ö/g, "OE").replace(/Ä/g, "AE").replace(/Ü/g, "UE").replace(/[^A-Z0-9]/g, "");
  const m = up.match(/^([A-Z]+)(\d{3})$/);
  return m ? `${m[1]}-${m[2]}` : up;
}

export function isValidCode(code: string): boolean {
  return /^[A-Z]{3,8}-\d{3}$/.test(code);
}
