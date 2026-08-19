import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/lib/profile-context";

const MONTHLY_PRICE = 5;
const YEARLY_PRICE = 40;
const YEARLY_FULL_PRICE = MONTHLY_PRICE * 12;

const PLANS = [
  { id: "monthly", label: "Aylık", price: MONTHLY_PRICE, suffix: "/ ay", originalPrice: null as number | null, badge: null as string | null },
  {
    id: "yearly",
    label: "Yıllık",
    price: YEARLY_PRICE,
    suffix: "/ yıl",
    originalPrice: YEARLY_FULL_PRICE,
    badge: "%33 İndirim",
  },
];

const FEATURES = [
  "Sınırsız kategori (ücretsizde en fazla 6)",
  "AI Rapor — Günlük, Aylık ve Yıllık anlık özetler",
  "Her gece otomatik oluşturulup arşivlenen AI raporu",
  "Yeni Pro özelliklere ilk erişim",
];

export default function ProScreen() {
  const theme = useTheme();
  const { isPro } = useProfile();

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={theme.textSecondary} />
          </Pressable>

          <ThemedText type="title" style={styles.headerTitle}>
            Hayat Borsası Pro
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
            Sınırsız kategori, AI Rapor ve daha fazlası
          </ThemedText>

          {isPro ? (
            <View style={[styles.proCard, { borderColor: "#f5b40050", backgroundColor: "#f5b40014" }]}>
              <View style={[styles.proIcon, { backgroundColor: "#f5b400" }]}>
                <Feather name="award" size={24} color="#1a1400" />
              </View>
              <ThemedText style={styles.proTitle}>Zaten Pro üyesin</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.proSubtitle}>
                Tüm Pro özellikler hesabında aktif.
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.card, { borderColor: "#f5b40060", backgroundColor: theme.backgroundElement }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: "#f5b40024" }]}>
                  <Feather name="award" size={18} color="#f5b400" />
                </View>
                <ThemedText style={styles.cardHeaderText}>Pro</ThemedText>
              </View>

              <View style={styles.plansRow}>
                {PLANS.map((plan) => (
                  <View key={plan.id} style={[styles.planCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <View style={styles.planTopRow}>
                      <ThemedText themeColor="textSecondary" style={styles.planLabel}>
                        {plan.label}
                      </ThemedText>
                      {plan.badge && (
                        <View style={[styles.planBadge, { backgroundColor: theme.positive + "24" }]}>
                          <ThemedText style={[styles.planBadgeText, { color: theme.positive }]}>{plan.badge}</ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={styles.planPriceRow}>
                      {plan.originalPrice && (
                        <ThemedText themeColor="textSecondary" style={styles.planOriginalPrice}>
                          ${plan.originalPrice}
                        </ThemedText>
                      )}
                      <ThemedText style={styles.planPrice}>${plan.price}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.planSuffix}>
                        {plan.suffix}
                      </ThemedText>
                    </View>
                    <View style={[styles.planButton, { backgroundColor: "#f5b400" }]}>
                      <ThemedText style={styles.planButtonText}>Yakında</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <View style={[styles.featureList, { borderTopColor: theme.border }]}>
                {FEATURES.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: "#f5b40024" }]}>
                      <Feather name="check" size={10} color="#f5b400" />
                    </View>
                    <ThemedText style={styles.featureText}>{feature}</ThemedText>
                  </View>
                ))}
              </View>

              <ThemedText themeColor="textSecondary" style={styles.footNote}>
                Ödeme altyapısı henüz aktif değil.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4 },
  backButton: { marginBottom: 8, alignSelf: "flex-start" },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { fontSize: 13, marginBottom: 16 },
  proCard: { borderWidth: 1, borderRadius: 20, padding: 28, alignItems: "center", gap: 8 },
  proIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  proTitle: { fontSize: 16, fontWeight: "700" },
  proSubtitle: { fontSize: 13 },
  card: { borderWidth: 2, borderRadius: 20, padding: 20, gap: 20 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardHeaderIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardHeaderText: { fontSize: 17, fontWeight: "800" },
  plansRow: { gap: 12 },
  planCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  planTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  planBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  planBadgeText: { fontSize: 10, fontWeight: "700" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  planOriginalPrice: { fontSize: 13, textDecorationLine: "line-through" },
  planPrice: { fontSize: 26, fontWeight: "800" },
  planSuffix: { fontSize: 12 },
  planButton: { borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  planButtonText: { color: "#1a1400", fontWeight: "700", fontSize: 13 },
  featureList: { gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureIcon: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  featureText: { fontSize: 13, flex: 1 },
  footNote: { fontSize: 11, textAlign: "center" },
});
