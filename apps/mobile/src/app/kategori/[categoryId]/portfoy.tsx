import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { getRobinhoodTheme, PortfolioPanel } from "@/components/portfolio-panel";
import { useThemeMode } from "@/lib/theme-context";

// Finans & Portföy'ün Seviye 2 route'u (bkz. CLAUDE.md bölüm 9).
export default function PortfoyTab() {
  const ROBINHOOD = getRobinhoodTheme(useThemeMode().theme === "dark");
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: ROBINHOOD.bg }}>
      <PortfolioPanel categoryId={categoryId} />
    </ScrollView>
  );
}
