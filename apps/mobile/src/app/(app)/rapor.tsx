import { useState } from "react";
import {
  average,
  buildCalendarMonthSeries,
  buildCalendarYearSeries,
  calculateScore,
  makeScoreForDate,
  nonNullScores,
  todayIso,
  type ReportPeriod,
} from "@hayat-borsasi/shared";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StructuredReportView } from "@/components/structured-report-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";
import { useProfile } from "@/lib/profile-context";
import { supabase } from "@/lib/supabase/client";

const PERIODS: ReportPeriod[] = ["Günlük", "Aylık", "Yıllık"];

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function RaporScreen() {
  const theme = useTheme();
  const { categories, tasks, dailyNote, previousDailyScore, dailyHistory } = useAppData();
  const { isPro, loading: profileLoading } = useProfile();
  const [loadingPeriod, setLoadingPeriod] = useState<ReportPeriod | null>(null);
  const [activePeriod, setActivePeriod] = useState<ReportPeriod | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(period: ReportPeriod) {
    setLoadingPeriod(period);
    setError(null);
    setPreview(null);

    const today = todayIso();
    const liveOverallScore = calculateScore(tasks);

    let overallScore = liveOverallScore;
    const overallDelta = period === "Günlük" ? liveOverallScore - previousDailyScore : 0;

    const overallScoreForDate = makeScoreForDate(dailyHistory, today, liveOverallScore, (d) => d.overallScore);
    if (period === "Aylık") {
      overallScore = average(nonNullScores(buildCalendarMonthSeries(overallScoreForDate)));
    } else if (period === "Yıllık") {
      overallScore = average(nonNullScores(buildCalendarYearSeries(overallScoreForDate)));
    }

    const categorySummaries = categories.map((category) => {
      const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
      const liveCategoryScore = calculateScore(categoryTasks);

      if (period === "Günlük") {
        return { name: category.name, score: liveCategoryScore };
      }

      const categoryScoreForDate = makeScoreForDate(
        dailyHistory,
        today,
        liveCategoryScore,
        (d) => d.categoryScores[category.id] ?? 0
      );
      const series =
        period === "Aylık" ? buildCalendarMonthSeries(categoryScoreForDate) : buildCalendarYearSeries(categoryScoreForDate);
      return { name: category.name, score: average(nonNullScores(series)) };
    });

    const completedWeight = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.weight, 0);
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı.");

      const response = await fetch(`${API_BASE_URL}/api/rapor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          period,
          overallScore,
          overallDelta,
          categories: categorySummaries,
          completedWeight,
          totalWeight,
          dailyNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Rapor oluşturulamadı.");

      setActivePeriod(period);
      setPreview(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rapor oluşturulamadı.");
    } finally {
      setLoadingPeriod(null);
    }
  }

  const locked = !profileLoading && !isPro;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText type="title" style={styles.headerTitle}>
            AI Rapor
          </ThemedText>

          <View
            pointerEvents={locked ? "none" : "auto"}
            style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: locked ? 0.3 : 1 }]}
          >
            {PERIODS.map((period) => (
              <Pressable
                key={period}
                onPress={() => handleGenerate(period)}
                disabled={loadingPeriod !== null}
                style={[styles.periodButton, { borderColor: theme.border }]}
              >
                {loadingPeriod === period ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <ThemedText style={styles.periodButtonText}>
                    Anlık {period === "Günlük" ? "Günü" : period === "Aylık" ? "Ayı" : "Yılı"} Özetle
                  </ThemedText>
                )}
              </Pressable>
            ))}

            {error ? (
              <ThemedText themeColor="negative" style={styles.footNote}>
                {error}
              </ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.footNote}>
                Bu, o an göreceğin anlık bir özet — arşive kaydedilmez.
              </ThemedText>
            )}
          </View>

          {preview && activePeriod && (
            <View style={[styles.previewCard, { borderColor: theme.accent + "4d", backgroundColor: theme.accent + "0f" }]}>
              <View style={styles.previewHeader}>
                <ThemedText themeColor="accent" style={styles.previewLabel}>
                  Anlık {activePeriod} Özeti
                </ThemedText>
                <Pressable onPress={() => setPreview(null)}>
                  <Feather name="x" size={16} color={theme.negative} />
                </Pressable>
              </View>
              <StructuredReportView content={preview} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {locked && (
        <Pressable
          style={[styles.lockOverlay, { backgroundColor: theme.background + "e6" }]}
          onPress={() => router.push("/pro")}
        >
          <View style={[styles.lockIcon, { backgroundColor: "#f5b40024" }]}>
            <Feather name="lock" size={26} color="#f5b400" />
          </View>
          <ThemedText style={styles.lockTitle}>AI Rapor bir Pro özelliği</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.lockSubtitle}>
            Anlık AI özetlerine ve arşivlenmiş raporlara erişmek için Pro'ya geç.
          </ThemedText>
          <View style={[styles.lockButton, { backgroundColor: "#f5b400" }]}>
            <Feather name="lock" size={13} color="#1a1400" />
            <ThemedText style={styles.lockButtonText}>Pro'ya Geç</ThemedText>
          </View>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: BottomTabInset, gap: 16 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  lockIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  lockTitle: { fontSize: 15, fontWeight: "700" },
  lockSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 260 },
  lockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 8,
  },
  lockButtonText: { color: "#1a1400", fontWeight: "700", fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  periodButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  periodButtonText: { fontSize: 13, fontWeight: "600" },
  footNote: { fontSize: 11, textAlign: "center" },
  previewCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});
