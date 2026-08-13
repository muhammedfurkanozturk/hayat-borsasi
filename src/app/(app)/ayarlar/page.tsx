"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useProfile } from "@/lib/supabase/profile-context";
import { useAppData } from "@/lib/supabase/app-data-context";

export default function AyarlarPage() {
  const { displayName, loading, updateDisplayName } = useProfile();
  const { resetAllCategories } = useAppData();

  const [draftName, setDraftName] = useState(displayName);
  const [syncedDisplayName, setSyncedDisplayName] = useState(displayName);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Profil asenkron yüklendiğinde (veya kaydedince) draft alanı senkron
  // tutuyoruz — React'in "render sırasında state ayarlama" deseni, effect
  // gerektirmiyor: https://react.dev/learn/you-might-not-need-an-effect
  if (displayName !== syncedDisplayName) {
    setSyncedDisplayName(displayName);
    setDraftName(displayName);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    const { error } = await updateDisplayName(draftName);
    if (error) setSaveError(error);
    setSaving(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Ayarlar" subtitle="Profil ve uygulama tercihlerin" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium text-foreground">Profil</h2>

          <form onSubmit={handleSaveName} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full border border-border-soft bg-background-elevated" />
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={loading}
              suppressHydrationWarning
              className="flex-1 rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || saving || draftName.trim() === displayName || !draftName.trim()}
              className="rounded-lg bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-40"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
          {saveError && <p className="text-xs text-negative">{saveError}</p>}
        </section>

        <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">Plan</h2>
            <p className="text-xs text-muted">Şu an ücretsiz plandasın.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border-soft px-2.5 py-1 text-[11px] text-muted">
              Ücretsiz
            </span>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent opacity-50"
            >
              Pro&apos;ya Geç · Yakında
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium text-foreground">Görünüm</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted">Hayat Borsası şu an sadece koyu temada.</p>
            <span className="rounded-full border border-border-soft bg-background-elevated px-2.5 py-1 text-[11px] text-muted">
              Koyu Tema
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-negative/25 bg-negative-soft/30 p-5">
          <h2 className="text-sm font-medium text-foreground">Veriler</h2>
          <p className="text-xs text-muted">
            Bu işlem, hesabındaki tüm kategorileri ve altlarındaki görevleri kalıcı olarak siler
            (günlük notların ve raporların kalır). Sıfırdan başlamak istersen kullan.
          </p>

          {confirmingReset ? (
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
              <span className="mr-auto text-xs text-negative">Emin misin? Bu geri alınamaz.</span>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  await resetAllCategories();
                  setResetting(false);
                  setConfirmingReset(false);
                }}
                className="rounded-lg bg-negative px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                {resetting ? "Siliniyor..." : "Verileri Sıfırla"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="self-start rounded-lg border border-negative/30 px-3 py-1.5 text-xs text-negative hover:bg-negative-soft"
            >
              Verileri Sıfırla
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
