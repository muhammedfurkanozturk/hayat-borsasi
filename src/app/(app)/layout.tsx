import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { MobileNavProvider } from "@/lib/mobile-nav-context";
import { AppDataProvider } from "@/lib/supabase/app-data-context";
import { ProfileProvider } from "@/lib/supabase/profile-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <AppDataProvider>
        <MobileNavProvider>
          <OnboardingGate />
          <div className="flex min-h-full flex-1">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </div>
        </MobileNavProvider>
      </AppDataProvider>
    </ProfileProvider>
  );
}
