import type { StratumState } from "../../state";
import { lte, mul } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { addRawDreamEnergy, getRawDreamEnergyGain } from "./logic";

export function tickDreamEnergy(stratum: StratumState, dtSec: Num) {
    if (lte(dtSec, 0)) return;

    const rawGain = mul(getRawDreamEnergyGain(stratum), mul(stratum.stratumSpeed, dtSec));
    addRawDreamEnergy(stratum, rawGain);
}
