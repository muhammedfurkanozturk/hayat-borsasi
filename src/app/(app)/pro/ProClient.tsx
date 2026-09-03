"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon, CrownIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { useProfile } from "@/lib/supabase/profile-context";
import { createClient } from "@/lib/supabase/client";
import { IyzicoCheckoutModal } from "@/components/pro/IyzicoCheckoutModal";

const MONTHLY_PRICE = 5;
const YEARLY_PRICE = 40;
const YEARLY_FULL_PRICE = MONTHLY_PRICE * 12;

const plans = [
  {
    id: "monthly",
    label: "Aylık",
    price: MONTHLY_PRICE,
    suffix: "/ ay",
    originalPrice: null as number | null,
    badge: null as string | null,
    note: null as string | null,
    highlighted: false,
  },
  {
    id: "yearly",
    label: "Yıllık",
    price: YEARLY_PRICE,
    suffix: "/ yıl",
    originalPrice: YEARLY_FULL_PRICE,
    badge: "%33 İndirim",
    note: `Aylık plana göre $${YEARLY_FULL_PRICE - YEARLY_PRICE} tasarruf`,
    highlighted: true,
  },
];

const features = [
  "Sınırsız kategori (ücretsizde en fazla 6)",
  "AI Rapor — Günlük, Aylık ve Yıllık anlık özetler",
  "Her gece otomatik oluşturulup arşivlenen AI raporu",
  "Yeni Pro özelliklere ilk erişim",
];

export default function ProPage() {
  const { isPro } = useProfile();
  const searchParams = useSearchParams();
  const odemeParam = searchParams.get("odeme");

  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  // iyzico callback'i (bkz. /api/payments/callback) ödeme sonrası
  // kullanıcıyı ?odeme=basarili/basarisiz/hata ile buraya geri
  // yönlendiriyor — sunucu tarafı bir redirect olduğu için sayfa TAM
  // yeniden yükleniyor, ProfileProvider da baştan mount olup profili
  // (yeni is_pro dahil) tekrar çekiyor, ekstra bir "yenile" adımı gerekmiyor.
  // Başlangıç hata mesajı doğrudan lazy initializer'da hesaplanıyor —
  // bir effect + setState yerine, gereksiz bir render turu atlanıyor.
  const [checkoutError, setCheckoutError] = useState<string | null>(() => {
    if (odemeParam === "basarisiz") return "Ödeme tamamlanamadı, tekrar deneyebilirsin.";
    if (odemeParam === "hata") return "Ödeme sırasında bir sorun oluştu, tekrar deneyebilirsin.";
    return null;
  });
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleCheckout(planId: string) {
    setCheckoutLoadingPlan(planId);
    setCheckoutError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data?.message || data?.error || "Ödeme başlatılamadı.");
        return;
      }
      setCheckoutFormContent(data.checkoutFormContent);
      setModalOpen(true);
    } catch {
      setCheckoutError("Ödeme başlatılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setCheckoutLoadingPlan(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Hayat Borsası Pro" subtitle="Sınırsız kategori, AI Rapor ve daha fazlası" />

      <main className="flex w-full flex-1 flex-col items-center gap-8 px-6 py-10 sm:px-10">
        {isPro ? (
          <div className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-pro/30 bg-pro-soft px-8 py-10 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pro text-pro-foreground">
              <CrownIcon width={26} height={26} strokeWidth={2.5} />
            </div>
            <p className="text-lg font-semibold text-foreground">Zaten Pro üyesin</p>
            <p className="text-sm text-muted">Tüm Pro özellikler hesabında aktif.</p>
          </div>
        ) : (
          <div className="flex w-full max-w-2xl flex-col gap-6 rounded-lg border-2 border-pro/40 bg-surface p-7 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pro-soft text-pro">
                <CrownIcon width={18} height={18} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Pro</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`card-lift flex flex-col gap-3 rounded-lg border-2 p-5 ${
                    plan.highlighted ? "border-pro/60 bg-pro-soft/30" : "border-border-soft bg-background-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">{plan.label}</span>
                    {plan.badge && (
                      <span className="rounded-full bg-positive-soft px-1.5 py-0.5 text-[10px] font-semibold text-positive">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1.5">
                      {plan.originalPrice && (
                        <span className="font-mono text-sm text-muted line-through">${plan.originalPrice}</span>
                      )}
                      <span className="font-mono text-3xl font-bold tabular-nums text-foreground">${plan.price}</span>
                      <span className="text-xs text-muted">{plan.suffix}</span>
                    </div>
                    {plan.note && <span className="text-xs text-positive">{plan.note}</span>}
                  </div>

                  <button
                    type="button"
                    disabled={checkoutLoadingPlan !== null}
                    onClick={() => handleCheckout(plan.id)}
                    className="btn mt-1 w-full rounded-lg bg-pro py-2.5 text-sm font-semibold text-pro-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {checkoutLoadingPlan === plan.id ? "Hazırlanıyor..." : "Şimdi Öde"}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-border-soft pt-5">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pro-soft text-pro">
                    <CheckIcon width={10} height={10} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {checkoutError ? (
              <p className="text-center text-xs text-negative">{checkoutError}</p>
            ) : (
              <p className="text-center text-xs text-muted">Ödeme iyzico ile güvenli şekilde işlenir.</p>
            )}
          </div>
        )}
      </main>

      <IyzicoCheckoutModal
        open={modalOpen}
        checkoutFormContent={checkoutFormContent}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
