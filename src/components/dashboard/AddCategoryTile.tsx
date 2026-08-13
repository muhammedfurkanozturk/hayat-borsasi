"use client";

import { useState } from "react";
import { AppIcon, PlusIcon, iconPalette, type IconKey } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";

const iconOptions = Object.keys(iconPalette) as IconKey[];

export function AddCategoryTile({ emptyState = false }: { emptyState?: boolean }) {
  const { addCategory } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconKey>("star");
  const [saving, setSaving] = useState(false);

  function close() {
    setOpen(false);
    setName("");
    setIcon("star");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addCategory(name, icon);
    setSaving(false);
    close();
  }

  return (
    <>
      {emptyState ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-accent-soft px-6 py-10 text-accent transition-colors hover:border-accent/60 hover:bg-accent/25"
        >
          <PlusIcon width={22} height={22} />
          <span className="text-base font-semibold">Kategori Eklemeye Başla</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-soft text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <PlusIcon width={18} height={18} />
          <span className="text-xs">Kategori Ekle</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background-elevated p-5">
            <h2 className="mb-4 text-sm font-medium text-foreground">Yeni Kategori</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category-name" className="text-xs text-muted">
                  Kategori adı
                </label>
                <input
                  id="category-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örn. Finans"
                  className="rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">İkon seç</span>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setIcon(key)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        icon === key
                          ? "border-accent/50 bg-accent-soft text-accent"
                          : "border-border-soft text-muted hover:border-border hover:text-foreground"
                      }`}
                    >
                      <AppIcon name={key} width={16} height={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
