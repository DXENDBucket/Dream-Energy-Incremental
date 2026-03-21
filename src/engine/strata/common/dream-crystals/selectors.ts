import type { DreamCrystalsState } from "./state";
import { N } from "@/engine/math/num";

export function getDreamCrystalAmount(
  crystals: DreamCrystalsState,
  tier: number
) {
  return crystals.tiers[tier]?.amount ?? N(0);
}

export function getDreamCrystalBought(
  crystals: DreamCrystalsState,
  tier: number
) {
  return crystals.tiers[tier]?.bought ?? N(0);
}