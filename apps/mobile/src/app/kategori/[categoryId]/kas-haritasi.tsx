import { useEffect, useMemo, useState } from "react";
import {
  calculateMuscleVolume,
  daysAgoIso,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_LIBRARY,
  fetchExercises,
  fetchWorkoutSets,
  MUSCLE_GROUP_LABELS,
  updateExerciseMuscle,
  type DbExercise,
  type DbWorkoutSet,
  type MuscleGroup,
} from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { getFreeleticsTheme } from "@/components/workout-panel";
import { MuscleMap } from "@/components/muscle-map";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Spor & Vücut'un Seviye 2 "Kas Haritası" route'u (2026-09-04, madde 4 —
// "eksikler" envanteri) — web'in `body-muscles` (DOM-only) kütüphanesi
// yerine `muscle-map.tsx`'teki AYNI dosyanın belgelediği basitleştirilmiş
// SVG bölge haritası kullanılıyor (bkz. o dosyadaki not). Isı haritası
// mantığı (`calculateMuscleVolume`, son 7 gün) web ile AYNI paylaşılan
// fonksiyon. Kendi verisini kendi yüklüyor (su/oruç/kalori route'larıyla
// AYNI mimari desen).
export default function KasHaritasiTab() {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const styles = getStyles(FREELETICS);
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<DbExercise[]>([]);
  const [sets, setSets] = useState<DbWorkoutSet[]>([]);
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);

  async function load() {
    try {
      const exerciseRows = await fetchExercises(supabase, categoryId);
      setExercises(exerciseRows);
      const since = daysAgoIso(7);
      const setRows = await fetchWorkoutSets(supabase, categoryId, since);
      setSets(setRows);
    } catch (err) {
      console.error("Kas haritası verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const volumeByGroup = useMemo(
    () => calculateMuscleVolume(sets, exercises) as Partial<Record<MuscleGroup, number>>,
    [sets, exercises]
  );

  const libraryMatches = selectedGroup ? EXERCISE_LIBRARY.filter((e) => e.muscleGroup === selectedGroup) : [];
  const untaggedExercises = exercises.filter((e) => !e.primary_muscle);

  async function handleTagMuscle(exerciseId: string, muscle: MuscleGroup) {
    setExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, primary_muscle: muscle } : e)));
    await updateExerciseMuscle(supabase, exerciseId, muscle);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: FREELETICS.bg }}>
        <ActivityIndicator color={FREELETICS.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "900", fontStyle: "italic" }}>
          KAS HARİTASI
        </ThemedText>
        <View style={styles.segmentRow}>
          {(["front", "back"] as const).map((v) => (
            <Pressable key={v} onPress={() => setView(v)} style={[styles.segmentPill, view === v && { backgroundColor: FREELETICS.accent + "26" }]}>
              <ThemedText style={{ color: view === v ? FREELETICS.accent : FREELETICS.muted, fontSize: 11, fontWeight: "700" }}>
                {v === "front" ? "Ön" : "Arka"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>
        Bir kasa dokun, o kası hedefleyen egzersizleri gör. Renk = son 7 günkü hacmin.
      </ThemedText>

      <View style={styles.mapBox}>
        <MuscleMap
          view={view}
          volumeByGroup={volumeByGroup}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          accent={FREELETICS.accent}
          muted={FREELETICS.muted}
        />
      </View>

      {selectedGroup && (
        <View style={[styles.card, { borderColor: FREELETICS.accent + "40", backgroundColor: FREELETICS.accent + "1a" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "700" }}>
              {MUSCLE_GROUP_LABELS[selectedGroup]} Egzersizleri
            </ThemedText>
            <Pressable onPress={() => setSelectedGroup(null)}>
              <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Kapat</ThemedText>
            </Pressable>
          </View>
          <View style={{ gap: 6, marginTop: 8 }}>
            {libraryMatches.map((ex) => (
              <View key={ex.id} style={[styles.exerciseRow, { backgroundColor: FREELETICS.elevated }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "700" }}>{ex.name}</ThemedText>
                  <ThemedText style={{ color: FREELETICS.muted, fontSize: 9 }}>
                    {EQUIPMENT_LABELS[ex.equipment]} · {DIFFICULTY_LABELS[ex.difficulty]}
                  </ThemedText>
                </View>
                <ThemedText style={{ color: FREELETICS.muted, fontSize: 10, marginTop: 2 }}>{ex.instructions}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {untaggedExercises.length > 0 && (
        <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: FREELETICS.border, paddingTop: 10 }}>
          <ThemedText style={{ color: FREELETICS.muted, fontSize: 10 }}>
            Isı haritasında görünmesi için kendi hareketlerini bir kas grubuna etiketle (opsiyonel):
          </ThemedText>
          {untaggedExercises.map((ex) => (
            <View key={ex.id} style={[styles.tagRow, { borderColor: FREELETICS.border }]}>
              <ThemedText style={{ color: FREELETICS.text, fontSize: 11, flex: 1 }} numberOfLines={1}>
                {ex.name}
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((mg) => (
                  <Pressable key={mg} onPress={() => handleTagMuscle(ex.id, mg)} style={[styles.tagChip, { borderColor: FREELETICS.border }]}>
                    <ThemedText style={{ color: FREELETICS.muted, fontSize: 9 }}>{MUSCLE_GROUP_LABELS[mg]}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function getStyles(FREELETICS: ReturnType<typeof getFreeleticsTheme>) {
  return StyleSheet.create({
    container: { padding: 14, gap: 12, backgroundColor: FREELETICS.bg },
    segmentRow: { flexDirection: "row", gap: 4, backgroundColor: FREELETICS.elevated, borderRadius: 8, padding: 3 },
    segmentPill: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
    mapBox: { height: 340, width: 220, alignSelf: "center" },
    card: { borderWidth: 2, borderRadius: 10, padding: 12 },
    exerciseRow: { borderRadius: 8, padding: 8 },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
    tagChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  });
}
