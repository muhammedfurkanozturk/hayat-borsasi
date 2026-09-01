"use client";

import { useEffect, useRef, useState } from "react";
import {
  calculateHabitSavings,
  calculateLockedInScore,
  calculateNextMilestone,
  calculateStreak,
  daysAgoIso,
  deleteHabitNote,
  deleteHabitReward,
  fetchHabitNotes,
  fetchHabitRewards,
  fetchRelapses,
  fetchTaskCompletionDates,
  fillDateRange,
  insertHabitNote,
  insertHabitReward,
  todayIso,
  upsertRelapse,
  type DbHabitNote,
  type DbHabitRelapse,
  type DbHabitReward,
  type HabitCostPeriod,
} from "@hayat-borsasi/shared";
import { CheckIcon, ChevronDownIcon, FlameIcon, LightbulbIcon, TrashIcon, XIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useAppData, type Task } from "@/lib/supabase/app-data-context";
import { HabitBadges } from "./habit/HabitBadges";
import { HabitRewards } from "./habit/HabitRewards";
import { PreciseCounter } from "./habit/PreciseCounter";
import { UrgeReliefModal } from "./habit/UrgeReliefModal";

// 120 günden daha uzun süredir takip edilen alışkanlıklarda "en uzun
// serin" gerçek all-time rekordan düşük görünüyordu (pencere dışı kalan
// eski bir rekor varsa) — bug değildi ama gerçek bir sınırlamaydı, bu
// turda genişletildi.
const STREAK_WINDOW_DAYS = 1825;

// Kategori Bazlı Tasarım Farklılaştırma — Bölüm 7 (Headspace dili,
// 2026-09-02). Headspace'in "renk-bloklu içerik kartları" fikri — her
// kartın kendi doygun renginin OLMASI gerekiyordu, sabit tek bir kategori
// vurgusu değil. Renk task.id'den DETERMİNİSTİK olarak türetiliyor (sayfa
// yenilenince/liste sırası değişince aynı alışkanlık aynı rengi koruyor),
// yeni bir DB sütunu gerekmedi.
export interface HabitPalette {
  bg: string;
  fg: string;
  muted: string;
}

const HABIT_PALETTE_POOL: HabitPalette[] = [
  { bg: "#d4a72c", fg: "#2b2100", muted: "#5c4c12" }, // hardal sarısı
  { bg: "#c1502e", fg: "#ffffff", muted: "#ffe4d9" }, // toprak turuncusu
  { bg: "#2f5233", fg: "#ffffff", muted: "#cfe0d1" }, // orman yeşili
  { bg: "#6b4e8e", fg: "#ffffff", muted: "#e3d9ee" }, // leylak moru
  { bg: "#1a1a1a", fg: "#ffffff", muted: "#b8b8b8" }, // siyah
];

export function hashHabitColor(id: string): HabitPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return HABIT_PALETTE_POOL[hash % HABIT_PALETTE_POOL.length];
}

