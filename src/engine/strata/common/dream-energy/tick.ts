import type { StratumState } from "../../state";
import { ZERO, add, div, lt, lte, min, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getDreamEnergyGain } from "./logic";
import {
    DREAM_ENERGY_SOFTCAP_ONE_START,
    DREAM_ENERGY_SOFTCAP_THREE_START,
    DREAM_ENERGY_SOFTCAP_TWO_START,
} from "@/engine/math/dream-energy/balance";

const DREAM_ENERGY_TICK_STEP_LIMIT = 8192;

function getNextDreamEnergySoftcapThreshold(current: Num): Num | null {
    if (lt(current, DREAM_ENERGY_SOFTCAP_ONE_START)) return DREAM_ENERGY_SOFTCAP_ONE_START;
    if (lt(current, DREAM_ENERGY_SOFTCAP_TWO_START)) return DREAM_ENERGY_SOFTCAP_TWO_START;
    if (lt(current, DREAM_ENERGY_SOFTCAP_THREE_START)) return DREAM_ENERGY_SOFTCAP_THREE_START;
    return null;
}

function getSoftcapBoundaryStepSec(current: Num, gain: Num, remainingSec: Num): Num {
    const threshold = getNextDreamEnergySoftcapThreshold(current);
    if (!threshold) return remainingSec;

    const target = add(current, mul(gain, remainingSec));
    if (lte(target, threshold)) return remainingSec;

    const timeToThreshold = div(sub(threshold, current), gain);
    if (lte(timeToThreshold, ZERO)) return remainingSec;
    return min(remainingSec, timeToThreshold);
}

export function tickDreamEnergy(stratum: StratumState, dtSec: Num) {
    let remainingSec = dtSec;

    for (let step = 0; step < DREAM_ENERGY_TICK_STEP_LIMIT; step++) {
        if (lte(remainingSec, ZERO)) return;

        const gain = getDreamEnergyGain(stratum);
        if (lte(gain, ZERO)) return;

        const current = stratum.dreamEnergy;
        const stepSec = getSoftcapBoundaryStepSec(current, gain, remainingSec);

        if (lte(stepSec, ZERO)) return;

        stratum.dreamEnergy = add(stratum.dreamEnergy, mul(gain, stepSec));
        remainingSec = sub(remainingSec, stepSec);
    }
}
