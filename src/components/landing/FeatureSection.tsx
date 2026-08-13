import Image from "next/image";
import type { IconKey } from "@/components/icons";
import { AppIcon } from "@/components/icons";

export function FeatureSection({
  icon,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  reverse = false,
}: {
  icon: IconKey;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <section
      className={`mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-16 ${
        reverse ? "lg:flex-row-reverse" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:w-[45%]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <AppIcon name={icon} width={18} height={18} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{eyebrow}</span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border-soft bg-surface lg:w-[55%]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
