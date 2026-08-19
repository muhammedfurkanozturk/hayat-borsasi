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
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

          {locked && (
            <View style={[styles.lockNotice, { borderColor: "#f5b40040", backgroundColor: "#f5b40014" }]}>
              <Feather name="lock" size={20} color="#f5b400" />
              <ThemedText style={styles.lockTitle}>AI Rapor bir Pro özelliği</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.lockSubtitle}>
                Anlık AI özetlerine erişmek için Pro'ya geçmen gerekiyor.
              </ThemedText>
            </View>
          )}

          <View
            pointerEvents={locked ? "none" : "auto"}
            style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: locked ? 0.4 : 1 }]}
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
              <ThemedText style={styles.previewText}>{preview}</ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  lockNotice: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 6 },
  lockTitle: { fontSize: 14, fontWeight: "600" },
  lockSubtitle: { fontSize: 12, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  periodButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  periodButtonText: { fontSize: 13, fontWeight: "600" },
  footNote: { fontSize: 11, textAlign: "center" },
  previewCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  previewText: { fontSize: 13, lineHeight: 20 },
});
