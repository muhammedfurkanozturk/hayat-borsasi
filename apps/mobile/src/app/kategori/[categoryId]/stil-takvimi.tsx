import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { StyleCalendarPanel } from "@/components/style-calendar-panel";

// Stil & Giyim'in Seviye 2 "Takvim" route'u (bkz. CLAUDE.md bölüm 9).
export default function StilTakvimiTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#0a0a0a" }}>
      <StyleCalendarPanel categoryId={categoryId} />
    </ScrollView>
  );
}
