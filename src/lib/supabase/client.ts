import { createBrowserClient } from "@supabase/ssr";

// Client component'lerde (tarayıcıda) kullanılacak Supabase client'ı.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
