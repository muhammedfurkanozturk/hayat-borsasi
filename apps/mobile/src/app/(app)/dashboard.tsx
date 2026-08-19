import { useMemo } from "react";
import { calculateScore } from "@hayat-borsasi/shared";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";

export default function DashboardScreen() {
  const theme = useTheme();
  const { loading, categories, tasks, previousDailyScore } = useAppData();

  const todayScore = useMemo(
    () =>
      calculateScore(
        tasks.map((t) => ({
          weight: t.weight,
          completed: t.completed,
          subtaskTotal: t.subtaskTotal,
          subtaskCompleted: t.subtaskCompleted,
        }))
      ),
    [tasks]
  );

  const delta = todayScore - previousDailyScore;
  const completedCount = tasks.filter((t) => t.completed).length;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText type="title" style={styles.headerTitle}>
            Günlük Endeks
          </ThemedText>

          <View style={[styles.scoreCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={styles.scoreValue}>{todayScore.toFixed(0)}</ThemedText>
            <ThemedText themeColor={delta >= 0 ? "positive" : "negative"} style={styles.scoreDelta}>
              {delta >= 0 ? "▲" : "▼"} %{Math.abs(delta).toFixed(1)}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.scoreCaption}>
              {completedCount}/{tasks.length} görev tamamlandı
            </ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Bugünün Görevleri
          </ThemedText>

          {tasks.length === 0 && (
            <ThemedText themeColor="textSecondary">
              Henüz görev yok — web uygulamasından kategori ve görev ekleyebilirsin.
            </ThemedText>
          )}

          {categories.map((category) => {
            const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
            if (categoryTasks.length === 0) return null;
            return (
              <View key={category.id} style={styles.categoryBlock}>
                <ThemedText themeColor="textSecondary" style={styles.categoryLabel}>
                  {category.name}
                </ThemedText>
                {categoryTasks.map((task) => (
                  <TaskRow key={task.id} title={task.title} completed={task.completed} taskId={task.id} />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TaskRow({ taskId, title, completed }: { taskId: string; title: string; completed: boolean }) {
  const theme = useTheme();
  const { toggleTask } = useAppData();

  return (
    <Pressable
      onPress={() => toggleTask(taskId)}
      style={[styles.taskRow, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: completed ? theme.accent : theme.border, backgroundColor: completed ? theme.accent : "transparent" },
        ]}
      />
      <ThemedText style={completed ? styles.taskTitleCompleted : undefined}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 16 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  scoreCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  scoreValue: { fontSize: 40, fontWeight: "700" },
  scoreDelta: { fontSize: 14, fontWeight: "600" },
  scoreCaption: { fontSize: 13 },
  sectionTitle: { fontSize: 18, lineHeight: 24, marginTop: 8 },
  categoryBlock: { gap: 8 },
  categoryLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2 },
  taskTitleCompleted: { textDecorationLine: "line-through", opacity: 0.6 },
});
