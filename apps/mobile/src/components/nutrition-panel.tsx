import { useEffect, useState } from "react";
import {
  calculateCalorieGoal,
  deleteWaterLog,
  fetchActiveFastingSession,
  fetchNutritionProfile,
  fetchWaterLogs,
  insertWaterLog,
  startFasting,
  stopFasting,
  todayIso,
  upsertNutritionProfile,
  type ActivityLevel,
  type BiologicalSex,
  type CalorieGoal,
  type DbFastingSession,
  type DbNutritionProfile,
  type DbWaterLog,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Sağlıklı
// Beslenme'nin mobil karşılığı, Bölüm 1. Yazio'nun teal kimliği (sabit,
// mobil tema sisteminden bağımsız). **Bilinçli kapsam sınırlaması (web'in
// 6 sekmesinden SADECE 3'ü bu turda taşındı):** Su Takibi/Aralıklı Oruç/
// Kalori Takibi burada — Öğün Kaydı (AI fotoğraf analizi + USDA arama +
// barkod tarama + sürükle-bırak öğün planlayıcı) ve Tarifler (AI tarif
// üretimi) KASITLI OLARAK ERTELENDİ, web'in en büyük/en karmaşık iki
// alt-özelliği, ayrı bir turda ele alınmalı. Checklist tabı da mobilde
// AYRI bir sekme değil — kategori sayfasının genel görev listesi zaten
// üstte duruyor (Odaklanma/Pomodoro'daki AYNI "üstte genel liste, altta
// modül paneli" deseni, web'in 6-sekmeli iç yapısını mobilde TAM
// kopyalamak yerine).
const YAZIO_TEAL = "#00c896";
const WATER_PRESETS = [200, 330, 500];
const FASTING_PRESETS = [14, 16, 18, 20];
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function NutritionPanel({ categoryId }: { categoryId: string }) {
  const [tab, setTab] = useState<"water" | "fasting" | "calories">("water");
  const [loading, setLoading] = useState(true);
  const [waterLogs, setWaterLogs] = useState<DbWaterLog[]>([]);
  const [profile, setProfile] = useState<DbNutritionProfile | null>(null);
  const [fastingSession, setFastingSession] = useState<DbFastingSession | null>(null);

  async function load() {
    try {
      const [waterRows, profileRow, fastingRow] = await Promise.all([
        fetchWaterLogs(supabase, categoryId, todayIso()),
        fetchNutritionProfile(supabase, categoryId),
        fetchActiveFastingSession(supabase, categoryId),
      ]);
      setWaterLogs(waterRows.filter((w) => w.date === todayIso()));
      setProfile(profileRow);
      setFastingSession(fastingRow);
    } catch (err) {
      console.error("Beslenme verisi yüklenemedi:", err);
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
      <View style={[styles.container, { backgroundColor: "#fafafa" }]}>
        <ActivityIndicator color={YAZIO_TEAL} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#fafafa" }]}>
      <View style={styles.segmentRow}>
        {(
          [
            { key: "water", label: "Su", icon: "water-outline" },
            { key: "fasting", label: "Oruç", icon: "timer-sand" },
            { key: "calories", label: "Kalori", icon: "fire" },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.segmentPill, tab === t.key && { backgroundColor: YAZIO_TEAL + "1a" }]}
          >
            <MaterialCommunityIcons name={t.icon} size={14} color={tab === t.key ? YAZIO_TEAL : "#71717a"} />
            <ThemedText style={{ color: tab === t.key ? YAZIO_TEAL : "#71717a", fontSize: 12, fontWeight: "700" }}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {tab === "water" && (
        <WaterTab categoryId={categoryId} logs={waterLogs} profile={profile} onLogsChange={setWaterLogs} onProfileChange={setProfile} />
      )}
      {tab === "fasting" && <FastingTab categoryId={categoryId} session={fastingSession} onSessionChange={setFastingSession} />}
      {tab === "calories" && <CaloriesTab categoryId={categoryId} profile={profile} onProfileChange={setProfile} />}
    </View>
  );
}

function WaterTab({
  categoryId,
  logs,
  profile,
  onLogsChange,
  onProfileChange,
}: {
  categoryId: string;
  logs: DbWaterLog[];
  profile: DbNutritionProfile | null;
  onLogsChange: (updater: (prev: DbWaterLog[]) => DbWaterLog[]) => void;
  onProfileChange: (p: DbNutritionProfile) => void;
}) {
  const [saving, setSaving] = useState(false);
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
      onLogsChange((prev) => [created, ...prev]);
    }
    setSaving(false);
  }

  async function handleUndo() {
    const last = logs[0];
    if (!last) return;
    onLogsChange((prev) => prev.filter((l) => l.id !== last.id));
    await deleteWaterLog(supabase, last.id);
  }

  async function handleSetGoal(newGoal: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const updated = await upsertNutritionProfile(supabase, user.id, categoryId, { water_goal_ml: newGoal });
    onProfileChange(updated);
  }

  return (
    <View style={{ gap: 14 }}>
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
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => handleSetGoal(Math.max(500, goalMl - 250))}>
            <MaterialCommunityIcons name="minus-circle-outline" size={18} color="#a1a1aa" />
          </Pressable>
          <ThemedText style={{ fontSize: 12, color: "#71717a" }}>Hedef</ThemedText>
          <Pressable onPress={() => handleSetGoal(goalMl + 250)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FastingTab({
  categoryId,
  session,
  onSessionChange,
}: {
  categoryId: string;
  session: DbFastingSession | null;
  onSessionChange: (s: DbFastingSession | null) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  async function handleStart(hours: number) {
    setStarting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await startFasting(supabase, user.id, categoryId, hours);
      onSessionChange(created);
    }
    setStarting(false);
  }

  async function handleStop() {
    if (!session) return;
    await stopFasting(supabase, session.id);
    onSessionChange(null);
  }

  if (!session) {
    return (
      <View style={{ gap: 12 }}>
        <ThemedText style={{ fontSize: 13, color: "#71717a" }}>Kaç saatlik oruç tutmak istiyorsun?</ThemedText>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {FASTING_PRESETS.map((h) => (
            <Pressable key={h} disabled={starting} onPress={() => handleStart(h)} style={[styles.waterButton, { borderColor: YAZIO_TEAL }]}>
              <ThemedText style={{ color: YAZIO_TEAL, fontWeight: "700", fontSize: 13 }}>{h} saat</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const elapsedMs = now - new Date(session.start_at).getTime();
  const targetMs = session.target_hours * 3600 * 1000;
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const progress = Math.min(1, elapsedMs / targetMs);

  return (
    <View style={{ gap: 14, alignItems: "center" }}>
      <ThemedText style={{ fontSize: 12, color: "#71717a" }}>Kalan süre</ThemedText>
      <ThemedText style={{ fontSize: 34, fontWeight: "800", color: "#27272a", fontVariant: ["tabular-nums"] }}>
        {formatDuration(remainingMs)}
      </ThemedText>
      <View style={[styles.progressTrack, { width: "100%" }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: YAZIO_TEAL }]} />
      </View>
      <Pressable onPress={handleStop} style={[styles.primaryButton, { backgroundColor: "#e91e63" }]}>
        <ThemedText style={{ color: "#ffffff", fontWeight: "700" }}>Orucu Bitir</ThemedText>
      </Pressable>
    </View>
  );
}

function CaloriesTab({
  categoryId,
  profile,
  onProfileChange,
}: {
  categoryId: string;
  profile: DbNutritionProfile | null;
  onProfileChange: (p: DbNutritionProfile) => void;
}) {
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
        <ThemedText style={{ fontSize: 12, color: "#71717a" }}>Günlük Hedefin</ThemedText>
        <ThemedText style={{ fontSize: 32, fontWeight: "800", color: "#27272a" }}>{goalKcal} kcal</ThemedText>
        <Pressable onPress={() => setEditing(true)}>
          <ThemedText style={{ color: YAZIO_TEAL, fontSize: 12, fontWeight: "600" }}>Ayarları Düzenle</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={weight} onChangeText={setWeight} placeholder="Kilo (kg)" keyboardType="decimal-pad" placeholderTextColor="#a1a1aa" style={styles.input} />
        <TextInput value={height} onChangeText={setHeight} placeholder="Boy (cm)" keyboardType="decimal-pad" placeholderTextColor="#a1a1aa" style={styles.input} />
        <TextInput value={age} onChangeText={setAge} placeholder="Yaş" keyboardType="number-pad" placeholderTextColor="#a1a1aa" style={styles.input} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["male", "female"] as BiologicalSex[]).map((s) => (
          <Pressable key={s} onPress={() => setSex(s)} style={[styles.chip, { borderColor: sex === s ? YAZIO_TEAL : "#e4e4e7" }]}>
            <ThemedText style={{ fontSize: 12, color: sex === s ? YAZIO_TEAL : "#3f3f46" }}>{s === "male" ? "Erkek" : "Kadın"}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText style={{ fontSize: 11, color: "#71717a" }}>Aktivite Düzeyi</ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {ACTIVITY_OPTIONS.map((o) => (
          <Pressable key={o.value} onPress={() => setActivity(o.value)} style={[styles.chip, { borderColor: activity === o.value ? YAZIO_TEAL : "#e4e4e7" }]}>
            <ThemedText style={{ fontSize: 11, color: activity === o.value ? YAZIO_TEAL : "#3f3f46" }}>{o.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText style={{ fontSize: 11, color: "#71717a" }}>Hedefin</ThemedText>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {GOAL_OPTIONS.map((o) => (
          <Pressable key={o.value} onPress={() => setGoal(o.value)} style={[styles.chip, { borderColor: goal === o.value ? YAZIO_TEAL : "#e4e4e7" }]}>
            <ThemedText style={{ fontSize: 11, color: goal === o.value ? YAZIO_TEAL : "#3f3f46" }}>{o.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, { backgroundColor: YAZIO_TEAL, marginTop: 6 }]}>
        {saving ? <ActivityIndicator color="#ffffff" size="small" /> : <ThemedText style={{ color: "#ffffff", fontWeight: "700" }}>Kaydet</ThemedText>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, borderRadius: 12, padding: 14 },
  segmentRow: { flexDirection: "row", gap: 4, backgroundColor: "#f0f0f0", borderRadius: 8, padding: 3 },
  segmentPill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 6, paddingVertical: 8 },
  waterRing: { alignItems: "center", borderWidth: 2, borderColor: "#e4e4e7", borderRadius: 16, paddingVertical: 20 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#e4e4e7", overflow: "hidden", width: "80%" },
  progressFill: { height: "100%", borderRadius: 999 },
  waterButton: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  primaryButton: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  input: { flex: 1, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 8, paddingHorizontal: 8, height: 40, fontSize: 13, color: "#27272a", backgroundColor: "#ffffff" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
});
