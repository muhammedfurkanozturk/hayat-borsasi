"use client";

import Link from "next/link";
import { useState } from "react";
import { AppIcon, LockIcon, PlusIcon, iconLabels, iconPalette, type IconKey } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

const iconOptions = Object.keys(iconPalette) as IconKey[];
export const FREE_CATEGORY_LIMIT = 6;

export function AddCategoryTile({ emptyState = false }: { emptyState?: boolean }) {
  const { addCategory, categories } = useAppData();
  const { isPro } = useProfile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [icon, setIcon] = useState<IconKey>("star");
  const [saving, setSaving] = useState(false);

  const limitReached = !isPro && categories.length >= FREE_CATEGORY_LIMIT;

  function close() {
    setOpen(false);
    setName("");
    setNameTouched(false);
    setIcon("star");
  }

  function pickIcon(key: IconKey) {
    setIcon(key);
    // Kullanıcı adı kendi yazmadıysa, seçtiği ikonun adını isim alanına
    // öneri olarak yazıyoruz — istersen üzerine yazıp değiştirebilirsin.
    if (!nameTouched) setName(iconLabels[key]);
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
      ) : limitReached ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-pro/50 bg-pro-soft text-pro transition-colors hover:border-pro/70"
        >
          <LockIcon width={18} height={18} />
          <span className="text-xs font-medium">Pro&apos;ya Geç</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-accent"
        >
          <PlusIcon width={18} height={18} />
          <span className="text-xs">Kategori Ekle</span>
        </button>
      )}

      {open && limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pro-soft text-pro">
              <LockIcon width={26} height={26} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">Ücretsiz kategori limitine ulaştın</p>
              <p className="text-sm text-muted">
                Ücretsiz planda en fazla {FREE_CATEGORY_LIMIT} kategori oluşturabilirsin. Sınırsız
                kategori için Pro&apos;ya geç.
              </p>
            </div>
            <div className="flex w-full gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
              >
                Vazgeç
              </button>
              <Link
                href="/pro"
                onClick={close}
                className="flex-1 rounded-lg bg-pro px-3 py-2 text-sm font-semibold text-pro-foreground hover:opacity-90"
              >
                Pro&apos;ya Geç
              </Link>
            </div>
          </div>
        </div>
      )}

      {open && !limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-background-elevated p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">Yeni Kategori</h2>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category-name" className="text-xs text-muted">
                  Kategori adı
                </label>
                <input
                  id="category-name"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameTouched(true);
                  }}
                  placeholder="örn. Finans"
                  className="rounded-lg border border-border-soft bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <span className="text-xs text-muted">İkon seç</span>
                <div className="grid min-h-0 flex-1 grid-cols-6 gap-3 overflow-y-auto pr-1 sm:grid-cols-8">
                  {iconOptions.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => pickIcon(key)}
                      title={iconLabels[key]}
                      className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-colors ${
                        icon === key
                          ? "border-accent/60 bg-accent-soft text-accent"
                          : "border-border-soft text-muted hover:border-border hover:text-foreground"
                      }`}
                    >
                      <AppIcon name={key} width={26} height={26} />
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
