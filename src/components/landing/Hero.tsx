import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:gap-16 lg:py-20">
      <div className="flex flex-col gap-6 lg:w-[48%]">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-soft px-3 py-1 text-xs text-muted">
          Şu an Faz 1 · Erken erişim
        </span>

        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          Hayatını, <span className="text-accent">kendi endeksinle</span> takip et.
        </h1>

        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Hazır bir yapılacaklar listesi değil — kendi kategorilerini, kendi görevlerini ve
          her birine kendi verdiğin önem ağırlığını tanımladığın kişisel bir gelişim
          panosu. Hayat Borsası, ilerlemeni bir borsa terminali hissiyle görselleştirir.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/kayit"
            className="rounded-lg bg-accent-soft px-5 py-3 text-sm font-semibold text-accent hover:bg-accent/25"
          >
            Ücretsiz Başla
          </Link>
          <a
            href="#nasil-calisir"
            className="rounded-lg border border-border-soft px-5 py-3 text-sm font-medium text-muted hover:text-foreground"
          >
            Nasıl çalışır?
          </a>
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border-soft bg-surface lg:w-[52%]">
        <Image
          src="/landing/hero.png"
          alt="Hayat Borsası uygulamasını telefonda kullanan bir kişi"
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
