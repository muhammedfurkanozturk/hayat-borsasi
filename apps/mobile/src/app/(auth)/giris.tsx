import { useState } from "react";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

export default function GirisScreen() {
  const theme = useTheme();
  const elevated = useElevatedStyle();
  const { signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setError(error);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemedView style={styles.container}>
        {mode === "email" && (
          <Pressable onPress={() => setMode("choice")} hitSlop={12} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Geri</ThemedText>
          </Pressable>
        )}

        <ThemedText type="title" style={styles.title}>
          Hayat Borsası
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Kendi endeksinle giriş yap
        </ThemedText>

        {mode === "choice" ? (
          <>
            <Pressable
              onPress={handleGoogle}
              disabled={googleLoading}
              style={[styles.googleButton, { opacity: googleLoading ? 0.7 : 1 }]}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1f1f1f" />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={20} color="#1f1f1f" />
                  <ThemedText style={styles.googleButtonText}>Google ile devam et</ThemedText>
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText themeColor="textSecondary" style={styles.dividerText}>
                veya
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Pressable
              onPress={() => setMode("email")}
              style={[styles.emailChoiceButton, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }, elevated]}
            >
              <MaterialCommunityIcons name="email-outline" size={20} color={theme.text} />
              <ThemedText style={styles.emailChoiceText}>E-posta ile devam et</ThemedText>
            </Pressable>

            {error && (
              <ThemedText themeColor="negative" style={styles.error}>
                {error}
              </ThemedText>
            )}
          </>
        ) : (
          <>
            <TextInput
              placeholder="E-posta"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSelected }, elevated]}
            />
            <TextInput
              placeholder="Şifre"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSelected }, elevated]}
            />

            {error && (
              <ThemedText themeColor="negative" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email || !password}
              style={[styles.button, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#04191d" /> : <ThemedText style={styles.buttonText}>Giriş Yap</ThemedText>}
            </Pressable>
          </>
        )}

        <Link href="/(auth)/kayit" style={styles.link}>
          <ThemedText themeColor="accent">Hesabın yok mu? Kayıt ol</ThemedText>
        </Link>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  backButton: {
    position: "absolute",
    top: 8,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  googleButtonText: {
    color: "#1f1f1f",
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  emailChoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  emailChoiceText: {
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#04191d",
    fontWeight: "600",
  },
  link: {
    marginTop: 16,
    alignSelf: "center",
  },
});
