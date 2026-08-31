"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangleIcon, CameraIcon } from "@/components/icons";

// 2026-08-26: FaceLandmarker'dan PoseLandmarker'a geçildi (kullanıcı
// bulgusu — "elimi yüzüme götürünce iptal ediyor"). FaceLandmarker net bir
// yüz (gözler/burun/ağız) gerektiriyordu, elin yüzü kısmen kapatması bile
// algılamayı anında düşürüyordu. PoseLandmarker omuz/gövde/kafa gibi daha
// geniş vücut noktalarını takip ediyor — elin yüze değmesi bu noktaları
// kapatmaz, poz hâlâ algılanır. Kullanıcı gerçekten kadraj dışına
// çıktığında (ayağa kalkıp gitmek gibi) TÜM poz kaybolur, o zaman
// tetiklenir. Aynı @mediapipe/tasks-vision paketinden, yeni bir bağımlılık
// eklenmedi — "lite" varyant, her 500ms'de bir çalıştığı için en hafifi.
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const CHECK_INTERVAL_MS = 500;
// Poz anlık olarak kaybolduğunda (ör. hızlı bir hareket, tek kare algılama
// hatası) hemen "kadraj dışı" saymıyoruz — kesintisiz bu süre kadar poz
// bulunamazsa uyarı/sayaç başlıyor. Geri gelince (ör. el yüzden çekilince)
// gecikme olmadan hemen "görülüyor" durumuna dönüyor.
const ABSENCE_GRACE_MS = 3000;

interface PoseLandmarkerLike {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks: unknown[][] };
  close: () => void;
}

// MediaPipe/TFLite'ın WASM çalışma zamanı, tamamen zararsız tanılama
// satırlarını (ör. "INFO: Created TensorFlow Lite XNNPACK delegate for
// CPU.") emscripten'in stderr köprüsü üzerinden console.error'a yazıyor —
// gerçek bir hata değil ama Next.js'in geliştirme modu kırmızı hata
// overlay'i olarak gösteriyor (kullanıcı bulgusu: kamerayı kapatınca
// tetikleniyordu, close() sırasında WASM modülü bu satırı basıyor). Sadece
// "INFO:" ile başlayan satırları, bu bileşen kamerayı kurduğu/kapattığı
// süre boyunca filtreliyoruz — başka hiçbir console.error etkilenmiyor.
function suppressTfliteInfoLogs(): () => void {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    original(...args);
  };
  return () => {
    console.error = original;
  };
}

// Bağımsız teknik araştırma sonucu (piyasa uygulaması değil) — MediaPipe
// PoseLandmarker tamamen tarayıcıda (WASM) çalışıyor, kamera görüntüsü
// hiçbir zaman ağa gönderilmiyor/kaydedilmiyor, sadece "kadrajda bir kişinin
// pozu var mı" (evet/hayır) sinyali React state'inde tutulur. Varsayılan
// kapalı — kullanıcı açmadıkça hiç yüklenmez/çalışmaz.
export function FocusCameraMonitor({
  active,
  running,
  onDistractedSecondsChange,
}: {
  active: boolean;
  running: boolean;
  onDistractedSecondsChange: (seconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const distractedRef = useRef(0);
  const absentSinceRef = useRef<number | null>(null);
  const runningRef = useRef(running);
  const onChangeRef = useRef(onDistractedSecondsChange);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [personVisible, setPersonVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    onChangeRef.current = onDistractedSecondsChange;
  }, [onDistractedSecondsChange]);

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      distractedRef.current = 0;
      absentSinceRef.current = null;
      setStatus("idle");
      return;
    }

    const restoreConsole = suppressTfliteInfoLogs();
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function createLandmarker(vision: Awaited<ReturnType<typeof import("@mediapipe/tasks-vision").FilesetResolver.forVisionTasks>>) {
      const { PoseLandmarker } = await import("@mediapipe/tasks-vision");
      try {
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      } catch {
        // Bazı cihazlarda/tarayıcılarda GPU delege desteklenmiyor — CPU'ya düş.
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      }
    }

    async function setup() {
      setStatus("loading");
      setError(null);
      try {
        const { FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await createLandmarker(vision);
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker as unknown as PoseLandmarkerLike;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");

        intervalId = setInterval(() => {
          if (!videoRef.current || !landmarkerRef.current || !runningRef.current) return;
          const result = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
          const hasPerson = result.landmarks.length > 0;
          const now = performance.now();

          if (hasPerson) {
            absentSinceRef.current = null;
            setPersonVisible(true);
            return;
          }

          if (absentSinceRef.current === null) absentSinceRef.current = now;
          if (now - absentSinceRef.current >= ABSENCE_GRACE_MS) {
            setPersonVisible(false);
            distractedRef.current += CHECK_INTERVAL_MS / 1000;
            onChangeRef.current(Math.round(distractedRef.current));
          }
        }, CHECK_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Kamera başlatılamadı.");
        }
      }
    }

    setup();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      restoreConsole();
    };
  }, [active]);

  if (!active) return null;

  const isDistracted = status === "ready" && !personVisible;

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted/20 bg-background-elevated p-4">
      <div
        className={`relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border-4 bg-black transition-colors ${
          isDistracted ? "border-negative" : status === "ready" ? "border-positive/60" : "border-muted/30"
        }`}
      >
        {/* Ham kamera akışı yatayda ters — gerçek bir aynaya bakıyormuş gibi
            hissettirmek için sadece GÖRSEL olarak (CSS transform) çevriliyor.
            PoseLandmarker `videoRef`'in ham (çevrilmemiş) piksel verisi
            üzerinde çalışıyor, bu görsel çevirme algılamayı etkilemiyor. */}
        <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">
            Kamera başlatılıyor...
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 px-3 text-center text-xs text-negative">
            <AlertTriangleIcon width={18} height={18} />
            {error ?? "Kamera hatası"}
          </div>
        )}
      </div>

      {isDistracted && (
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border-2 border-negative/50 bg-negative-soft px-3 py-2 text-sm font-medium text-negative">
          <AlertTriangleIcon width={16} height={16} />
          Seni kadrajda göremiyorum — odaklanma seansı duraklamış sayılıyor.
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <CameraIcon width={12} height={12} />
        Görüntü hiçbir yere kaydedilmez/gönderilmez, sadece tarayıcında işlenir.
      </div>
    </div>
  );
}
