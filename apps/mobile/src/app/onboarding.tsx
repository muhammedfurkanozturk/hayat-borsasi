import { useState } from "react";
import { ONBOARDING_TEMPLATES } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";
import { ICON_KEY_TO_MCI } from "@/lib/icon-map";
import { useProfile } from "@/lib/profile-context";

// Web'in src/app/(app)/onboarding/OnboardingClient.tsx'inin RN portu —
// bkz. OnboardingGate. `(app)` grubunun ve `kategori/[categoryId]`'nin
// KARDEŞİ olarak kök _layout.tsx'te ayrı bir Stack.Screen — floating tab
// bar hiç sızmasın diye (kullanıcı henüz kategorisi olmadan tab bar'ı
// görmemeli).
export default function OnboardingScreen() {
  const theme = useTheme();
  const { addCategoriesFromTemplates } = useAppData();
  const { completeOnboarding } = useProfile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    const chosen = ONBOARDING_TEMPLATES.filter((t) => selected.has(t.key)).map((t) => ({
      name: t.name,
      icon: t.icon,
      moduleType: t.moduleType,
    }));
    await addCategoriesFromTemplates(chosen);
    await completeOnboarding();
    router.replace("/dashboard");
  }

  async function handleSkip() {
    setSaving(true);
    await completeOnboarding();
    router.replace("/dashboard");
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText type="title" style={styles.headerTitle}>
            Hoş geldin
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
            İlk alışkanlıklarını seç — bunlar sadece öneri, istediğin kadarını seç, hiçbirini seçmek zorunda
            değilsin. Seçtiklerin normal birer kategori olarak eklenir, istediğin zaman düzenleyebilir veya
            silebilirsin.
          </ThemedText>

          <View style={{ gap: 10 }}>
            {ONBOARDING_TEMPLATES.map((template) => {
              const isSelected = selected.has(template.key);
              return (
                <Pressable
                  key={template.key}
                  onPress={() => toggle(template.key)}
                  style={[
                    styles.templateRow,
                    {
                      borderColor: isSelected ? theme.accent + "99" : theme.border,
                      backgroundColor: isSelected ? theme.accent + "1a" : theme.backgroundElement,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.templateIcon,
                      { backgroundColor: isSelected ? theme.accent + "33" : theme.backgroundSelected },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={ICON_KEY_TO_MCI[template.icon]}
                      size={20}
                      color={isSelected ? theme.accent : theme.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.templateDesc}>
                      {template.description}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? "check-circle" : "checkbox-blank-circle-outline"}
                    size={22}
                    color={isSelected ? theme.accent : theme.border}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={handleSkip} disabled={saving} style={styles.skipButton} hitSlop={8}>
              <ThemedText themeColor="textSecondary" style={styles.skipText}>
                Şimdilik atla
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleContinue}
              disabled={saving}
              style={[styles.continueButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ThemedText style={styles.continueText}>
                  {selected.size > 0 ? `Devam (${selected.size} seçildi)` : "Devam"}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, gap: 20 },
  headerTitle: { fontSize: 26, lineHeight: 32 },
  headerSubtitle: { fontSize: 13, lineHeight: 19, marginTop: -8 },
  templateRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderRadius: 14, padding: 14 },
  templateIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  templateName: { fontSize: 14, fontWeight: "700" },
  templateDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 4 },
  skipButton: { paddingVertical: 12, paddingHorizontal: 4 },
  skipText: { fontSize: 13, fontWeight: "600" },
  continueButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  continueText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
