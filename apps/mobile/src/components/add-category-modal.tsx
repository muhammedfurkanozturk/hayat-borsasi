import { useState } from "react";
import { ONBOARDING_TEMPLATES, type IconKey, type OnboardingTemplate } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ICON_KEY_TO_MCI } from "@/lib/icon-map";
import { useAppData, type Category } from "@/lib/app-data-context";

const ICON_OPTIONS = Object.keys(ICON_KEY_TO_MCI) as IconKey[];

// Web'in AddCategoryTile.tsx'inin (2026-09-02) mobil karşılığı — kategori
// eklerken hazır şablon kartları (Beslenme/Spor/.../Kötü Alışkanlıklar) +
// "Kendi Kategorimi Oluştur" seçeneği. Web'de bu eklenene kadar mobilde
// kategori ekleme hep düz isim+sabit-yıldız-ikonu formuydu — bir şablona
// dokunmadan "Kötü Alışkanlıklar" yazarak kategori oluşturmak module_type'ı
// hiç ayarlamıyordu, bu yüzden HabitTrackerPanel gibi module_type'a bağlı
// paneller mobilde HİÇBİR ZAMAN tetiklenemiyordu — bu modal o boşluğu
// kapatıyor.
export function AddCategoryModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const theme = useTheme();
  const { addCategory, addCategoriesFromTemplates } = useAppData();
  const [step, setStep] = useState<"templates" | "custom">("templates");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconKey>("star");
  const [saving, setSaving] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);

  const availableTemplates = ONBOARDING_TEMPLATES.filter(
    (t) => !categories.some((c) => c.moduleType === t.moduleType)
  );

  function close() {
    onClose();
    setStep("templates");
    setName("");
    setIcon("star");
    setAddingKey(null);
  }

  async function handleAddTemplate(template: OnboardingTemplate) {
    setAddingKey(template.key);
    await addCategoriesFromTemplates([{ name: template.name, icon: template.icon, moduleType: template.moduleType }]);
    setAddingKey(null);
    close();
  }

  async function handleSubmitCustom() {
    if (!name.trim()) return;
    setSaving(true);
    await addCategory(name, icon);
    setSaving(false);
    close();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {step === "templates" ? (
            <>
              <ThemedText style={styles.title}>Yeni Kategori</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Hazır, özelleştirilmiş bir kategoriyle başla ya da kendi kategorini elle oluştur.
              </ThemedText>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 8 }}>
                  {availableTemplates.map((template) => {
                    const isAdding = addingKey === template.key;
                    return (
                      <Pressable
                        key={template.key}
                        onPress={() => handleAddTemplate(template)}
                        disabled={addingKey !== null}
                        style={[styles.templateRow, { borderColor: theme.border, opacity: addingKey !== null && !isAdding ? 0.5 : 1 }]}
                      >
                        <View style={[styles.templateIcon, { backgroundColor: theme.accent + "1a" }]}>
                          {isAdding ? (
                            <ActivityIndicator size="small" color={theme.accent} />
                          ) : (
                            <MaterialCommunityIcons name={ICON_KEY_TO_MCI[template.icon]} size={18} color={theme.accent} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={styles.templateDesc}>
                            {template.description}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => setStep("custom")}
                    style={[styles.templateRow, { borderColor: theme.border, borderStyle: "dashed" }]}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: theme.backgroundSelected }]}>
                      <MaterialCommunityIcons name="plus" size={18} color={theme.textSecondary} />
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.templateName}>
                      Kendi Kategorimi Oluştur
                    </ThemedText>
                  </Pressable>
                </View>
              </ScrollView>

              <Pressable onPress={close} style={styles.cancelRow}>
                <ThemedText themeColor="textSecondary">Vazgeç</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.customHeader}>
                <Pressable hitSlop={8} onPress={() => setStep("templates")}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                </Pressable>
                <ThemedText style={styles.title}>Kendi Kategorimi Oluştur</ThemedText>
              </View>

              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="örn. Finans"
                placeholderTextColor={theme.textSecondary}
                style={[styles.nameInput, { borderColor: theme.border, color: theme.text }]}
              />

              <ThemedText themeColor="textSecondary" style={[styles.subtitle, { marginTop: 4 }]}>
                İkon seç
              </ThemedText>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => setIcon(key)}
                      style={[
                        styles.iconOption,
                        {
                          borderColor: icon === key ? theme.accent : theme.border,
                          backgroundColor: icon === key ? theme.accent + "1a" : "transparent",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={ICON_KEY_TO_MCI[key]}
                        size={20}
                        color={icon === key ? theme.accent : theme.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.customActions}>
                <Pressable onPress={close} style={styles.cancelRow}>
                  <ThemedText themeColor="textSecondary">Vazgeç</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSubmitCustom}
                  disabled={saving || !name.trim()}
                  style={[styles.submitButton, { backgroundColor: theme.accent + "1a", opacity: name.trim() ? 1 : 0.5 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <ThemedText themeColor="accent" style={{ fontWeight: "600", fontSize: 13 }}>
                      Ekle
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 420, maxHeight: "85%", borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, lineHeight: 17 },
  templateRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  templateIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  templateName: { fontSize: 13, fontWeight: "600" },
  templateDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  cancelRow: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  customHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconOption: { width: 44, height: 44, borderWidth: 2, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  customActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  submitButton: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
