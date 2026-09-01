"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeIcon, CameraIcon, KeyboardIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";

interface BarcodeProduct {
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portion: string | null;
}

// OpenNutriTracker + FoodLens'teki (piyasa araştırması) barkod tarama
// fikri. 2026-08-28: önceki sürüm tarayıcının yerleşik BarcodeDetector
// API'sine bağlıydı — bu sadece Chrome/Edge'de var, Firefox/Safari'de
// kullanıcı kamera seçeneğini hiç görmüyordu. Saf JS tabanlı @zxing/browser'a
// geçildi — tüm modern tarayıcılarda çalışıyor, sadece kamera izni
// reddedilirse/erişilemezse elle girişe düşülüyor.
type ScanMode = "choice" | "camera" | "manual";

export function BarcodeScanButton({ onResult }: { onResult: (product: BarcodeProduct) => void }) {
  const [open, setOpen] = useState(false);
  // 2026-08-29 (kullanıcı isteği): önceden kamera ve elle giriş aynı anda
  // gösteriliyordu, kafa karıştırıyordu — artık önce bir seçim ekranı
  // ("Kameradan Tara" / "Elle Yaz"), sadece seçilen mod render ediliyor.
  const [mode, setMode] = useState<ScanMode>("choice");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const foundRef = useRef(false);
  const lookupRef = useRef<(code: string) => void>(() => {});

  async function lookupAndApply(code: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/barcode-lookup?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ürün bulunamadı.");
      onResult(json);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürün bulunamadı.");
    }
    setLoading(false);
  }

  // lookupAndApply her render'da değişiyor (kapanışında güncel state'i
  // yakalaması gerekiyor) — effect'in her render'da yeniden kamera açmasını
  // önlemek için en güncel sürümü bir ref'te tutuyoruz, effect'in kendisi
  // sadece `open` değişince çalışıyor.
  useEffect(() => {
    lookupRef.current = lookupAndApply;
  });

  useEffect(() => {
    if (!open || mode !== "camera") return;
    let cancelled = false;
    foundRef.current = false;

    async function startCamera() {
      try {
        const reader = new BrowserMultiFormatReader();
        if (cancelled || !videoRef.current) return;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (result && !foundRef.current) {
              foundRef.current = true;
              controlsRef.current?.stop();
              lookupRef.current(result.getText());
            }
            // Kare okunamadığında (Exception) sessizce yoksayılıyor —
            // sürekli tarama döngüsü zaten devam ediyor.
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setCameraActive(true);
      } catch {
        if (!cancelled) setError("Kameraya erişilemedi — barkod numarasını elle girebilirsin.");
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setCameraActive(false);
    };
  }, [open, mode]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    lookupAndApply(manualCode.trim());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setManualCode("");
          setMode("choice");
          setOpen(true);
        }}
        className="btn h-10 rounded-lg border-2 border-muted/30 px-4 text-sm text-muted hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <BarcodeIcon width={15} height={15} />
          Barkod Tara
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex w-full max-w-sm flex-col gap-3 overflow-hidden rounded-lg border border-border bg-background-elevated p-5"
      >
        <h3 className="text-sm font-medium text-foreground">Barkod Tara</h3>

        {mode === "choice" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("camera");
              }}
              className="btn flex flex-col items-center gap-2 rounded-lg border-2 border-muted/25 p-4 text-center text-muted hover:border-[color:var(--nutrition-accent)]/30 hover:text-foreground"
            >
              <CameraIcon width={22} height={22} />
              <span className="text-xs font-semibold">Kameradan Tara</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("manual");
              }}
              className="btn flex flex-col items-center gap-2 rounded-lg border-2 border-muted/25 p-4 text-center text-muted hover:border-[color:var(--nutrition-accent)]/30 hover:text-foreground"
            >
              <KeyboardIcon width={22} height={22} />
              <span className="text-xs font-semibold">Elle Yaz</span>
            </button>
          </div>
        )}

        {mode === "camera" && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                  Kamera açılıyor...
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMode("choice")}
              className="btn self-start text-xs text-muted hover:text-foreground"
            >
              ← Geri
            </button>
          </div>
        )}

        {mode === "manual" && (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Barkod numarasını yaz"
                inputMode="numeric"
                className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="btn h-10 shrink-0 rounded-lg bg-[color:var(--nutrition-accent)]/15 px-4 text-sm font-medium text-[color:var(--nutrition-accent)] hover:bg-[color:var(--nutrition-accent)]/25 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? "Aranıyor..." : "Ara"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode("choice")}
              className="btn self-start text-xs text-muted hover:text-foreground"
            >
              ← Geri
            </button>
          </div>
        )}

        {error && <p className="text-xs text-negative">{error}</p>}
      </Modal>
    </>
  );
}
