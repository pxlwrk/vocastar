"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Page({ children, tabs = true, className = "" }: { children: ReactNode; tabs?: boolean; className?: string }) {
  return (
    <main className={`mx-auto w-full max-w-xl px-4 pt-4 ${tabs ? "pb-28" : "pb-10"} ${className}`}>{children}</main>
  );
}

export function Header({ title, back, right }: { title: ReactNode; back?: string | true; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-3 mb-4 min-h-12">
      {back &&
        (back === true ? (
          <button onClick={() => router.back()} className="btn btn-ghost !min-h-11 !px-3 !text-xl" aria-label="Zurück">
            ←
          </button>
        ) : (
          <Link href={back} className="btn btn-ghost !min-h-11 !px-3 !text-xl" aria-label="Zurück">
            ←
          </Link>
        ))}
      <h1 className="font-display text-2xl font-semibold flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}

export function ProgressBar({ value, max, color = "var(--mint)", className = "" }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-4 rounded-full bg-black/8 overflow-hidden ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full transition-all duration-500 relative" style={{ width: `${pct}%`, background: color }}>
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white border-2 border-line px-3 py-1 font-display text-sm font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose?: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5 anim-slide-up max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
