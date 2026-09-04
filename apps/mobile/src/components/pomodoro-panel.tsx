import { useEffect, useMemo, useState } from "react";
import {
  buildDailySumSeries,
  calculateStreak,
  daysAgoIso,
  deleteFocusSubject,
  fetchFocusSessionsSince,
  fetchFocusSubjects,
  fillDateRange,
  insertFocusSession,
  insertFocusSubject,
  todayIso,
  type DbFocusSession,
  type DbFocusSubject,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Ders &
// Odaklanma'nın mobil karşılığı. Web'de Duolingo dilinde 3 katmanlı renk
// (Checklist turuncu, Pomodoro mavi, İlerleme raporu mor) uygulanmıştı —
// burada da aynı sabit renkler (mobil tema sisteminden BAĞIMSIZ) kullanıldı.
// **Bilinçli kapsam dışı bırakılanlar** (Expo Go'da native/WASM kısıtları
// nedeniyle): kamera tabanlı duruş takibi (@mediapipe/tasks-vision, tarayıcı
// WASM'ı gerektiriyor, RN'de karşılığı yok) ve prosedürel "Odak Sesi"
// (Web Audio API ile anlık üretilen gürültü, RN'de eşdeğer bir API yok,
// önceden kaydedilmiş ses dosyası + expo-av gerektirirdi) — ikisi de
// web'de zaten opsiyonel/ek özellikler, çekirdek Pomodoro/seri/AI soru-cevap
// akışı burada tam.
const DUOLINGO_BLUE = "#1cb0f6";
const DUOLINGO_PURPLE = "#8549ff";

// Kritik düzeltme (2026-09-03, madde 3) — bu dosyadaki her rengin
// beyaz/açık zemine SABİT kilitli yazılmış olması (web'in bu turda
// düzeltilen 6 kategorisiyle AYNI hata sınıfı, bkz. CLAUDE.md "Kategori
// Temaları" kritik düzeltme notu) bulundu. `getFocusPalette` genel
// site temasına göre (koyu/açık) çözülen zemin/kart/metin renklerini
// döndürüyor — mavi/mor vurgu (DUOLINGO_BLUE/PURPLE) sabit kalıyor.
function getFocusPalette(isDark: boolean) {
  return isDark
    ? { bg: "#1c1c1e", surface: "#2c2c2e", border: "rgba(255,255,255,0.12)", text: "#f5f5f5", muted: "#a0a0a5" }
    : { bg: "#ffffff", surface: "#fafafa", border: "#e4e4e7", text: "#27272a", muted: "#71717a" };
}

function getFocusStyles(p: ReturnType<typeof getFocusPalette>) {
  return StyleSheet.create({
    container: { gap: 12, borderRadius: 12, padding: 14, backgroundColor: p.bg },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    heading: { fontSize: 15, fontWeight: "700", color: p.text },
    segmentRow: { flexDirection: "row", gap: 4, backgroundColor: p.surface, borderRadius: 8, padding: 3 },
    segmentPill: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
    subjectChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    subjectAddRow: { flexDirection: "row", gap: 8 },
    subjectInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 38,
      fontSize: 13,
      color: p.text,
      backgroundColor: p.surface,
    },
    subjectAddButton: { borderRadius: 8, width: 38, height: 38, alignItems: "center", justifyContent: "center", backgroundColor: "#1cb0f61a" },
    timerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24, borderWidth: 2, borderColor: p.border, borderRadius: 999, marginHorizontal: 40 },
    timerText: { fontSize: 40, fontWeight: "700", color: p.text, fontVariant: ["tabular-nums"] },
    primaryButton: { flex: 1, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
    secondaryButton: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: p.border, alignItems: "center", justifyContent: "center" },
    totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: p.border, paddingTop: 10 },
    progressBox: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
    barRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 64 },
    barColumn: { alignItems: "center", flex: 1 },
    bar: { width: 14, borderRadius: 4 },
    qaBox: { borderWidth: 1, borderColor: p.border, borderRadius: 10, padding: 12, gap: 8 },
    qaInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 38,
      fontSize: 13,
      color: p.text,
      backgroundColor: p.surface,
    },
  });
}

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;
const HISTORY_WINDOW_DAYS = 60;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toLocalIsoDate(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PomodoroPanel({ categoryId }: { categoryId: string }) {
  const focusPalette = getFocusPalette(useThemeMode().theme === "dark");
  const styles = getFocusStyles(focusPalette);
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<DbFocusSubject[]>([]);
  const [sessions, setSessions] = useState<DbFocusSession[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [swSeconds, setSwSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [swRunning, setSwRunning] = useState(false);

  async function load() {
    try {
      const [subjectRows, sessionRows] = await Promise.all([
        fetchFocusSubjects(supabase, categoryId),
        fetchFocusSessionsSince(supabase, categoryId, daysAgoIso(HISTORY_WINDOW_DAYS)),
      ]);
      setSubjects(subjectRows);
      setSessions(sessionRows);
    } catch (err) {
      console.error("Odaklanma verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      handleLogSession(FOCUS_MINUTES);
      setRunning(false);
      setSecondsLeft(FOCUS_SECONDS);
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft]);

  useEffect(() => {
    if (!swRunning) return;
    const id = setInterval(() => setSwSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [swRunning]);

  async function handleLogSession(durationMinutes: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const created = await insertFocusSession(supabase, user.id, categoryId, durationMinutes, {
      subjectId: selectedSubjectId,
    });
    setSessions((prev) => [created, ...prev]);
  }

  async function handleFinishStopwatch() {
    setSwRunning(false);
    const minutes = Math.round(swSeconds / 60);
    if (minutes >= 1) await handleLogSession(minutes);
    setSwSeconds(0);
  }

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertFocusSubject(supabase, user.id, categoryId, newSubjectName.trim(), subjects.length);
      setSubjects((prev) => [...prev, created]);
      setSelectedSubjectId(created.id);
      setNewSubjectName("");
    }
    setAddingSubject(false);
  }

  async function handleDeleteSubject(subjectId: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    if (selectedSubjectId === subjectId) setSelectedSubjectId(null);
    await deleteFocusSubject(supabase, subjectId);
  }

  const todayTotalMinutes = useMemo(
    () => sessions.filter((s) => toLocalIsoDate(s.completed_at) === todayIso()).reduce((sum, s) => sum + s.duration_minutes, 0),
    [sessions]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={DUOLINGO_BLUE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#ffffff" }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.heading}>Odaklanma</ThemedText>
        <View style={styles.segmentRow}>
          {(["pomodoro", "stopwatch"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.segmentPill, mode === m && { backgroundColor: DUOLINGO_BLUE + "1a" }]}
            >
              <ThemedText style={{ color: mode === m ? DUOLINGO_BLUE : focusPalette.muted, fontSize: 12, fontWeight: "600" }}>
                {m === "pomodoro" ? "Pomodoro" : "Kronometre"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Pressable
          onPress={() => setSelectedSubjectId(null)}
          style={[styles.subjectChip, { borderColor: selectedSubjectId === null ? DUOLINGO_BLUE : focusPalette.border }]}
        >
          <ThemedText style={{ fontSize: 12, color: selectedSubjectId === null ? DUOLINGO_BLUE : focusPalette.muted }}>Genel</ThemedText>
        </Pressable>
        {subjects.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSelectedSubjectId(s.id)}
            onLongPress={() => handleDeleteSubject(s.id)}
            style={[styles.subjectChip, { borderColor: selectedSubjectId === s.id ? DUOLINGO_BLUE : focusPalette.border }]}
          >
            <ThemedText style={{ fontSize: 12, color: selectedSubjectId === s.id ? DUOLINGO_BLUE : focusPalette.muted }}>{s.name}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.subjectAddRow}>
        <TextInput
          value={newSubjectName}
          onChangeText={setNewSubjectName}
          placeholder="Yeni ders/konu..."
          placeholderTextColor="#a1a1aa"
          style={styles.subjectInput}
          onSubmitEditing={handleAddSubject}
        />
        <Pressable onPress={handleAddSubject} disabled={addingSubject} style={styles.subjectAddButton}>
          <MaterialCommunityIcons name="plus" size={14} color={DUOLINGO_BLUE} />
        </Pressable>
      </View>

      <View style={styles.timerBox}>
        <ThemedText style={styles.timerText}>{mode === "pomodoro" ? formatClock(secondsLeft) : formatClock(swSeconds)}</ThemedText>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {mode === "pomodoro" ? (
          <>
            <Pressable onPress={() => setRunning((v) => !v)} style={[styles.primaryButton, { backgroundColor: DUOLINGO_BLUE }]}>
              <ThemedText style={styles.primaryButtonText}>{running ? "Duraklat" : "Başlat"}</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                setRunning(false);
                setSecondsLeft(FOCUS_SECONDS);
              }}
              style={styles.secondaryButton}
            >
              <ThemedText style={{ color: focusPalette.muted, fontSize: 13, fontWeight: "600" }}>Sıfırla</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => setSwRunning((v) => !v)} style={[styles.primaryButton, { backgroundColor: DUOLINGO_BLUE }]}>
              <ThemedText style={styles.primaryButtonText}>{swRunning ? "Duraklat" : "Başlat"}</ThemedText>
            </Pressable>
            <Pressable onPress={handleFinishStopwatch} style={styles.secondaryButton}>
              <ThemedText style={{ color: focusPalette.muted, fontSize: 13, fontWeight: "600" }}>Bitir ve Kaydet</ThemedText>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.totalRow}>
        <ThemedText style={{ color: focusPalette.muted, fontSize: 12 }}>Bugünkü toplam odaklanma</ThemedText>
        <ThemedText style={{ fontFamily: "monospace", fontWeight: "700", fontSize: 13 }}>{todayTotalMinutes} dk</ThemedText>
      </View>

      {sessions.length > 0 && <FocusProgressBox sessions={sessions} />}

      <FocusQABox sessions={sessions} subjects={subjects} />
    </View>
  );
}

function FocusProgressBox({ sessions }: { sessions: DbFocusSession[] }) {
  const focusPalette = getFocusPalette(useThemeMode().theme === "dark");
  const styles = getFocusStyles(focusPalette);
  const streak = useMemo(() => {
    const completedDates = new Set(sessions.map((s) => toLocalIsoDate(s.completed_at)));
    const days = Array.from(completedDates).map((date) => ({ date, completed: true }));
    if (days.length === 0) return { current: 0, longest: 0 };
    const since = days.reduce((min, d) => (d.date < min ? d.date : min), days[0].date);
    const filled = fillDateRange(days, since, todayIso());
    return calculateStreak(filled);
  }, [sessions]);

  const weekData = useMemo(() => {
    const rows = sessions.map((s) => ({ date: toLocalIsoDate(s.completed_at), duration_minutes: s.duration_minutes }));
    return buildDailySumSeries(rows, 7, (r) => r.duration_minutes);
  }, [sessions]);

  const maxMinutes = Math.max(1, ...weekData.map((d) => d.score ?? 0));

  return (
    <View style={[styles.progressBox, { borderColor: DUOLINGO_PURPLE + "33", backgroundColor: DUOLINGO_PURPLE + "0d" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <ThemedText style={{ fontSize: 11, fontWeight: "700", color: DUOLINGO_PURPLE, textTransform: "uppercase", letterSpacing: 0.4 }}>
          İlerleme
        </ThemedText>
        {(streak.current > 0 || streak.longest > 0) && (
          <ThemedText style={{ fontSize: 11, color: DUOLINGO_PURPLE, fontFamily: "monospace" }}>
            🔥 {streak.current} gün · en uzun {streak.longest}
          </ThemedText>
        )}
      </View>
      <View style={styles.barRow}>
        {weekData.map((d, i) => (
          <View key={i} style={styles.barColumn}>
            <View style={[styles.bar, { height: Math.max(3, ((d.score ?? 0) / maxMinutes) * 48), backgroundColor: DUOLINGO_PURPLE }]} />
            <ThemedText style={{ fontSize: 8, color: focusPalette.muted, marginTop: 3 }}>{d.label.slice(0, 2)}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function FocusQABox({ sessions, subjects }: { sessions: DbFocusSession[]; subjects: DbFocusSubject[] }) {
  const focusPalette = getFocusPalette(useThemeMode().theme === "dark");
  const styles = getFocusStyles(focusPalette);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const subjectById = new Map(subjects.map((s) => [s.id, s.name]));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/focus-qa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          question: question.trim(),
          sessions: sessions.map((s) => ({
            subject: s.subject_id ? (subjectById.get(s.subject_id) ?? null) : null,
            durationMinutes: s.duration_minutes,
            completedAt: s.completed_at,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Cevap alınamadı.");
      setAnswer(json.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cevap alınamadı.");
    }
    setLoading(false);
  }

  return (
    <View style={styles.qaBox}>
      <ThemedText style={{ fontSize: 11, fontWeight: "700", color: focusPalette.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Verimine Soru Sor
      </ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="örn. Bu hafta en çok neye çalıştım?"
          placeholderTextColor="#a1a1aa"
          style={styles.qaInput}
          onSubmitEditing={handleAsk}
        />
        <Pressable onPress={handleAsk} disabled={loading || !question.trim()} style={[styles.subjectAddButton, { opacity: question.trim() ? 1 : 0.5 }]}>
          {loading ? <ActivityIndicator size="small" color={DUOLINGO_BLUE} /> : <ThemedText style={{ color: DUOLINGO_BLUE, fontSize: 12, fontWeight: "600" }}>Sor</ThemedText>}
        </Pressable>
      </View>
      {error && <ThemedText style={{ color: "#dc2626", fontSize: 12 }}>{error}</ThemedText>}
      {answer && <ThemedText style={{ fontSize: 13, color: focusPalette.text }}>{answer}</ThemedText>}
    </View>
  );
}

