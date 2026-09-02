import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";

// Seviye 1 — genel floating/pill alt navigasyon. 6 sekme (Endeks/Günlük/
// Kategoriler/Karakter/Rapor/Ayarlar) tek bir pill barda sıkışık durduğu
// için 5 görünür yuvaya indirgendi: son yuva "Diğer" — Rapor ve Ayarlar'ı
// küçük bir alt menüde topluyor (bkz. CLAUDE.md bölüm 9, "Mobil Navigasyon
// Mimarisi" kararı). Üçüncü parti bir tab-bar kütüphanesi KULLANILMADI —
// proje zaten react-native-reanimated'a sahip, yeni bağımlılık/SDK 54
// uyumluluk riski almamak için sıfırdan kuruldu.
type SlotKey = "dashboard" | "gunluk-giris" | "kategoriler" | "karakter-karti" | "more";

const SLOTS: { key: SlotKey; route: string | null; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "dashboard", route: "dashboard", label: "Endeks", icon: "bar-chart-2" },
  { key: "gunluk-giris", route: "gunluk-giris", label: "Günlük", icon: "edit-3" },
  { key: "kategoriler", route: "kategoriler", label: "Kategoriler", icon: "grid" },
  { key: "karakter-karti", route: "karakter-karti", label: "Karakter", icon: "award" },
  { key: "more", route: null, label: "Diğer", icon: "more-horizontal" },
];

const MORE_ROUTES: { route: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { route: "rapor", label: "Rapor", icon: "file-text" },
  { route: "ayarlar", label: "Ayarlar", icon: "settings" },
];

export function FloatingTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const elevated = useElevatedStyle();
  const safeArea = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const pillOffset = useSharedValue(0);

  const activeRouteName = state.routes[state.index]?.name;
  const activeSlotIndex = MORE_ROUTES.some((m) => m.route === activeRouteName)
    ? SLOTS.length - 1
    : SLOTS.findIndex((s) => s.route === activeRouteName);

  const slotWidth = barWidth / SLOTS.length;
  if (slotWidth > 0) {
    pillOffset.value = withSpring(activeSlotIndex >= 0 ? activeSlotIndex * slotWidth : 0, {
      damping: 18,
      stiffness: 180,
    });
  }

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillOffset.value }],
    width: slotWidth > 0 ? slotWidth - 8 : 0,
  }));

  function handlePress(slot: (typeof SLOTS)[number]) {
    if (slot.key === "more") {
      setMoreOpen(true);
      return;
    }
    const route = state.routes.find((r) => r.name === slot.route);
    if (!route) return;
    const isFocused = route.name === activeRouteName;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  function handleMorePress(routeName: string) {
    setMoreOpen(false);
    navigation.navigate(routeName);
  }

  return (
    <>
      <View
        style={[
          styles.container,
          {
            bottom: (safeArea.bottom || insets.bottom || 0) + 12,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
          elevated,
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {slotWidth > 0 && (
          <Animated.View style={[styles.pill, pillStyle, { backgroundColor: theme.accent + "1a" }]} />
        )}
        {SLOTS.map((slot, index) => {
          const isActive = index === activeSlotIndex;
          const color = isActive ? theme.accent : theme.textSecondary;
          return (
            <Pressable key={slot.key} onPress={() => handlePress(slot)} style={styles.slot}>
              <Feather name={slot.icon} size={20} color={color} />
              <ThemedText style={{ fontSize: 10, fontWeight: isActive ? "700" : "500", color, marginTop: 2 }}>
                {slot.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {moreOpen && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.sheetBackdrop}>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 0 }]} onPress={() => setMoreOpen(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            exiting={SlideOutDown.duration(150)}
            style={[
              styles.sheetCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, paddingBottom: safeArea.bottom + 16, zIndex: 1 },
            ]}
          >
            {MORE_ROUTES.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => handleMorePress(item.route)}
                style={({ pressed }) => [
                  styles.sheetRow,
                  { backgroundColor: pressed ? theme.backgroundSelected : "transparent" },
                ]}
              >
                <Feather name={item.icon} size={18} color={theme.text} />
                <ThemedText style={{ fontSize: 15, fontWeight: "600" }}>{item.label}</ThemedText>
              </Pressable>
            ))}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pill: { position: "absolute", top: 6, bottom: 6, left: 4, borderRadius: 999 },
  slot: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 20,
    elevation: 20,
  },
  sheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
});
