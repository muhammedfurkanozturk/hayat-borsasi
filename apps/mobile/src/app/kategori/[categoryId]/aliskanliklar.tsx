import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { HabitTrackerPanel } from "@/components/habit-tracker-panel";
import { ThemedView } from "@/components/themed-view";
import { useAppData } from "@/lib/app-data-context";

// Kötü Alışkanlıklar'ın Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) — tek
// sekme. HabitTrackerPanel diğer 7 panelin AKSİNE sabit bir kimlik rengi
// KULLANMIYOR (her kart kendi rengini task.id hash'inden alıyor, panelin
// kendisi global açık/koyu temayı takip ediyor) — bu yüzden ThemedView
// kullanılıyor, sabit bir backgroundColor DAYATILMIYOR.
export default function AliskanliklarTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const { tasks } = useAppData();
  const categoryTasks = tasks.filter((t) => t.categoryId === categoryId);
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <HabitTrackerPanel categoryId={categoryId} tasks={categoryTasks} />
      </ScrollView>
    </ThemedView>
  );
}
