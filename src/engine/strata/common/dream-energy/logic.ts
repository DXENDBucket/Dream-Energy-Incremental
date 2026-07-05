import type { StratumState } from "../../state";
import { ONE, ZERO, add, div, gte, logn, lt, lte, max, mul, pow, sub, type Num } from "@/engine/math/num";
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
    return getActualDreamEnergyGainForRawGain(stratum, getRawDreamEnergyGain(stratum));
}

export function getDreamEnergyGainPerSecond(stratum: StratumState) {
    return getActualDreamEnergyGainForRawGain(
        stratum,
        mul(getRawDreamEnergyGain(stratum), stratum.stratumSpeed),
    );
}

export function applyDreamEnergySoftcapOne(raw: Num, divisor: Num) {
    return div(raw, divisor);
}

export function getDreamEnergySoftcapOneDivisor(stratum: StratumState) {
    if (!isDreamEnergySoftcapOneActive(stratum)) return ONE;
    const actual = getDreamEnergy(stratum);
    if (lte(actual, ZERO)) return ONE;
    return max(ONE, div(getRawDreamEnergy(stratum), actual));
}

export function getRawDreamEnergyGain(stratum: StratumState) {
    let gain = ZERO;
    gain = add(gain, getDreamEnergyIncrement(stratum));

    return gain;
}

export function getRawDreamEnergyGainPerSecond(stratum: StratumState) {
    return mul(getRawDreamEnergyGain(stratum), stratum.stratumSpeed);
}

export function getRawDreamEnergy(stratum: StratumState): Num {
    return stratum.rawDreamEnergy ?? stratum.dreamEnergy;
}

function invertDreamEnergyAmountSoftcap(value: Num, start: Num, power: Num): Num {
    if (lte(value, start) || lte(power, ZERO)) return value;

    const ratio = div(value, start);
    return mul(
        start,
        add(
            ONE,
            div(sub(pow(ratio, add(power, ONE)), ONE), add(power, ONE)),
        ),
    );
}

function applySoftcapStrengthMultiplier(strength: Num, multiplier: Num): Num {
    return add(ONE, mul(max(ZERO, sub(strength, ONE)), max(ZERO, multiplier)));
}

export function getActualDreamEnergyFromRaw(stratum: StratumState, raw: Num): Num {
    const targetRaw = max(raw, ZERO);
    if (lte(targetRaw, DREAM_ENERGY_SOFTCAP_ONE_START)) return targetRaw;

    let low = ZERO;
    let high = targetRaw;

    for (let step = 0; step < 96 && lt(getRawDreamEnergyFromActual(stratum, high), targetRaw); step++) {
        low = high;
        high = mul(high, 10);
    }

    for (let step = 0; step < 96; step++) {
        const mid = div(add(low, high), 2);
        if (lt(getRawDreamEnergyFromActual(stratum, mid), targetRaw)) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return high;
}

export function getRawDreamEnergyFromActual(stratum: StratumState, actual: Num): Num {
    const targetActual = max(actual, ZERO);
    let raw = targetActual;

    raw = invertDreamEnergyAmountSoftcap(
        raw,
        DREAM_ENERGY_SOFTCAP_TWO_START,
        getDreamEnergySoftcapTwoExtraPowerAt(stratum, targetActual),
    );

    raw = invertDreamEnergyAmountSoftcap(
        raw,
        DREAM_ENERGY_SOFTCAP_ONE_START,
        getDreamEnergySoftCapOneBasePower(stratum),
    );

    return raw;
}

export function syncDreamEnergyActualFromRaw(stratum: StratumState): void {
    stratum.rawDreamEnergy = getRawDreamEnergy(stratum);
    stratum.dreamEnergy = getActualDreamEnergyFromRaw(stratum, stratum.rawDreamEnergy);
}

export function setDreamEnergy(stratum: StratumState, actual: Num): void {
    stratum.dreamEnergy = max(actual, ZERO);
    stratum.rawDreamEnergy = getRawDreamEnergyFromActual(stratum, stratum.dreamEnergy);
}

export function addDreamEnergy(stratum: StratumState, actualAmount: Num): void {
    setDreamEnergy(stratum, add(getDreamEnergy(stratum), actualAmount));
}

export function addRawDreamEnergy(stratum: StratumState, rawAmount: Num): void {
    if (lte(rawAmount, ZERO)) return;
    stratum.rawDreamEnergy = add(getRawDreamEnergy(stratum), rawAmount);
    stratum.dreamEnergy = getActualDreamEnergyFromRaw(stratum, stratum.rawDreamEnergy);
}

export function spendDreamEnergy(stratum: StratumState, cost: Num): void {
    if (lte(cost, ZERO)) return;
    setDreamEnergy(stratum, max(ZERO, sub(getDreamEnergy(stratum), cost)));
}

export function getActualDreamEnergyGainForRawGain(stratum: StratumState, rawGain: Num): Num {
    if (lte(rawGain, ZERO)) return ZERO;

    return max(
        ZERO,
        sub(
            getActualDreamEnergyFromRaw(stratum, add(getRawDreamEnergy(stratum), rawGain)),
            getDreamEnergy(stratum),
        ),
    );
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

export function getDreamEnergySoftCapOneRatio(dreamEnergy: Num) {
    const ratio = div(dreamEnergy, DREAM_ENERGY_SOFTCAP_ONE_START);

    return ratio
}

export function getDreamEnergySoftcapTwoRatio(dreamEnergy: Num) {
    return div(dreamEnergy, DREAM_ENERGY_SOFTCAP_TWO_START);
}

export function getDreamEnergySoftcapThreeRatio(dreamEnergy: Num) {
    return div(dreamEnergy, DREAM_ENERGY_SOFTCAP_THREE_START);
}

export function getDreamEnergySoftcapOneBaseStrengthDisplay(stratum?: StratumState) {
    const baseStrength = DREAM_ENERGY_SOFTCAP_POWER_DISPLAY;
    if (!stratum) return baseStrength;
    return applySoftcapStrengthMultiplier(baseStrength, getDreamCrystalSoftcapOneStrengthMultiplier(stratum));
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
    return getDreamEnergySoftcapTwoExcessExponentAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapTwoExcessExponentAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_TWO_START)) return ZERO;
    return logn(getDreamEnergySoftcapTwoRatio(dreamEnergy), DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE);
}

