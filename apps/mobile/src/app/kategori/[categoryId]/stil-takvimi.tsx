import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { StyleCalendarPanel } from "@/components/style-calendar-panel";
import { getWheringTheme } from "@/components/wardrobe-panel";
import { useThemeMode } from "@/lib/theme-context";

// Stil & Giyim'in Seviye 2 "Takvim" route'u (bkz. CLAUDE.md bölüm 9).
export default function StilTakvimiTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const whering = getWheringTheme(useThemeMode().theme === "dark");
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: whering.bg }}>
      <StyleCalendarPanel categoryId={categoryId} />
    </ScrollView>
  );
}
