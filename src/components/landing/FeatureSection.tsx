"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { IconKey } from "@/components/icons";
import { AppIcon } from "@/components/icons";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function FeatureSection({
  icon,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  gradient,
  reverse = false,
}: {
  icon: IconKey;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  gradient: string;
  reverse?: boolean;
}) {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-24 sm:px-6">
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <GlassPanel gradient={gradient} className="min-h-[65vh]">
          <div
            className={`flex flex-col gap-8 p-6 sm:gap-10 sm:p-10 lg:flex-row lg:items-stretch lg:gap-16 lg:p-16 ${
              reverse ? "lg:flex-row-reverse" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, x: reverse ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center gap-5 lg:w-[45%]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-accent-soft text-accent">
                <AppIcon name={icon} width={22} height={22} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">{eyebrow}</span>
              <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
              <p className="text-base leading-relaxed text-muted sm:text-lg lg:text-xl">{description}</p>
            </motion.div>

            <div
              className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border-soft lg:w-[55%]"
              style={{ background: gradient }}
            >
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
