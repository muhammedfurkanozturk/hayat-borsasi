import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { MobileNavProvider } from "@/lib/mobile-nav-context";
import { loadInitialAppData, type InitialAppData } from "@/lib/supabase/app-data-loader";
import { AppDataProvider } from "@/lib/supabase/app-data-context";
import { ProfileProvider } from "@/lib/supabase/profile-context";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Sidebar'ın daralt/genişlet tercihi bir çerezde tutuluyor — burada
  // (server component) okunup ilk render'a geçiriliyor, tema tercihindeki
  // gibi bir client-side flash olmadan (bkz. CLAUDE.md, animasyonlu tema
  // değiştirici notu).
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  // "eksikler" envanteri madde 9 — AppDataProvider'ın uzun süredir ertelenmiş
  // client-side veri çekme gecikmesi. İlk yükleme verisi artık burada
  // (server component, cookie tabanlı oturum) çekilip Provider'a hazır
  // veriliyor — bkz. app-data-loader.ts'in başındaki not (TAM bir server-
  // component mimarisine geçiş DEĞİL, sadece ilk anlık görüntü). Herhangi
  // bir sebeple başarısız olursa (oturum yok, ağ hatası vb.) `initialData`
  // null kalır — AppDataProvider bu durumda ESKİ client-side fetch'e
  // sorunsuzca düşüyor, sayfa asla kırılmıyor.
  let initialData: InitialAppData | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      initialData = await loadInitialAppData(supabase, user.id);
    }
  } catch (error) {
    console.error("Sunucu tarafı ilk veri yüklemesi başarısız (client-side fallback devrede):", error);
  }

  return (
    <ProfileProvider>
      <AppDataProvider initialData={initialData}>
        <MobileNavProvider>
          <OnboardingGate />
          <div className="flex min-h-full min-w-0 flex-1">
            <Sidebar initialCollapsed={initialCollapsed} />
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </div>
        </MobileNavProvider>
      </AppDataProvider>
    </ProfileProvider>
  );
}
