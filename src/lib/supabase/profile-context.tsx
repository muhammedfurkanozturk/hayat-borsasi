"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./client";

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
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateContactInfo: (info: ContactInfo) => Promise<{ error: string | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const emptyContactInfo: ContactInfo = { phone: "", address: "", occupation: "" };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayNameState] = useState("");
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(emptyContactInfo);
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

    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("display_name, is_pro, phone, address, occupation")
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
    } else {
      // profiles satırı yoksa (örn. daha önce elle silindiyse) burada
      // yeniden oluşturuyoruz — auth kaydı var ama profil eksik kalmasın.
      const fallbackName =
        (user.user_metadata?.display_name as string | undefined) ?? "Kullanıcı";
      await supabase.from("profiles").upsert({ id: user.id, display_name: fallbackName });
      setDisplayNameState(fallbackName);
      setIsPro(false);
      setContactInfo(emptyContactInfo);
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

  async function updateContactInfo(info: ContactInfo) {
    const supabase = createClient();
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

  // E-posta değişikliği doğrudan bir tabloya yazmıyor — Supabase Auth'un
  // kendi güvenli akışını kullanıyor: yeni adrese bir onay linki gider,
  // kullanıcı o linke tıklamadan e-posta gerçekten değişmiş olmaz. Bu yüzden
  // burada `email` state'ini hemen güncellemiyoruz.
  async function updateEmail(newEmail: string) {
    const trimmed = newEmail.trim();
    if (!trimmed) return { error: "E-posta boş olamaz." };
    if (trimmed === email) return { error: "Bu zaten mevcut e-posta adresin." };

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) return { error: error.message };

    return { error: null };
  }

  return (
    <ProfileContext.Provider
      value={{ displayName, email, isPro, contactInfo, loading, updateDisplayName, updateContactInfo, updateEmail }}
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
