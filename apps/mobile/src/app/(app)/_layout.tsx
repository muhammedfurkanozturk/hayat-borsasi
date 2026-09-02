import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/floating-tab-bar";

// AppDataProvider/ProfileProvider artık kök _layout.tsx'te (session
// guard'ının çevresinde) — bkz. oradaki not. Burada TEKRAR sarmak iki ayrı
// instance oluşturup Seviye 2 (kategori/[categoryId]) ile veri
// tutarsızlığına yol açardı.
export default function AppLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Endeks" }} />
      <Tabs.Screen name="gunluk-giris" options={{ title: "Günlük" }} />
      <Tabs.Screen name="kategoriler" options={{ title: "Kategoriler" }} />
      <Tabs.Screen name="karakter-karti" options={{ title: "Karakter" }} />
      <Tabs.Screen name="rapor" options={{ title: "Rapor" }} />
      <Tabs.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      <Tabs.Screen name="pro" options={{ href: null }} />
    </Tabs>
  );
}
