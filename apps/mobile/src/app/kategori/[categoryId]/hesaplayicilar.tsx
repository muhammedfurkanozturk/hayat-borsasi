import { ScrollView } from "react-native";
import { CalcTab, getFreeleticsTheme } from "@/components/workout-panel";
import { useThemeMode } from "@/lib/theme-context";

// Spor & Vücut'un Seviye 2 "Hesaplayıcılar" route'u (bkz. CLAUDE.md bölüm
// 9) — CalcTab tamamen istemci-taraflı (1RM hesaplayıcı), Supabase'e hiç
// dokunmuyor, veri yüklemesi yok.
export default function HesaplayicilarTab() {
  const FREELETICS = getFreeleticsTheme(useThemeMode().theme === "dark");
  return (
    <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }} style={{ backgroundColor: FREELETICS.bg }}>
      <CalcTab />
    </ScrollView>
  );
}
