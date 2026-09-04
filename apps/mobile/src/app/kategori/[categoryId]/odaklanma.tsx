import { useGlobalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { useThemeMode } from "@/lib/theme-context";

// Ders & Odaklanma'nın Seviye 2 route'u (bkz. CLAUDE.md bölüm 9) —
// PomodoroPanel kendi iç Pomodoro/Kronometre mod geçişini zaten koruyor,
// mantığa dokunulmadı. Zemin artık PomodoroPanel'in kendi `styles.container`'ı
// tarafından (genel site temasına göre) belirleniyor — burada ayrı bir
// sabit override YOK (madde 3 kritik düzeltmesi).
export default function OdaklanmaTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const { colors } = useThemeMode();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }}>
      <PomodoroPanel categoryId={categoryId} />
    </ScrollView>
  );
}
