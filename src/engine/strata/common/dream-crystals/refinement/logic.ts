import type { StratumState } from "@/engine/strata/state";
import { ZERO, N, add, div, mul, pow, max, sub, lte, gt } from "@/engine/math/num";
import { getDreamCrystalAmount } from "../selectors";
import { isRefineUnlocked } from "../../milestones";

export function getPendingDreamCrystalRefinement(stratum: StratumState, tier: number) {
  let refinement = ZERO;
  const stepScale = N(100);

  for (let otherTier = 1; otherTier <= 8; otherTier++) {
    if (otherTier === tier) continue;

    const amount = getDreamCrystalAmount(stratum.dreamCrystals, otherTier);
    const diff = otherTier - tier;
    const scale = pow(stepScale, Math.abs(diff));

    const contribution =
      diff > 0
        ? mul(amount, scale)   // 更高 tier：每高 1 级 *100
        : div(amount, scale);  // 更低 tier：每低 1 级 /100

    refinement = add(refinement, contribution);
  }

  return refinement;
}

export function getCurrentDreamCrystalRefinement(stratum: StratumState, tier: number) {
    return stratum.dreamCrystals.tiers[tier]!.refinement
}

export function getDreamCrystalRefinementIncrement(stratum: StratumState, tier: number) {
    const raw = getPendingDreamCrystalRefinement(stratum, tier);
    const current = getCurrentDreamCrystalRefinement(stratum, tier);
    return max(ZERO, sub(raw,current))
}

export function refineDreamCrystal(stratum: StratumState, tier:number) {
    const increment = getDreamCrystalRefinementIncrement(stratum, tier);
    const crystal = stratum.dreamCrystals.tiers;
    if (!canRefineDreamCrystal) return;
    for (let otherTier = 1; otherTier <= 8; otherTier++) {
        if (otherTier === tier) continue;
        
        crystal[otherTier]!.bought = ZERO
        crystal[otherTier]!.amount = ZERO
    }
    crystal[tier]!.refinement = add(crystal[tier]!.refinement, increment)
}

export function canRefineDreamCrystal(stratum: StratumState, tier:number) {
    if (!isRefineUnlocked(stratum)) return false;
    return gt(getDreamCrystalRefinementIncrement(stratum, tier), ZERO);
}