import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { CategoryChecklistPanel } from "@/components/category-checklist-panel";
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";
import { MODULE_THEMES } from "./_layout";

// Checklist, tek fiziksel dosya olarak nutrition/style/finance/focus
// arasında PAYLAŞILIYOR (route adı hepsinde aynı: "checklist") — bu yüzden
// **sabit bir tek renk paleti kullanamaz**, aksi halde her kategori Yazio'nun
// beyazını alırdı (gerçek, canlı testte bulunan bir hata: Stil & Giyim'e
// girince header/alt bar Whering'in koyu temasında ama Checklist içeriği
// beyaz zeminde kalıyordu). `_layout.tsx`'teki AYNI MODULE_THEMES tablosu
// tekrar kullanılıyor (tek kaynak) — kategori moduleType'ına göre doğru
// sabit/global temayı seçiyor.
export default function ChecklistTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const { tasks, categories } = useAppData();
  const globalTheme = useTheme();
  const category = categories.find((c) => c.id === categoryId);
  const categoryTasks = tasks.filter((t) => t.categoryId === categoryId);

  const moduleTheme = (category && MODULE_THEMES[category.moduleType]) ?? { mode: "global" as const };
  const resolved =
    moduleTheme.mode === "fixed"
      ? moduleTheme
      : { bg: globalTheme.background, text: globalTheme.text, muted: globalTheme.textSecondary, accent: globalTheme.accent };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: resolved.bg }}>
      <CategoryChecklistPanel
        categoryId={categoryId}
        tasks={categoryTasks}
        palette={{ text: resolved.text, textSecondary: resolved.muted, border: resolved.muted + "33", backgroundSelected: resolved.bg, accent: resolved.accent }}
      />
    </ScrollView>
  );
}
