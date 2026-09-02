import { ScrollView } from "react-native";
import { FinanceCalculators } from "@/components/finance-calculators";
import { ROBINHOOD } from "@/components/portfolio-panel";

// Finans & Portföy'ün Seviye 2 "Araçlar" route'u (bkz. CLAUDE.md bölüm 9)
// — SADECE 4 hesaplayıcı (tamamen istemci-taraflı, Supabase'e hiç
// dokunmuyor). Vergi Raporu (CSV export) ve Fiyat Alarmı (cron'a bağlı,
// deploy açığıyla aynı kısıtlama) KASITLI OLARAK bu turda ertelendi —
// Spor & Vücut'un "sadece 1RM hesaplayıcı" kapsam sınırlamasıyla aynı
// felsefe.
export default function AraclarTab() {
  return (
    <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }} style={{ backgroundColor: ROBINHOOD.bg }}>
      <FinanceCalculators />
    </ScrollView>
  );
}
