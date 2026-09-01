import { useState } from "react";
import { type IconKey, type TaskFrequency } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddCategoryModal } from "@/components/add-category-modal";
import { HabitTrackerPanel } from "@/components/habit-tracker-panel";
import { NutritionPanel } from "@/components/nutrition-panel";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { PortfolioPanel } from "@/components/portfolio-panel";
import { RoadmapPanel } from "@/components/roadmap-panel";
import { TravelPanel } from "@/components/travel-panel";
import { WardrobePanel } from "@/components/wardrobe-panel";
import { WorkoutPanel } from "@/components/workout-panel";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";
import { ICON_KEY_TO_MCI } from "@/lib/icon-map";
import { useAppData, type Category, type Task } from "@/lib/app-data-context";
import { useProfile } from "@/lib/profile-context";

const FREE_CATEGORY_LIMIT = 6;

const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

export default function KategorilerScreen() {
  const theme = useTheme();
  const { loading, categories, tasks, removeCategory } = useAppData();
  const { isPro } = useProfile();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const limitReached = !isPro && categories.length >= FREE_CATEGORY_LIMIT;

  function handleOpenAdd() {
    if (limitReached) {
      setLimitModalOpen(true);
      return;
    }
    setAddModalOpen(true);
  }

  function confirmDeleteCategory(categoryId: string, name: string, taskCount: number) {
    Alert.alert(
      "Kategoriyi sil",
      taskCount > 0
        ? `"${name}" kategorisini ve içindeki ${taskCount} görevi silmek istediğine emin misin?`
        : `"${name}" kategorisini silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => removeCategory(categoryId) },
      ]
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText type="title" style={styles.headerTitle}>
            Kategoriler
          </ThemedText>

          <Pressable
            onPress={handleOpenAdd}
            style={[styles.addCategoryButtonWide, { borderColor: theme.accent + "66", backgroundColor: theme.accent + "1a" }]}
          >
            <MaterialCommunityIcons name={limitReached ? "lock-outline" : "plus"} size={18} color={theme.accent} />
            <ThemedText themeColor="accent" style={styles.addCategoryButtonWideText}>
              {limitReached ? "Pro'ya Geç" : "Kategori Ekle"}
            </ThemedText>
          </Pressable>

          {limitReached && (
            <ThemedText themeColor="textSecondary" style={styles.limitNote}>
              Ücretsiz planda en fazla {FREE_CATEGORY_LIMIT} kategori oluşturabilirsin.
            </ThemedText>
          )}

          {categories.length === 0 && (
            <ThemedText themeColor="textSecondary">
              Henüz kategori yok — yukarıdan ilk kategorini oluştur.
            </ThemedText>
          )}

          {categories.map((category) => {
            const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
            const isExpanded = expandedId === category.id;
            return (
              <View key={category.id} style={[styles.categoryCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : category.id)}
                  style={styles.categoryHeader}
                >
                  <View style={[styles.iconBadge, { backgroundColor: theme.accent + "1a" }]}>
                    <MaterialCommunityIcons name={ICON_KEY_TO_MCI[category.icon]} size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.categoryMeta}>
                      {categoryTasks.length} görev
                    </ThemedText>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => confirmDeleteCategory(category.id, category.name, categoryTasks.length)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.negative} />
                  </Pressable>
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {isExpanded && <CategoryDetail category={category} tasks={categoryTasks} />}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={limitModalOpen} transparent animationType="fade" onRequestClose={() => setLimitModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLimitModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: "#f5b40024" }]}>
              <MaterialCommunityIcons name="lock-outline" size={26} color="#f5b400" />
            </View>
            <ThemedText style={styles.modalTitle}>Ücretsiz kategori limitine ulaştın</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.modalSubtitle}>
              Ücretsiz planda en fazla {FREE_CATEGORY_LIMIT} kategori oluşturabilirsin. Sınırsız kategori için
              Pro'ya geç.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setLimitModalOpen(false)} style={styles.modalCancelButton}>
                <ThemedText themeColor="textSecondary">Vazgeç</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setLimitModalOpen(false);
                  router.push("/pro");
                }}
                style={[styles.modalProButton, { backgroundColor: "#f5b400" }]}
              >
                <ThemedText style={styles.modalProButtonText}>Pro'ya Geç</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AddCategoryModal open={addModalOpen} onClose={() => setAddModalOpen(false)} categories={categories} />
    </ThemedView>
  );
}

function CategoryDetail({ category, tasks }: { category: Category; tasks: Task[] }) {
  const theme = useTheme();
  const elevated = useElevatedStyle();
  const { addTask, removeTask } = useAppData();
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(5);
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  const [saving, setSaving] = useState(false);
  const categoryId = category.id;

  // Kategori Bazlı Tasarım Farklılaştırma kararı (bkz. CLAUDE.md bölüm 9) —
  // "Kötü Alışkanlıklar" modülü genel görev CRUD'u yerine kendi paneline
  // sahip, web'deki HabitTrackerPanel.tsx'in mobil karşılığı.
  if (category.moduleType === "habit") {
    return (
      <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
        <HabitTrackerPanel categoryId={categoryId} tasks={tasks} />
      </View>
    );
  }

  // Kategori Bazlı Tasarım Farklılaştırma — Yol Haritam'ın mobil karşılığı
  // (web: RoadmapPanel.tsx). module_type DB'de hâlâ "digital" (bkz. web
  // CLAUDE.md notu — kod detayı, kullanıcıya görünmüyor).
  if (category.moduleType === "digital") {
    return (
      <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
        <RoadmapPanel categoryId={categoryId} />
      </View>
    );
  }

  // Kategori Bazlı Tasarım Farklılaştırma — Seyahat'in mobil karşılığı
  // (web: TravelPanel.tsx). Web'de de bu kategoride genel checklist YOK
  // (sport/habit/digital/travel — TAM DEĞİŞTİRME deseni).
  if (category.moduleType === "travel") {
    return (
      <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
        <TravelPanel categoryId={categoryId} />
      </View>
    );
  }

  // Kategori Bazlı Tasarım Farklılaştırma — Spor & Vücut'un mobil karşılığı
  // (web: WorkoutLogPanel.tsx). Web'deki gibi genel görev listesinin
  // YERİNE geçiyor (habit/digital ile aynı desen — nutrition/focus'un
  // AKSİNE, web'de de sport kategorisinde genel checklist hiç yok).
  if (category.moduleType === "sport") {
    return (
      <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
        <WorkoutPanel categoryId={categoryId} />
      </View>
    );
  }

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
    <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
      {tasks.length === 0 && (
        <ThemedText themeColor="textSecondary" style={styles.noTasks}>
          Bu kategoride henüz görev yok.
        </ThemedText>
      )}

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskRow}>
          <ThemedText style={{ flex: 1 }}>{task.title}</ThemedText>
          <View style={[styles.badge, { backgroundColor: theme.border }]}>
            <ThemedText themeColor="textSecondary" style={styles.badgeText}>
              {FREQUENCY_OPTIONS.find((f) => f.value === task.frequency)?.label}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.border }]}>
            <ThemedText themeColor="textSecondary" style={styles.badgeText}>
              {task.weight}
            </ThemedText>
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
              <ThemedText themeColor={frequency === option.value ? "accent" : "textSecondary"} style={styles.frequencyPillText}>
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.weightRow}>
          <ThemedText themeColor="textSecondary" style={styles.weightLabel}>
            Ağırlık
          </ThemedText>
          <Pressable
            onPress={() => setWeight((w) => Math.max(1, w - 1))}
            style={[styles.weightButton, { borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="minus" size={16} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.weightValue}>{weight}</ThemedText>
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

      {/* Kategori Bazlı Tasarım Farklılaştırma — Ders & Odaklanma'nın mobil
          karşılığı (web: PomodoroTimer.tsx). Web'deki gibi genel görev
          listesinin ALTINDA, onu değiştirmeden ek olarak render ediliyor —
          Kötü Alışkanlıklar/Yol Haritam'ın aksine bu modülde genel checklist
          web'de de duruyor. */}
      {category.moduleType === "focus" && <PomodoroPanel categoryId={categoryId} />}
      {/* Kategori Bazlı Tasarım Farklılaştırma — Sağlıklı Beslenme'nin
          mobil karşılığı (web: MealLogPanel.tsx). Bölüm 1: sadece Su/
          Oruç/Kalori taşındı, bkz. nutrition-panel.tsx başındaki not. */}
      {category.moduleType === "nutrition" && <NutritionPanel categoryId={categoryId} />}
      {/* Kategori Bazlı Tasarım Farklılaştırma — Stil & Giyim'in mobil
          karşılığı (web: WardrobePanel.tsx). Web'de de bu kategoride genel
          checklist duruyor (nutrition/focus ile AYNI "üstte liste, altta
          panel" deseni — sport/habit/digital'in TAM DEĞİŞTİRME'sinin
          AKSİNE). */}
      {category.moduleType === "style" && <WardrobePanel categoryId={categoryId} />}
      {/* Kategori Bazlı Tasarım Farklılaştırma — Finans & Portföy'ün mobil
          karşılığı (web: PortfolioPanel.tsx). Web'de de bu kategoride genel
          checklist duruyor (nutrition/focus/style ile AYNI desen). */}
      {category.moduleType === "finance" && <PortfolioPanel categoryId={categoryId} />}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 12 },
  headerTitle: { fontSize: 22, lineHeight: 28, marginBottom: 4 },
  addCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  addCategoryInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  addCategoryButton: { borderRadius: 8, width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  addCategoryButtonWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  addCategoryButtonWideText: { fontSize: 14, fontWeight: "600" },
  categoryCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  iconBadge: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  categoryName: { fontSize: 14, fontWeight: "600" },
  categoryMeta: { fontSize: 12, marginTop: 2 },
  detailContainer: { borderTopWidth: 1, padding: 14, gap: 10 },
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
  limitNote: { fontSize: 12, marginTop: -4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 340, borderWidth: 1, borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  modalIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  modalSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  modalCancelButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  modalProButton: { flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 12 },
  modalProButtonText: { color: "#1a1400", fontWeight: "700", fontSize: 13 },
});
