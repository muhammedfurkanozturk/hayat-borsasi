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

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 12h12" />
      <rect x="2" y="9.5" width="3" height="5" rx="1" />
      <rect x="19" y="9.5" width="3" height="5" rx="1" />
      <rect x="6.5" y="8.5" width="2.2" height="7" rx="0.8" />
      <rect x="15.3" y="8.5" width="2.2" height="7" rx="0.8" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 9.3c-3.1 0-5 2.6-5 5.9 0 3.1 2.1 6.3 4.1 6.3.9 0 1.2-.5 1.9-.5s1 .5 1.9.5c2 0 4.1-3.1 4.1-6.1 0-3.3-1.9-6.1-5-6.1-.8 0-1.3.4-1.9.4Z" />
      <path d="M12.7 9.3c-.1-1.4.7-2.5 1.9-3" />
    </svg>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7 12h2.2l1.3-3 2 6 1.3-3H17" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 19c8-1 13-6 14-14-8 1-13 6-14 14Z" />
      <path d="M5 19c1.5-4 4-7 8-9.5" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 4 11 14" />
      <path d="M21 4 14.5 21 11 14 4 10.5 21 4Z" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="M13.5 6.5 10.5 17.5" />
    </svg>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 17.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
      <path d="M18 15.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
      <path d="M11.3 12.9V5l9-1.8v8.7" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4a8 8 0 1 0 0 16h1.5a1.8 1.8 0 0 0 1.3-3.1 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-3.8-4-6.8-9-6.8Z" />
      <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1.2-1.8a1.5 1.5 0 0 1 1.2-.7h4.2a1.5 1.5 0 0 1 1.2.7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

export function UtensilsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3v6.5a1.5 1.5 0 0 0 3 0V3" />
      <path d="M8.5 9.5V21" />
      <path d="M16.5 3c-1.4 0-2.5 1.8-2.5 5s1.1 4 2.5 4" />
      <path d="M16.5 3v18" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function GamepadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="8" width="19" height="9.5" rx="4" />
      <path d="M7 10.5v4M5 12.5h4" />
      <circle cx="16" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.2" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="16" r="3.2" />
      <circle cx="6.5" cy="9" r="1.7" />
      <circle cx="10.3" cy="6.3" r="1.7" />
      <circle cx="13.7" cy="6.3" r="1.7" />
      <circle cx="17.5" cy="9" r="1.7" />
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15.5 5.5 9.5a2 2 0 0 1 2-1.5h9a2 2 0 0 1 2 1.5l1.5 6" />
      <rect x="3" y="15.5" width="18" height="4" rx="1.5" />
      <circle cx="7.5" cy="19.5" r="1.4" />
      <circle cx="16.5" cy="19.5" r="1.4" />
    </svg>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6.5 6.5 0 0 0-3.5 12c.7.5 1 1.2 1 2h5c0-.8.3-1.5 1-2A6.5 6.5 0 0 0 12 3Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21c-4 0-6.5-2.8-6.5-6.3 0-2.7 1.6-4.5 2.6-6.5.5 1.3 1.4 2 2.4 2-.4-2.8.6-5.3 3-7.2.3 2.4 1.3 3.8 2.8 5.3 1.8 1.8 2.7 3.7 2.7 6.3C19 18.2 16 21 12 21Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.2M12 18.8V21M4.2 12H2.5M21.5 12h-1.7M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.8 9.2-1.7 4.9-4.9 1.7 1.7-4.9Z" />
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5 7.5 11.5 12 5l4.5 6.5 3.5-3-1.5 9h-13Z" />
      <path d="M6.5 17.5h11" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
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
  wallet: WalletIcon,
  dumbbell: DumbbellIcon,
  apple: AppleIcon,
  pulse: PulseIcon,
  briefcase: BriefcaseIcon,
  leaf: LeafIcon,
  home: HomeIcon,
  plane: PlaneIcon,
  code: CodeIcon,
  music: MusicIcon,
  palette: PaletteIcon,
  camera: CameraIcon,
  utensils: UtensilsIcon,
  clock: ClockIcon,
  gamepad: GamepadIcon,
  paw: PawIcon,
  car: CarIcon,
  lightbulb: LightbulbIcon,
  calendar: CalendarIcon,
  flame: FlameIcon,
  sun: SunIcon,
  compass: CompassIcon,
} as const;

export type IconKey = keyof typeof iconPalette;

export const iconLabels: Record<IconKey, string> = {
  rocket: "Girişimcilik",
  book: "Eğitim",
  target: "Hedef",
  users: "Sosyal",
  heart: "İlişkiler",
  "moon-star": "Maneviyat",
  star: "Genel",
  badge: "Başarı",
  wallet: "Finans",
  dumbbell: "Spor",
  apple: "Beslenme",
  pulse: "Sağlık",
  briefcase: "Kariyer",
  leaf: "Doğa",
  home: "Ev",
  plane: "Seyahat",
  code: "Teknoloji",
  music: "Müzik",
  palette: "Sanat",
  camera: "Fotoğrafçılık",
  utensils: "Mutfak",
  clock: "Zaman Yönetimi",
  gamepad: "Oyun",
  paw: "Evcil Hayvan",
  car: "Ulaşım",
  lightbulb: "Yaratıcılık",
  calendar: "Planlama",
  flame: "Motivasyon",
  sun: "Rutin",
  compass: "Keşif",
};

export function AppIcon({ name, ...props }: { name: IconKey } & IconProps) {
  const Icon = iconPalette[name];
  return <Icon {...props} />;
}
