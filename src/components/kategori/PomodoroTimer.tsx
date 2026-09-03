"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  daysAgoIso,
  deleteFocusSubject,
  fetchFocusSessionsSince,
  fetchFocusSubjects,
  insertFocusSession,
  insertFocusSubject,
  todayIso,
  type DbFocusSession,
  type DbFocusSubject,
} from "@hayat-borsasi/shared";
import { CameraIcon, CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Modal } from "@/components/ui/Modal";
import { FocusCameraMonitor } from "./focus/FocusCameraMonitor";
import { FocusMascot } from "./focus/FocusMascot";
import { FocusProgressPanel } from "./focus/FocusProgressPanel";
import { FocusQA } from "./focus/FocusQA";
import { FocusSoundPlayer } from "./focus/FocusSoundPlayer";

// Kritik düzeltme (2026-09-03, kullanıcı bulgusu) — KategoriClient.tsx'teki
// FOCUS_CHECKLIST_PALETTE ile AYNI zemin çifti (Duolingo'nun beyaz/koyu-gri
// modu) — ayrı dosyada küçük bir tekrar, iki component arasında tuhaf bir
// import bağımlılığı kurmaktan kaçınmak için bilinçli. Mavi vurgu
// (#1cb0f6) HER İKİ modda da aynı.
const FOCUS_PALETTE: Record<"dark" | "light", Record<string, string>> = {
  dark: {
    "--background": "#1c1c1e",
    "--background-elevated": "#2c2c2e",
    "--surface": "#2c2c2e",
    "--surface-hover": "#3a3a3c",
    "--border": "rgba(255,255,255,0.12)",
    "--border-soft": "rgba(255,255,255,0.08)",
    "--foreground": "#f5f5f5",
    "--muted": "#a0a0a5",
    "--muted-soft": "#6e6e73",
  },
  light: {
    "--background": "#ffffff",
    "--background-elevated": "#f7f7f7",
    "--surface": "#ffffff",
    "--surface-hover": "#f0f0f0",
    "--border": "#e5e5e5",
    "--border-soft": "#eeeeee",
    "--foreground": "#3c3c3c",
    "--muted": "#777777",
    "--muted-soft": "#afafaf",
  },
};

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;
const HISTORY_WINDOW_DAYS = 60;
const RING_RADIUS = 84;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// TickTick'in kronometresinde sürenin loglanabilmesi için bir alt sınır yok
// gibi görünse de, 1 dakikanın altındaki bir "kaydı" (yanlışlıkla başlat/
// durdur) geçmişe eklemek gürültü yaratır — bu yüzden anlamlı bir taban
// koyduk.
const MIN_STOPWATCH_LOG_SECONDS = 60;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Mode = "pomodoro" | "stopwatch";

