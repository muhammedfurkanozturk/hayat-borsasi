import { useMemo, useState } from "react";
import {
  average,
  buildCalendarMonthSeries,
  buildCalendarYearSeries,
  calculateScore,
  makeScoreForDate,
  nonNullScores,
  todayIso,
} from "@hayat-borsasi/shared";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LeaderboardCard } from "@/components/leaderboard-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";
import { useProfile } from "@/lib/profile-context";

const PERIODS = ["Günlük", "Aylık", "Yıllık"] as const;
type Period = (typeof PERIODS)[number];

function getTier(score: number) {
  if (score >= 80) return { label: "ELMAS", color: "#5ac8fa" };
  if (score >= 60) return { label: "ALTIN", color: "#f5b400" };
  if (score >= 40) return { label: "GÜMÜŞ", color: "#9ca3af" };
  return { label: "BRONZ", color: "#b26a3a" };
}

export default function KarakterKartiScreen() {
  const theme = useTheme();
  const { loading, categories, tasks, dailyHistory } = useAppData();
  const { displayName } = useProfile();
  const [period, setPeriod] = useState<Period>("Günlük");

  const data = useMemo(() => {
    const today = todayIso();
    return categories.map((category) => {
      const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
      const liveScore = calculateScore(categoryTasks);

      if (period === "Günlük") {
        return { category: category.name, score: Math.round(liveScore) };
      }

      const scoreForDate = makeScoreForDate(dailyHistory, today, liveScore, (d) => d.categoryScores[category.id] ?? 0);
      const series = period === "Aylık" ? buildCalendarMonthSeries(scoreForDate) : buildCalendarYearSeries(scoreForDate);
      return { category: category.name, score: Math.round(average(nonNullScores(series))) };
    });
  }, [period, categories, tasks, dailyHistory]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  const overallScore = data.length > 0 ? average(data.map((d) => d.score)) : 0;
  const strongest = data.length ? data.reduce((best, d) => (d.score > best.score ? d : best), data[0]) : null;
  const weakest = data.length ? data.reduce((worst, d) => (d.score < worst.score ? d : worst), data[0]) : null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const tier = getTier(overallScore);
  const maxScore = Math.max(1, ...data.map((d) => d.score));

  const stats = [
    ...(strongest ? [{ label: "En Güçlü Alan", value: `${strongest.category} · ${strongest.score}` }] : []),
    ...(weakest ? [{ label: "En Zayıf Alan", value: `${weakest.category} · ${weakest.score}` }] : []),
    { label: "Kategori Sayısı", value: String(categories.length) },
    { label: "Toplam Görev", value: String(tasks.length) },
    { label: "Sıralama", value: "#1" },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText type="title" style={styles.headerTitle}>
            Karakter Kartı
          </ThemedText>

          {data.length > 0 && (
            <View style={[styles.card, { borderColor: tier.color, backgroundColor: theme.backgroundElement }]}>
              <View style={styles.cardTop}>
                <ThemedText style={[styles.scoreValue, { color: tier.color }]}>{Math.round(overallScore)}</ThemedText>
                <ThemedText style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</ThemedText>
                <View style={[styles.avatar, { backgroundColor: theme.accent, borderColor: tier.color }]}>
                  <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                </View>
                <ThemedText style={styles.name}>{displayName}</ThemedText>
              </View>

              <View style={[styles.statList, { borderTopColor: tier.color }]}>
                {stats.map((stat) => (
                  <View key={stat.label} style={[styles.statRow, { borderBottomColor: theme.border }]}>
                    <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                      {stat.label}
                    </ThemedText>
                    <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {data.length > 0 && (
            <LeaderboardCard
              currentUser={{ name: displayName, initial, score: overallScore, tierLabel: tier.label, tierColor: tier.color }}
            />
          )}

          <View style={[styles.periodRow, { borderColor: theme.border }]}>
            {PERIODS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.periodPill, period === p && { backgroundColor: theme.accent + "1a" }]}
              >
                <ThemedText themeColor={period === p ? "accent" : "textSecondary"} style={styles.periodPillText}>
                  {p}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {data.length < 3 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyNotice}>
              Bir karakter kartı görebilmek için en az 3 kategoriye ihtiyacın var. Kategoriler sekmesinden ekleyebilirsin.
            </ThemedText>
          ) : (
            <View style={styles.barList}>
              {data
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((d) => (
                  <View key={d.category} style={styles.barRow}>
                    <ThemedText style={styles.barLabel} numberOfLines={1}>
                      {d.category}
                    </ThemedText>
                    <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(4, (d.score / maxScore) * 100)}%`, backgroundColor: theme.accent },
                        ]}
                      />
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.barScore}>
                      {d.score}
                    </ThemedText>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, paddingBottom: BottomTabInset, gap: 16 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  card: { borderWidth: 2, borderRadius: 24, overflow: "hidden", alignSelf: "center", width: "100%", maxWidth: 340 },
  cardTop: { alignItems: "center", gap: 4, paddingTop: 28, paddingBottom: 20, paddingHorizontal: 20 },
  scoreValue: { fontSize: 48, fontWeight: "800" },
  tierLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 3 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 3, marginTop: 12 },
  avatarText: { fontSize: 26, fontWeight: "700", color: "#ffffff" },
  name: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  statList: { borderTopWidth: 2 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: "600" },
  periodRow: { flexDirection: "row", alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, padding: 3, gap: 2 },
  periodPill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  periodPillText: { fontSize: 13, fontWeight: "600" },
  emptyNotice: { fontSize: 13, textAlign: "center", paddingVertical: 20 },
  barList: { gap: 12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLabel: { width: 90, fontSize: 12 },
  barTrack: { flex: 1, height: 10, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  barScore: { width: 28, fontSize: 12, textAlign: "right" },
});
