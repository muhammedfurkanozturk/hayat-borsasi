import { useMemo, useState } from "react";
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_LIBRARY,
  MUSCLE_GROUP_LABELS,
  deleteWorkoutSet,
  formatDaysAgo,
  insertWorkoutSet,
  todayIso,
  type DbExercise,
  type DbWorkoutSet,
  type MuscleGroup,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Spor &
// Vücut'un mobil karşılığı. Freeletics'in koyu/mavi/bold-italik kimliği
// (sabit renkler, mobil tema sisteminden bağımsız). **Bilinçli kapsam
// sınırlaması (web'in 6 sekmesinden SADECE 3'ü):** Hareketlerim/Kütüphane/
// Hesaplayıcılar taşındı — **Kas Haritası** (`body-muscles` npm paketi
// doğrudan DOM manipülasyonu yapıyor, RN'de karşılığı yok, yeni bir
// anatomi-görselleştirme çözümü gerektirir) ve **Antrenman Oluştur**
// (AI antrenman üretimi, ayrı bir API+CORS turu gerektirir) KASITLI
// OLARAK ERTELENDİ. **Hareketlerim ayrıca web'in sürükle-bırak (dnd-kit)
// haftalık ızgarasından BİLİNÇLİ OLARAK basitleştirildi** — RN'de
// sürükle-bırak için yeni bir kütüphane gerekirdi, bunun yerine "hareket
// seç → BUGÜNE set/tekrar/ağırlık gir" akışı (haftanın diğer günleri
// yok, sadece bugün). **Takip** (grafikler) de bu turda atlandı.
// Bu panel önceden `WorkoutPanel` adında tek bir bileşendi (kendi iç
// Hareketlerim/Kütüphane/Hesap sekme geçişiyle) — Seviye 2'ye (kategori-içi
// navigasyon, bkz. CLAUDE.md bölüm 9) geçilince bu üç alt bileşen ayrı
// route'lara (hareketlerim.tsx/kutuphane.tsx/hesaplayicilar.tsx) taşındı,
// her biri kendi verisini kendi yüklüyor (nutrition'ın su/oruç/kalori
// route'larıyla AYNI desen). `WorkoutPanel` sarmalayıcısı KALDIRILDI, sadece
// bu üç alt bileşen + paylaşılan sabitler export ediliyor.
// Kritik düzeltme (2026-09-03, madde 3 — "eksikler" envanteri) — bu sabit
// SABİT/tek moda kilitliydi (web'in bu turda düzeltilen 6 kategorisiyle
// AYNI hata sınıfı, bkz. CLAUDE.md "Kategori Temaları" kritik düzeltme
// notu). Artık bir FONKSİYON — çağıran component kendi `useThemeMode()`
// değerine göre `getFreeleticsTheme(theme === "dark")` çağırıp sonucu
// `FREELETICS` adıyla YEREL bir değişkene atıyor (aşağıdaki 3 component'in
// hepsinde aynı desen) — bu sayede dosya içindeki onlarca `FREELETICS.x`
// kullanım noktasının HİÇBİRİNE dokunmadan (gölgeleme/shadowing) doğru
// temaya otomatik geçiyor. Mavi vurgu (#2e7dff) HER İKİ modda da aynı.
export function getFreeleticsTheme(isDark: boolean) {
  return isDark
    ? {
        bg: "#141414",
        surface: "#1c1c1c",
        elevated: "#242424",
        border: "rgba(255,255,255,0.12)",
        text: "#f5f5f5",
        muted: "#9a9a9a",
        accent: "#2e7dff",
      }
    : {
        bg: "#f2f2f2",
        surface: "#ffffff",
        elevated: "#ffffff",
        border: "rgba(0,0,0,0.12)",
        text: "#141414",
        muted: "#6b6b6b",
        accent: "#2e7dff",
      };
}

