"use client";
import { use, type ReactNode } from "react";
import { browser } from "react-dom";

/** Alle Daten liegen lokal (IndexedDB), daher rendert die App erst im Browser. */
export function BrowserGate({ children }: { children: ReactNode }) {
  use(browser("VocaStar speichert alle Daten lokal im Browser."));
  return <>{children}</>;
}
