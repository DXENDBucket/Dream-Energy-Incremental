import type { StratumState } from "../../state";
import { add, N, ZERO, type Num, lte, div, pow, mul, ONE } from "@/engine/math/num";
import { getDreamCrystalAmount } from "../dream-crystals/index";
import { getDreamCrystalIncrement, getDreamCrystalMultiplier } from "@/engine/math/dream-crystals";
import { DREAM_ENERGY_SOFTCAP_ONE_START, DREAM_ENERGY_SOFTCAP_POWER_DISPLAY } from "@/engine/math/dream-energy/balance";
import { convertDreamEnergySoftcapOneToPower, getDreamEnergyIncrement } from "@/engine/math/dream-energy/computed";
import { getDreamEnergy } from "../../manager/selectors";

export function getDreamEnergyGain(stratum: StratumState) {
    let gain = getRawDreamEnergyGain(stratum);

    if (isDreamEnergySoftcapOneActive(stratum)) {
        const divisor = getDreamEnergySoftcapOneDivisor(stratum);
        gain = applyDreamEnergySoftcapOne(gain, divisor);
    }

    return gain;
}

export function applyDreamEnergySoftcapOne(raw: Num, divisor: Num) {
    return div(raw, divisor);
}

export function getDreamEnergySoftcapOneDivisor(stratum: StratumState) {
    if (!isDreamEnergySoftcapOneActive(stratum)) return ONE;
    const dreamEnergy = getDreamEnergy(stratum)

    const ratio = getDreamEnergySoftCapOneRatio(dreamEnergy);
    const power = getDreamEnergySoftCapOnePower(dreamEnergy);

    return pow(ratio, power);
}

export function getRawDreamEnergyGain(stratum: StratumState) {
    let gain = ZERO;
    gain = add(gain, getDreamEnergyIncrement(stratum));

    return gain;
}

export function isDreamEnergySoftcapOneActive(stratum: StratumState) {
    return !lte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_ONE_START);
}

export function getDreamEnergySoftCapOneRatio(raw: Num) {
    const ratio = div(raw, DREAM_ENERGY_SOFTCAP_ONE_START);

    return ratio
}

export function getDreamEnergySoftCapOnePower(raw: Num) {
    let origin = getDreamEnergySoftcapOnePowerDisplay();
    let power = convertDreamEnergySoftcapOneToPower(origin);

    return power
}

export function getDreamEnergySoftcapOnePowerDisplay() {
  return DREAM_ENERGY_SOFTCAP_POWER_DISPLAY;
}