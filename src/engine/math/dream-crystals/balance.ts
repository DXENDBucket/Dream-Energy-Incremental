import { N } from "@/engine/math/num";

export const DREAM_CRYSTAL_BASE_COSTS = {
    1: N(10),
    2: N(100),
    3: N(1e4),
    4: N(1e7),
    5: N(1e11),
    6: N(1e16),
    7: N(1e21),
    8: N(1e28),
} as const;

export const DREAM_CRYSTAL_COST_SCALES = {
    1: N(1.1),
    2: N(1.21),
    3: N(1.33),
    4: N(1.46),
    5: N(1.61),
    6: N(1.77),
    7: N(1.95),
    8: N(2.14),
} as const;

export function getDreamCrystalBaseCost(tier: number) {
    const value = DREAM_CRYSTAL_BASE_COSTS[tier as keyof typeof DREAM_CRYSTAL_BASE_COSTS];
    if (!value) {
        throw new Error(`Dream Crystal base cost for tier ${tier} not found.`);
    }
    return value;
}

export function getDreamCrystalCostScale(tier: number) {
    const value = DREAM_CRYSTAL_COST_SCALES[tier as keyof typeof DREAM_CRYSTAL_COST_SCALES];
    if (!value) {
        throw new Error(`Dream Crystal cost scale for tier ${tier} not found.`);
    }
    return value;
}

