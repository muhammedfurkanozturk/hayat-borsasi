import { ScrollView } from "react-native";
import { CalcTab, FREELETICS } from "@/components/workout-panel";

// Spor & Vücut'un Seviye 2 "Hesaplayıcılar" route'u (bkz. CLAUDE.md bölüm
// 9) — CalcTab tamamen istemci-taraflı (1RM hesaplayıcı), Supabase'e hiç
// dokunmuyor, veri yüklemesi yok.
export default function HesaplayicilarTab() {
  return (
    <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }} style={{ backgroundColor: FREELETICS.bg }}>
      <CalcTab />
    </ScrollView>
  );
}
