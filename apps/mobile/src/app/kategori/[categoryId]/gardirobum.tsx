import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { WardrobePanel } from "@/components/wardrobe-panel";

// Stil & Giyim'in Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — WardrobePanel
// zaten tek-amaçlı (sadece Gardırobum), mantığa dokunulmadan doğrudan
// sarılıyor. Panel kendi iç scroll'una sahip değil (eskiden kategoriler.tsx'in
// dış ScrollView'ına güveniyordu) — bu yüzden burada bir ScrollView ekleniyor.
export default function GardirobumTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#0a0a0a" }}>
      <WardrobePanel categoryId={categoryId} />
    </ScrollView>
  );
}
