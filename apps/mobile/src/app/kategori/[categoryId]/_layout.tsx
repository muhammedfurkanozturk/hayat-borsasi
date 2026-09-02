import { Feather } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { router, Tabs, useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAppData, type Category } from "@/lib/app-data-context";

// Seviye 2 — kategori-içi navigasyon (bkz. CLAUDE.md bölüm 9, "Mobil
// Navigasyon Mimarisi" kararı). (app) grubunun DIŞINDA, kökte ayrı bir
// stack ekranı — bu sayede Seviye 1'in floating tab bar'ı buraya hiç
// sızmıyor, gerçek nested <Tabs> kendi barını kuruyor. TEK bir shared
// `_layout.tsx` — 8 modül tipinin HEPSİ için — moduleType'a göre hangi
// sekmelerin gösterileceğini ve hangi renk kimliğinin kullanılacağını
// MODULE_TABS/MODULE_THEMES tablolarından okuyor.
type FeatherIconName = keyof typeof Feather.glyphMap;
type TabConfig = { name: string; title: string; icon: FeatherIconName; comingSoon?: boolean };
export type FixedTheme = { mode: "fixed"; bg: string; text: string; muted: string; accent: string };
export type GlobalTheme = { mode: "global" };

// Her kategorinin kendi sabit renk paleti zaten mobil panellerinde var
// (bkz. nutrition-panel.tsx/workout-panel.tsx/vb.'nin kendi sabitleri) —
// burada TEKRAR TANIMLANMIYOR, aynı hex değerleri kullanılıyor ki Seviye 2
// header'ı + alt bar, panelin kendi içeriğiyle birebir tutarlı olsun.
// **habit istisna:** HabitTrackerPanel diğer 7'nin aksine sabit bir kimlik
// KULLANMIYOR (her kart kendi rengini task.id hash'inden alıyor, panel
// global açık/koyu temayı takip ediyor) — bu yüzden "global" modu var,
// header de aynı şekilde cihazın temasını takip ediyor.
export const MODULE_THEMES: Partial<Record<Category["moduleType"], FixedTheme | GlobalTheme>> = {
  nutrition: { mode: "fixed", bg: "#fafafa", text: "#27272a", muted: "#71717a", accent: "#00c896" },
  sport: { mode: "fixed", bg: "#141414", text: "#f5f5f5", muted: "#9a9a9a", accent: "#2e7dff" },
  style: { mode: "fixed", bg: "#0a0a0a", text: "#f5f5f5", muted: "#a1a1aa", accent: "#d4ff00" },
  finance: { mode: "fixed", bg: "#000000", text: "#ffffff", muted: "#8e8e93", accent: "#00e676" },
  focus: { mode: "fixed", bg: "#ffffff", text: "#27272a", muted: "#71717a", accent: "#1cb0f6" },
  digital: { mode: "fixed", bg: "#fafafa", text: "#27272a", muted: "#71717a", accent: "#a78bfa" },
  habit: { mode: "global" },
  travel: { mode: "fixed", bg: "#0d1b2a", text: "#f2f6f9", muted: "#8fa3b3", accent: "#2dd4bf" },
};

// Tek gerçek sekmesi olan kategorilerde (digital/habit/travel — web'de de
// bu modüllerde genel checklist YOK, TAM DEĞİŞTİRME deseni) alt bar
// GİZLENİYOR (bkz. showTabBar), tek yuvaya bir bar göstermenin bir anlamı
// yok. "Yakında" sekmeler ComingSoonTabButton ile dokunulamaz yapılıyor —
// kullanıcı kararı: özellik mobilde taşınana kadar görünür ama pasif kalsın.
const MODULE_TABS: Partial<Record<Category["moduleType"], TabConfig[]>> = {
  nutrition: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "ogun-kaydi", title: "Öğün Kaydı", icon: "clock", comingSoon: true },
    { name: "su", title: "Su", icon: "droplet" },
    { name: "oruc", title: "Oruç", icon: "watch" },
    { name: "kalori", title: "Kalori", icon: "target" },
    { name: "tarifler", title: "Tarifler", icon: "bookmark", comingSoon: true },
  ],
  sport: [
    { name: "hareketlerim", title: "Hareketlerim", icon: "activity" },
    { name: "kutuphane", title: "Kütüphane", icon: "book" },
    { name: "hesaplayicilar", title: "Hesap", icon: "percent" },
    { name: "kas-haritasi", title: "Kas Haritası", icon: "user", comingSoon: true },
    { name: "antrenman-olustur", title: "Antrenman", icon: "zap", comingSoon: true },
  ],
  style: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "gardirobum", title: "Gardırobum", icon: "image" },
    { name: "kombin-olustur", title: "Kombin Oluştur", icon: "layers", comingSoon: true },
    { name: "kombinlerim", title: "Kombinlerim", icon: "archive", comingSoon: true },
    { name: "ai-stilist", title: "AI Stilist", icon: "cloud", comingSoon: true },
    { name: "stil-takvimi", title: "Takvim", icon: "calendar", comingSoon: true },
  ],
  finance: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "portfoy", title: "Portföy", icon: "briefcase" },
    { name: "piyasalar", title: "Piyasalar", icon: "trending-up", comingSoon: true },
    { name: "tarama", title: "Tarama", icon: "filter", comingSoon: true },
    { name: "araclar", title: "Araçlar", icon: "tool", comingSoon: true },
  ],
  focus: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "odaklanma", title: "Odaklanma", icon: "clock" },
  ],
  digital: [{ name: "haritalarim", title: "Haritalarım", icon: "map" }],
  habit: [{ name: "aliskanliklar", title: "Alışkanlıklar", icon: "alert-triangle" }],
  travel: [{ name: "seyahat", title: "Seyahat", icon: "compass" }],
};

