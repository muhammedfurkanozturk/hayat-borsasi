import { useEffect, useState } from "react";
import {
  calculateCalorieGoal,
  fetchNutritionProfile,
  upsertNutritionProfile,
  type ActivityLevel,
  type BiologicalSex,
  type CalorieGoal,
  type DbNutritionProfile,
} from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// nutrition-panel.tsx'teki CaloriesTab'ın Seviye 2 route'una taşınmış hali
// (bkz. CLAUDE.md bölüm 9) — mantık DEĞİŞMEDİ, sadece kendi ekranı.
const YAZIO_TEAL = "#00c896";

// Kritik düzeltme (2026-09-03, madde 3) — su.tsx'teki AYNI palet (bkz. o
// dosyadaki not), burada ayrıca `chipMuted` (seçilmemiş chip metni).
function getYazioTheme(isDark: boolean) {
  return isDark
    ? { bg: "#1c1c1e", surface: "#2c2c2e", text: "#f5f5f5", muted: "#a0a0a5", chipMuted: "#c7c7cc", border: "rgba(255,255,255,0.12)" }
    : { bg: "#fafafa", surface: "#ffffff", text: "#27272a", muted: "#71717a", chipMuted: "#3f3f46", border: "#e4e4e7" };
}
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Hareketsiz" },
  { value: "light", label: "Az Hareketli" },
  { value: "moderate", label: "Orta" },
  { value: "active", label: "Aktif" },
  { value: "very_active", label: "Çok Aktif" },
];
const GOAL_OPTIONS: { value: CalorieGoal; label: string }[] = [
  { value: "lose", label: "Kilo Ver" },
  { value: "maintain", label: "Kilomu Koru" },
  { value: "gain", label: "Kilo Al" },
];

export default function KaloriTab() {
  const yazio = getYazioTheme(useThemeMode().theme === "dark");
  const styles = getStyles(yazio);
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DbNutritionProfile | null>(null);

  async function load() {
    try {
      const row = await fetchNutritionProfile(supabase, categoryId);
      setProfile(row);
    } catch (err) {
      console.error("Kalori verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: yazio.bg }}>
        <ActivityIndicator color={YAZIO_TEAL} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CaloriesForm categoryId={categoryId} profile={profile} onProfileChange={setProfile} />
    </ScrollView>
  );
}

function CaloriesForm({
  categoryId,
  profile,
  onProfileChange,
}: {
  categoryId: string;
  profile: DbNutritionProfile | null;
  onProfileChange: (p: DbNutritionProfile) => void;
}) {
  const yazio = getYazioTheme(useThemeMode().theme === "dark");
  const styles = getStyles(yazio);
  const [editing, setEditing] = useState(!profile || profile.weight_kg == null);
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() ?? "");
  const [height, setHeight] = useState(profile?.height_cm?.toString() ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [sex, setSex] = useState<BiologicalSex>(profile?.sex ?? "male");
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity_level ?? "moderate");
  const [goal, setGoal] = useState<CalorieGoal>(profile?.goal ?? "maintain");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const weightNum = Number(weight);
    const heightNum = Number(height);
    const ageNum = Number(age);
    if (!(weightNum > 0) || !(heightNum > 0) || !(ageNum > 0)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const updated = await upsertNutritionProfile(supabase, user.id, categoryId, {
        weight_kg: weightNum,
        height_cm: heightNum,
        age: ageNum,
        sex,
        goal,
        activity_level: activity,
      });
      onProfileChange(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  if (!editing && profile?.weight_kg != null && profile.height_cm != null && profile.age != null && profile.sex) {
    const goalKcal = calculateCalorieGoal({
      weightKg: profile.weight_kg,
      heightCm: profile.height_cm,
      age: profile.age,
      sex: profile.sex,
      goal: profile.goal ?? "maintain",
      activityLevel: profile.activity_level ?? "moderate",
    });
    return (
      <View style={{ gap: 10, alignItems: "center" }}>
        <ThemedText style={{ fontSize: 12, color: yazio.muted }}>Günlük Hedefin</ThemedText>
        <ThemedText style={{ fontSize: 32, fontWeight: "800", color: yazio.text }}>{goalKcal} kcal</ThemedText>
        <Pressable onPress={() => setEditing(true)}>
          <ThemedText style={{ color: YAZIO_TEAL, fontSize: 12, fontWeight: "600" }}>Ayarları Düzenle</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={weight} onChangeText={setWeight} placeholder="Kilo (kg)" keyboardType="decimal-pad" placeholderTextColor={yazio.muted} style={styles.input} />
        <TextInput value={height} onChangeText={setHeight} placeholder="Boy (cm)" keyboardType="decimal-pad" placeholderTextColor={yazio.muted} style={styles.input} />
        <TextInput value={age} onChangeText={setAge} placeholder="Yaş" keyboardType="number-pad" placeholderTextColor={yazio.muted} style={styles.input} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["male", "female"] as BiologicalSex[]).map((s) => (
          <Pressable key={s} onPress={() => setSex(s)} style={[styles.chip, { borderColor: sex === s ? YAZIO_TEAL : yazio.border }]}>
            <ThemedText style={{ fontSize: 12, color: sex === s ? YAZIO_TEAL : yazio.chipMuted }}>{s === "male" ? "Erkek" : "Kadın"}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText style={{ fontSize: 11, color: yazio.muted }}>Aktivite Düzeyi</ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {ACTIVITY_OPTIONS.map((o) => (
          <Pressable key={o.value} onPress={() => setActivity(o.value)} style={[styles.chip, { borderColor: activity === o.value ? YAZIO_TEAL : yazio.border }]}>
            <ThemedText style={{ fontSize: 11, color: activity === o.value ? YAZIO_TEAL : yazio.chipMuted }}>{o.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText style={{ fontSize: 11, color: yazio.muted }}>Hedefin</ThemedText>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {GOAL_OPTIONS.map((o) => (
          <Pressable key={o.value} onPress={() => setGoal(o.value)} style={[styles.chip, { borderColor: goal === o.value ? YAZIO_TEAL : yazio.border }]}>
            <ThemedText style={{ fontSize: 11, color: goal === o.value ? YAZIO_TEAL : yazio.chipMuted }}>{o.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, { backgroundColor: YAZIO_TEAL, marginTop: 6 }]}>
        {saving ? <ActivityIndicator color="#ffffff" size="small" /> : <ThemedText style={{ color: "#ffffff", fontWeight: "700" }}>Kaydet</ThemedText>}
      </Pressable>
    </View>
  );
}

function getStyles(yazio: ReturnType<typeof getYazioTheme>) {
  return StyleSheet.create({
    container: { padding: 20, gap: 14, backgroundColor: yazio.bg },
    primaryButton: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: yazio.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      height: 40,
      fontSize: 13,
      color: yazio.text,
      backgroundColor: yazio.surface,
    },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  });
}
