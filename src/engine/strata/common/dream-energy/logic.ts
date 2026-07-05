import type { StratumState } from "../../state";
import { N, ONE, ZERO, add, div, gte, logn, lte, max, mul, pow, sub, type Num } from "@/engine/math/num";
import {
    DREAM_ENERGY_SOFTCAP_ONE_START,
    DREAM_ENERGY_SOFTCAP_POWER_DISPLAY,
    DREAM_ENERGY_SOFTCAP_TWO_START,
    DREAM_ENERGY_SOFTCAP_TWO_EFFECT_SCALE,
    DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE,
    DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH,
    DREAM_ENERGY_SOFTCAP_THREE_START,
    DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_BASE,
    DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH,
} from "@/engine/math/dream-energy/balance";
import { convertDreamEnergySoftcapOneToPower, getDreamEnergyIncrement } from "@/engine/math/dream-energy/computed";
import {
    getDreamCrystalSoftcapOneStrengthMultiplier,
    getDreamCrystalSoftcapTwoStrengthMultiplier,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { getCoherenceSoftcapTwoStrengthMultiplier } from "@/engine/strata/common/coherence/upgrades";
import { getConceptCrystalAssimilationStrengthMultiplier } from "@/engine/strata/common/concept-crystals";
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
    return gte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_ONE_START);
}

export function isDreamEnergySoftcapTwoActive(stratum: StratumState) {
    return gte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_TWO_START);
}

export function isDreamEnergySoftcapThreeActive(stratum: StratumState) {
    return gte(getDreamEnergy(stratum), DREAM_ENERGY_SOFTCAP_THREE_START);
}

export function getDreamEnergySoftCapOneRatio(raw: Num) {
    const ratio = div(raw, DREAM_ENERGY_SOFTCAP_ONE_START);

    return ratio
}

export function getDreamEnergySoftcapTwoRatio(raw: Num) {
    return div(raw, DREAM_ENERGY_SOFTCAP_TWO_START);
}

export function getDreamEnergySoftcapThreeRatio(raw: Num) {
    return div(raw, DREAM_ENERGY_SOFTCAP_THREE_START);
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
    return pow(getDreamEnergySoftcapTwoEffectiveStrengthGrowth(stratum), getDreamEnergySoftcapTwoExcessExponent(stratum));
}

export function getDreamEnergySoftcapTwoStrengthBase() {
    return DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE;
}

export function getDreamEnergySoftcapTwoStrengthGrowth(stratum?: StratumState) {
    const baseStrength = getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum);
    if (!stratum) return baseStrength;
    return mul(baseStrength, getDreamEnergySoftcapThreeStrengthMultiplier(stratum));
}

export function getDreamEnergySoftcapTwoEffectiveStrengthGrowth(stratum: StratumState) {
    return mul(getDreamEnergySoftcapTwoStrengthGrowth(stratum), DREAM_ENERGY_SOFTCAP_TWO_EFFECT_SCALE);
}

export function getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum?: StratumState) {
    if (!stratum) return DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH;
    return mul(
        mul(
            DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH,
            getDreamCrystalSoftcapTwoStrengthMultiplier(stratum),
        ),
        getCoherenceSoftcapTwoStrengthMultiplier(stratum),
    );
}

export function getDreamEnergySoftcapThreeExcessExponent(stratum: StratumState) {
    if (!isDreamEnergySoftcapThreeActive(stratum)) return ZERO;
    return logn(getDreamEnergySoftcapThreeRatio(getDreamEnergy(stratum)), DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_BASE);
}

export function getDreamEnergySoftcapThreeStrengthBase() {
    return DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_BASE;
}

export function getDreamEnergySoftcapThreeStrengthGrowth(stratum?: StratumState) {
    if (!stratum) return DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH;
    return max(
        N(1.0001),
        mul(DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH, getConceptCrystalAssimilationStrengthMultiplier(stratum)),
    );
}

export function getDreamEnergySoftcapThreeStrengthMultiplier(stratum: StratumState) {
    if (!isDreamEnergySoftcapThreeActive(stratum)) return ONE;
    return pow(getDreamEnergySoftcapThreeStrengthGrowth(stratum), getDreamEnergySoftcapThreeExcessExponent(stratum));
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
