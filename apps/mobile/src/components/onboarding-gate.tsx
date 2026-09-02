import { useEffect } from "react";
import { router, usePathname } from "expo-router";
import { useAppData } from "@/lib/app-data-context";
import { useProfile } from "@/lib/profile-context";

// Web'in src/components/onboarding/OnboardingGate.tsx'inin RN portu — yeni
// hesap açıp hiç kategori oluşturmamış kullanıcıyı "ilk alışkanlıklarını
// seç" ekranına yönlendirir. `onboardingCompletedAt` kontrolü sayesinde
// kullanıcı bilinçli olarak hiçbir şablon seçmese bile (0 kategoriyle
// devam etse bile) buraya tekrar tekrar geri gönderilmez. Kök `_layout.tsx`'te
// AppDataProvider/ProfileProvider'ın İÇİNDE, oturum varken her zaman monte
// edilir — kendi görsel çıktısı yok, sadece yönlendirme yan etkisi.
export function OnboardingGate() {
  const pathname = usePathname();
  const { loading: profileLoading, onboardingCompletedAt } = useProfile();
  const { loading: dataLoading, categories } = useAppData();

  useEffect(() => {
    if (profileLoading || dataLoading) return;
    if (pathname === "/onboarding") return;
    if (onboardingCompletedAt === null && categories.length === 0) {
      router.replace("/onboarding");
    }
  }, [profileLoading, dataLoading, pathname, onboardingCompletedAt, categories.length]);

  return null;
}
