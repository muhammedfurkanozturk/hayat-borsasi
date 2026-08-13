import Link from "next/link";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border-soft bg-surface/60 px-6 py-14 text-center">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hayatının endeksi bugün başlıyor.
        </h2>
        <p className="max-w-md text-sm text-muted sm:text-base">
          Kurulum yok, kredi kartı yok. Kendi kategorini yarat, ilk görevini işaretle.
        </p>
        <Link
          href="/kayit"
          className="rounded-lg bg-accent-soft px-6 py-3 text-sm font-semibold text-accent hover:bg-accent/25"
        >
          Ücretsiz Başla
        </Link>
      </div>
    </section>
  );
}
