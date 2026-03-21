import type { StratumState } from "../../state";
import { add } from "@/engine/math/num";
import { getDreamCrystalAmount } from "./selectors";
import { getDreamCrystalProduction } from "@/engine/math/dream-crystals/computed";

export function tickDreamCrystals(stratum: StratumState, dtSec: number) {
    for (let tier = 8; tier >= 2; tier--) {
        const produced = getDreamCrystalProduction(stratum, tier, dtSec);
        const lowerCrystal = stratum.dreamCrystals.tiers[tier - 1];

        if (!lowerCrystal) {
            throw new Error(`Dream Crystal tier ${tier - 1} not found.`);
        }

        lowerCrystal.amount = add(lowerCrystal.amount, produced);
    }
}