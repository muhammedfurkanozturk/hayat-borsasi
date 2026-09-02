import { useEffect, useState } from "react";
import { fetchExercises, insertExercise, type DbExercise } from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { FREELETICS, LibraryTab } from "@/components/workout-panel";
import { supabase } from "@/lib/supabase/client";

// Spor & Vücut'un Seviye 2 "Kütüphane" route'u (bkz. CLAUDE.md bölüm 9).
export default function KutuphaneTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<DbExercise[]>([]);

  async function load() {
    try {
      const rows = await fetchExercises(supabase, categoryId);
      setExercises(rows);
    } catch (err) {
      console.error("Kütüphane verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleAdd(name: string) {
    if (exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertExercise(supabase, user.id, categoryId, name, exercises.length);
      setExercises((prev) => [...prev, created]);
    }
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
      <LibraryTab existingNames={exercises.map((e) => e.name)} onAdd={handleAdd} />
    </ScrollView>
  );
}
