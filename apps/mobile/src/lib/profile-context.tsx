import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase/client";

export interface ContactInfo {
  phone: string;
  address: string;
  occupation: string;
}

interface ProfileContextValue {
  displayName: string;
  email: string;
  isPro: boolean;
  contactInfo: ContactInfo;
  loading: boolean;
  onboardingCompletedAt: string | null;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateContactInfo: (info: ContactInfo) => Promise<{ error: string | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
  completeOnboarding: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const emptyContactInfo: ContactInfo = { phone: "", address: "", occupation: "" };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayNameState] = useState("");
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(emptyContactInfo);
  const [loading, setLoading] = useState(true);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("display_name, is_pro, phone, address, occupation, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setDisplayNameState(data.display_name ?? "Kullanıcı");
      setIsPro(data.is_pro ?? false);
      setContactInfo({
        phone: data.phone ?? "",
        address: data.address ?? "",
        occupation: data.occupation ?? "",
      });
      setOnboardingCompletedAt(data.onboarding_completed_at ?? null);
    } else {
      const fallbackName = (user.user_metadata?.display_name as string | undefined) ?? "Kullanıcı";
      await supabase.from("profiles").upsert({ id: user.id, display_name: fallbackName });
      setDisplayNameState(fallbackName);
      setIsPro(false);
      setContactInfo(emptyContactInfo);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Oturum bulunamadı." };

    const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
    if (error) return { error: error.message };

    setDisplayNameState(trimmed);
    return { error: null };
  }

  async function updateContactInfo(info: ContactInfo) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Oturum bulunamadı." };

    const trimmed: ContactInfo = {
      phone: info.phone.trim(),
      address: info.address.trim(),
      occupation: info.occupation.trim(),
    };

    const { error } = await supabase.from("profiles").update(trimmed).eq("id", user.id);
    if (error) return { error: error.message };

    setContactInfo(trimmed);
    return { error: null };
  }

  async function completeOnboarding() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ onboarding_completed_at: now }).eq("id", user.id);
    if (!error) setOnboardingCompletedAt(now);
  }

  async function updateEmail(newEmail: string) {
    const trimmed = newEmail.trim();
    if (!trimmed) return { error: "E-posta boş olamaz." };
    if (trimmed === email) return { error: "Bu zaten mevcut e-posta adresin." };

    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) return { error: error.message };

    return { error: null };
  }

  return (
    <ProfileContext.Provider
      value={{
        displayName,
        email,
        isPro,
        contactInfo,
        loading,
        onboardingCompletedAt,
        updateDisplayName,
        updateContactInfo,
        updateEmail,
        completeOnboarding,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile, ProfileProvider içinde kullanılmalı");
  return ctx;
}
