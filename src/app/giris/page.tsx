"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { LockIcon, MailIcon } from "@/components/icons";
import { AuthShell } from "@/components/ui/AuthShell";
import { TextField } from "@/components/ui/TextField";
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
    <AuthShell>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Giriş Yap</h1>
      <p className="mb-6 text-sm text-muted">Endeksine kaldığın yerden devam et.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
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
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="btn rounded-md text-accent hover:underline">
          Kayıt ol
        </Link>
      </p>
    </AuthShell>
  );
}
