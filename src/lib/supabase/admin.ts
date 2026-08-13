import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role anahtarıyla oluşturulan, RLS'i bypass eden client. Sadece
// oturumsuz sunucu işlerinde (ör. gece cron job'ı) kullanılır — kullanıcı
// isteklerinde ASLA kullanılmaz. "server-only" ile client component'ten
// yanlışlıkla import edilirse build hatası verir.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
