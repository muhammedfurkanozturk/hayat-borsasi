import { useEffect, useState } from "react";
import {
  calculateLastDoneDates,
  calculatePersonalRecords,
  daysAgoIso,
  deleteExercise,
  fetchExercises,
  fetchWorkoutSets,
  insertDefaultExercises,
  insertExercise,
  type DbExercise,
  type DbWorkoutSet,
} from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { getFreeleticsTheme, LogTab } from "@/components/workout-panel";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Spor & Vücut'un Seviye 2 "Hareketlerim" route'u (bkz. CLAUDE.md bölüm 9)
// — workout-panel.tsx'teki LogTab'ın kendi verisini kendi yüklediği hali,
// eskiden paylaşılan WorkoutPanel state'inden geliyordu.
export default function HareketlerimTab() {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<DbExercise[]>([]);
  const [sets, setSets] = useState<DbWorkoutSet[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");

  async function load() {
    try {
      let exerciseRows = await fetchExercises(supabase, categoryId);
      if (exerciseRows.length === 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) exerciseRows = await insertDefaultExercises(supabase, user.id, categoryId);
      }
      setExercises(exerciseRows);
      const since = daysAgoIso(365);
      const setRows = await fetchWorkoutSets(supabase, categoryId, since);
      setSets(setRows);
    } catch (err) {
      console.error("Spor verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleAddExercise() {
    if (!newExerciseName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertExercise(supabase, user.id, categoryId, newExerciseName.trim(), exercises.length);
      setExercises((prev) => [...prev, created]);
      setNewExerciseName("");
    }
  }

  async function handleDeleteExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    await deleteExercise(supabase, id);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: FREELETICS.bg }}>
        <ActivityIndicator color={FREELETICS.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }} style={{ backgroundColor: FREELETICS.bg }}>
      <LogTab
        categoryId={categoryId}
        exercises={exercises}
        sets={sets}
        personalRecords={calculatePersonalRecords(sets)}
        lastDoneDates={calculateLastDoneDates(sets)}
        newExerciseName={newExerciseName}
        onNewExerciseNameChange={setNewExerciseName}
        onAddExercise={handleAddExercise}
        onDeleteExercise={handleDeleteExercise}
        onSetsChange={setSets}
      />
    </ScrollView>
  );
}
