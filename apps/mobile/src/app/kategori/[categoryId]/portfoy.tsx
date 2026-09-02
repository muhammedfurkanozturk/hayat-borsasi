import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { PortfolioPanel } from "@/components/portfolio-panel";

// Finans & Portföy'ün Seviye 2 route'u (bkz. CLAUDE.md bölüm 9).
export default function PortfoyTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#000000" }}>
      <PortfolioPanel categoryId={categoryId} />
    </ScrollView>
  );
}
