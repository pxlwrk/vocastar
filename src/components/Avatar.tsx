import { SHOP_ITEMS } from "@/lib/gamification";
import type { Profile } from "@/lib/types";

export function Avatar({
  profile,
  size = 64,
  className = "",
}: {
  profile: Pick<Profile, "avatar" | "color" | "equippedItem">;
  size?: number;
  className?: string;
}) {
  const item = SHOP_ITEMS.find((i) => i.id === profile.equippedItem);
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: profile.color,
        boxShadow: `inset 0 -${size / 14}px 0 #00000022`,
      }}
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }} aria-hidden>
        {profile.avatar}
      </span>
      {item && (
        <span
          className="absolute"
          style={{ fontSize: size * 0.34, top: -size * 0.12, right: -size * 0.08, lineHeight: 1 }}
          aria-hidden
        >
          {item.emoji}
        </span>
      )}
    </div>
  );
}
