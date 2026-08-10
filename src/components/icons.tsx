import type { SVGProps } from "react";
import type { CategoryKey } from "@/lib/mock/dashboard-data";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function RocketIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2c2.5 2 4 5.5 4 9.5-1.2.7-2.6 1-4 1s-2.8-.3-4-1c0-4 1.5-7.5 4-9.5Z" />
      <path d="M9.5 14.5 7 21l3.2-1.8" />
      <path d="M14.5 14.5 17 21l-3.2-1.8" />
      <circle cx="12" cy="9.5" r="1.4" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5c2.2-1 5-1 8 0v14c-3-1-5.8-1-8 0Z" />
      <path d="M20 5c-2.2-1-5-1-8 0v14c3-1 5.8-1 8 0Z" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8.5" r="2.8" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6.2c1.4.3 2.5 1.6 2.5 3.1 0 1.4-.9 2.6-2.1 3" />
      <path d="M15 14c2.5.4 4.5 2.2 4.5 5" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20s-7-4.4-9.3-9C1.2 7.8 3 4.5 6.4 4.5c1.9 0 3.3 1 4.2 2.5.9-1.5 2.3-2.5 4.2-2.5 3.4 0 5.2 3.3 3.7 6.5C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function MoonStarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z" />
      <path d="M18 3v3M16.5 4.5h3" />
    </svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17 9.5 10.5 14 15 21 7" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

const categoryIconMap: Record<CategoryKey, (props: IconProps) => React.JSX.Element> = {
  girisimcilik: RocketIcon,
  akademisyenlik: BookIcon,
  disiplin: TargetIcon,
  "sosyal-sermaye": UsersIcon,
  saglik: HeartIcon,
  maneviyat: MoonStarIcon,
};

export function CategoryIcon({ category, ...props }: { category: CategoryKey } & IconProps) {
  const Icon = categoryIconMap[category];
  return <Icon {...props} />;
}
