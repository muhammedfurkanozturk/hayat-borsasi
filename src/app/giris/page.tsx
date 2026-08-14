"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrendUpIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials" ? "E-posta veya şifre hatalı." : error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

        <h1 className="mb-1 text-xl font-semibold text-foreground">Giriş Yap</h1>
        <p className="mb-6 text-sm text-muted">Endeksine kaldığın yerden devam et.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-accent/50"
          />

          {error && <p className="text-xs text-negative">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-accent hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
