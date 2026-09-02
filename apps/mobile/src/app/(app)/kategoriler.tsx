import { useState } from "react";
import { type IconKey } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddCategoryModal } from "@/components/add-category-modal";
import { CategoryChecklistPanel } from "@/components/category-checklist-panel";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ICON_KEY_TO_MCI } from "@/lib/icon-map";
import { useAppData, type Category, type Task } from "@/lib/app-data-context";
import { useProfile } from "@/lib/profile-context";

const FREE_CATEGORY_LIMIT = 6;

// Seviye 2'nin (bkz. CLAUDE.md bölüm 9) her moduleType için ilk/varsayılan
// sekmesi — kategori/[categoryId]/_layout.tsx'teki MODULE_TABS'ın ilk
// elemanıyla AYNI sırada tutulmalı. "standard" (kullanıcının kendi
// oluşturduğu, modülsüz) kategoriler burada YOK — onlar hâlâ eski
// inline-akordeon davranışını koruyor (tek bir Checklist'ten fazlası yok,
// yeni bir ekran/alt bar açmanın kazancı yok).
const LEVEL2_FIRST_TAB: Partial<Record<Category["moduleType"], string>> = {
  nutrition: "checklist",
  sport: "hareketlerim",
  style: "checklist",
  finance: "checklist",
  focus: "checklist",
  digital: "haritalarim",
  habit: "aliskanliklar",
  travel: "seyahat",
};

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
            // Seviye 2 (kategori-içi navigasyon, bkz. CLAUDE.md bölüm 9) —
            // 8 modül tipinin 7'si artık kendi Seviye 2 ekranına gidiyor.
            // Sadece "standard" (kullanıcının kendi oluşturduğu, modülsüz)
            // kategoriler eski inline-akordeon davranışını koruyor.
            const firstTab = LEVEL2_FIRST_TAB[category.moduleType];
            const hasLevel2 = firstTab != null;
            return (
              <View key={category.id} style={[styles.categoryCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <Pressable
                  onPress={() =>
                    firstTab
                      ? router.push(`/kategori/${category.id}/${firstTab}` as Href)
                      : setExpandedId(isExpanded ? null : category.id)
                  }
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
                    name={hasLevel2 ? "chevron-right" : isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {!hasLevel2 && isExpanded && <CategoryDetail category={category} tasks={categoryTasks} />}
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

// Artık SADECE "standard" (kullanıcının kendi oluşturduğu, modülsüz)
// kategoriler için çalışıyor — 8 modül tipinin hepsi kendi Seviye 2
// ekranına yönlendiriliyor (bkz. LEVEL2_FIRST_TAB), buraya hiç düşmüyor.
function CategoryDetail({ category, tasks }: { category: Category; tasks: Task[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.detailContainer, { borderTopColor: theme.border }]}>
      <CategoryChecklistPanel categoryId={category.id} tasks={tasks} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, paddingBottom: BottomTabInset, gap: 12 },
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
