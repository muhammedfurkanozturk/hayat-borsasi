"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { LockIcon, MailIcon, UserIcon } from "@/components/icons";
import { AuthShell } from "@/components/ui/AuthShell";
import { TextField } from "@/components/ui/TextField";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() || undefined } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
    setLoading(false);
  }

  return (
    <AuthShell>
      {confirmationSent ? (
        <div className="modal-in">
          <h1 className="mb-1 text-xl font-semibold text-foreground">E-postanı kontrol et</h1>
          <p className="text-sm text-muted">
            <span className="text-foreground">{email}</span> adresine bir onay linki gönderdik.
            Hesabını onaylayınca giriş yapabilirsin.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-xl font-semibold text-foreground">Ücretsiz Başla</h1>
          <p className="mb-6 text-sm text-muted">Kendi endeksini oluşturmaya başla.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextField
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="İsmin (opsiyonel)"
              icon={<UserIcon width={16} height={16} />}
            />
            <TextField
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              icon={<MailIcon width={16} height={16} />}
            />
            <TextField
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              icon={<LockIcon width={16} height={16} />}
            />

            {error && <p className="text-xs text-negative">{error}</p>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 480, damping: 28, mass: 0.7 }}
              className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Zaten hesabın var mı?{" "}
            <Link href="/giris" className="btn rounded-md text-accent hover:underline">
              Giriş yap
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
