"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

// Auth formlarındaki (ve gerektiğinde başka yerlerdeki) ikonlu input alanı —
// sol tarafta opsiyonel bir ikon, `type="password"` verilirse sağda otomatik
// göster/gizle butonu.
export function TextField({
  icon,
  type = "text",
  className = "",
  ...props
}: { icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      )}
      <input
        type={resolvedType}
        className={`w-full rounded-lg border border-border-soft bg-background-elevated py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-accent/50 ${
          icon ? "pl-10" : "pl-3"
        } ${isPassword ? "pr-10" : "pr-3"} ${className}`}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          className="btn absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-foreground"
        >
          {show ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
        </button>
      )}
    </div>
  );
}
