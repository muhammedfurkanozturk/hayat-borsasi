import { Sidebar } from "@/components/layout/Sidebar";
import { AppDataProvider } from "@/lib/supabase/app-data-context";
import { ProfileProvider } from "@/lib/supabase/profile-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <AppDataProvider>
        <div className="flex min-h-full flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </AppDataProvider>
    </ProfileProvider>
  );
}
