import { N, ONE, logn, max, pow, type Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";

export function isCrushOneActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 1;
}

export function getCrushOneChaoticEtherGainMultiplier(stratum: StratumState): Num {
  if (!isCrushOneActive(stratum)) return ONE;
  const bestDreamEnergyLog2 = logn(max(stratum.bestDreamEnergy, ONE), N(2));
  return max(ONE, pow(bestDreamEnergyLog2, N(4)));
}

export function isDreamCrystalProductionDisabledByCrushOne(
  stratum: StratumState,
  sourceTier: number,
): boolean {
  return isCrushOneActive(stratum) && sourceTier >= 7;
}
