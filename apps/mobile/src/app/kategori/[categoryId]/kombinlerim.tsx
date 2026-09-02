import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { OutfitGalleryPanel } from "@/components/outfit-gallery-panel";

// Stil & Giyim'in Seviye 2 "Kombinlerim" route'u (bkz. CLAUDE.md bölüm 9).
export default function KombinlerimTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#0a0a0a" }}>
      <OutfitGalleryPanel categoryId={categoryId} />
    </ScrollView>
  );
}
