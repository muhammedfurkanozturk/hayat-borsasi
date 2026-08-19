import type { IconKey } from "@hayat-borsasi/shared";
import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Web'deki 30 IconKey'e karşılık gelen MaterialCommunityIcons glifleri —
// web'in kendi SVG bileşenleri (src/components/icons.tsx) RN'de kullanılamaz,
// bu yüzden aynı kavramlara en yakın MCI ikonlarıyla eşliyoruz.
export const ICON_KEY_TO_MCI: Record<IconKey, MciName> = {
  rocket: "rocket-launch-outline",
  book: "book-open-variant",
  target: "target",
  users: "account-group-outline",
  heart: "heart-outline",
  "moon-star": "weather-night",
  star: "star-outline",
  badge: "medal-outline",
  wallet: "wallet-outline",
  dumbbell: "dumbbell",
  apple: "food-apple-outline",
  pulse: "pulse",
  briefcase: "briefcase-outline",
  leaf: "leaf",
  home: "home-outline",
  plane: "airplane",
  code: "code-tags",
  music: "music-note-outline",
  palette: "palette-outline",
  camera: "camera-outline",
  utensils: "silverware-fork-knife",
  clock: "clock-outline",
  gamepad: "gamepad-variant-outline",
  paw: "paw-outline",
  car: "car-outline",
  lightbulb: "lightbulb-on-outline",
  calendar: "calendar-blank-outline",
  flame: "fire",
  sun: "white-balance-sunny",
  compass: "compass-outline",
};
