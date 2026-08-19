"use client";

import { motion } from "motion/react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionGlow } from "@/components/ui/SectionGlow";

const HOWITWORKS_GRADIENT =
  "linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(10,209,235,0.15) 55%, rgba(10,209,235,0.08) 100%)";

const steps = [
  {
    title: "Kategorilerini yarat",
    description: "Girişimcilik, Sağlık, Disiplin — sana anlamlı gelen ne varsa kendi kategorini oluştur.",
  },
  {
    title: "Görevlerini ve ağırlıklarını belirle",
    description: "Her kategoriye görevler ekle, hangisi senin için ne kadar önemliyse ona göre ağırlık ver.",
  },
  {
    title: "Endeksini izle",
    description: "Günlük, haftalık, aylık, yıllık — gelişimin zaman içinde nasıl bir trend çiziyor gör.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="nasil-calisir"
      className="relative flex min-h-screen w-full scroll-mt-24 items-center justify-center overflow-hidden px-4 py-24 sm:px-6"
    >
      <SectionGlow rgb="99,102,241" />
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <GlassPanel gradient={HOWITWORKS_GRADIENT} className="min-h-[60vh]">
          <div className="flex h-full flex-col justify-center gap-8 p-6 sm:gap-10 sm:p-10 lg:p-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 text-center"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Nasıl çalışır</span>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Üç adımda kendi endeksin
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 },
                  }}
                  viewport={{ once: false, amount: 0.4 }}
                  whileHover={{
                    scale: 1.04,
                    y: -4,
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-surface/60 p-6 hover:border-accent/50 hover:bg-surface hover:shadow-[var(--glass-shadow)]"
                  style={{ transitionProperty: "border-color, background-color, box-shadow", transitionDuration: "var(--dur-base)" }}
                >
                  <span className="font-mono text-sm text-accent">0{i + 1}</span>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
