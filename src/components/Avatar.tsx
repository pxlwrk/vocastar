import { FRAME_STYLES } from "@/lib/shop";
import type { Profile } from "@/lib/types";

export function Avatar({
  profile,
  size = 64,
  className = "",
}: {
  profile: Pick<Profile, "avatar" | "color" | "frame">;
  size?: number;
  className?: string;
}) {
  const frame = profile.frame ? FRAME_STYLES[profile.frame] : undefined;
  const ring = frame ? Math.max(3, Math.round(size * 0.08)) : 0;
  const inner = size - ring * 2;
  const face = (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${frame ? "" : className}`}
      style={{
        width: inner,
        height: inner,
        background: profile.color,
        boxShadow: `inset 0 -${inner / 14}px 0 #00000022`,
      }}
    >
      <span style={{ fontSize: inner * 0.58, lineHeight: 1 }} aria-hidden>
        {profile.avatar}
      </span>
    </div>
  );
  if (!frame) return face;
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, padding: ring, background: frame, boxShadow: "0 3px 8px #00000025" }}
    >
      {face}
    </div>
  );
}
