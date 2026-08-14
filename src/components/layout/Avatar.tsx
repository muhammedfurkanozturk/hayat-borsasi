import { CrownIcon } from "@/components/icons";

export function Avatar({
  initial,
  size = "md",
  isPro = false,
}: {
  initial: string;
  size?: "sm" | "md" | "lg";
  isPro?: boolean;
}) {
  const dimension =
    size === "lg" ? "h-14 w-14 text-lg" : size === "md" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  const badgeSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const badgeIcon = size === "lg" ? 11 : 9;

  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${dimension} items-center justify-center rounded-full bg-accent font-semibold text-white`}
      >
        {initial}
      </div>
      {isPro && (
        <div
          className={`absolute -bottom-1 -right-1 flex ${badgeSize} items-center justify-center rounded-full border-2 border-background bg-pro text-pro-foreground`}
          title="Pro üye"
        >
          <CrownIcon width={badgeIcon} height={badgeIcon} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}
