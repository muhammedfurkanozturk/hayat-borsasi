"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

// Küçük aşağı-açılır paneller (sıklık seçici, sembol seçici vb.) için
// paylaşılan kabuk — dışına tıklanınca kapanan görünmez bir katman + yay
// fiziğiyle büyüyerek gelen/küçülerek kaybolan panel. Konumlandıran ebeveyn
// (`position: relative`) çağıran bileşende kalır, bu sadece panelin kendisini
// yönetir.
export function PopoverPanel({
  open,
  onClose,
  children,
  className = "",
  align = "left",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.8 }}
            style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
            className={`absolute top-full z-50 ${align === "right" ? "right-0" : "left-0"} ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
