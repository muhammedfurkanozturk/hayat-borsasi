import { useState } from "react";
import {
  EQUIPMENT_LABELS,
  fetchExercises,
  insertExercise,
  insertWorkoutSet,
  insertWorkoutTemplate,
  MUSCLE_GROUP_LABELS,
  updateExerciseMuscle,
  EXERCISE_LIBRARY,
  type DbExercise,
  type EquipmentType,
  type MuscleGroup,
  type QuickWorkoutPlan,
  type WeeklyWorkoutPlan,
} from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { getFreeleticsTheme } from "@/components/workout-panel";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Spor & Vücut'un Seviye 2 "Antrenman Oluştur" route'u (2026-09-04, madde
// 4 — "eksikler" envanteri) — web'in `WorkoutBuilderPanel.tsx`'inin RN
// portu, SADECE Hızlı/Haftalık AI modları (Manuel mod BİLİNÇLİ OLARAK
// PORTLANMADI — mobilin zaten var olan "Kütüphane" sekmesi arama+"Ekle"
// akışıyla AYNI işi yapıyor, tekrar inşa etmek gereksiz). `/api/
// workout-generate`'e bu turda Bearer+CORS eklendi (bkz. o route'taki
// yorum) — **ama route Vercel'de HENÜZ DEPLOY EDİLMEMİŞ (curl ile 404
// doğrulandı, bkz. CLAUDE.md deploy notu), bu yüzden bu ekran kod olarak
// HAZIR ama gerçek bir AI çağrısı bu turda hiç TEST EDİLEMEDİ** — deploy
// tamamlanınca kullanıcının kendi cihazında denemesi gerekiyor.
type BuilderMode = "quick" | "weekly";
type Goal = "hypertrophy" | "strength" | "endurance";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "hypertrophy", label: "Kas Kütlesi" },
  { value: "strength", label: "Kuvvet" },
  { value: "endurance", label: "Dayanıklılık" },
];

const MUSCLE_KEYS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
const EQUIPMENT_KEYS = Object.keys(EQUIPMENT_LABELS) as EquipmentType[];

