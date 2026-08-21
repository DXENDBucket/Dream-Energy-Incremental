import type { StratumState } from "../../state";
import { add, lte } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getDreamCrystalAmount } from "./selectors";
import { getDreamCrystalProduction } from "@/engine/math/dream-crystals/computed";

export function tickDreamCrystals(stratum: StratumState, dtSec: Num) {
    const production = [] as Array<{ lowerTier: number; amount: Num }>;

    for (let tier = 2; tier <= 8; tier++) {
        production.push({
            lowerTier: tier - 1,
            amount: getDreamCrystalProduction(stratum, tier, dtSec),
        });
    }

    for (const produced of production) {
        if (lte(produced.amount, 0)) continue;
        const lowerCrystal = stratum.dreamCrystals.tiers[produced.lowerTier];

        if (!lowerCrystal) {
            throw new Error(`Dream Crystal tier ${produced.lowerTier} not found.`);
        }

        lowerCrystal.amount = add(lowerCrystal.amount, produced.amount);
    }
}
