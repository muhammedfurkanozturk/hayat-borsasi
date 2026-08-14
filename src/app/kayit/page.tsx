"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrendUpIcon } from "@/components/icons";
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
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-card p-6">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <TrendUpIcon width={16} height={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
        </Link>

        {confirmationSent ? (
          <>
            <h1 className="mb-1 text-xl font-semibold text-foreground">E-postanı kontrol et</h1>
            <p className="text-sm text-muted">
              <span className="text-foreground">{email}</span> adresine bir onay linki gönderdik.
              Hesabını onaylayınca giriş yapabilirsin.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-semibold text-foreground">Ücretsiz Başla</h1>
            <p className="mb-6 text-sm text-muted">Kendi endeksini oluşturmaya başla.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="İsmin (opsiyonel)"
                className="rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-accent/50"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta"
                className="rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-accent/50"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre (en az 6 karakter)"
                className="rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-accent/50"
              />

              {error && <p className="text-xs text-negative">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-lg bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              Zaten hesabın var mı?{" "}
              <Link href="/giris" className="text-accent hover:underline">
                Giriş yap
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
