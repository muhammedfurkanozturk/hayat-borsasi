"use client";

import { useState } from "react";
import { CheckIcon, PencilIcon } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";

export function CategoryNameEditor({ categoryId, name }: { categoryId: string; name: string }) {
  const { renameCategory } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  async function save() {
    await renameCategory(categoryId, draft);
    setEditing(false);
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
        className="flex items-center gap-2"
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
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent hover:bg-accent/25"
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
      className="group flex items-center gap-2.5"
    >
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{name}</h1>
      <PencilIcon
        width={22}
        height={22}
        className="text-muted transition-colors group-hover:text-accent"
      />
    </button>
  );
}