function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}
function brzycki(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

export function LogTab({
  categoryId,
  exercises,
  sets,
  personalRecords,
  lastDoneDates,
  newExerciseName,
  onNewExerciseNameChange,
  onAddExercise,
  onDeleteExercise,
  onSetsChange,
}: {
  categoryId: string;
  exercises: DbExercise[];
  sets: DbWorkoutSet[];
  personalRecords: Map<string, { weightKg: number }>;
  lastDoneDates: Map<string, string>;
  newExerciseName: string;
  onNewExerciseNameChange: (v: string) => void;
  onAddExercise: () => void;
  onDeleteExercise: (id: string) => void;
  onSetsChange: (updater: (prev: DbWorkoutSet[]) => DbWorkoutSet[]) => void;
}) {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [setsCount, setSetsCount] = useState("3");
  const [saving, setSaving] = useState(false);

  const today = todayIso();
  const todaySets = sets.filter((s) => s.date === today);
  const byExercise = new Map<string, DbWorkoutSet[]>();
  for (const s of todaySets) {
    const arr = byExercise.get(s.exercise_name) ?? [];
    arr.push(s);
    byExercise.set(s.exercise_name, arr);
  }

  async function handleLogSet() {
    const exercise = exercises.find((e) => e.id === activeExerciseId);
    const repsNum = Number(reps);
    const setsNum = Number(setsCount);
    if (!exercise || !(repsNum > 0) || !(setsNum > 0)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const existingForDay = todaySets.filter((s) => s.exercise_name.toLowerCase() === exercise.name.toLowerCase()).length;
      const weightKg = weight ? Number(weight) : null;
      const created: DbWorkoutSet[] = [];
      for (let i = 0; i < setsNum; i += 1) {
        created.push(
          await insertWorkoutSet(supabase, user.id, categoryId, {
            exerciseName: exercise.name,
            setNumber: existingForDay + i + 1,
            reps: repsNum,
            weightKg,
            date: today,
          })
        );
      }
      onSetsChange((prev) => [...created, ...prev]);
      setActiveExerciseId(null);
    }
    setSaving(false);
  }

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {exercises.map((ex) => (
          <Pressable
            key={ex.id}
            onPress={() => setActiveExerciseId(ex.id)}
            onLongPress={() => onDeleteExercise(ex.id)}
            style={[
              styles.exerciseChip,
              { borderColor: activeExerciseId === ex.id ? FREELETICS.accent : FREELETICS.border },
            ]}
          >
            <ThemedText style={{ color: FREELETICS.text, fontSize: 11, fontWeight: "900", fontStyle: "italic" }}>
              {ex.name.toUpperCase()}
            </ThemedText>
            {personalRecords.get(ex.name)?.weightKg != null && (
              <ThemedText style={{ color: "#f5b400", fontSize: 9, marginTop: 2 }}>
                🏆 {personalRecords.get(ex.name)?.weightKg}kg
              </ThemedText>
            )}
            {lastDoneDates.get(ex.name) && (
              <ThemedText style={{ color: FREELETICS.muted, fontSize: 9, marginTop: 1 }}>
                {formatDaysAgo(lastDoneDates.get(ex.name)!, today)}
              </ThemedText>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={newExerciseName}
          onChangeText={onNewExerciseNameChange}
          placeholder="örn. Şınav"
          placeholderTextColor={FREELETICS.muted}
          style={[styles.input, { borderColor: FREELETICS.border, color: FREELETICS.text, backgroundColor: FREELETICS.elevated }]}
          onSubmitEditing={onAddExercise}
        />
        <Pressable onPress={onAddExercise} style={[styles.addButton, { backgroundColor: FREELETICS.accent + "26" }]}>
          <MaterialCommunityIcons name="plus" size={16} color={FREELETICS.accent} />
        </Pressable>
      </View>

      {activeExerciseId && (
        <View style={[styles.logForm, { borderColor: FREELETICS.accent + "4d", backgroundColor: FREELETICS.accent + "1a" }]}>
          <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "700" }}>
            {exercises.find((e) => e.id === activeExerciseId)?.name}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput value={setsCount} onChangeText={setSetsCount} placeholder="Set" keyboardType="number-pad" placeholderTextColor={FREELETICS.muted} style={[styles.smallInput, { borderColor: FREELETICS.border, color: FREELETICS.text }]} />
            <TextInput value={reps} onChangeText={setReps} placeholder="Tekrar" keyboardType="number-pad" placeholderTextColor={FREELETICS.muted} style={[styles.smallInput, { borderColor: FREELETICS.border, color: FREELETICS.text }]} />
            <TextInput value={weight} onChangeText={setWeight} placeholder="kg" keyboardType="decimal-pad" placeholderTextColor={FREELETICS.muted} style={[styles.smallInput, { borderColor: FREELETICS.border, color: FREELETICS.text }]} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={handleLogSet} disabled={saving} style={[styles.primaryButton, { backgroundColor: FREELETICS.accent, flex: 1 }]}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <ThemedText style={{ color: "#fff", fontWeight: "700" }}>Kaydet</ThemedText>}
            </Pressable>
            <Pressable onPress={() => setActiveExerciseId(null)} style={[styles.secondaryButton, { borderColor: FREELETICS.border }]}>
              <ThemedText style={{ color: FREELETICS.muted }}>Vazgeç</ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Bugün</ThemedText>
      {byExercise.size === 0 && <ThemedText style={{ color: FREELETICS.muted, fontSize: 12 }}>Bugün henüz set girilmedi.</ThemedText>}
      {Array.from(byExercise.entries()).map(([name, exSets]) => (
        <View key={name} style={{ gap: 4 }}>
          <ThemedText style={{ color: FREELETICS.muted, fontSize: 11, fontWeight: "900", fontStyle: "italic" }}>{name.toUpperCase()}</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {exSets.map((s) => (
              <View key={s.id} style={[styles.setChip, { borderColor: FREELETICS.border }]}>
                <ThemedText style={{ color: FREELETICS.text, fontSize: 11, fontFamily: "monospace" }}>
                  #{s.set_number} — {s.reps}×{s.weight_kg != null ? `${s.weight_kg}kg` : "-"}
                </ThemedText>
                <Pressable
                  hitSlop={8}
                  onPress={async () => {
                    onSetsChange((prev) => prev.filter((x) => x.id !== s.id));
                    await deleteWorkoutSet(supabase, s.id);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={12} color={FREELETICS.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function LibraryTab({ existingNames, onAdd }: { existingNames: string[]; onAdd: (name: string) => void }) {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (muscle && e.muscleGroup !== muscle) return false;
      return true;
    }).slice(0, 40);
  }, [query, muscle]);

  const existingLower = new Set(existingNames.map((n) => n.toLowerCase()));
  const muscleGroups = Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.muscleGroup)));

  return (
    <View style={{ gap: 10 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Egzersiz ara..."
        placeholderTextColor={FREELETICS.muted}
        style={[styles.input, { borderColor: FREELETICS.border, color: FREELETICS.text, backgroundColor: FREELETICS.elevated }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Pressable onPress={() => setMuscle(null)} style={[styles.filterChip, { borderColor: muscle === null ? FREELETICS.accent : FREELETICS.border }]}>
          <ThemedText style={{ color: muscle === null ? FREELETICS.accent : FREELETICS.muted, fontSize: 11 }}>Tümü</ThemedText>
        </Pressable>
        {muscleGroups.map((mg) => (
          <Pressable key={mg} onPress={() => setMuscle(mg)} style={[styles.filterChip, { borderColor: muscle === mg ? FREELETICS.accent : FREELETICS.border }]}>
            <ThemedText style={{ color: muscle === mg ? FREELETICS.accent : FREELETICS.muted, fontSize: 11 }}>{MUSCLE_GROUP_LABELS[mg]}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>{results.length} sonuç</ThemedText>
      <View style={{ gap: 6 }}>
        {results.map((ex) => {
          const already = existingLower.has(ex.name.toLowerCase());
          return (
            <View key={ex.id} style={[styles.libraryRow, { borderColor: FREELETICS.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: FREELETICS.text, fontSize: 12, fontWeight: "900", fontStyle: "italic" }}>{ex.name.toUpperCase()}</ThemedText>
                <ThemedText style={{ color: FREELETICS.muted, fontSize: 10 }}>
                  {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {EQUIPMENT_LABELS[ex.equipment]} · {DIFFICULTY_LABELS[ex.difficulty]}
                </ThemedText>
              </View>
              <Pressable disabled={already} onPress={() => onAdd(ex.name)} style={[styles.addButton, { backgroundColor: FREELETICS.accent + "26", opacity: already ? 0.5 : 1 }]}>
                <ThemedText style={{ color: FREELETICS.accent, fontSize: 10, fontWeight: "700" }}>{already ? "Eklendi" : "Ekle"}</ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function CalcTab() {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const weightNum = Number(weight);
  const repsNum = Number(reps);
  const valid = weightNum > 0 && repsNum > 0 && repsNum < 37;
  const epleyResult = valid ? epley(weightNum, repsNum) : null;
  const brzyckiResult = valid ? brzycki(weightNum, repsNum) : null;

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: FREELETICS.text, fontSize: 13, fontWeight: "700" }}>1RM Hesaplayıcı</ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={weight} onChangeText={setWeight} placeholder="Ağırlık (kg)" keyboardType="decimal-pad" placeholderTextColor={FREELETICS.muted} style={[styles.input, { flex: 1, borderColor: FREELETICS.border, color: FREELETICS.text, backgroundColor: FREELETICS.elevated }]} />
        <TextInput value={reps} onChangeText={setReps} placeholder="Tekrar" keyboardType="number-pad" placeholderTextColor={FREELETICS.muted} style={[styles.input, { flex: 1, borderColor: FREELETICS.border, color: FREELETICS.text, backgroundColor: FREELETICS.elevated }]} />
      </View>
      {valid && epleyResult != null && (
        <View style={{ gap: 4 }}>
          <ThemedText style={{ color: FREELETICS.accent, fontSize: 26, fontWeight: "800", fontFamily: "monospace" }}>
            {Math.round(epleyResult)} kg
          </ThemedText>
          <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>tahmini 1RM (Epley)</ThemedText>
          {brzyckiResult != null && !Number.isNaN(brzyckiResult) && (
            <ThemedText style={{ color: FREELETICS.muted, fontSize: 11 }}>Brzycki formülüne göre: ~{Math.round(brzyckiResult)} kg</ThemedText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, borderRadius: 12, padding: 14 },
  tabRow: { flexDirection: "row", gap: 6 },
  tabPill: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  exerciseChip: { borderWidth: 2, borderRadius: 10, padding: 10, minWidth: 96, alignItems: "center" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13 },
  smallInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, height: 38, fontSize: 13 },
  addButton: { borderRadius: 8, width: 40, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  logForm: { borderWidth: 2, borderRadius: 10, padding: 10, gap: 8 },
  primaryButton: { height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryButton: { height: 38, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  setChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  libraryRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
});
