import { useState } from "react";
import { type TaskFrequency } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";
import { useAppData, type Task } from "@/lib/app-data-context";

// Genel görev listesi (kategoriye özel modül paneli olmayan/olsa da onun
// ÜSTÜNDE duran "Checklist" kısmı) — önceden kategoriler.tsx'in
// CategoryDetail fallback render'ına gömülüydü, Seviye 2 (kategori-içi
// navigasyon, bkz. CLAUDE.md bölüm 9) için ayrı bir ekran (checklist.tsx)
// olarak da kullanılabilsin diye buraya çıkarıldı — mantık DEĞİŞMEDİ, sadece
// dosya sınırı.
export const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

type ChecklistPalette = { text: string; textSecondary: string; border: string; backgroundSelected: string; accent: string };

export function CategoryChecklistPanel({
  categoryId,
  tasks,
  palette,
}: {
  categoryId: string;
  tasks: Task[];
  // Bu panel hem genel tema ile uyumlu bağlamlarda (kategoriler.tsx'in
  // inline akordeonu — palette VERİLMEZ, useTheme() global açık/koyu
  // temayı kullanır) HEM DE sabit/tema-bağımsız kategori kimliklerinde
  // (Seviye 2, bkz. CLAUDE.md bölüm 9 — örn. checklist.tsx'in Yazio teal
  // zemini) kullanılıyor. İkincisinde ThemedText'in varsayılan rengi
  // (global useTheme()'den gelir) sabit açık zemine karşı düşük kontrast
  // olabiliyordu (koyu tema aktifken açık renkli metin, beyaz zeminde
  // okunaksız) — bu yüzden opsiyonel bir palette override eklendi.
  palette?: ChecklistPalette;
}) {
  const globalTheme = useTheme();
  const theme = palette ?? globalTheme;
  const elevated = useElevatedStyle();
  const { addTask, removeTask } = useAppData();
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(5);
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  const [saving, setSaving] = useState(false);

  async function handleAddTask() {
    if (!title.trim()) return;
    setSaving(true);
    await addTask(categoryId, title, weight, frequency);
    setTitle("");
    setWeight(5);
    setFrequency("daily");
    setSaving(false);
  }

  return (
    <View style={{ gap: 10 }}>
      {tasks.length === 0 && (
        <ThemedText style={[styles.noTasks, { color: theme.textSecondary }]}>
          Bu kategoride henüz görev yok.
        </ThemedText>
      )}

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskRow}>
          <ThemedText style={{ flex: 1, color: theme.text }}>{task.title}</ThemedText>
          <View style={[styles.badge, { backgroundColor: theme.border }]}>
            <ThemedText style={[styles.badgeText, { color: theme.textSecondary }]}>
              {FREQUENCY_OPTIONS.find((f) => f.value === task.frequency)?.label}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.border }]}>
            <ThemedText style={[styles.badgeText, { color: theme.textSecondary }]}>{task.weight}</ThemedText>
          </View>
          <Pressable hitSlop={8} onPress={() => removeTask(task.id)}>
            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      ))}

      <View style={styles.addTaskForm}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Yeni görev ekle..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.addTaskInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSelected }, elevated]}
          onSubmitEditing={handleAddTask}
        />

        <View style={styles.frequencyRow}>
          {FREQUENCY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setFrequency(option.value)}
              style={[
                styles.frequencyPill,
                {
                  borderColor: frequency === option.value ? theme.accent : theme.border,
                  backgroundColor: frequency === option.value ? theme.accent + "1a" : "transparent",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.frequencyPillText,
                  { color: frequency === option.value ? theme.accent : theme.textSecondary },
                ]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.weightRow}>
          <ThemedText style={[styles.weightLabel, { color: theme.textSecondary }]}>Ağırlık</ThemedText>
          <Pressable
            onPress={() => setWeight((w) => Math.max(1, w - 1))}
            style={[styles.weightButton, { borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="minus" size={16} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.weightValue, { color: theme.text }]}>{weight}</ThemedText>
          <Pressable
            onPress={() => setWeight((w) => Math.min(10, w + 1))}
            style={[styles.weightButton, { borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="plus" size={16} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={handleAddTask}
            disabled={saving || !title.trim()}
            style={[styles.addTaskButton, { backgroundColor: theme.accent, opacity: title.trim() ? 1 : 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#04191d" size="small" />
            ) : (
              <ThemedText style={styles.addTaskButtonText}>Ekle</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noTasks: { fontSize: 13 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11 },
  addTaskForm: { gap: 10, marginTop: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "transparent" },
  addTaskInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  frequencyRow: { flexDirection: "row", gap: 8 },
  frequencyPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  frequencyPillText: { fontSize: 12 },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weightLabel: { fontSize: 12, marginRight: 2 },
  weightButton: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  weightValue: { fontSize: 14, minWidth: 18, textAlign: "center" },
  addTaskButton: { marginLeft: "auto", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addTaskButtonText: { color: "#04191d", fontWeight: "600", fontSize: 13 },
});
