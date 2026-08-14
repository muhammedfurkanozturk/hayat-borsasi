"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./client";

interface ProfileContextValue {
  displayName: string;
  isPro: boolean;
  loading: boolean;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayNameState] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("display_name, is_pro")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setDisplayNameState(data.display_name ?? "Kullanıcı");
      setIsPro(data.is_pro ?? false);
    } else {
      // profiles satırı yoksa (örn. daha önce elle silindiyse) burada
      // yeniden oluşturuyoruz — auth kaydı var ama profil eksik kalmasın.
      const fallbackName =
        (user.user_metadata?.display_name as string | undefined) ?? "Kullanıcı";
      await supabase.from("profiles").upsert({ id: user.id, display_name: fallbackName });
      setDisplayNameState(fallbackName);
      setIsPro(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Mount'ta profili çekiyoruz ve oturum değişikliklerine abone oluyoruz —
    // effect'in React tarafından önerilen iki meşru kullanımından biri
    // (dış sistemden veri çekme + dış sistemdeki değişikliklere abone olma).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  async function updateDisplayName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return { error: "İsim boş olamaz." };

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Oturum bulunamadı." };

    const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
    if (error) return { error: error.message };

    setDisplayNameState(trimmed);
    return { error: null };
  }

  return (
    <ProfileContext.Provider value={{ displayName, isPro, loading, updateDisplayName }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile, ProfileProvider içinde kullanılmalı");
  return ctx;
}
