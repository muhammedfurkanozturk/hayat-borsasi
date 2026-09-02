import { useMemo, useState } from "react";
import { calculateScore } from "@hayat-borsasi/shared";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppData, type Subtask, type Task } from "@/lib/app-data-context";

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
              Henüz görev yok — Kategoriler sekmesinden kategori ve görev ekleyebilirsin.
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
                  <TaskRow key={task.id} task={task} />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TaskRow({ task }: { task: Task }) {
  const theme = useTheme();
  const { subtasks, toggleTask } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);

  return (
    <View style={[styles.taskCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.taskRow}>
        <Pressable hitSlop={8} onPress={() => toggleTask(task.id)}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: task.completed ? theme.accent : theme.border,
                backgroundColor: task.completed ? theme.accent : "transparent",
              },
            ]}
          />
        </Pressable>
        <ThemedText style={[{ flex: 1 }, task.completed && styles.taskTitleCompleted]}>{task.title}</ThemedText>
        {task.subtaskTotal > 0 && (
          <ThemedText themeColor="textSecondary" style={styles.subtaskCount}>
            {task.subtaskCompleted}/{task.subtaskTotal}
          </ThemedText>
        )}
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
      </Pressable>

      {expanded && (
        <View style={[styles.subtaskPanel, { borderTopColor: theme.border }]}>
          {taskSubtasks.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.noSubtasks}>
              Bu görevde alt görev yok. Kategoriler sekmesinden ekleyebilirsin.
            </ThemedText>
          )}
          {taskSubtasks.map((sub) => (
            <SubtaskRow key={sub.id} subtask={sub} />
          ))}
        </View>
      )}
    </View>
  );
}

function SubtaskRow({ subtask }: { subtask: Subtask }) {
  const theme = useTheme();
  const { toggleSubtask } = useAppData();

  return (
    <Pressable onPress={() => toggleSubtask(subtask.id)} style={styles.subtaskRow}>
      <View
        style={[
          styles.subtaskCheckbox,
          {
            borderColor: subtask.completed ? theme.accent : theme.border,
            backgroundColor: subtask.completed ? theme.accent : "transparent",
          },
        ]}
      />
      <ThemedText style={[styles.subtaskTitle, subtask.completed && styles.taskTitleCompleted]}>
        {subtask.title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, paddingBottom: BottomTabInset, gap: 16 },
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
  taskCard: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2 },
  taskTitleCompleted: { textDecorationLine: "line-through", opacity: 0.6 },
  subtaskCount: { fontSize: 11 },
  subtaskPanel: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 8, gap: 4 },
  noSubtasks: { fontSize: 12, paddingVertical: 6 },
  subtaskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingLeft: 8 },
  subtaskCheckbox: { width: 16, height: 16, borderRadius: 5, borderWidth: 2 },
  subtaskTitle: { fontSize: 13, flex: 1 },
});
