import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppDataProvider } from "@/lib/app-data-context";
import { useThemeMode } from "@/lib/theme-context";
import { ProfileProvider } from "@/lib/profile-context";
import { IntroAnimation } from "@/components/intro-animation";
import { OnboardingGate } from "@/components/onboarding-gate";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading } = useAuth();
  const { theme } = useThemeMode();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  // AppDataProvider/ProfileProvider burada, tüm oturum-korumalı Stack'in
  // ÇEVRESİNDE — sadece (app) grubunun içinde değil — çünkü Seviye 2
  // (kategori/[categoryId], bkz. CLAUDE.md bölüm 9) (app)'ın KARDEŞİ,
  // aynı tek AppData instance'ını paylaşması gerekiyor. Önceden bu
  // provider'lar SADECE (app)/_layout.tsx'te idi; Seviye 2 eklenince
  // "useAppData, AppDataProvider içinde kullanılmalı" hatası verdi —
  // burada iki AYRI instance oluşturmamak için (app)/_layout.tsx'teki
  // sarmalayıcı KALDIRILDI, tek kaynak burası.
  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="kategori/[categoryId]" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );

  return (
    <>
      <StatusBar style={theme === "light" ? "dark" : "light"} />
      {session ? (
        <ProfileProvider>
          <AppDataProvider>
            {stack}
            <OnboardingGate />
          </AppDataProvider>
        </ProfileProvider>
      ) : (
        stack
      )}
      {!introDone && <IntroAnimation onFinish={() => setIntroDone(true)} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
