"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Start", icon: "🏠" },
  { href: "/listen", label: "Listen", icon: "📚" },
  { href: "/erfolge", label: "Erfolge", icon: "🏆" },
  { href: "/einstellungen", label: "Ich", icon: "⚙️" },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t-2 border-line safe-bottom">
      <ul className="mx-auto max-w-xl grid grid-cols-4">
        {TABS.map((t) => {
          const active = path === t.href || (t.href !== "/home" && path.startsWith(t.href));
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 pt-2 pb-1 min-h-14 font-display text-sm transition ${
                  active ? "text-primary" : "text-ink-soft"
                }`}
              >
                <span className={`text-2xl transition ${active ? "scale-115" : "grayscale-40"}`} aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
