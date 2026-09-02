import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { PomodoroPanel } from "@/components/pomodoro-panel";

// Ders & Odaklanma'nın Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) —
// PomodoroPanel kendi iç Pomodoro/Kronometre mod geçişini zaten koruyor,
// mantığa dokunulmadı.
export default function OdaklanmaTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#ffffff" }}>
      <PomodoroPanel categoryId={categoryId} />
    </ScrollView>
  );
}
