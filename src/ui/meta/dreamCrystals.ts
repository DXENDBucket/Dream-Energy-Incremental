import type { DreamCrystalTier } from "@/engine/math/dream-crystals";

type Translate = (key: string, named?: Record<string, unknown>) => string;

const DREAM_CRYSTAL_TITLE_KEYS = {
  1: "dreamCrystals.tiers.1.title",
  2: "dreamCrystals.tiers.2.title",
  3: "dreamCrystals.tiers.3.title",
  4: "dreamCrystals.tiers.4.title",
  5: "dreamCrystals.tiers.5.title",
  6: "dreamCrystals.tiers.6.title",
  7: "dreamCrystals.tiers.7.title",
  8: "dreamCrystals.tiers.8.title",
} as const satisfies Record<DreamCrystalTier, string>;

export function getDreamCrystalTitle(t: Translate, tier: DreamCrystalTier): string {
  return t(DREAM_CRYSTAL_TITLE_KEYS[tier]);
}
