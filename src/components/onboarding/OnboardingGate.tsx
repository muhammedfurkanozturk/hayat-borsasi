"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

// Yeni hesap açıp hiç kategori oluşturmamış kullanıcıyı "ilk alışkanlıklarını
// seç" ekranına yönlendirir. `onboarding_completed_at` kontrolü sayesinde
// kullanıcı bilinçli olarak hiçbir şablon seçmese bile (0 kategoriyle devam
// etse bile) buraya tekrar tekrar geri gönderilmez.
export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: profileLoading, onboardingCompletedAt } = useProfile();
  const { loading: dataLoading, categories } = useAppData();

  useEffect(() => {
    if (profileLoading || dataLoading) return;
    if (pathname === "/onboarding") return;
    if (onboardingCompletedAt === null && categories.length === 0) {
      router.replace("/onboarding");
    }
  }, [profileLoading, dataLoading, pathname, onboardingCompletedAt, categories.length, router]);

  return null;
}
