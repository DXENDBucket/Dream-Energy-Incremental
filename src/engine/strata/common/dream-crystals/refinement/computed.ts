import { N, ONE, add, div, logn, max, mul } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
    getDreamCrystalRefineryEfficiencyMultiplier,
    getDreamCrystalRefineryLogBase,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { getCurrentDreamCrystalRefinement, getDreamCrystalRefinementIncrement, getPendingDreamCrystalRefinement } from "./logic";

export const REFINERY_DEFAULT_LOG_BASE = N(5);

export function getCurrentDreamCrystalRefinementMultiplier(stratum: StratumState, tier: number) {
    const refinement = getCurrentDreamCrystalRefinement(stratum, tier)
    const refinementMultiplier = mul(
        computeDreamCrystalRefinmentMultiplier(stratum, refinement),
        getDreamCrystalRefineryEfficiencyMultiplier(stratum),
    )
    return refinementMultiplier
}

export function getDreamCrystalRefinementMultiplierGainRatio(stratum: StratumState, tier: number) {
    const refineryMultiplier = getDreamCrystalRefineryEfficiencyMultiplier(stratum)
    const current = mul(
        computeDreamCrystalRefinmentMultiplier(stratum, getCurrentDreamCrystalRefinement(stratum, tier)),
        refineryMultiplier,
    )
    const pending = mul(
        computeDreamCrystalRefinmentMultiplier(stratum, getPendingDreamCrystalRefinement(stratum, tier)),
        refineryMultiplier,
    )
    const increment = max(ONE, div(pending,current))
    return increment
}

export function computeDreamCrystalRefinmentMultiplier(stratum: StratumState, raw: Num) {
    let refinementMultiplier = add(logn(add(raw, ONE), getDreamCrystalRefineryLogBase(stratum)), ONE)
    return refinementMultiplier
}
