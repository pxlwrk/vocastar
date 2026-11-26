"use client";
import { useRouter } from "next/navigation";
import { ListMetaForm } from "@/components/ListMetaForm";
import { Header, Page } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { createList } from "@/lib/repo";

export default function NewList() {
  const profile = useProfile();
  const router = useRouter();
  if (!profile) return null;
  return (
    <Page tabs={false}>
      <Header title="Neue Liste" back />
      <div className="card p-5">
        <ListMetaForm
          initial={{ title: "", targetLang: "en-GB", grade: profile.grade, emoji: "📘" }}
          submitLabel="✏️ Weiter: Wörter eintippen"
          extraActions={[{ id: "foto", label: "📸 Weiter: Wörter fotografieren" }]}
          onSubmit={async (meta, action) => {
            const list = await createList({ profileId: profile.id, ...meta });
            router.replace(action === "foto" ? `/listen/${list.id}/foto` : `/listen/${list.id}?neu=1`);
          }}
        />
      </div>
    </Page>
  );
}
