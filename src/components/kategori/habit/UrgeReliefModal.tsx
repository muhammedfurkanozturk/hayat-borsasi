"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { DbHabitNote } from "@hayat-borsasi/shared";
import { Modal } from "@/components/ui/Modal";

const BREATH_SECONDS = 4;

// Delust'taki (piyasa araştırması) anlık "urge control" aracı fikri —
// istek anında, nükseme olmadan ÖNCE kısa bir nefes egzersizi + kullanıcının
// kendi kayıtlı motivasyon notlarından biri gösteriliyor. Yeni veri
// gerekmiyor, tamamen istemci taraflı.
export function UrgeReliefModal({ open, onClose, notes }: { open: boolean; onClose: () => void; notes: DbHabitNote[] }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      panelClassName="flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border border-border bg-background-elevated p-6"
    >
      {open && <UrgeReliefContent notes={notes} onClose={onClose} />}
    </Modal>
  );
}

function UrgeReliefContent({ notes, onClose }: { notes: DbHabitNote[]; onClose: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [randomNote] = useState(() => (notes.length > 0 ? notes[Math.floor(Math.random() * notes.length)] : null));

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p === "in" ? "out" : "in")), BREATH_SECONDS * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <h3 className="text-base font-semibold text-foreground">Bir dakika dur, nefes al</h3>

      <motion.div
        animate={{ scale: phase === "in" ? 1.3 : 0.85 }}
        transition={{ duration: BREATH_SECONDS, ease: "easeInOut" }}
        className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-accent/50 bg-accent-soft"
      >
        <span className="text-sm font-medium text-accent">{phase === "in" ? "Nefes Al" : "Nefes Ver"}</span>
      </motion.div>

      {randomNote && (
        <div className="w-full rounded-lg border-2 border-muted/20 bg-surface p-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Kendi notundan</p>
          <p className="mt-1 text-sm text-foreground">{randomNote.note_text}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="btn h-10 w-full rounded-lg border-2 border-muted/30 text-sm text-muted hover:text-foreground"
      >
        Geçti, kapat
      </button>
    </>
  );
}
