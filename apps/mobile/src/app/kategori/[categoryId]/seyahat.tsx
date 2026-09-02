import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { TravelPanel } from "@/components/travel-panel";

// Seyahat'in Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — tek sekme.
export default function SeyahatTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#0d1b2a" }}>
      <TravelPanel categoryId={categoryId} />
    </ScrollView>
  );
}
