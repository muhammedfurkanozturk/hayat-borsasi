"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const MotionLink = motion.create(Link);

// Dönüşüm odaklı ana CTA'lar (landing hero, final CTA, üst nav) için gerçek
// yay fiziğiyle basma/hover geri bildirimi — `.btn`'in CSS geçişleri yerine
// Motion'ın kendi transform motoru devrede, bu yüzden bu bileşen `.btn`
// kullanmıyor (ikisi aynı anda `transform`'u yönetmeye çalışırsa çakışır).
export function MotionCtaLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <MotionLink
      href={href}
      onClick={onClick}
      className={className}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ y: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 480, damping: 28, mass: 0.7 }}
    >
      {children}
    </MotionLink>
  );
}
