"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MotionCtaLink } from "@/components/ui/MotionCtaLink";

const HERO_GRADIENT =
  "linear-gradient(135deg, rgba(10,209,235,0.28) 0%, rgba(139,92,246,0.15) 55%, rgba(139,92,246,0.08) 100%)";

export function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden px-4 py-24 sm:px-6">
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <GlassPanel gradient={HERO_GRADIENT} className="min-h-[65vh]">
          <div className="flex flex-col gap-8 p-6 sm:gap-10 sm:p-10 lg:flex-row lg:items-stretch lg:gap-16 lg:p-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center gap-8 lg:w-[48%]"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-soft px-3 py-1 text-xs text-muted">
                Şu an Faz 1 · Erken erişim
              </span>

              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
                Hayatını, <span className="text-accent">kendi endeksinle</span> takip et.
              </h1>

              <p className="text-base leading-relaxed text-muted sm:text-lg lg:text-xl">
                Hazır bir yapılacaklar listesi değil — kendi kategorilerini, kendi görevlerini ve
                her birine kendi verdiğin önem ağırlığını tanımladığın kişisel bir gelişim
                panosu. Hayat Borsası, ilerlemeni bir borsa terminali hissiyle görselleştirir.
              </p>

              <div className="flex flex-wrap gap-4">
                <MotionCtaLink
                  href="/kayit"
                  className="rounded-lg bg-accent px-5 py-3 text-sm sm:px-7 sm:py-4 sm:text-base font-semibold text-accent-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset] transition-colors hover:brightness-110"
                >
                  Ücretsiz Başla
                </MotionCtaLink>
                <a
                  href="#nasil-calisir"
                  className="btn rounded-lg border border-border-soft px-5 py-3 text-sm sm:px-7 sm:py-4 sm:text-base font-medium text-muted hover:border-accent/40 hover:text-foreground"
                >
                  Nasıl çalışır?
                </a>
              </div>
            </motion.div>

            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border-soft lg:w-[52%]"
              style={{ background: HERO_GRADIENT }}
            >
              <Image
                src="/landing/hero.webp"
                alt="Hayat Borsası uygulamasını telefonda kullanan bir kişi"
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
