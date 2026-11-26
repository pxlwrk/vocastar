"use client";
import { useState } from "react";
import { levelFromXp } from "@/lib/gamification";
import { buyItem, toggleItem } from "@/lib/repo";
import { isEquipped, SHOP_ITEMS, type ShopCategory, type ShopItem, type VokiOutfit } from "@/lib/shop";
import { sfx } from "@/lib/sound";
import type { Profile } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Modal, Pill } from "./ui";
import { SpeechBubble, Voki } from "./Voki";

const CATEGORIES: { id: ShopCategory; label: string; hint: string }[] = [
  { id: "voki", label: "🦉 Voki", hint: "Zieh Voki Hüte, Brillen und mehr an!" },
  { id: "rahmen", label: "🖼️ Rahmen", hint: "Ein glänzender Rahmen für deinen Avatar." },
  { id: "tiere", label: "🐾 Tiere", hint: "Seltene Tiere als neuer Avatar." },
];

function outfitWith(base: VokiOutfit | undefined, item: ShopItem): VokiOutfit {
  return item.slot ? { ...base, [item.slot]: item.id } : (base ?? {});
}

function ItemPreview({ item, profile, size }: { item: ShopItem; profile: Profile; size: number }) {
  if (item.category === "voki") return <Voki outfit={outfitWith({}, item)} size={size} />;
  if (item.category === "rahmen") return <Avatar profile={{ ...profile, frame: item.id }} size={size} />;
  return <Avatar profile={{ ...profile, avatar: item.emoji, frame: undefined }} size={size} />;
}

export function ShopView({ profile }: { profile: Profile }) {
  const [cat, setCat] = useState<ShopCategory>("voki");
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const level = levelFromXp(profile.xp).level;
  const info = CATEGORIES.find((c) => c.id === cat)!;
  const items = SHOP_ITEMS.filter((i) => i.category === cat);

  async function onTap(item: ShopItem) {
    const owned = profile.unlockedItems.includes(item.id);
    if (!owned) {
      setSelected(item);
      return;
    }
    if (item.category === "tiere" && isEquipped(profile, item)) return;
    sfx.tap();
    await toggleItem(profile.id, item.id, profile.avatar);
  }

  async function buy(item: ShopItem) {
    const r = await buyItem(profile.id, item.id);
    if (r === "ok") {
      sfx.coin();
      setMessage(`${item.name} gehört jetzt dir!`);
    }
    setSelected(null);
  }

  const sel = selected;
  const selLocked = sel ? level < (sel.minLevel ?? 1) : false;

  return (
    <>
      {/* Vorschau: so sieht es gerade aus */}
      <div className="card p-4 mb-4 flex items-end justify-around gap-2 !bg-gradient-to-b from-white to-bg-soft">
        <div className="flex flex-col items-center">
          <Voki mood={message ? "cheer" : "happy"} outfit={profile.outfit} size={104} className="anim-float" />
          <span className="text-xs font-bold text-ink-soft">Voki</span>
        </div>
        <div className="flex flex-col items-center gap-1 pb-4">
          <Avatar profile={profile} size={76} />
          <span className="text-xs font-bold text-ink-soft">{profile.name}</span>
        </div>
        <div className="flex flex-col items-center pb-6">
          <Pill className="!text-base">
            {profile.stars} <span aria-hidden>⭐</span>
          </Pill>
          <span className="text-xs font-bold text-ink-soft mt-1">Level {level}</span>
        </div>
      </div>
      {message && (
        <div className="mb-3">
          <SpeechBubble className="text-center">{message}</SpeechBubble>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCat(c.id);
              setMessage(null);
            }}
            className={`rounded-full px-2 py-2 font-display font-semibold border-2 whitespace-nowrap ${
              cat === c.id ? "bg-primary text-white border-primary" : "bg-white border-line"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-center font-semibold text-ink-soft mb-3">{info.hint}</p>

      <div className="grid grid-cols-3 gap-3">
        {items.map((it) => {
          const owned = profile.unlockedItems.includes(it.id);
          const equipped = owned && isEquipped(profile, it);
          const locked = !owned && level < (it.minLevel ?? 1);
          return (
            <button
              key={it.id}
              onClick={() => void onTap(it)}
              className={`card p-2 pt-3 flex flex-col items-center gap-1 active:scale-95 transition relative ${
                equipped ? "!border-primary !bg-primary/10" : ""
              } ${locked ? "opacity-60" : ""}`}
            >
              <div className={`h-16 flex items-center justify-center ${locked ? "grayscale" : ""}`}>
                <ItemPreview item={it} profile={profile} size={it.category === "voki" ? 58 : 56} />
              </div>
              <span className="font-display font-semibold leading-tight text-center">{it.name}</span>
              {owned ? (
                <Pill className={equipped ? "!bg-primary !text-white !border-primary" : ""}>
                  {equipped ? (it.category === "tiere" ? "Aktiv" : "An ✓") : it.category === "tiere" ? "Wählen" : "Anziehen"}
                </Pill>
              ) : locked ? (
                <Pill className="whitespace-nowrap">🔒 Lv {it.minLevel}</Pill>
              ) : (
                <Pill className={profile.stars >= it.price ? "" : "opacity-60"}>{it.price} ⭐</Pill>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-ink-soft font-semibold mt-4">
        Sterne bekommst du für jede Runde. Je höher dein Level, desto mehr Schätze werden freigeschaltet!
      </p>

      <Modal open={!!sel} onClose={() => setSelected(null)}>
        {sel && (
          <div className="text-center">
            <div className="flex justify-center items-end gap-4 mb-2 anim-pop">
              {sel.category === "voki" ? (
                <Voki outfit={outfitWith(profile.outfit, sel)} mood="cheer" size={130} />
              ) : (
                <ItemPreview item={sel} profile={profile} size={110} />
              )}
            </div>
            <h2 className="font-display text-2xl font-semibold mb-1">{sel.name}</h2>
            {selLocked ? (
              <>
                <p className="font-semibold text-ink-soft mb-4">
                  Gibt es ab <b>Level {sel.minLevel}</b>. Du bist Level {level}. Weiter so, du schaffst das!
                </p>
                <button className="btn w-full" onClick={() => setSelected(null)}>
                  Okay
                </button>
              </>
            ) : profile.stars >= sel.price ? (
              <>
                <p className="font-semibold text-ink-soft mb-4">Für {sel.price} ⭐ kaufen?</p>
                <div className="flex gap-2">
                  <button className="btn btn-ghost flex-1" onClick={() => setSelected(null)}>
                    Nein
                  </button>
                  <button className="btn btn-sun flex-1" onClick={() => void buy(sel)}>
                    Kaufen!
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-ink-soft mb-4">
                  Dir fehlen noch {sel.price - profile.stars} ⭐. Spiel ein paar Runden, dann klappt&apos;s!
                </p>
                <button className="btn w-full" onClick={() => setSelected(null)}>
                  Okay
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

