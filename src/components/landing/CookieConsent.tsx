"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "hb-cookie-consent";

// Sadece Landing sayfasında (giriş yapmadan önceki tanıtım sayfası) render
// edilir — uygulama içi (app) layout'a eklenmez. Gerçekte topladığımız tek
// çerez Supabase'in oturum çerezi (zorunlu/işlevsel) — ayrı bir "tercih"
// sistemi kurup işlevsiz bir kabul/reddet ayrımı yapmak yanıltıcı olurdu,
// bu yüzden tek bir bilgilendirme + onay var.
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Sunucu localStorage'ı göremediği için ilk render hep "gizli" — mount
    // sonrası (hydration bitince) dış sistemle (localStorage) senkronluyoruz,
    // theme-context.tsx'teki aynı desen (bkz. oradaki not).
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // localStorage kapalıysa (gizli sekme vb.) banner'ı hiç gösterme.
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // yazılamıyorsa sorun değil, sadece bir sonraki ziyarette tekrar sorar.
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
          role="dialog"
          aria-label="Çerez bilgilendirmesi"
        >
          <p className="text-sm text-muted">
            Bu site, oturumunu açık tutmak için gerekli çerezleri kullanır. Devam ederek bunu kabul etmiş olursun.
          </p>
          <button
            type="button"
            onClick={accept}
            className="btn shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-110"
          >
            Anladım
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
