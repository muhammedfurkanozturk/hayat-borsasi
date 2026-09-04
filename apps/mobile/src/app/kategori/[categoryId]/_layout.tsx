import { Feather } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { router, Tabs, useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAppData, type Category } from "@/lib/app-data-context";
import { useThemeMode } from "@/lib/theme-context";

// Seviye 2 — kategori-içi navigasyon (bkz. CLAUDE.md bölüm 9, "Mobil
// Navigasyon Mimarisi" kararı). (app) grubunun DIŞINDA, kökte ayrı bir
// stack ekranı — bu sayede Seviye 1'in floating tab bar'ı buraya hiç
// sızmıyor, gerçek nested <Tabs> kendi barını kuruyor. TEK bir shared
// `_layout.tsx` — 8 modül tipinin HEPSİ için — moduleType'a göre hangi
// sekmelerin gösterileceğini ve hangi renk kimliğinin kullanılacağını
// MODULE_TABS/MODULE_THEMES tablolarından okuyor.
type FeatherIconName = keyof typeof Feather.glyphMap;
type TabConfig = { name: string; title: string; icon: FeatherIconName; comingSoon?: boolean };
type ThemeVariant = { bg: string; text: string; muted: string };
// Kritik düzeltme (2026-09-03, madde 3 — "eksikler" envanteri): "fixed" mod
// zemini genel site temasından (açık/koyu) BAĞIMSIZ SABİT tutuyordu — web'in
// bu turda düzeltilen 6 kategorisiyle AYNI hata sınıfı (bkz. CLAUDE.md
// "Kategori Temaları" kritik düzeltme notu). "themed" modu bunun yerini
// alıyor: kategori KİMLİĞİ (accent) sabit kalıyor, zemin genel site
// temasına göre `dark`/`light` arasında geçiş yapıyor — web'deki
// "kimlik sabit, tema genel anahtara uyar" kuralının mobildeki karşılığı.
export type ThemedCategoryTheme = { mode: "themed"; accent: string; dark: ThemeVariant; light: ThemeVariant };
export type GlobalTheme = { mode: "global" };

// Her kategorinin kendi renk paleti zaten mobil panellerinde var (bkz.
// nutrition-panel.tsx/workout-panel.tsx/vb.'nin kendi get*Theme
// fonksiyonları) — burada AYNI hex değerleri tekrarlanıyor ki Seviye 2
// header'ı + alt bar, panelin kendi içeriğiyle birebir tutarlı olsun.
// **habit istisna:** HabitTrackerPanel diğer 7'nin aksine sabit bir kimlik
// KULLANMIYOR (her kart kendi rengini task.id hash'inden alıyor, panel
// global açık/koyu temayı takip ediyor) — bu yüzden "global" modu var,
// header de aynı şekilde cihazın temasını takip ediyor.
export const MODULE_THEMES: Partial<Record<Category["moduleType"], ThemedCategoryTheme | GlobalTheme>> = {
  nutrition: {
    mode: "themed",
    accent: "#00c896",
    dark: { bg: "#1c1c1e", text: "#f5f5f5", muted: "#a0a0a5" },
    light: { bg: "#fafafa", text: "#27272a", muted: "#71717a" },
  },
  sport: {
    mode: "themed",
    accent: "#2e7dff",
    dark: { bg: "#141414", text: "#f5f5f5", muted: "#9a9a9a" },
    light: { bg: "#f2f2f2", text: "#141414", muted: "#6b6b6b" },
  },
  style: {
    mode: "themed",
    accent: "#d4ff00",
    dark: { bg: "#0a0a0a", text: "#f5f5f5", muted: "#9a9a9a" },
    light: { bg: "#fafafa", text: "#141414", muted: "#6b6b6b" },
  },
  finance: {
    mode: "themed",
    accent: "#00e676",
    dark: { bg: "#000000", text: "#ffffff", muted: "#8e8e93" },
    light: { bg: "#ffffff", text: "#000000", muted: "#6e6e73" },
  },
  focus: {
    mode: "themed",
    accent: "#1cb0f6",
    dark: { bg: "#1c1c1e", text: "#f5f5f5", muted: "#a0a0a5" },
    light: { bg: "#ffffff", text: "#27272a", muted: "#71717a" },
  },
  digital: {
    mode: "themed",
    accent: "#a78bfa",
    dark: { bg: "#1a1a1d", text: "#f4f4f5", muted: "#a1a1aa" },
    light: { bg: "#fafafa", text: "#27272a", muted: "#71717a" },
  },
  habit: { mode: "global" },
  travel: {
    mode: "themed",
    accent: "#2dd4bf",
    dark: { bg: "#0d1b2a", text: "#f2f6f9", muted: "#8fa3b3" },
    light: { bg: "#f4f8fa", text: "#0d1b2a", muted: "#5f7385" },
  },
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
    { name: "kas-haritasi", title: "Kas Haritası", icon: "user" },
    { name: "antrenman-olustur", title: "Antrenman", icon: "zap" },
  ],
  style: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "gardirobum", title: "Gardırobum", icon: "image" },
    { name: "kombin-olustur", title: "Kombin Oluştur", icon: "layers", comingSoon: true },
    { name: "kombinlerim", title: "Kombinlerim", icon: "archive" },
    { name: "ai-stilist", title: "AI Stilist", icon: "cloud", comingSoon: true },
    { name: "stil-takvimi", title: "Takvim", icon: "calendar" },
  ],
  finance: [
    { name: "checklist", title: "Checklist", icon: "check-square" },
    { name: "portfoy", title: "Portföy", icon: "briefcase" },
    { name: "piyasalar", title: "Piyasalar", icon: "trending-up", comingSoon: true },
    { name: "tarama", title: "Tarama", icon: "filter", comingSoon: true },
    { name: "araclar", title: "Araçlar", icon: "tool" },
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
  const { theme: themeMode } = useThemeMode();
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
    moduleTheme.mode === "themed"
      ? { ...(themeMode === "dark" ? moduleTheme.dark : moduleTheme.light), accent: moduleTheme.accent }
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
