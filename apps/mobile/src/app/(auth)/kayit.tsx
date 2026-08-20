import { useState } from "react";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useElevatedStyle, useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

export default function KayitScreen() {
  const theme = useTheme();
  const elevated = useElevatedStyle();
  const { signUp, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setSuccess(true);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setError(error);
  }

  if (success) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Neredeyse tamam
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {email} adresine bir onay e-postası gönderdik. Hesabını doğrulamak için oradaki bağlantıya tıkla.
        </ThemedText>
        <Link href="/(auth)/giris" style={styles.link}>
          <ThemedText themeColor="accent">Giriş ekranına dön</ThemedText>
        </Link>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Hesap oluştur
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Kendi kategorilerini, kendi kurallarınla yarat
        </ThemedText>

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

        <TextInput
          placeholder="İsim"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSelected }, elevated]}
        />
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
          autoComplete="password-new"
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
          {loading ? <ActivityIndicator color="#04191d" /> : <ThemedText style={styles.buttonText}>Kayıt Ol</ThemedText>}
        </Pressable>

        <Link href="/(auth)/giris" style={styles.link}>
          <ThemedText themeColor="accent">Zaten hesabın var mı? Giriş yap</ThemedText>
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
