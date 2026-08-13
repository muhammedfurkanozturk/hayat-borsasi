import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server component'lerde, route handler'larda ve server action'larda
// kullanılacak Supabase client'ı. Kullanıcının oturum çerezlerini okur/yazar.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component içinden çağrılırsa çerez set edilemez —
            // oturum yenilemesi middleware üzerinden yapılacağı için
            // burada görmezden gelmek güvenli.
          }
        },
      },
    }
  );
}
