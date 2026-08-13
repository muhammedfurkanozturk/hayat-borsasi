import type { SVGProps } from "react";

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

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5" />
      <path d="M11 18 5 12l6-6" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8.5 21h7" />
    </svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
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

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function ListCheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3.5 6 1 1 1.5-1.8M3.5 12l1 1 1.5-1.8M3.5 18l1 1 1.5-1.8" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20l1-4.2L15.2 5.6a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8.2 19 4 20Z" />
      <path d="M13.2 7.6l3.2 3.2" />
    </svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h8l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M8 13h8M8 16.5h8" />
    </svg>
  );
}

export function BadgeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.8 7 21l5-2.6 5 2.6-1.5-7.2" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5 9.5 18 20 6" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7" />
      <path d="M6.5 7 7.3 19.2c.05.9.8 1.6 1.7 1.6h6c.9 0 1.65-.7 1.7-1.6L17.5 7" />
      <path d="M10.3 11v6M13.7 11v6" />
    </svg>
  );
}

export const iconPalette = {
  rocket: RocketIcon,
  book: BookIcon,
  target: TargetIcon,
  users: UsersIcon,
  heart: HeartIcon,
  "moon-star": MoonStarIcon,
  star: StarIcon,
  badge: BadgeIcon,
} as const;

export type IconKey = keyof typeof iconPalette;

export function AppIcon({ name, ...props }: { name: IconKey } & IconProps) {
  const Icon = iconPalette[name];
  return <Icon {...props} />;
}