export function getDreamEnergySoftcapTwoStrengthMultiplier(stratum: StratumState) {
    return getDreamEnergySoftcapTwoStrengthMultiplierAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapTwoStrengthMultiplierAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_TWO_START)) return ONE;
    return pow(
        getDreamEnergySoftcapTwoEffectiveStrengthGrowthAt(stratum, dreamEnergy),
        getDreamEnergySoftcapTwoExcessExponentAt(stratum, dreamEnergy),
    );
}

export function getDreamEnergySoftcapTwoStrengthBase() {
    return DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_BASE;
}

export function getDreamEnergySoftcapTwoStrengthGrowth(stratum?: StratumState) {
    if (!stratum) return getDreamEnergySoftcapTwoBaseStrengthGrowth();
    return getDreamEnergySoftcapTwoStrengthGrowthAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapTwoStrengthGrowthAt(stratum: StratumState, dreamEnergy: Num) {
    return mul(
        getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum),
        getDreamEnergySoftcapThreeStrengthMultiplierAt(stratum, dreamEnergy),
    );
}

export function getDreamEnergySoftcapTwoEffectiveStrengthGrowth(stratum: StratumState) {
    return getDreamEnergySoftcapTwoEffectiveStrengthGrowthAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapTwoEffectiveStrengthGrowthAt(stratum: StratumState, dreamEnergy: Num) {
    return applySoftcapStrengthMultiplier(
        getDreamEnergySoftcapTwoStrengthGrowthAt(stratum, dreamEnergy),
        DREAM_ENERGY_SOFTCAP_TWO_EFFECT_SCALE,
    );
}

export function getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum?: StratumState) {
    const baseGrowth = DREAM_ENERGY_SOFTCAP_TWO_STRENGTH_GROWTH;
    if (!stratum) return baseGrowth;
    return applySoftcapStrengthMultiplier(
        baseGrowth,
        mul(
            getDreamCrystalSoftcapTwoStrengthMultiplier(stratum),
            getCoherenceSoftcapTwoStrengthMultiplier(stratum),
        ),
    );
}

export function getDreamEnergySoftcapThreeExcessExponent(stratum: StratumState) {
    return getDreamEnergySoftcapThreeExcessExponentAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapThreeExcessExponentAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_THREE_START)) return ZERO;
    return logn(getDreamEnergySoftcapThreeRatio(dreamEnergy), DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_BASE);
}

export function getDreamEnergySoftcapThreeStrengthBase() {
    return DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_BASE;
}

export function getDreamEnergySoftcapThreeStrengthGrowth(stratum?: StratumState) {
    if (!stratum) return DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH;
    return applySoftcapStrengthMultiplier(
        DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH,
        getConceptCrystalAssimilationStrengthMultiplier(stratum),
    );
}

export function getDreamEnergySoftcapThreeStrengthMultiplier(stratum: StratumState) {
    return getDreamEnergySoftcapThreeStrengthMultiplierAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapThreeStrengthMultiplierAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_THREE_START)) return ONE;
    return pow(
        getDreamEnergySoftcapThreeStrengthGrowth(stratum),
        getDreamEnergySoftcapThreeExcessExponentAt(stratum, dreamEnergy),
    );
}

export function getDreamEnergySoftcapTwoExtraPower(stratum: StratumState) {
    return getDreamEnergySoftcapTwoExtraPowerAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapTwoExtraPowerAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_TWO_START)) return ZERO;
    return sub(getDreamEnergySoftCapOnePowerAt(stratum, dreamEnergy), getDreamEnergySoftCapOneBasePower(stratum));
}

export function getDreamEnergySoftcapOnePowerDisplay(stratum?: StratumState) {
    if (!stratum) return getDreamEnergySoftcapOneBaseStrengthDisplay();
    return getDreamEnergySoftcapOnePowerDisplayAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapOnePowerDisplayAt(stratum: StratumState, dreamEnergy: Num) {
    const baseStrength = getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    return mul(baseStrength, getDreamEnergySoftcapTwoStrengthMultiplierAt(stratum, dreamEnergy));
}

export function getDreamEnergySoftCapOnePowerAt(stratum: StratumState, dreamEnergy: Num) {
    return convertDreamEnergySoftcapOneToPower(getDreamEnergySoftcapOnePowerDisplayAt(stratum, dreamEnergy));
}
