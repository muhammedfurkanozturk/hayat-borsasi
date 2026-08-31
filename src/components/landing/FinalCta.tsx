import { MotionCtaLink } from "@/components/ui/MotionCtaLink";

export function FinalCta() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <div className="relative z-10 flex flex-col items-center gap-5 rounded-lg border border-border-soft bg-surface/60 px-6 py-14 text-center backdrop-blur-sm">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hayatının endeksi bugün başlıyor.
        </h2>
        <p className="max-w-md text-sm text-muted sm:text-base">
          Kurulum yok, kredi kartı yok. Kendi kategorini yarat, ilk görevini işaretle.
        </p>
        <MotionCtaLink
          href="/kayit"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset] transition-colors hover:brightness-110"
        >
          Ücretsiz Başla
        </MotionCtaLink>
      </div>
    </section>
  );
}
