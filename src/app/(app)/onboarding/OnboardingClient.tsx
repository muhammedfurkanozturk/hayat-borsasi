"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_TEMPLATES } from "@hayat-borsasi/shared";
import { AppIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

export default function OnboardingClient() {
  const router = useRouter();
  const { addCategoriesFromTemplates } = useAppData();
  const { completeOnboarding } = useProfile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    const chosen = ONBOARDING_TEMPLATES.filter((t) => selected.has(t.key)).map((t) => ({
      name: t.name,
      icon: t.icon,
    }));
    await addCategoriesFromTemplates(chosen);
    await completeOnboarding();
    router.push("/dashboard");
  }

  async function handleSkip() {
    setSaving(true);
    await completeOnboarding();
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Hoş geldin" subtitle="İlk alışkanlıklarını seç" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">İlk alışkanlıklarını seç</h2>
          <p className="max-w-2xl text-sm text-muted">
            Bunlar sadece öneri — istediğin kadarını seç, hiçbirini seçmek zorunda değilsin. Seçtiklerin
            normal birer kategori olarak eklenir, istediğin zaman düzenleyebilir veya silebilirsin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ONBOARDING_TEMPLATES.map((template) => {
            const isSelected = selected.has(template.key);
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => toggle(template.key)}
                aria-pressed={isSelected}
                className={`btn flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left shadow-sm transition-colors ${
                  isSelected
                    ? "border-accent/60 bg-accent-soft"
                    : "border-border-soft bg-background-elevated hover:border-border"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isSelected ? "bg-accent/25 text-accent" : "bg-surface text-muted"
                  }`}
                >
                  <AppIcon name={template.icon} width={20} height={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{template.name}</span>
                  <span className="text-xs leading-relaxed text-muted">{template.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="btn text-sm text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Şimdilik atla
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="btn w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {saving
              ? "Kaydediliyor..."
              : selected.size > 0
                ? `Devam (${selected.size} seçildi)`
                : "Devam"}
          </button>
        </div>
      </main>
    </div>
  );
}
