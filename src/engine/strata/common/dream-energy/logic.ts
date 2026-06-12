import type { StratumState } from "../../state";
import { ONE, ZERO, add, div, logn, lte, mul, pow, sub, type Num } from "@/engine/math/num";
import {
    DREAM_ENERGY_SOFTCAP_ONE_START,
    DREAM_ENERGY_SOFTCAP_POWER_DISPLAY,
    DREAM_ENERGY_SOFTCAP_TWO_START,
    DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE,
    DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH,
} from "@/engine/math/dream-energy/balance";
import { convertDreamEnergySoftcapOneToPower, getDreamEnergyIncrement } from "@/engine/math/dream-energy/computed";
import {
    getDreamCrystalSoftcapOneStrengthMultiplier,
    getDreamCrystalSoftcapTwoStrengthMultiplier,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { getDreamEnergy } from "../../manager/selectors";

export function getDreamEnergyGain(stratum: StratumState) {
    let gain = getRawDreamEnergyGain(stratum);

    if (isDreamEnergySoftcapOneActive(stratum)) {
        const divisor = getDreamEnergySoftcapOneDivisor(stratum);
        gain = applyDreamEnergySoftcapOne(gain, divisor);
    }

    return gain;
}

export function getDreamEnergyGainPerSecond(stratum: StratumState) {
    return mul(getDreamEnergyGain(stratum), stratum.stratumSpeed);
}

export function applyDreamEnergySoftcapOne(raw: Num, divisor: Num) {
    return div(raw, divisor);
}

export function getDreamEnergySoftcapOneDivisor(stratum: StratumState) {
    if (!isDreamEnergySoftcapOneActive(stratum)) return ONE;
    const dreamEnergy = getDreamEnergy(stratum)

    const ratio = getDreamEnergySoftCapOneRatio(dreamEnergy);
    const power = getDreamEnergySoftCapOneBasePower(stratum);
    let divisor = pow(ratio, power);

    if (isDreamEnergySoftcapTwoActive(stratum)) {
        const extraRatio = getDreamEnergySoftcapTwoRatio(dreamEnergy);
        const extraPower = getDreamEnergySoftcapTwoExtraPower(stratum);
        divisor = mul(divisor, pow(extraRatio, extraPower));
    }

    return divisor;
}

export function getRawDreamEnergyGain(stratum: StratumState) {
    let gain = ZERO;
    gain = add(gain, getDreamEnergyIncrement(stratum));

    return gain;
}

export function getRawDreamEnergyGainPerSecond(stratum: StratumState) {
    return mul(getRawDreamEnergyGain(stratum), stratum.stratumSpeed);
}

export function getDreamEnergyPercentageGainPerSecond(stratum: StratumState) {
    const amount = getDreamEnergy(stratum);
    if (lte(amount, ZERO)) return ZERO;

    return div(getDreamEnergyGainPerSecond(stratum), amount);
}

export function isDreamEnergySoftcapOneActive(stratum: StratumState) {
    return !lte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_ONE_START);
}

export function isDreamEnergySoftcapTwoActive(stratum: StratumState) {
    return !lte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_TWO_START);
}

export function getDreamEnergySoftCapOneRatio(raw: Num) {
    const ratio = div(raw, DREAM_ENERGY_SOFTCAP_ONE_START);

    return ratio
}

export function getDreamEnergySoftcapTwoRatio(raw: Num) {
    return div(raw, DREAM_ENERGY_SOFTCAP_TWO_START);
}

export function getDreamEnergySoftcapOneBaseStrengthDisplay(stratum?: StratumState) {
    if (!stratum) return DREAM_ENERGY_SOFTCAP_POWER_DISPLAY;
    return mul(DREAM_ENERGY_SOFTCAP_POWER_DISPLAY, getDreamCrystalSoftcapOneStrengthMultiplier(stratum));
}

export function getDreamEnergySoftCapOneBasePower(stratum?: StratumState) {
    return convertDreamEnergySoftcapOneToPower(getDreamEnergySoftcapOneBaseStrengthDisplay(stratum));
}

export function getDreamEnergySoftCapOnePower(stratum?: StratumState) {
    let origin = getDreamEnergySoftcapOnePowerDisplay(stratum);
    let power = convertDreamEnergySoftcapOneToPower(origin);

    return power
}

export function getDreamEnergySoftcapTwoExcessExponent(stratum: StratumState) {
    if (!isDreamEnergySoftcapTwoActive(stratum)) return ZERO;
    return logn(getDreamEnergySoftcapTwoRatio(getDreamEnergy(stratum)), DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE);
}

export function getDreamEnergySoftcapTwoStrengthMultiplier(stratum: StratumState) {
    if (!isDreamEnergySoftcapTwoActive(stratum)) return ONE;
    return pow(getDreamEnergySoftcapTwoStrengthGrowth(stratum), getDreamEnergySoftcapTwoExcessExponent(stratum));
}

export function getDreamEnergySoftcapTwoStrengthBase() {
    return DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE;
}

export function getDreamEnergySoftcapTwoStrengthGrowth(stratum?: StratumState) {
    if (!stratum) return DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH;
    return mul(
        DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH,
        getDreamCrystalSoftcapTwoStrengthMultiplier(stratum),
    );
}

export function getDreamEnergySoftcapTwoExtraPower(stratum: StratumState) {
    if (!isDreamEnergySoftcapTwoActive(stratum)) return ZERO;
    return sub(getDreamEnergySoftCapOnePower(stratum), getDreamEnergySoftCapOneBasePower(stratum));
}

export function getDreamEnergySoftcapOnePowerDisplay(stratum?: StratumState) {
    const baseStrength = getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    if (!stratum) return baseStrength;
    return mul(baseStrength, getDreamEnergySoftcapTwoStrengthMultiplier(stratum));
}
