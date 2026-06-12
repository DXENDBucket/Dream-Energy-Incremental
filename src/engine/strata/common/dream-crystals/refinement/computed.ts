import { N, ONE, add, div, logn, max, mul } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { getDreamCrystalRefineryEfficiencyMultiplier } from "@/engine/strata/common/dream-crystals/upgrades";
import { getCurrentDreamCrystalRefinement, getDreamCrystalRefinementIncrement, getPendingDreamCrystalRefinement } from "./logic";

const REFINERY_LOG_BASE = N(5);

export function getCurrentDreamCrystalRefinementMultiplier(stratum: StratumState, tier: number) {
    const refinement = getCurrentDreamCrystalRefinement(stratum, tier)
    const refinementMultiplier = mul(
        computeDreamCrystalRefinmentMultiplier(refinement),
        getDreamCrystalRefineryEfficiencyMultiplier(stratum),
    )
    return refinementMultiplier
}

export function getDreamCrystalRefinementMultiplierGainRatio(stratum: StratumState, tier: number) {
    const refineryMultiplier = getDreamCrystalRefineryEfficiencyMultiplier(stratum)
    const current = mul(
        computeDreamCrystalRefinmentMultiplier(getCurrentDreamCrystalRefinement(stratum, tier)),
        refineryMultiplier,
    )
    const pending = mul(
        computeDreamCrystalRefinmentMultiplier(getPendingDreamCrystalRefinement(stratum, tier)),
        refineryMultiplier,
    )
    const increment = max(ONE, div(pending,current))
    return increment
}

export function computeDreamCrystalRefinmentMultiplier(raw: Num) {
    let refinementMultiplier = add(logn(add(raw, ONE), REFINERY_LOG_BASE), ONE)
    return refinementMultiplier
}
