import type { ComponentType } from "react";
import {
  AppleIcon,
  BananaIcon,
  BreadIcon,
  CheeseIcon,
  ChickenLegIcon,
  EggIcon,
  FishIcon,
  LeafIcon,
  MilkIcon,
  RiceBowlIcon,
  type IconProps,
} from "@/components/icons";

// 2026-08-27 — gerçek fotoğrafı olmayan (elle eklenen/aranan) yemekler için
// jenerik UtensilsIcon yerine anlam taşıyan bir ikon eşleştirmesi (kullanıcı
// bulgusu — "basit bir muz görseli olsun"). Sade bir anahtar kelime
// eşleştirmesi — eksiksiz bir sözlük değil, en yaygın yiyecekleri
// kapsıyor, eşleşme yoksa çağıran taraf zaten UtensilsIcon'a düşüyor.
const FOOD_ICON_KEYWORDS: { keywords: string[]; Icon: ComponentType<IconProps> }[] = [
  { keywords: ["muz", "banana"], Icon: BananaIcon },
  { keywords: ["yumurta", "egg"], Icon: EggIcon },
  { keywords: ["tavuk", "chicken", "köfte", "biftek", "kuzu", "dana", "et"], Icon: ChickenLegIcon },
  { keywords: ["ekmek", "bread", "bagel", "simit"], Icon: BreadIcon },
  { keywords: ["pirinç", "pilav", "rice", "yulaf", "oat", "bulgur", "makarna", "pasta", "noodle"], Icon: RiceBowlIcon },
  { keywords: ["süt", "milk", "yoğurt", "yogurt"], Icon: MilkIcon },
  { keywords: ["peynir", "cheese"], Icon: CheeseIcon },
  { keywords: ["balık", "fish", "somon", "salmon", "ton bal", "tuna"], Icon: FishIcon },
  { keywords: ["elma", "apple"], Icon: AppleIcon },
  { keywords: ["salata", "salad", "sebze", "ıspanak", "spinach", "brokoli", "broccoli"], Icon: LeafIcon },
];

export function matchFoodIcon(description: string): ComponentType<IconProps> | null {
  const lower = description.toLowerCase();
  for (const { keywords, Icon } of FOOD_ICON_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return Icon;
  }
  return null;
}
