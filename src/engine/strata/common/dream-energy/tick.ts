import type { StratumState } from "../../state";
import { add, mul } from "@/engine/math/num";
import { getDreamEnergyGain } from "./logic";

export function tickDreamEnergy(stratum: StratumState, dtSec: number) {
    const gain = getDreamEnergyGain(stratum);
    stratum.dreamEnergy = add(stratum.dreamEnergy, mul(gain, dtSec));
}