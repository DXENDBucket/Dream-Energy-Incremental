import { ONE, log10, add, max, ZERO, div } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { getCurrentDreamCrystalRefinement, getDreamCrystalRefinementIncrement, getPendingDreamCrystalRefinement } from "./logic";

export function getCurrentDreamCrystalRefinementMultiplier(stratum: StratumState, tier: number) {
    const refinement = getCurrentDreamCrystalRefinement(stratum, tier)
    const refinementMultiplier = computeDreamCrystalRefinmentMultiplier(refinement)
    return refinementMultiplier
}

export function getDreamCrystalRefinementMultiplierGainRatio(stratum: StratumState, tier: number) {
    const current = computeDreamCrystalRefinmentMultiplier(getCurrentDreamCrystalRefinement(stratum, tier))
    const pending = computeDreamCrystalRefinmentMultiplier(getPendingDreamCrystalRefinement(stratum, tier))
    const increment = max(ONE, div(pending,current))
    return increment
}

export function computeDreamCrystalRefinmentMultiplier(raw: Num) {
    let refinementMultiplier = add(log10(add(raw, ONE)), ONE)
    return refinementMultiplier
}