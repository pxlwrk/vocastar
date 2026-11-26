"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useCurrentProfileId } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { Voki, type VokiMood } from "./Voki";

/** Voki im Outfit des aktuellen Profils. */
export function MyVoki(props: { mood?: VokiMood; size?: number; className?: string }) {
  const id = useCurrentProfileId();
  const outfit = useLiveQuery(async () => (id ? (await db.profiles.get(id))?.outfit : undefined), [id]);
  return <Voki {...props} outfit={outfit} />;
}