export function HabitBreakCard({ task, palette }: { task: Task; palette: HabitPalette }) {
  const { toggleTask, changeHabitCost } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [relapses, setRelapses] = useState<DbHabitRelapse[]>([]);
  const [notes, setNotes] = useState<DbHabitNote[]>([]);
  const [relapseNote, setRelapseNote] = useState("");
  const [loggingRelapse, setLoggingRelapse] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [rewards, setRewards] = useState<DbHabitReward[]>([]);
  const [costOpen, setCostOpen] = useState(false);
  const [costAmount, setCostAmount] = useState("");
  const [costPeriod, setCostPeriod] = useState<HabitCostPeriod>("week");
  const [savingCost, setSavingCost] = useState(false);

  const [urgeOpen, setUrgeOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const autoInsightRequestedRef = useRef(false);

  async function loadDetails() {
    const supabase = createClient();
    const since = daysAgoIso(STREAK_WINDOW_DAYS);
    const [dates, relapseRows, noteRows, rewardRows] = await Promise.all([
      fetchTaskCompletionDates(supabase, task.id, since),
      fetchRelapses(supabase, task.id),
      fetchHabitNotes(supabase, task.id),
      fetchHabitRewards(supabase, task.id).catch((err) => {
        // habit_rewards migration henüz uygulanmamış olabilir — ana
        // özelliği (streak/relapse) kilitlemesin.
        console.error("Ödül hedefleri yüklenemedi (migration uygulanmamış olabilir):", err);
        return [] as DbHabitReward[];
      }),
    ]);
    setStreak(calculateStreak(fillDateRange(dates, since, todayIso())));
    setRelapses(relapseRows);
    setNotes(noteRows);
    setRewards(rewardRows);
    setLoading(false);
  }

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  async function handleUsedToday() {
    setLoggingRelapse(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await upsertRelapse(supabase, user.id, task.id, todayIso(), relapseNote.trim());
      if (task.completed) await toggleTask(task.id);
      await loadDetails();
      setRelapseNote("");
    }
    setLoggingRelapse(false);
  }

  async function handleNotUsedToday() {
    if (task.completed) return;
    await toggleTask(task.id);
    await loadDetails();
  }

  const today = todayIso();
  const usedToday = relapses.some((r) => r.date === today);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertHabitNote(supabase, user.id, task.id, newNote.trim());
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    }
    setSavingNote(false);
  }

  async function handleDeleteNote(noteId: string) {
    const supabase = createClient();
    await deleteHabitNote(supabase, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleSaveCost(e: React.FormEvent) {
    e.preventDefault();
    setSavingCost(true);
    const amount = costAmount.trim() ? Number(costAmount) : null;
    await changeHabitCost(task.id, amount, amount != null ? costPeriod : null);
    setSavingCost(false);
    setCostOpen(false);
  }

  async function handleAddReward(title: string, targetAmount: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertHabitReward(supabase, user.id, task.id, title, targetAmount);
      setRewards((prev) => [...prev, created]);
    }
  }

  async function handleDeleteReward(rewardId: string) {
    const supabase = createClient();
    await deleteHabitReward(supabase, rewardId);
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  }

  async function handleRequestInsight() {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const res = await fetch("/api/habit-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitTitle: task.title,
          relapses: relapses.map((r) => ({ date: r.date, note: r.note_text || null })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "İçgörü alınamadı.");
      setInsight(json.insight);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "İçgörü alınamadı.");
    }
    setInsightLoading(false);
  }

  const savings = calculateHabitSavings(task.habitCostAmount, task.habitCostPeriod, streak.current);
  const counterSince = relapses[0]?.created_at ?? task.createdAt;

  // Pattrn ilhamı (Madde 10, piyasa araştırması) — "Kilitlenme Skoru",
  // "İyileştirme Modu" ve "sıradaki kilometre taşı" (bkz. habits.ts'teki
  // saf fonksiyonların yorumları, gerçek formül/eşik oradan).
  const relapsesLast30Days = relapses.filter((r) => r.date >= daysAgoIso(30)).length;
  const relapsesLast7Days = relapses.filter((r) => r.date >= daysAgoIso(7)).length;
  const lockedInScore = calculateLockedInScore(streak, relapsesLast30Days);
  const nextMilestone = calculateNextMilestone(streak.current);
  const improvementMode = relapsesLast7Days >= 2;

  // İyileştirme Modu aktif olunca AI koçunun notunu bir kere, otomatik iste
  // (kullanıcı elle "AI'dan İçgörü İste"ye basmasa bile) — Pattrn'in "AI
  // notices when you're slipping" davranışının bu projedeki karşılığı
  // (gerçek push/proaktif bildirim altyapısı yok, panel açıldığında/
  // genişletildiğinde tetikleniyor).
  useEffect(() => {
    if (improvementMode && expanded && !autoInsightRequestedRef.current && !loading) {
      autoInsightRequestedRef.current = true;
      void handleRequestInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [improvementMode, expanded, loading]);

  return (
    <div
      className="rounded-lg border-2 border-muted/30 bg-background-elevated"
      style={
        {
          "--background-elevated": palette.bg,
          "--accent": palette.fg,
          "--accent-soft": `${palette.fg}26`,
          "--accent-foreground": palette.bg,
          "--foreground": palette.fg,
          "--muted": palette.muted,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="btn flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <FlameIcon width={18} height={18} className="shrink-0 text-accent" />
        <span className="flex-1 text-sm font-medium text-foreground">{task.title}</span>
        {!loading && (
          <span className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted">
            {task.completed ? (
              <span className="inline-flex items-center gap-1 text-positive">
                <CheckIcon width={12} height={12} /> Bugün kullanmadın
              </span>
            ) : usedToday ? (
              <span className="inline-flex items-center gap-1 text-negative">
                <XIcon width={12} height={12} /> Bugün kullandın
              </span>
            ) : (
              <span>Bugün işaretlenmedi</span>
            )}
            <span className="inline-flex items-center gap-1">
              <FlameIcon width={12} height={12} /> {streak.current} gün
            </span>
            <span className={`inline-flex items-center gap-1 ${lockedInScore >= 70 ? "text-positive" : lockedInScore >= 40 ? "text-muted" : "text-negative"}`}>
              Kilitlenme: %{lockedInScore}
            </span>
          </span>
        )}
        <ChevronDownIcon
          width={18}
          height={18}
          className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t-2 border-muted/20 px-4 py-4">
          {/* Pattrn ilhamı — "İyileştirme Modu": son 7 günde 2+ nüksetme
              olunca, seri baskısı yerine daha yumuşak bir çerçeveye geçiyor
              ve AI koçun notunu otomatik gösteriyor (bkz. yukarıdaki
              useEffect). Kırmızı/negatif değil, nötr-destekleyici bir renk
              kimliği bilinçli olarak seçildi — bu bir "başarısızlık" uyarısı
              değil. */}
          {improvementMode && (
            <div className="flex flex-col gap-2 rounded-lg border-2 border-accent/30 bg-accent-soft/20 px-3 py-2.5">
              <span className="text-xs font-medium text-accent">
                Bu hafta biraz zorlanmış görünüyorsun — bugüne odaklan, seri sıfırdan başlar.
              </span>
              {insightLoading && <p className="text-xs text-muted">Koçun bir not hazırlıyor...</p>}
              {insightError && <p className="text-xs text-negative">{insightError}</p>}
              {insight && !insightLoading && (
                <p className="rounded-lg border-2 border-accent/40 bg-background/60 px-3 py-2 text-xs text-foreground">{insight}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-muted/20 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Temiz Süre</span>
              <PreciseCounter since={counterSince} />
            </div>
            <button
              type="button"
              onClick={() => setUrgeOpen(true)}
              className="btn h-9 shrink-0 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground hover:opacity-90"
            >
              İstek Hissediyorum
            </button>
          </div>

          {/* Pattrn ilhamı — büyük "bırak" hedefini ufak, görünür bir
              sonraki kilometre taşına bölüyor (HabitBadges'teki rozet
              listesinin AYNI HABIT_MILESTONES_DAYS sırasından türetiliyor). */}
          {nextMilestone && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Sıradaki hedef: {nextMilestone.days} gün</span>
                <span className="font-mono tabular-nums text-muted">{nextMilestone.daysRemaining} gün kaldı</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${nextMilestone.progressPct}%` }}
                />
              </div>
            </div>
          )}

          <HabitBadges longestStreak={streak.longest} />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Bugün ne oldu?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNotUsedToday}
                disabled={task.completed}
                className="btn inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-positive/30 text-sm font-medium text-positive hover:bg-positive/10 disabled:pointer-events-none disabled:opacity-50"
              >
                <CheckIcon width={14} height={14} /> Bugün Kullanmadım
              </button>
              <button
                type="button"
                onClick={handleUsedToday}
                disabled={loggingRelapse}
                className="btn inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-negative/30 text-sm font-medium text-negative hover:bg-negative/10 disabled:pointer-events-none disabled:opacity-50"
              >
                {loggingRelapse ? (
                  "Kaydediliyor..."
                ) : (
                  <>
                    <XIcon width={14} height={14} /> Bugün Kullandım
                  </>
                )}
              </button>
            </div>
            <input
              value={relapseNote}
              onChange={(e) => setRelapseNote(e.target.value)}
              placeholder="Kullandıysan ne oldu, tetikleyici neydi? (opsiyonel)"
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            {relapses.length > 0 && (
              <p className="px-1 text-xs text-muted">
                Son nüksetme: {relapses[0].date}
                {relapses[0].note_text && ` — "${relapses[0].note_text}"`}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRequestInsight}
                disabled={insightLoading}
                className="btn flex w-fit items-center gap-1.5 rounded-lg border-2 border-muted/30 px-3 py-1.5 text-xs text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <LightbulbIcon width={12} height={12} />
                {insightLoading ? "Düşünüyor..." : "AI'dan İçgörü İste"}
              </button>
              {insightError && <p className="text-xs text-negative">{insightError}</p>}
              {insight && (
                <p className="rounded-lg border-2 border-accent/40 bg-accent-soft/30 px-3 py-2 text-xs text-foreground">
                  {insight}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t-2 border-muted/10 pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Tasarruf</span>
              <button
                type="button"
                onClick={() => {
                  setCostAmount(task.habitCostAmount != null ? String(task.habitCostAmount) : "");
                  setCostPeriod(task.habitCostPeriod ?? "week");
                  setCostOpen((v) => !v);
                }}
                className="btn text-xs text-accent hover:underline"
              >
                {task.habitCostAmount != null ? "Maliyeti Düzenle" : "Maliyet Gir"}
              </button>
            </div>

            {costOpen ? (
              <form onSubmit={handleSaveCost} className="flex gap-2">
                <input
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  placeholder="Maliyet (₺)"
                  inputMode="decimal"
                  className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                />
                <select
                  value={costPeriod}
                  onChange={(e) => setCostPeriod(e.target.value as HabitCostPeriod)}
                  className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none"
                >
                  <option value="day">/ gün</option>
                  <option value="week">/ hafta</option>
                  <option value="month">/ ay</option>
                </select>
                <button
                  type="submit"
                  disabled={savingCost}
                  className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Kaydet
                </button>
              </form>
            ) : (
              task.habitCostAmount != null && (
                <p className="font-mono text-lg font-semibold tabular-nums text-positive">
                  {savings.toFixed(0)} ₺ biriktirdin
                </p>
              )
            )}

            {task.habitCostAmount != null && (
              <HabitRewards rewards={rewards} currentSavings={savings} onAdd={handleAddReward} onDelete={handleDeleteReward} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Motivasyon Notların
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Neden bırakıyorsun? Kendine bir not bırak..."
                className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
              >
                Ekle
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="px-1 text-sm text-muted">Henüz not yok.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start gap-2 rounded-lg border-2 border-muted/20 bg-surface px-3 py-2 text-sm text-foreground"
                  >
                    <span className="flex-1">{note.note_text}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Notu sil"
                      className="btn shrink-0 text-muted hover:text-negative"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <UrgeReliefModal open={urgeOpen} onClose={() => setUrgeOpen(false)} notes={notes} />
    </div>
  );
}
