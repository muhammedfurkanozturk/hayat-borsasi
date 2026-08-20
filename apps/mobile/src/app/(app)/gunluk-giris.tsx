import { useState } from "react";
import { formatTodayLong } from "@hayat-borsasi/shared";
import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";

export default function GunlukGirisScreen() {
  const theme = useTheme();
  const elevated = useElevatedStyle();
  const { loading, dailyNote, setDailyNote } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setDraft(dailyNote);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await setDailyNote(draft);
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  const hasNote = dailyNote.trim().length > 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <ThemedText type="title" style={styles.headerTitle}>
              Günlük
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
              {formatTodayLong()}
            </ThemedText>

            {!editing ? (
              <Pressable
                onPress={startEditing}
                style={[styles.idleButton, { borderColor: theme.accent, backgroundColor: theme.accent + "1a" }]}
              >
                <Feather name="edit-3" size={22} color={theme.accent} />
                <ThemedText themeColor="accent" style={styles.idleButtonText}>
                  {hasNote ? "Bugünün Notlarını Güncelle" : "Bugün Not Tutmaya Başla"}
                </ThemedText>
                {hasNote && (
                  <ThemedText themeColor="textSecondary" style={styles.notePreview} numberOfLines={3}>
                    {dailyNote}
                  </ThemedText>
                )}
              </Pressable>
            ) : (
              <View style={[styles.editorCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={styles.editorLabel}>Bugün nasıl geçti?</ThemedText>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Neler yaşadın, neler hissettin?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  autoFocus
                  numberOfLines={7}
                  style={[styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSelected }, elevated]}
                />
                <View style={styles.editorActions}>
                  <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
                    <ThemedText themeColor="textSecondary">Vazgeç</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveButton, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]}
                  >
                    {saving ? (
                      <ActivityIndicator color="#04191d" />
                    ) : (
                      <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 6 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { marginBottom: 16 },
  idleButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  idleButtonText: { fontSize: 15, fontWeight: "600" },
  notePreview: { fontSize: 13, textAlign: "center", marginTop: 6 },
  editorCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  editorLabel: { fontSize: 14, fontWeight: "600" },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 140,
    textAlignVertical: "top",
  },
  editorActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, alignItems: "center" },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 4 },
  saveButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  saveButtonText: { color: "#04191d", fontWeight: "600" },
});
