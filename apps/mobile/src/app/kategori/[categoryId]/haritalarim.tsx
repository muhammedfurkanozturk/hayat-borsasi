import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { RoadmapPanel } from "@/components/roadmap-panel";
import { useTheme } from "@/hooks/use-theme";

// Yol Haritam'ın Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — tek sekme
// (checklist yok, web'de de bu kategoride genel checklist hiç yok).
export default function HaritalarimTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: theme.background }}>
      <RoadmapPanel categoryId={categoryId} />
    </ScrollView>
  );
}
