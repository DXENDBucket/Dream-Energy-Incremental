import { DREAM_CRYSTAL_BASE_COSTS, DREAM_CRYSTAL_COST_SCALES } from "./balance";
import type { Num } from "@/engine/math/num";
import { add, div, floor, mul, N, ONE, pow, sub, ZERO } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals/selectors";
import { getCurrentDreamCrystalRefinementMultiplier } from "@/engine/strata/common/dream-crystals/refinement";
import {
    getDreamCrystalBoughtPowerMultiplier,
    getDreamCrystalFirstTierUpgradeMultiplier,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { applyEntropyToProduction } from "@/engine/strata/common/entropy";
import { getConceptCrystalDreamCrystalCostGrowthFactor } from "@/engine/strata/common/concept-crystals";

const DREAM_CRYSTAL_COST_SOFTCAP_START = 20;
const DREAM_CRYSTAL_COST_SOFTCAP_EXACT_STEPS = 128;
const DREAM_CRYSTAL_COST_SOFTCAP_DEFAULT_GROWTH = N(1.5);

export function getDreamCrystalCostSoftcapGrowth(stratum?: StratumState): Num {
    const conceptFactor = stratum ? getConceptCrystalDreamCrystalCostGrowthFactor(stratum) : ONE;
    return add(ONE, mul(sub(DREAM_CRYSTAL_COST_SOFTCAP_DEFAULT_GROWTH, ONE), conceptFactor));
}

function getDreamCrystalSoftcappedCost(base: Num, scale: Num, amountBought: Num, stratum?: StratumState): Num {
    const softcapStart = DREAM_CRYSTAL_COST_SOFTCAP_START;
    const bought = floor(amountBought);

    if (bought.lte(softcapStart)) {
        return mul(base, pow(scale, bought));
    }

    const growthIncrement = sub(scale, ONE);
    if (growthIncrement.lte(ZERO)) {
        return mul(base, pow(scale, bought));
    }

    let cost = mul(base, pow(scale, softcapStart));
    const softcappedPurchases = sub(bought, softcapStart);
    const softcapGrowth = getDreamCrystalCostSoftcapGrowth(stratum);
    const exactSteps = Math.min(
        DREAM_CRYSTAL_COST_SOFTCAP_EXACT_STEPS,
        Math.max(0, softcappedPurchases.floor().toNumber()),
    );

    for (let step = 1; step <= exactSteps; step++) {
        cost = mul(cost, add(ONE, mul(growthIncrement, pow(softcapGrowth, step))));
    }

    const remainingSteps = sub(softcappedPurchases, exactSteps);
    if (remainingSteps.lte(ZERO)) {
        return cost;
    }

    const firstApproxStep = exactSteps + 1;
    const lastApproxStep = add(N(exactSteps), remainingSteps);
    const doubledIncrementPower = div(
        mul(add(N(firstApproxStep), lastApproxStep), remainingSteps),
        2,
    );

    return mul(cost, mul(pow(growthIncrement, remainingSteps), pow(softcapGrowth, doubledIncrementPower)));
}

export function getDreamCrystalCost(tier: number, amountBought: Num, stratum?: StratumState) {
    const base = DREAM_CRYSTAL_BASE_COSTS[tier as keyof typeof DREAM_CRYSTAL_BASE_COSTS];
    const scale = DREAM_CRYSTAL_COST_SCALES[tier as keyof typeof DREAM_CRYSTAL_COST_SCALES];

    if (!base) {
        throw new Error(`Dream Crystal base cost for tier ${tier} not found.`);
    }

    if (!scale) {
        throw new Error(`Dream Crystal cost scale for tier ${tier} not found.`);
    }

    return getDreamCrystalSoftcappedCost(base, scale, amountBought, stratum);
}

export function getNextDreamCrystalCost(
    tier: number,
    amountBought: Num,
    currentCost: Num,
    stratum?: StratumState,
) {
    const scale = DREAM_CRYSTAL_COST_SCALES[tier as keyof typeof DREAM_CRYSTAL_COST_SCALES];

    if (!scale) {
        throw new Error(`Dream Crystal cost scale for tier ${tier} not found.`);
    }

    const bought = floor(amountBought);
    if (bought.lt(DREAM_CRYSTAL_COST_SOFTCAP_START)) {
        return mul(currentCost, scale);
    }

    const growthIncrement = sub(scale, ONE);
    if (growthIncrement.lte(ZERO)) {
        return mul(currentCost, scale);
    }

    const softcappedStep = sub(add(bought, ONE), DREAM_CRYSTAL_COST_SOFTCAP_START);
    const softcapGrowth = getDreamCrystalCostSoftcapGrowth(stratum);
    const growthPower = pow(softcapGrowth, softcappedStep);
    const ratio = softcappedStep.lte(DREAM_CRYSTAL_COST_SOFTCAP_EXACT_STEPS)
        ? add(ONE, mul(growthIncrement, growthPower))
        : mul(growthIncrement, growthPower);

    return mul(currentCost, ratio);
}

// 实际生产值
export function getDreamCrystalProduction(
    stratum: StratumState,
    tier: number,
    dtSec: Num
) {
    return mul(getDreamCrystalIncrement(stratum, tier - 1), dtSec);
}

// Multiplier
export function getDreamCrystalMultiplier(
    stratum: StratumState,
    tier: number,
) {
    let multiplier = ONE;
    multiplier = mul(multiplier,getCurrentDreamCrystalRefinementMultiplier(stratum, tier))
    multiplier = mul(multiplier, getDreamCrystalFirstTierUpgradeMultiplier(stratum, tier))
    multiplier = mul(multiplier, getDreamCrystalBoughtPowerMultiplier(stratum, tier))
    multiplier = mul(multiplier, stratum.coherenceDreamCrystalMultiplier ?? ONE)
    multiplier = mul(multiplier, stratum.coherenceProgressionDreamCrystalMultiplier ?? ONE)
    return pow(multiplier, stratum.dreamCrystalMultiplierPower ?? ONE);
}

export function getDreamCrystalIncrement(
    stratum: StratumState,
    tier: number,
) {
    if (tier == 8) { return ZERO }
    const multiplier = getDreamCrystalMultiplier(stratum, tier + 1);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier + 1);
    return applyEntropyToProduction(stratum, mul(multiplier, amount))
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

export function getDreamCrystalGainPerSecond(
    stratum: StratumState,
    tier: number,
) {
    return mul(getDreamCrystalIncrement(stratum, tier), stratum.stratumSpeed);
}

export function getDreamCrystalPercentageGainPerSecond(
    stratum: StratumState,
    tier: number,
) {
    if (tier >= 8) return ZERO;

    const gain = getDreamCrystalGainPerSecond(stratum, tier);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier);

    if (amount.eq(ZERO)) return ZERO;
    return div(gain, amount);
}
