"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { TrendUpIcon } from "@/components/icons";

// Giriş/Kayıt kartının ortak kabuğu — arkada temaya göre kendini ayarlayan
// yumuşak, bulanık bir ışık katmanı kartın zeminden "derinlikle" ayrılmasını
// sağlıyor (koyu temada da açık temada da aynı iki renkli glow, sadece
// --accent-soft/--pro-soft token'ları üzerinden temaya uyuyor).
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)", filter: "blur(50px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--pro-soft) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, var(--positive-soft) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.9 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface shadow-card p-6"
      >
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <TrendUpIcon width={16} height={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
        </Link>

        {children}
      </motion.div>
    </div>
  );
}
