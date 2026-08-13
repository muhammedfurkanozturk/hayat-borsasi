"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  taskCount,
}: {
  categoryId: string;
  categoryName: string;
  taskCount: number;
}) {
  const router = useRouter();
  const { removeCategory } = useAppData();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await removeCategory(categoryId);
    router.push("/dashboard");
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3 py-2.5 sm:flex-row sm:items-center">
        <span className="text-sm text-negative">
          {categoryName}
          {taskCount > 0 && ` ve ${taskCount} görevi`} kalıcı olarak silinecek.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-negative px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Kalıcı Olarak Sil
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 rounded-lg border-2 border-negative/60 px-3 py-2 text-sm text-negative transition-colors hover:bg-negative-soft"
    >
      <TrashIcon width={16} height={16} />
      Kategoriyi Sil
    </button>
  );
}
