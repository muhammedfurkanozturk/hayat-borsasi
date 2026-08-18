"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

// Uygulamadaki tüm modal diyaloglar (kategori ekleme, limit uyarısı vb.) bu
// paylaşılan kabuğu kullanır — arka plan yumuşakça belirir/kaybolur, panel
// gerçek bir yay fiziğiyle büyüyerek gelir ve kapanırken de (AnimatePresence
// sayesinde) aynı şekilde geri çekilir; CSS'in tersine gerçek bir çıkış
// animasyonu var.
export function Modal({
  open,
  onClose,
  children,
  panelClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className={panelClassName}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
