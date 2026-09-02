import { useEffect, useState } from "react";
import {
  deleteWaterLog,
  fetchNutritionProfile,
  fetchWaterLogs,
  insertWaterLog,
  todayIso,
  upsertNutritionProfile,
  type DbNutritionProfile,
  type DbWaterLog,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";

// nutrition-panel.tsx'teki WaterTab'ın Seviye 2 route'una taşınmış hali
// (bkz. CLAUDE.md bölüm 9) — Supabase/shared mantığı DEĞİŞMEDİ, sadece
// artık kendi ekranı, kendi verisini yüklüyor (paylaşılan NutritionPanel
// state'i yerine).
const YAZIO_TEAL = "#00c896";
const WATER_PRESETS = [200, 330, 500];

export default function SuTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<DbWaterLog[]>([]);
  const [profile, setProfile] = useState<DbNutritionProfile | null>(null);

  async function load() {
    try {
      const [waterRows, profileRow] = await Promise.all([
        fetchWaterLogs(supabase, categoryId, todayIso()),
        fetchNutritionProfile(supabase, categoryId),
      ]);
      setLogs(waterRows.filter((w) => w.date === todayIso()));
      setProfile(profileRow);
    } catch (err) {
      console.error("Su verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const totalMl = logs.reduce((sum, l) => sum + l.amount_ml, 0);
  const goalMl = profile?.water_goal_ml ?? 2000;
  const progress = Math.min(1, totalMl / goalMl);

  async function handleAdd(amountMl: number) {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertWaterLog(supabase, user.id, categoryId, todayIso(), amountMl);
      setLogs((prev) => [created, ...prev]);
    }
    setSaving(false);
  }

  async function handleUndo() {
    const last = logs[0];
    if (!last) return;
    setLogs((prev) => prev.filter((l) => l.id !== last.id));
    await deleteWaterLog(supabase, last.id);
  }

  async function handleSetGoal(newGoal: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const updated = await upsertNutritionProfile(supabase, user.id, categoryId, { water_goal_ml: newGoal });
    setProfile(updated);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
        <ActivityIndicator color={YAZIO_TEAL} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: "#fafafa" }]}>
      <View style={styles.waterRing}>
        <ThemedText style={{ fontSize: 30, fontWeight: "800", color: "#27272a" }}>{totalMl}</ThemedText>
        <ThemedText style={{ fontSize: 12, color: "#71717a" }}>/ {goalMl} ml</ThemedText>
        <View style={[styles.progressTrack, { marginTop: 8 }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: YAZIO_TEAL }]} />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {WATER_PRESETS.map((ml) => (
          <Pressable key={ml} disabled={saving} onPress={() => handleAdd(ml)} style={[styles.waterButton, { borderColor: YAZIO_TEAL }]}>
            <ThemedText style={{ color: YAZIO_TEAL, fontWeight: "700", fontSize: 13 }}>+{ml} ml</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {logs.length > 0 ? (
          <Pressable onPress={handleUndo}>
            <ThemedText style={{ color: "#dc2626", fontSize: 12 }}>Son eklemeyi geri al</ThemedText>
          </Pressable>
        ) : (
          <View />
        )}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Pressable onPress={() => handleSetGoal(Math.max(500, goalMl - 250))}>
            <MaterialCommunityIcons name="minus-circle-outline" size={18} color="#a1a1aa" />
          </Pressable>
          <ThemedText style={{ fontSize: 12, color: "#71717a" }}>Hedef</ThemedText>
          <Pressable onPress={() => handleSetGoal(goalMl + 250)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  waterRing: { alignItems: "center", borderWidth: 2, borderColor: "#e4e4e7", borderRadius: 16, paddingVertical: 20 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#e4e4e7", overflow: "hidden", width: "80%" },
  progressFill: { height: "100%", borderRadius: 999 },
  waterButton: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
});
