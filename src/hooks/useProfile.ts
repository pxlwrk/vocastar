"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { db } from "@/lib/db";
import { useCurrentProfileId } from "@/lib/current-profile";
import { setSoundEnabled } from "@/lib/sound";
import { setVoicePreference } from "@/lib/speech";
import type { Profile } from "@/lib/types";

/** Aktuelles Profil; leitet zur Profilauswahl, wenn keins gewählt ist. */
export function useProfile(): Profile | undefined {
  const id = useCurrentProfileId();
  const router = useRouter();
  const profile = useLiveQuery(async () => (id ? ((await db.profiles.get(id)) ?? null) : null), [id]);
  useEffect(() => {
    if (!id || profile === null) router.replace("/");
  }, [id, profile, router]);
  useEffect(() => {
    if (profile) {
      setSoundEnabled(profile.settings.sound);
      setVoicePreference(profile.settings.voice);
    }
  }, [profile]);
  return profile ?? undefined;
}
