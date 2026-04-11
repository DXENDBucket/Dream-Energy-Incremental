import { DREAM_CRYSTAL_BASE_COSTS, DREAM_CRYSTAL_COST_SCALES } from "./balance";
import type { Num } from "@/engine/math/num";
import { mul, ONE, pow, ZERO, div } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals/selectors";
import { getCurrentDreamCrystalRefinementMultiplier } from "@/engine/strata/common/dream-crystals/refinement";

export function getDreamCrystalCost(tier: number, amountBought: Num) {
    const base = DREAM_CRYSTAL_BASE_COSTS[tier as keyof typeof DREAM_CRYSTAL_BASE_COSTS];
    const scale = DREAM_CRYSTAL_COST_SCALES[tier as keyof typeof DREAM_CRYSTAL_COST_SCALES];

    if (!base) {
        throw new Error(`Dream Crystal base cost for tier ${tier} not found.`);
    }

    if (!scale) {
        throw new Error(`Dream Crystal cost scale for tier ${tier} not found.`);
    }

    return mul(base, pow(scale, amountBought));
}

// 实际生产值
export function getDreamCrystalProduction(
    stratum: StratumState,
    tier: number,
    dtSec: Num
) {
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier);
    return mul(mul(amount, getDreamCrystalMultiplier(stratum, tier)), dtSec);
}

// Multiplier
export function getDreamCrystalMultiplier(
    stratum: StratumState,
    tier: number,
) {
    let multiplier = ONE;
    multiplier = mul(multiplier,getCurrentDreamCrystalRefinementMultiplier(stratum, tier))
    return multiplier;
}

export function getDreamCrystalIncrement(
    stratum: StratumState,
    tier: number,
) {
    if (tier == 8) { return ZERO }
    const multiplier = getDreamCrystalMultiplier(stratum, tier + 1);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier + 1);
    return mul(multiplier, amount)
}

export function getDreamCrystalPercentageIncrement(
    stratum: StratumState,
    tier: number,
) {
    if (tier >= 8) return ZERO;

    const increment = getDreamCrystalIncrement(stratum, tier);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier);

    if (amount.eq(ZERO)) return ZERO;
    return div(increment, amount);
}