// **Gerçek, canlı testte bulunan bir hata:** expo-router'ın <Tabs>'ı, bu
// _layout.tsx'in bulunduğu DİZİNDEKİ (kategori/[categoryId]/) TÜM route
// dosyalarını OTOMATİK olarak sekme yapıyor — sadece `tabs.map()` ile
// İSTEDİĞİM alt kümeyi render etmek bunu ENGELLEMİYOR (dosya sisteminden
// implicit olarak dahil ediliyorlar). Sonuç: bir kategoriye girince TÜM
// 8 kategorinin TÜM sekmeleri (24 tanesi) tek bir bar'da üst üste
// binmiş halde görünüyordu. **Düzeltme:** ilgisiz TÜM route'lara elle
// `options={{ href: null }}` vermek gerekiyor — bu yüzden burada TÜM
// modüllerin TÜM sekme adlarının birleşimi hesaplanıp, mevcut kategorinin
// LİSTESİNDE OLMAYANLAR açıkça gizleniyor.
const ALL_TAB_NAMES = Array.from(new Set(Object.values(MODULE_TABS).flatMap((list) => list?.map((t) => t.name) ?? [])));

export default function CategoryLevel2Layout() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const { loading, categories } = useAppData();
  const globalTheme = useTheme();
  const category = categories.find((c) => c.id === categoryId);

  if (loading || !category) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={globalTheme.accent} />
      </ThemedView>
    );
  }

  const moduleTheme = MODULE_THEMES[category.moduleType] ?? { mode: "global" as const };
  const tabs = MODULE_TABS[category.moduleType] ?? [];
  const resolved =
    moduleTheme.mode === "fixed"
      ? moduleTheme
      : { bg: globalTheme.background, text: globalTheme.text, muted: globalTheme.textSecondary, accent: globalTheme.accent };
  const showTabBar = tabs.length > 1;

  return (
    <View style={{ flex: 1, backgroundColor: resolved.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}>
        <Pressable
          onPress={() => router.replace("/dashboard")}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Feather name="arrow-left" size={16} color={resolved.accent} />
          <ThemedText style={{ color: resolved.accent, fontSize: 13, fontWeight: "600" }}>Dashboard&apos;a Dön</ThemedText>
        </Pressable>
        <ThemedText style={{ fontSize: 22, fontWeight: "800", color: resolved.text }}>{category.name}</ThemedText>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: resolved.accent,
          tabBarInactiveTintColor: resolved.muted,
          tabBarStyle: showTabBar
            ? { backgroundColor: resolved.bg, borderTopColor: resolved.muted + "33" }
            : { display: "none" },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        }}
      >
        {ALL_TAB_NAMES.map((name) => {
          const tab = tabs.find((t) => t.name === name);
          if (!tab) {
            // Bu kategoriye ait olmayan route — bar'dan tamamen gizleniyor
            // (bkz. yukarıdaki not).
            return <Tabs.Screen key={name} name={name} options={{ href: null }} />;
          }
          return (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                title: tab.title,
                tabBarIcon: ({ color, size }) => <Feather name={tab.icon} size={size} color={color} />,
                ...(tab.comingSoon ? { tabBarButton: ComingSoonTabButton } : {}),
              }}
            />
          );
        })}
      </Tabs>
    </View>
  );
}

// Öğün Kaydı/Tarifler/Kas Haritası/vb. gibi mobilde henüz taşınmamış
// alt-özellikler için: sekme GÖRÜNÜR kalsın ama soluk/pasif dursun,
// dokununca yönlendirmesin (kullanıcı kararı).
function ComingSoonTabButton({ children, style }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={[style, { opacity: 0.35 }]}
      accessibilityState={{ disabled: true }}
    >
      {children}
    </Pressable>
  );
}
