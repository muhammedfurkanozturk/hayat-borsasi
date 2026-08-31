"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { TrendUpIcon } from "@/components/icons";

// Giriş/Kayıt kartının ortak kabuğu — "Terminal Ledger" yönü (2026-09-01):
// üç renkli gradient küre kaldırılmıştı (Anti-Slop: borders over shadows/
// glows, tek vurgu rengi). Bölüm 2 (2026-08-25) bunun üstüne derinlik
// ekledi — önce nötr/siyah bir vignette denendi, ama kullanıcı testinde
// açık temada ortanın "çok beyaz" kaldığı bildirildi (nötr vignette'in
// merkezi transparent olduğu için açık temanın soluk zeminini olduğu gibi
// gösteriyordu). Kullanıcının isteğiyle projenin eski (Terminal Ledger
// öncesi) camgöbeği/mavi kimliğini anımsatan, mavi tonlarında bir vignette'e
// çevrildi — merkez artık transparent değil, hafif mavi bir parıltı;
// köşelere doğru koyu lacivert. Tek vurgu rengi (bakır) kuralı hâlâ genel
// site için geçerli, bu SADECE Auth ekranına özel, bilinçli bir istisna.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.16) 0%, rgba(15,23,42,0.72) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
        className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-surface p-6"
        style={{
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 30px 70px -20px rgba(0,0,0,0.75), 0 12px 30px -10px rgba(0,0,0,0.6)",
        }}
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
