import type { ReactNode } from "react";
import { ProfileMenu } from "./ProfileMenu";

export function PageHeader({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
      <div className="flex flex-col gap-1">
        {children ?? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {right}
        <ProfileMenu />
      </div>
    </header>
  );
}
