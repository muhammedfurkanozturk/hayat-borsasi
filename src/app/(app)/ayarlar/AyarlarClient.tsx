"use client";

import Link from "next/link";
import { useState } from "react";
import { EditableField } from "@/components/ayarlar/EditableField";
import { CrownIcon } from "@/components/icons";
import { Avatar } from "@/components/layout/Avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/lib/theme-context";
import { useProfile } from "@/lib/supabase/profile-context";
import { useAppData } from "@/lib/supabase/app-data-context";

function validateEmail(value: string): string | null {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Geçerli bir e-posta adresi gir (örn. ornek@eposta.com).";
  }
  return null;
}

function validatePhone(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length > 11) return "Telefon numarası en fazla 11 haneli olabilir.";
  if (digits.length < 10) return "Telefon numarası en az 10 haneli olmalı.";
  return null;
}

export default function AyarlarPage() {
  const { displayName, email, isPro, contactInfo, loading, updateDisplayName, updateContactInfo, updateEmail } =
    useProfile();
  const { resetAllCategories } = useAppData();
  const { theme, setTheme } = useTheme();

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

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Ayarlar" subtitle="Profil ve uygulama tercihlerin" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="text-sm font-medium text-foreground">Profil</h2>

          <form onSubmit={handleSaveName} className="flex items-center gap-3">
            <Avatar initial={initial} isPro={isPro} />
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
              className="btn rounded-lg bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-40"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
          {saveError && <p className="text-xs text-negative">{saveError}</p>}

          <div className="my-1 border-t border-border-soft" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EditableField
              label="E-posta"
              value={email}
              type="email"
              placeholder="ornek@eposta.com"
              onSave={updateEmail}
              validate={validateEmail}
              successMessage="Onay bağlantısı yeni adresine gönderildi. Linke tıklayınca değişiklik tamamlanır."
            />
            <EditableField
              label="Telefon"
              value={contactInfo.phone}
              type="tel"
              placeholder="05XX XXX XX XX"
              onSave={(phone) => updateContactInfo({ ...contactInfo, phone })}
              validate={validatePhone}
            />
            <EditableField
              label="Meslek"
              value={contactInfo.occupation}
              placeholder="örn. Yazılım Mühendisi"
              onSave={(occupation) => updateContactInfo({ ...contactInfo, occupation })}
            />
            <EditableField
              label="Adres"
              value={contactInfo.address}
              placeholder="örn. Kadıköy, İstanbul"
              onSave={(address) => updateContactInfo({ ...contactInfo, address })}
            />
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">Plan</h2>
            <p className="text-xs text-muted">{isPro ? "Pro plandasın." : "Şu an ücretsiz plandasın."}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPro ? (
              <span className="flex items-center gap-1 rounded-full bg-pro-soft px-2.5 py-1 text-[11px] font-semibold text-pro">
                <CrownIcon width={11} height={11} strokeWidth={2.5} />
                Pro
              </span>
            ) : (
              <>
                <span className="rounded-full border border-border-soft px-2.5 py-1 text-[11px] text-muted">
                  Ücretsiz
                </span>
                <Link
                  href="/pro"
                  className="btn rounded-lg bg-pro px-3 py-1.5 text-xs font-semibold text-pro-foreground hover:opacity-90"
                >
                  Pro&apos;ya Geç
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="text-sm font-medium text-foreground">Görünüm</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted">Tema tercihini seç.</p>
            <SegmentedControl
              options={[
                { value: "dark" as const, label: "Koyu Tema" },
                { value: "light" as const, label: "Açık Tema" },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-negative/25 bg-negative-soft/30 p-5 shadow-card">
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
                className="btn rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground"
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
                className="btn rounded-lg bg-negative px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                {resetting ? "Siliniyor..." : "Verileri Sıfırla"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="btn self-start rounded-lg border border-negative/30 px-3 py-1.5 text-xs text-negative hover:bg-negative-soft"
            >
              Verileri Sıfırla
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
