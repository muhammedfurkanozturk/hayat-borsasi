import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { OutfitGalleryPanel } from "@/components/outfit-gallery-panel";
import { getWheringTheme } from "@/components/wardrobe-panel";
import { useThemeMode } from "@/lib/theme-context";

// Stil & Giyim'in Seviye 2 "Kombinlerim" route'u (bkz. CLAUDE.md bölüm 9).
export default function KombinlerimTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const whering = getWheringTheme(useThemeMode().theme === "dark");
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: whering.bg }}>
      <OutfitGalleryPanel categoryId={categoryId} />
    </ScrollView>
  );
}
