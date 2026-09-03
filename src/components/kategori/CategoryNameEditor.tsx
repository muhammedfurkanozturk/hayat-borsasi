"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugifyCategoryName } from "@hayat-borsasi/shared";
import { CheckIcon, PencilIcon } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";

export function CategoryNameEditor({ categoryId, name }: { categoryId: string; name: string }) {
  const { renameCategory } = useAppData();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  async function save() {
    await renameCategory(categoryId, draft);
    setEditing(false);
    // "eksikler" envanteri madde 9 — URL kategori adına göre değiştiği için
    // (okunur slug), yeniden adlandırınca adres çubuğu da senkron kalsın diye
    // yeni slug'a yönlendiriyoruz — aksi halde adres çubuğundaki ESKİ slug
    // artık hiçbir kategoriyle eşleşmeyip sayfa "kategori bulunamadı" gibi
    // davranırdı (sayfa yenilenene kadar).
    router.replace(`/kategori/${slugifyCategoryName(draft)}`);
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="popover-in flex items-center gap-2"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && cancel()}
          className="rounded-lg border border-accent/50 bg-surface px-3 py-2 text-xl font-semibold tracking-tight text-foreground outline-none"
        />
        <button
          type="submit"
          aria-label="Kaydet"
          className="btn flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent hover:bg-accent/25"
        >
          <CheckIcon width={18} height={18} />
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className="btn group flex items-center gap-2.5 rounded-lg"
    >
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{name}</h1>
      <PencilIcon
        width={22}
        height={22}
        className="text-muted transition-colors group-hover:text-accent group-hover:scale-110"
        style={{ transitionDuration: "var(--dur-base)", transitionTimingFunction: "var(--ease-snap)" }}
      />
    </button>
  );
}
