import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Web'de AsyncStorage'ın kendi localStorage shim'i, Expo Router'ın statik
// dışa aktarımı sırasındaki Node (window'suz) render adımında patlıyor.
// supabase-js'in kendi varsayılan web storage'ı bu duruma zaten karşı
// korumalı, o yüzden native dışında storage'ı override etmiyoruz.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Google OAuth (expo-web-browser üzerinden) redirect URL'inde token yerine
    // bir "code" döndürür, signInWithGoogle bunu exchangeCodeForSession ile
    // değiştirir. E-posta/şifre girişini etkilemez.
    flowType: "pkce",
  },
});
