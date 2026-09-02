import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { RoadmapPanel } from "@/components/roadmap-panel";

// Yol Haritam'ın Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — tek sekme
// (checklist yok, web'de de bu kategoride genel checklist hiç yok).
export default function HaritalarimTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#fafafa" }}>
      <RoadmapPanel categoryId={categoryId} />
    </ScrollView>
  );
}
