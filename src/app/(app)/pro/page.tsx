"use client";

import { useState } from "react";
import { CheckIcon, CrownIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { useProfile } from "@/lib/supabase/profile-context";

type Billing = "monthly" | "yearly";

const MONTHLY_PRICE = 5;
const YEARLY_PRICE = 40;
const YEARLY_FULL_PRICE = MONTHLY_PRICE * 12;

const features = [
  "Sınırsız kategori (ücretsizde en fazla 6)",
  "AI Rapor — Günlük, Aylık ve Yıllık anlık özetler",
  "Her gece otomatik oluşturulup arşivlenen AI raporu",
  "Yeni Pro özelliklere ilk erişim",
];

export default function ProPage() {
  const { isPro } = useProfile();
  const [billing, setBilling] = useState<Billing>("yearly");

  const price = billing === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;
  const priceSuffix = billing === "monthly" ? "/ ay" : "/ yıl";

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Hayat Borsası Pro" subtitle="Sınırsız kategori, AI Rapor ve daha fazlası" />

      <main className="flex w-full flex-1 flex-col items-center gap-8 px-6 py-10 sm:px-10">
        {isPro ? (
          <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-pro/30 bg-pro-soft px-8 py-10 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pro text-pro-foreground">
              <CrownIcon width={26} height={26} strokeWidth={2.5} />
            </div>
            <p className="text-lg font-semibold text-foreground">Zaten Pro üyesin</p>
            <p className="text-sm text-muted">Tüm Pro özellikler hesabında aktif.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-lg border border-border-soft bg-background-elevated p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  billing === "monthly" ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                Aylık
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  billing === "yearly" ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                Yıllık
                <span className="rounded-full bg-positive-soft px-1.5 py-0.5 text-[10px] font-semibold text-positive">
                  %33 İndirim
                </span>
              </button>
            </div>

            <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border-2 border-pro/40 bg-surface p-7 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pro-soft text-pro">
                  <CrownIcon width={18} height={18} strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">Pro</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  {billing === "yearly" && (
                    <span className="font-mono text-lg text-muted line-through">${YEARLY_FULL_PRICE}</span>
                  )}
                  <span className="font-mono text-4xl font-bold tabular-nums text-foreground">${price}</span>
                  <span className="text-sm text-muted">{priceSuffix}</span>
                </div>
                {billing === "yearly" && (
                  <span className="text-xs text-positive">
                    Aylık plana göre ${YEARLY_FULL_PRICE - YEARLY_PRICE} tasarruf
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pro-soft text-pro">
                      <CheckIcon width={10} height={10} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-pro py-3 text-sm font-semibold text-pro-foreground"
                >
                  Pro&apos;ya Geç · Yakında
                </button>
                <p className="text-center text-xs text-muted">Ödeme altyapısı henüz aktif değil.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
