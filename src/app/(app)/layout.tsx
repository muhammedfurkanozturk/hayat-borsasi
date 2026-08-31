import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { MobileNavProvider } from "@/lib/mobile-nav-context";
import { AppDataProvider } from "@/lib/supabase/app-data-context";
import { ProfileProvider } from "@/lib/supabase/profile-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Sidebar'ın daralt/genişlet tercihi bir çerezde tutuluyor — burada
  // (server component) okunup ilk render'a geçiriliyor, tema tercihindeki
  // gibi bir client-side flash olmadan (bkz. CLAUDE.md, animasyonlu tema
  // değiştirici notu).
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  return (
    <ProfileProvider>
      <AppDataProvider>
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
