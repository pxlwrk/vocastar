"use client";
import { useSyncExternalStore } from "react";

const KEY = "vocastar.currentProfile";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}
let memory: string | null = null;

export function setCurrentProfileId(id: string | null) {
  memory = id;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* privater Modus */
  }
  listeners.forEach((l) => l());
}

export function useCurrentProfileId(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}