export function PomodoroTimer({ categoryId }: { categoryId: string }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>("pomodoro");

  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [swSeconds, setSwSeconds] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sessions, setSessions] = useState<DbFocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState<DbFocusSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  // Kamera varsayılan KAPALI — kullanıcı elle açmadıkça hiç yüklenmez/
  // çalışmaz (bkz. CLAUDE.md'deki genel kural). distractedSecondsRef, seans
  // sırasında FocusCameraMonitor'dan gelen canlı değeri tutar (ref —
  // logSession'ın kapandığı closure'da her zaman güncel değeri okuması
  // için), distractedSecondsDisplay ise SADECE canlı ekran gösterimi için
  // aynı değerin state kopyası (2026-08-26).
  //
  // 2026-08-26: ayrı bir "Kamera" aç/kapa düğmesi kaldırıldı (kullanıcı
  // bulgusu) — artık seans "Başlat"a basılınca (mode'a göre pomodoro/
  // kronometre fark etmez) bir kere soruluyor, cameraDecisionOpen ile.
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraDecisionOpen, setCameraDecisionOpen] = useState(false);
  const distractedSecondsRef = useRef(0);
  const [distractedSecondsDisplay, setDistractedSecondsDisplay] = useState(0);
  // "eksikler" envanteri madde 5 — "başarı bandı": bir seans kaydedilince
  // Duolingo'nun ders-sonu şeridinden ilham, alttan kayıp birkaç saniye
  // sonra kendiliğinden kapanan yeşil bir bant.
  const [showSuccessBand, setShowSuccessBand] = useState(false);

  async function loadSessions() {
    const supabase = createClient();
    const [rows, subjectRows] = await Promise.all([
      fetchFocusSessionsSince(supabase, categoryId, `${daysAgoIso(HISTORY_WINDOW_DAYS)}T00:00:00Z`),
      fetchFocusSubjects(supabase, categoryId).catch((err) => {
        // focus_subjects migration henüz uygulanmamış olabilir — ana
        // Pomodoro özelliğini kilitlemesin.
        console.error("Dersler yüklenemedi (migration uygulanmamış olabilir):", err);
        return [] as DbFocusSubject[];
      }),
    ]);
    setSessions(rows);
    setSubjects(subjectRows);
    setLoading(false);
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function logSession(durationMinutes: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const created = await insertFocusSession(supabase, user.id, categoryId, durationMinutes, {
      subjectId: selectedSubjectId || null,
      distractedSeconds: cameraOn ? distractedSecondsRef.current : null,
    });
    setSessions((prev) => [created, ...prev]);
    distractedSecondsRef.current = 0;
    setDistractedSecondsDisplay(0);
    setCameraOn(false);
    setShowSuccessBand(true);
    setTimeout(() => setShowSuccessBand(false), 2400);
  }

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          void logSession(FOCUS_MINUTES);
          return FOCUS_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!swRunning) return;
    swIntervalRef.current = setInterval(() => {
      setSwSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    };
  }, [swRunning]);

  function resetPomodoro() {
    setRunning(false);
    setSecondsLeft(FOCUS_SECONDS);
    setCameraOn(false);
    distractedSecondsRef.current = 0;
    setDistractedSecondsDisplay(0);
  }

  function finishStopwatch() {
    setSwRunning(false);
    if (swSeconds >= MIN_STOPWATCH_LOG_SECONDS) {
      void logSession(Math.round(swSeconds / 60));
    } else {
      setCameraOn(false);
      distractedSecondsRef.current = 0;
      setDistractedSecondsDisplay(0);
    }
    setSwSeconds(0);
  }

  // 2026-08-26: kullanıcı bulgusu — ayrı bir "Kamera" aç/kapa düğmesi
  // kafa karıştırıyordu (ne zaman açık ne zaman kapalı belli değildi).
  // Artık taze bir seans başlatılırken (duraklatılmış bir seansı devam
  // ettirirken DEĞİL — secondsLeft/swSeconds hâlâ başlangıç değerindeyse)
  // bir kere soruluyor, karar verilince gerçek Başlat tetiklenir.
  function handleStartClick() {
    const isFreshStart = mode === "pomodoro" ? secondsLeft === FOCUS_SECONDS : swSeconds === 0;
    if (isFreshStart) {
      setCameraDecisionOpen(true);
      return;
    }
    if (mode === "pomodoro") setRunning((v) => !v);
    else setSwRunning((v) => !v);
  }

  function handleCameraDecision(wantCamera: boolean) {
    setCameraOn(wantCamera);
    setCameraDecisionOpen(false);
    if (mode === "pomodoro") setRunning(true);
    else setSwRunning(true);
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertFocusSubject(supabase, user.id, categoryId, newSubjectName.trim(), subjects.length);
      setSubjects((prev) => [...prev, created]);
      setSelectedSubjectId(created.id);
    }
    setNewSubjectName("");
    setAddingSubject(false);
  }

  async function handleDeleteSubject(subjectId: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setSelectedSubjectId((prev) => (prev === subjectId ? "" : prev));
    const supabase = createClient();
    await deleteFocusSubject(supabase, subjectId);
  }

  const today = todayIso();
  const todaySessions = sessions.filter((s) => s.completed_at.slice(0, 10) === today);
  const todayTotalMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  // 2026-08-26: kamera takipli geçmiş seanslardan "kaç dk verimli / kaç dk
  // kamerasız" özeti — kullanıcı bulgusu, sadece canlı seansta değil geçmiş
  // özette de görünsün istendi. distracted_seconds sadece kamera açıkken
  // dolan bir alan (bkz. focus.ts), null olanlar (kamerasız seanslar)
  // hesaba katılmıyor.
  const todayCameraSessions = todaySessions.filter((s) => s.distracted_seconds !== null);
  const todayCameraTrackedMinutes = todayCameraSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const todayDistractedMinutes = todayCameraSessions.reduce((sum, s) => sum + (s.distracted_seconds ?? 0) / 60, 0);
  const todayInCameraMinutes = todayCameraTrackedMinutes - todayDistractedMinutes;

  const pomodoroProgress = 1 - secondsLeft / FOCUS_SECONDS;
  const anyRunning = mode === "pomodoro" ? running : swRunning;
  const elapsedSeconds = mode === "pomodoro" ? FOCUS_SECONDS - secondsLeft : swSeconds;
  const inCameraSeconds = Math.max(0, elapsedSeconds - distractedSecondsDisplay);

  return (
    // Kategori Bazlı Tasarım Farklılaştırma — Bölüm 5 (Duolingo dili,
    // 2026-09-02): mavi vurgu (Checklist'in turuncusundan BİLİNÇLİ OLARAK
    // farklı — Duolingo'da alt-özelliğe göre renk değişiyor). Aynı kök-
    // token-ezme yöntemi (bkz. Finans/Robinhood bölümü) kullanıldı. Zemin
    // artık FOCUS_PALETTE ile genel site temasına göre değişiyor (kritik
    // düzeltme, 2026-09-03) — önceden SABİT beyazdı.
    <div
      className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-surface shadow-card p-5"
      style={
        {
          ...FOCUS_PALETTE[theme],
          "--accent": "#1cb0f6",
          "--accent-soft": "#1cb0f626",
          "--accent-foreground": "#ffffff",
          // Ders & Odaklanma "eksikler" envanteri madde 5 — Duolingo'nun
          // yuvarlak/dostane tipografisi (Nunito, self-hosted). font-mono
          // kullanan sayaç rakamları (aşağıda) Tailwind'in kendi
          // font-family'sini ezdiği için bu miras alınan değerden
          // ETKİLENMİYOR, sadece geri kalan tüm metin Nunito'ya geçiyor.
          fontFamily: "var(--font-nunito)",
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FocusMascot size={32} />
          <h2 className="text-sm font-medium text-foreground">Odaklanma</h2>
        </div>
        <SegmentedControl
          size="sm"
          options={[
            { value: "pomodoro", label: "Pomodoro" },
            { value: "stopwatch", label: "Kronometre" },
          ]}
          value={mode}
          onChange={(next) => {
            // Mod değişince diğer sayacın kafa karışıklığı yaratmaması için
            // arka planda sessizce çalışmaya devam etmesini engelliyoruz.
            if (running) resetPomodoro();
            if (swRunning) setSwRunning(false);
            setMode(next);
          }}
        />
      </div>

      {!loading && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none"
          >
            <option value="">Ders seçme (genel)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selectedSubjectId && (
            <button
              type="button"
              onClick={() => handleDeleteSubject(selectedSubjectId)}
              aria-label="Dersi sil"
              className="btn flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-negative"
            >
              <TrashIcon width={14} height={14} />
            </button>
          )}
          <form onSubmit={handleAddSubject} className="flex items-center gap-1">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Yeni ders/konu"
              className="h-9 w-32 rounded-lg border-2 border-muted/30 bg-surface px-2 text-xs text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={addingSubject || !newSubjectName.trim()}
              className="btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Ders ekle"
            >
              <PlusIcon width={12} height={12} />
            </button>
          </form>
        </div>
      )}

      <FocusSoundPlayer />

      <div className="flex flex-col items-center gap-4 py-2">
        {mode === "pomodoro" ? (
          <div className="relative flex h-52 w-52 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r={RING_RADIUS} fill="none" stroke="var(--border-soft)" strokeWidth="6" />
              <circle
                cx="96"
                cy="96"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - pomodoroProgress)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="absolute font-mono text-4xl tabular-nums text-foreground">{formatTime(secondsLeft)}</span>
          </div>
        ) : (
          <div className="flex h-52 w-52 items-center justify-center rounded-full border-2 border-border-soft">
            <span className="font-mono text-4xl tabular-nums text-foreground">{formatTime(swSeconds)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {mode === "pomodoro" ? (
            <>
              <button
                type="button"
                onClick={() => (running ? setRunning(false) : handleStartClick())}
                className="btn h-10 rounded-lg bg-accent-soft px-6 text-sm font-semibold text-accent hover:bg-accent/25"
              >
                {running ? "Duraklat" : "Başlat"}
              </button>
              <button
                type="button"
                onClick={resetPomodoro}
                className="btn h-10 rounded-lg border-2 border-muted/30 px-6 text-sm text-muted hover:text-foreground"
              >
                Sıfırla
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (swRunning ? setSwRunning(false) : handleStartClick())}
                className="btn h-10 rounded-lg bg-accent-soft px-6 text-sm font-semibold text-accent hover:bg-accent/25"
              >
                {swRunning ? "Duraklat" : "Başlat"}
              </button>
              <button
                type="button"
                onClick={finishStopwatch}
                disabled={swSeconds === 0}
                className="btn h-10 rounded-lg border-2 border-muted/30 px-6 text-sm text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                Bitir ve Kaydet
              </button>
            </>
          )}
        </div>
        {mode === "stopwatch" && swSeconds > 0 && swSeconds < MIN_STOPWATCH_LOG_SECONDS && (
          <p className="text-xs text-muted">1 dakikadan kısa seanslar kaydedilmez.</p>
        )}
      </div>

      {cameraOn && elapsedSeconds > 0 && (
        <div className="flex items-center justify-center gap-4 rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 text-positive">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            Kamerada: {formatTime(inCameraSeconds)}
          </span>
          <span className="flex items-center gap-1.5 text-negative">
            <span className="h-1.5 w-1.5 rounded-full bg-negative" />
            Kamerasız: {formatTime(distractedSecondsDisplay)}
          </span>
        </div>
      )}

      <FocusCameraMonitor
        active={cameraOn}
        running={anyRunning}
        onDistractedSecondsChange={(seconds) => {
          distractedSecondsRef.current = seconds;
          setDistractedSecondsDisplay(seconds);
        }}
      />

      <Modal
        open={cameraDecisionOpen}
        onClose={() => setCameraDecisionOpen(false)}
        panelClassName="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-background-elevated p-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CameraIcon width={22} height={22} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">Kamerayı açalım mı?</p>
          <p className="text-sm text-muted">
            Seans boyunca ekranda olup olmadığını takip eder, kaç dakika kamerada/kamerasız
            geçirdiğini gösterir. Görüntü hiçbir yere kaydedilmez/gönderilmez.
          </p>
        </div>
        <div className="flex w-full gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCameraDecision(false)}
            className="btn flex-1 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Hayır, Kapalı Kalsın
          </button>
          <button
            type="button"
            onClick={() => handleCameraDecision(true)}
            className="btn flex-1 rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/25"
          >
            Evet, Aç
          </button>
        </div>
      </Modal>

      <div className="flex flex-col gap-1.5 rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Bugünkü toplam odaklanma</span>
          <span className="font-mono tabular-nums text-foreground">
            {loading ? "…" : `${todayTotalMinutes} dk (${todaySessions.length} seans)`}
          </span>
        </div>
        {!loading && todayCameraTrackedMinutes > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Kamera takipli seanslardan</span>
            <span className="font-mono tabular-nums text-muted">
              {Math.round(todayInCameraMinutes)} dk verimli · {Math.round(todayDistractedMinutes)} dk kamerasız
            </span>
          </div>
        )}
      </div>

      {!loading && sessions.length > 0 && (
        <div
          style={
            {
              "--accent": "#8549ff",
              "--accent-soft": "#8549ff26",
              "--accent-foreground": "#ffffff",
              "--positive": "#8549ff",
            } as React.CSSProperties
          }
        >
          <FocusProgressPanel sessions={sessions} />
        </div>
      )}

      {!loading && <FocusQA sessions={sessions} subjects={subjects} />}

      <AnimatePresence>
        {showSuccessBand && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-positive px-4 py-2.5 text-sm font-semibold text-white"
          >
            <CheckIcon width={14} height={14} strokeWidth={3} />
            Harika! Seans kaydedildi.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
