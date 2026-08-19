import { useState } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

export default function GirisScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Hayat Borsası
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Kendi endeksinle giriş yap
        </ThemedText>

        <TextInput
          placeholder="E-posta"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <TextInput
          placeholder="Şifre"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
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
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16,
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
