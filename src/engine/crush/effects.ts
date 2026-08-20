import { N, ONE, ZERO, add, div, logn, max, mul, pow, sub, type Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";

export function isCrushOneActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 1;
}

export function isCrushTwoActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 2;
}

export function isCrushThreeActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 3;
}

export function getCrushOneChaoticEtherGainMultiplier(stratum: StratumState): Num {
  if (!isCrushOneActive(stratum)) return ONE;
  const bestDreamEnergyLog2 = logn(max(stratum.bestDreamEnergy, ONE), N(2));
  return max(ONE, pow(bestDreamEnergyLog2, N(4)));
}

export function isDreamCrystalProductionDisabledByCrush(
  stratum: StratumState,
  sourceTier: number,
): boolean {
  if (isCrushThreeActive(stratum) && sourceTier >= 5) return true;
  return isCrushOneActive(stratum) && sourceTier >= 7;
}

export function getCrushTwoConsensusShieldingEfficiency(stratum: StratumState): Num {
  if (!isCrushTwoActive(stratum)) return ONE;
  const consensusAmount = max(stratum.conceptCrystals?.nodes?.conquest ?? ONE, ONE);
  const heldConceptCrystals = max(stratum.conceptCrystals?.amount ?? ONE, ONE);
  const heldAmountExponent = add(
    ONE,
    mul(N(0.065), max(ZERO, sub(heldConceptCrystals, ONE))),
  );
  return pow(consensusAmount, div(heldAmountExponent, N(154)));
}
