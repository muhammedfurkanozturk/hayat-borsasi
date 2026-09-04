import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { TravelPanel } from "@/components/travel-panel";
import { useTheme } from "@/hooks/use-theme";

// Seyahat'in Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — tek sekme.
export default function SeyahatTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: theme.background }}>
      <TravelPanel categoryId={categoryId} />
    </ScrollView>
  );
}