export default function AntrenmanOlusturTab() {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const styles = getStyles(FREELETICS);
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();

  const [mode, setMode] = useState<BuilderMode>("quick");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickPlan, setQuickPlan] = useState<QuickWorkoutPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [applying, setApplying] = useState(false);

  function toggleMuscle(m: MuscleGroup) {
    setMuscleGroups((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }
  function toggleEquipment(e: EquipmentType) {
    setEquipment((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  async function ensureExercise(name: string, currentExercises: DbExercise[]): Promise<DbExercise> {
    const existing = currentExercises.find((ex) => ex.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı.");
    const created = await insertExercise(supabase, user.id, categoryId, name, currentExercises.length);
    const libraryMatch = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (libraryMatch) {
      try {
        await updateExerciseMuscle(supabase, created.id, libraryMatch.muscleGroup);
        created.primary_muscle = libraryMatch.muscleGroup;
      } catch (err) {
        console.error("Kas grubu kaydedilemedi (migration uygulanmamış olabilir):", err);
      }
    }
    return created;
  }

  async function handleGenerate() {
    if (muscleGroups.length === 0) {
      setError("En az bir kas grubu seç.");
      return;
    }
    setLoading(true);
    setError(null);
    setQuickPlan(null);
    setWeeklyPlan(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/workout-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ mode, muscleGroups, equipment, goal, daysPerWeek }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Antrenman üretilemedi.");
      if (mode === "weekly") setWeeklyPlan(json);
      else setQuickPlan(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Antrenman üretilemedi.");
    }
    setLoading(false);
  }

  async function handleApplyQuickPlan() {
    if (!quickPlan) return;
    setApplying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      let currentExercises = await fetchExercises(supabase, categoryId);
      const today = new Date().toISOString().slice(0, 10);
      for (const planEx of quickPlan.exercises) {
        const exercise = await ensureExercise(planEx.name, currentExercises);
        if (!currentExercises.some((ex) => ex.id === exercise.id)) currentExercises = [...currentExercises, exercise];
        for (let i = 0; i < planEx.sets; i += 1) {
          await insertWorkoutSet(supabase, user.id, categoryId, {
            exerciseName: exercise.name,
            setNumber: i + 1,
            reps: planEx.reps,
            weightKg: null,
            date: today,
          });
        }
      }
      setQuickPlan(null);
    } finally {
      setApplying(false);
    }
  }

  async function handleSaveWeeklyPlan() {
    if (!weeklyPlan) return;
    setApplying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      let currentExercises = await fetchExercises(supabase, categoryId);
      let sortOrder = 0;
      for (const day of weeklyPlan.days) {
        for (const planEx of day.exercises) {
          const exercise = await ensureExercise(planEx.name, currentExercises);
          if (!currentExercises.some((ex) => ex.id === exercise.id)) currentExercises = [...currentExercises, exercise];
        }
        await insertWorkoutTemplate(
          supabase,
          user.id,
          categoryId,
          day.label,
          day.exercises.map((e) => e.name),
          sortOrder
        );
        sortOrder += 1;
      }
      setWeeklyPlan(null);
    } finally {
      setApplying(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "900", fontStyle: "italic" }}>
          ANTRENMAN OLUŞTUR
        </ThemedText>
        <ThemedText style={{ color: FREELETICS.muted, fontSize: 11, marginTop: 2 }}>Nasıl bir antrenman istersin?</ThemedText>
      </View>

      <View style={styles.segmentRow}>
        {(["quick", "weekly"] as BuilderMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setError(null);
              setQuickPlan(null);
              setWeeklyPlan(null);
            }}
            style={[styles.segmentPill, mode === m && { backgroundColor: FREELETICS.accent + "26" }]}
          >
            <ThemedText style={{ color: mode === m ? FREELETICS.accent : FREELETICS.muted, fontSize: 12, fontWeight: "700" }}>
              {m === "quick" ? "Bugünün Antrenmanı" : "Haftalık Plan"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Hedef Kas Grubu</ThemedText>
      <View style={styles.chipWrap}>
        {MUSCLE_KEYS.map((m) => (
          <Pressable key={m} onPress={() => toggleMuscle(m)} style={[styles.chip, { borderColor: muscleGroups.includes(m) ? FREELETICS.accent : FREELETICS.border }]}>
            <ThemedText style={{ color: muscleGroups.includes(m) ? FREELETICS.accent : FREELETICS.muted, fontSize: 11 }}>
              {MUSCLE_GROUP_LABELS[m]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Ekipman (boş = fark etmez)</ThemedText>
      <View style={styles.chipWrap}>
        {EQUIPMENT_KEYS.map((e) => (
          <Pressable key={e} onPress={() => toggleEquipment(e)} style={[styles.chip, { borderColor: equipment.includes(e) ? FREELETICS.accent : FREELETICS.border }]}>
            <ThemedText style={{ color: equipment.includes(e) ? FREELETICS.accent : FREELETICS.muted, fontSize: 11 }}>
              {EQUIPMENT_LABELS[e]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Hedef</ThemedText>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {GOAL_OPTIONS.map((g) => (
          <Pressable key={g.value} onPress={() => setGoal(g.value)} style={[styles.chip, { borderColor: goal === g.value ? FREELETICS.accent : FREELETICS.border }]}>
            <ThemedText style={{ color: goal === g.value ? FREELETICS.accent : FREELETICS.muted, fontSize: 11 }}>{g.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {mode === "weekly" && (
        <>
          <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Haftada Kaç Gün</ThemedText>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[3, 4, 5, 6].map((d) => (
              <Pressable key={d} onPress={() => setDaysPerWeek(d)} style={[styles.dayChip, { borderColor: daysPerWeek === d ? FREELETICS.accent : FREELETICS.border }]}>
                <ThemedText style={{ color: daysPerWeek === d ? FREELETICS.accent : FREELETICS.muted, fontSize: 13, fontWeight: "700" }}>{d}</ThemedText>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Pressable onPress={handleGenerate} disabled={loading} style={[styles.primaryButton, { opacity: loading ? 0.6 : 1 }]}>
        {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <ThemedText style={{ color: "#ffffff", fontWeight: "700", fontSize: 13 }}>Antrenman Oluştur</ThemedText>}
      </Pressable>

      {error && <ThemedText style={{ color: "#ff3b30", fontSize: 12 }}>{error}</ThemedText>}

      {quickPlan && (
        <View style={[styles.planCard, { borderColor: FREELETICS.accent + "40", backgroundColor: FREELETICS.accent + "1a" }]}>
          {quickPlan.exercises.map((ex, i) => (
            <View key={i} style={[styles.planRow, { backgroundColor: FREELETICS.elevated }]}>
              <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "900", fontStyle: "italic" }}>{ex.name.toUpperCase()}</ThemedText>
              <ThemedText style={{ color: FREELETICS.muted, fontSize: 11, fontFamily: "monospace" }}>
                {ex.sets} × {ex.reps}
              </ThemedText>
            </View>
          ))}
          <Pressable onPress={handleApplyQuickPlan} disabled={applying} style={[styles.secondaryButton, { backgroundColor: FREELETICS.accent }]}>
            <ThemedText style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>{applying ? "Uygulanıyor..." : "Bugüne Uygula"}</ThemedText>
          </Pressable>
        </View>
      )}

      {weeklyPlan && (
        <View style={[styles.planCard, { borderColor: FREELETICS.accent + "40", backgroundColor: FREELETICS.accent + "1a" }]}>
          {weeklyPlan.progressionNote && <ThemedText style={{ color: "#f5b400", fontSize: 11 }}>{weeklyPlan.progressionNote}</ThemedText>}
          {weeklyPlan.days.map((day, i) => (
            <View key={i} style={[styles.planRow, { backgroundColor: FREELETICS.elevated, gap: 4 }]}>
              <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "900", fontStyle: "italic" }}>
                {i + 1}. {day.label.toUpperCase()}
              </ThemedText>
              {day.exercises.map((ex, j) => (
                <View key={j} style={{ flexDirection: "row", justifyContent: "space-between", paddingLeft: 8 }}>
                  <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>{ex.name}</ThemedText>
                  <ThemedText style={{ color: FREELETICS.muted, fontSize: 11, fontFamily: "monospace" }}>
                    {ex.sets} × {ex.reps}
                  </ThemedText>
                </View>
              ))}
            </View>
          ))}
          <Pressable onPress={handleSaveWeeklyPlan} disabled={applying} style={[styles.secondaryButton, { backgroundColor: FREELETICS.accent }]}>
            <ThemedText style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>{applying ? "Kaydediliyor..." : "Şablonlarıma Kaydet"}</ThemedText>
          </Pressable>
          <ThemedText style={{ color: FREELETICS.muted, fontSize: 10 }}>
            Her gün ayrı bir şablon olarak &quot;Hareketlerim&quot;e kaydedilir, oradan istediğin güne uygulayabilirsin.
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

function getStyles(FREELETICS: ReturnType<typeof getFreeleticsTheme>) {
  return StyleSheet.create({
    container: { padding: 14, gap: 10, backgroundColor: FREELETICS.bg },
    segmentRow: { flexDirection: "row", gap: 4, backgroundColor: FREELETICS.elevated, borderRadius: 8, padding: 3 },
    segmentPill: { flex: 1, borderRadius: 6, paddingVertical: 8, alignItems: "center" },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    dayChip: { borderWidth: 1.5, borderRadius: 8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    primaryButton: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: FREELETICS.accent, marginTop: 4 },
    secondaryButton: { height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    planCard: { borderWidth: 2, borderRadius: 10, padding: 12, gap: 8 },
    planRow: { borderRadius: 8, padding: 10, gap: 2 },
  });
}
