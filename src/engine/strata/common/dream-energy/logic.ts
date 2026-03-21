import type { StratumState } from "../../state";
import { add, N, ZERO } from "@/engine/math/num";
import { getDreamCrystalAmount } from "../dream-crystals/index";

export function getDreamEnergyGain(stratum: StratumState) {
    let gain = ZERO;

    gain = add(gain, getDreamCrystalAmount(stratum.dreamCrystals, 1));

    return gain;
}