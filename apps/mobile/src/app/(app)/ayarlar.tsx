import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
import { useTheme } from "@/hooks/use-theme";
import { useAppData } from "@/lib/app-data-context";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-context";
import { useThemeMode } from "@/lib/theme-context";

export default function AyarlarScreen() {
  const theme = useTheme();
  const { theme: themeMode, setTheme: setThemeMode } = useThemeMode();
  const { signOut } = useAuth();
  const { resetAllCategories } = useAppData();
  const { displayName, email, isPro, contactInfo, loading, updateDisplayName, updateContactInfo, updateEmail } =
    useProfile();

  const [draftName, setDraftName] = useState(displayName);
  const [syncedName, setSyncedName] = useState(displayName);
  if (displayName !== syncedName) {
    setSyncedName(displayName);
    setDraftName(displayName);
  }

  const [draftEmail, setDraftEmail] = useState(email);
  const [syncedEmail, setSyncedEmail] = useState(email);
  if (email !== syncedEmail) {
    setSyncedEmail(email);
    setDraftEmail(email);
  }

  const [draftPhone, setDraftPhone] = useState(contactInfo.phone);
  const [draftOccupation, setDraftOccupation] = useState(contactInfo.occupation);
  const [draftAddress, setDraftAddress] = useState(contactInfo.address);
  const [syncedContact, setSyncedContact] = useState(contactInfo);
  if (contactInfo !== syncedContact) {
    setSyncedContact(contactInfo);
    setDraftPhone(contactInfo.phone);
    setDraftOccupation(contactInfo.occupation);
    setDraftAddress(contactInfo.address);
  }

  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleSaveName() {
    setNameError(null);
    setSavingName(true);
    const { error } = await updateDisplayName(draftName);
    if (error) setNameError(error);
    setSavingName(false);
  }

  async function handleSaveEmail() {
    setEmailNotice(null);
    setSavingEmail(true);
    const { error } = await updateEmail(draftEmail);
    setEmailNotice(error ?? "Onay bağlantısı yeni adresine gönderildi. Linke tıklayınca değişiklik tamamlanır.");
    setSavingEmail(false);
  }

  async function handleSaveContact() {
    setSavingContact(true);
    await updateContactInfo({ phone: draftPhone, occupation: draftOccupation, address: draftAddress });
    setSavingContact(false);
  }

  function handleResetData() {
    setResetting(true);
    resetAllCategories().finally(() => {
      setResetting(false);
      setConfirmingReset(false);
    });
  }

  function handleSignOut() {
    Alert.alert("Çıkış yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <ThemedText type="title" style={styles.headerTitle}>
              Ayarlar
            </ThemedText>

            <View style={[styles.section, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Profil</ThemedText>

              <View style={styles.profileRow}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.accent, borderColor: isPro ? "#f5b400" : "transparent" },
                  ]}
                >
                  <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                </View>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  editable={!loading}
                  style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text }]}
                />
                <Pressable
                  onPress={handleSaveName}
                  disabled={loading || savingName || draftName.trim() === displayName || !draftName.trim()}
                  style={[styles.smallButton, { backgroundColor: theme.accent + "1a" }]}
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <ThemedText themeColor="accent" style={styles.smallButtonText}>
                      Kaydet
                    </ThemedText>
                  )}
                </Pressable>
              </View>
              {nameError && (
                <ThemedText themeColor="negative" style={styles.errorText}>
                  {nameError}
                </ThemedText>
              )}

              <Field label="E-posta">
                <TextInput
                  value={draftEmail}
                  onChangeText={setDraftEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
                <Pressable
                  onPress={handleSaveEmail}
                  disabled={savingEmail || draftEmail.trim() === email || !draftEmail.trim()}
                  style={[styles.smallButton, { backgroundColor: theme.accent + "1a", marginTop: 6, alignSelf: "flex-start" }]}
                >
                  {savingEmail ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <ThemedText themeColor="accent" style={styles.smallButtonText}>
                      Kaydet
                    </ThemedText>
                  )}
                </Pressable>
                {emailNotice && (
                  <ThemedText themeColor="textSecondary" style={styles.noticeText}>
                    {emailNotice}
                  </ThemedText>
                )}
              </Field>

              <Field label="Telefon">
                <TextInput
                  value={draftPhone}
                  onChangeText={setDraftPhone}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>

              <Field label="Meslek">
                <TextInput
                  value={draftOccupation}
                  onChangeText={setDraftOccupation}
                  placeholder="örn. Yazılım Mühendisi"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>

              <Field label="Adres">
                <TextInput
                  value={draftAddress}
                  onChangeText={setDraftAddress}
                  placeholder="örn. Kadıköy, İstanbul"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>

              <Pressable
                onPress={handleSaveContact}
                disabled={savingContact}
                style={[styles.saveContactButton, { backgroundColor: theme.accent }]}
              >
                {savingContact ? (
                  <ActivityIndicator size="small" color="#04191d" />
                ) : (
                  <ThemedText style={styles.saveContactButtonText}>İletişim Bilgilerini Kaydet</ThemedText>
                )}
              </Pressable>
            </View>

            <View style={[styles.section, styles.planSection, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <View>
                <ThemedText style={styles.sectionTitle}>Plan</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.planCaption}>
                  {isPro ? "Pro plandasın." : "Şu an ücretsiz plandasın."}
                </ThemedText>
              </View>
              {isPro ? (
                <View style={[styles.proBadge, { backgroundColor: "#f5b40024" }]}>
                  <Feather name="award" size={12} color="#f5b400" />
                  <ThemedText style={[styles.proBadgeText, { color: "#f5b400" }]}>Pro</ThemedText>
                </View>
              ) : (
                <Pressable onPress={() => router.push("/pro")} style={[styles.freeBadge, { borderColor: theme.border }]}>
                  <ThemedText themeColor="textSecondary" style={styles.freeBadgeText}>
                    Ücretsiz
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <View style={[styles.section, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Görünüm</ThemedText>
              <View style={[styles.themeRow, { borderColor: theme.border }]}>
                <Pressable
                  onPress={() => setThemeMode("dark")}
                  style={[styles.themePill, themeMode === "dark" && { backgroundColor: theme.accent + "1a" }]}
                >
                  <Feather name="moon" size={13} color={themeMode === "dark" ? theme.accent : theme.textSecondary} />
                  <ThemedText themeColor={themeMode === "dark" ? "accent" : "textSecondary"} style={styles.themePillText}>
                    Koyu Tema
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setThemeMode("light")}
                  style={[styles.themePill, themeMode === "light" && { backgroundColor: theme.accent + "1a" }]}
                >
                  <Feather name="sun" size={13} color={themeMode === "light" ? theme.accent : theme.textSecondary} />
                  <ThemedText themeColor={themeMode === "light" ? "accent" : "textSecondary"} style={styles.themePillText}>
                    Açık Tema
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={[styles.section, { borderColor: "#f43e5c40", backgroundColor: "#f43e5c14" }]}>
              <ThemedText style={styles.sectionTitle}>Veriler</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.dangerText}>
                Bu işlem, hesabındaki tüm kategorileri ve altlarındaki görevleri kalıcı olarak siler (günlük notların
                ve raporların kalır).
              </ThemedText>
              {confirmingReset ? (
                <View style={styles.confirmRow}>
                  <ThemedText themeColor="negative" style={styles.confirmText}>
                    Emin misin? Bu geri alınamaz.
                  </ThemedText>
                  <View style={styles.confirmActions}>
                    <Pressable onPress={() => setConfirmingReset(false)} style={styles.cancelButton}>
                      <ThemedText themeColor="textSecondary">Vazgeç</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={handleResetData}
                      disabled={resetting}
                      style={[styles.dangerButton, { backgroundColor: theme.negative }]}
                    >
                      {resetting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <ThemedText style={styles.dangerButtonText}>Verileri Sıfırla</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmingReset(true)}
                  style={[styles.dangerOutlineButton, { borderColor: theme.negative }]}
                >
                  <ThemedText themeColor="negative" style={styles.dangerOutlineText}>
                    Verileri Sıfırla
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <Pressable onPress={handleSignOut} style={[styles.signOutButton, { borderColor: theme.border }]}>
              <Feather name="log-out" size={16} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary">Çıkış Yap</ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 },
  smallButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  smallButtonText: { fontSize: 12, fontWeight: "600" },
  errorText: { fontSize: 12 },
  noticeText: { fontSize: 11, marginTop: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  saveContactButton: { borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  saveContactButtonText: { color: "#04191d", fontWeight: "600", fontSize: 13 },
  planSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planCaption: { fontSize: 12, marginTop: 2 },
  proBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  proBadgeText: { fontSize: 11, fontWeight: "700" },
  freeBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  freeBadgeText: { fontSize: 11 },
  themeRow: { flexDirection: "row", borderWidth: 1, borderRadius: 999, padding: 3, gap: 2, alignSelf: "flex-start" },
  themePill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  themePillText: { fontSize: 12, fontWeight: "600" },
  dangerText: { fontSize: 12, lineHeight: 17 },
  confirmRow: { gap: 8 },
  confirmText: { fontSize: 12 },
  confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelButton: { paddingVertical: 9, paddingHorizontal: 4 },
  dangerButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  dangerButtonText: { color: "#ffffff", fontWeight: "600", fontSize: 12 },
  dangerOutlineButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  dangerOutlineText: { fontSize: 12 },
  signOutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
});
