import type { StratumState } from "../../state";
import { N, ONE, TEN, ZERO, add, div, gt, gte, log10, logn, lte, max, min, mul, pow, sqrt, sub, type Num } from "@/engine/math/num";
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
    DREAM_ENERGY_CONCEPT_CONFLICT_START,
    DREAM_ENERGY_CONCEPT_CONFLICT_STRENGTH_BASE,
    DREAM_ENERGY_SHIELDING_CHAOS_STRENGTH_SCALE,
    DREAM_ENERGY_SHIELDING_ROOT_CURVE_CALIBRATION,
    DREAM_ENERGY_SHIELDING_ROOT_GROWTH_DIVISOR,
    DREAM_ENERGY_SHIELDING_TUNING_REDUCTION_SCALE,
} from "@/engine/math/dream-energy/balance";
import {
    convertDreamEnergySoftcapOneToPower,
    convertDreamEnergySoftcapOneToRaw,
    getDreamEnergyIncrement,
} from "@/engine/math/dream-energy/computed";
import {
    getDreamCrystalSoftcapOneStrengthMultiplier,
    getDreamCrystalSoftcapTwoStrengthMultiplier,
} from "@/engine/strata/common/dream-crystals/upgrades";
import {
    getCoherenceSoftcapTwoStrengthMultiplier,
} from "@/engine/strata/common/coherence/upgrades";
import { getConceptCrystalAssimilationStrengthMultiplier } from "@/engine/strata/common/concept-crystals";
import {
    ENTROPY_DEFAULT_TUNING_EXPONENT,
    getEntropyChaosExponent,
    getEntropyTuningExponent,
} from "@/engine/strata/common/entropy";
import { realityStratumId } from "@/engine/strata/defs";
import { getDreamEnergy } from "../../manager/selectors";

const NATURAL_LOG_TEN = N(Math.LN10);

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

export function updateBestDreamEnergy(stratum: StratumState): void {
    stratum.bestDreamEnergy = max(
        stratum.bestDreamEnergy ?? ZERO,
        getDreamEnergy(stratum),
    );
}

function applySoftcapStrengthMultiplier(strength: Num, multiplier: Num): Num {
    return add(ONE, mul(max(ZERO, sub(strength, ONE)), max(ZERO, multiplier)));
}

function getDreamEnergySoftcapOneStartLog(): Num {
    return log10(DREAM_ENERGY_SOFTCAP_ONE_START);
}

function getDreamEnergySoftcapTwoStartLog(): Num {
    return log10(DREAM_ENERGY_SOFTCAP_TWO_START);
}

function getDreamEnergySoftcapThreeStartLog(): Num {
    return log10(DREAM_ENERGY_SOFTCAP_THREE_START);
}

function getPositiveLogExcess(valueLog: Num, startLog: Num): Num {
    return max(ZERO, sub(valueLog, startLog));
}

function getDreamEnergySoftcapTwoEffectiveBaseStrengthGrowth(stratum: StratumState): Num {
    return applySoftcapStrengthMultiplier(
        getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum),
        DREAM_ENERGY_SOFTCAP_TWO_EFFECT_SCALE,
    );
}

function getDreamEnergySoftcapTwoPowerSlope(stratum: StratumState): Num {
    const baseStrength = getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    const basePower = convertDreamEnergySoftcapOneToPower(baseStrength);
    const nextPower = convertDreamEnergySoftcapOneToPower(
        mul(baseStrength, getDreamEnergySoftcapTwoEffectiveBaseStrengthGrowth(stratum)),
    );

    return max(ZERO, sub(nextPower, basePower));
}

function getDreamEnergySoftcapThreePowerSlope(stratum: StratumState): Num {
    const baseStrength = getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    const basePower = convertDreamEnergySoftcapOneToPower(baseStrength);
    const nextPower = convertDreamEnergySoftcapOneToPower(
        mul(baseStrength, getDreamEnergySoftcapThreeStrengthGrowth(stratum)),
    );

    return max(ZERO, sub(nextPower, basePower));
}

function getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum: StratumState): Num {
    const secondToThirdSpan = max(
        ONE,
        sub(getDreamEnergySoftcapThreeStartLog(), getDreamEnergySoftcapTwoStartLog()),
    );

    return div(getDreamEnergySoftcapThreePowerSlope(stratum), secondToThirdSpan);
}

function getDreamEnergySoftcapPowerAtLog(stratum: StratumState, actualLog: Num): Num {
    const softcapTwoExcess = getPositiveLogExcess(actualLog, getDreamEnergySoftcapTwoStartLog());
    const softcapThreeExcess = getPositiveLogExcess(actualLog, getDreamEnergySoftcapThreeStartLog());

    return add(
        add(
            getDreamEnergySoftCapOneBasePower(stratum),
            mul(
                mul(getDreamEnergySoftcapTwoPowerSlope(stratum), 2),
                softcapTwoExcess,
            ),
        ),
        lte(softcapThreeExcess, ZERO)
            ? ZERO
            : mul(
                getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum),
                add(softcapTwoExcess, softcapThreeExcess),
            ),
    );
}

function getRawDreamEnergyLogFromActualLog(stratum: StratumState, actualLog: Num): Num {
    const softcapOneStartLog = getDreamEnergySoftcapOneStartLog();
    if (lte(actualLog, softcapOneStartLog)) return actualLog;

    const softcapTwoExcess = getPositiveLogExcess(actualLog, getDreamEnergySoftcapTwoStartLog());
    const softcapThreeExcess = getPositiveLogExcess(actualLog, getDreamEnergySoftcapThreeStartLog());

    return add(
        add(
            add(
                actualLog,
                mul(getDreamEnergySoftCapOneBasePower(stratum), sub(actualLog, softcapOneStartLog)),
            ),
            mul(getDreamEnergySoftcapTwoPowerSlope(stratum), pow(softcapTwoExcess, 2)),
        ),
        mul(
            getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum),
            mul(softcapTwoExcess, softcapThreeExcess),
        ),
    );
}

function solveDreamEnergyActualLogFromRawLog(
    stratum: StratumState,
    rawLog: Num,
    softcapTwoSlope: Num,
    softcapThreeCrossSlope: Num,
): Num {
    const softcapOneStartLog = getDreamEnergySoftcapOneStartLog();
    const softcapTwoStartLog = getDreamEnergySoftcapTwoStartLog();
    const softcapThreeStartLog = getDreamEnergySoftcapThreeStartLog();
    const basePower = getDreamEnergySoftCapOneBasePower(stratum);
    const quadratic = add(softcapTwoSlope, softcapThreeCrossSlope);
    const linear = sub(
        add(ONE, basePower),
        add(
            mul(mul(softcapTwoSlope, 2), softcapTwoStartLog),
            mul(softcapThreeCrossSlope, add(softcapTwoStartLog, softcapThreeStartLog)),
        ),
    );
    const constant = sub(
        add(
            sub(mul(softcapTwoSlope, pow(softcapTwoStartLog, 2)), mul(basePower, softcapOneStartLog)),
            mul(softcapThreeCrossSlope, mul(softcapTwoStartLog, softcapThreeStartLog)),
        ),
        rawLog,
    );

    if (lte(quadratic, ZERO)) {
        return div(sub(ZERO, constant), linear);
    }

    const discriminant = max(
        ZERO,
        sub(pow(linear, 2), mul(mul(quadratic, 4), constant)),
    );

    return div(add(sub(ZERO, linear), sqrt(discriminant)), mul(quadratic, 2));
}

function getActualDreamEnergyAfterStandardSoftcaps(stratum: StratumState, raw: Num): Num {
    const targetRaw = max(raw, ZERO);
    if (lte(targetRaw, DREAM_ENERGY_SOFTCAP_ONE_START)) return targetRaw;

    const rawLog = log10(targetRaw);
    const softcapTwoStartRawLog = getRawDreamEnergyLogFromActualLog(
        stratum,
        getDreamEnergySoftcapTwoStartLog(),
    );
    const softcapThreeStartRawLog = getRawDreamEnergyLogFromActualLog(
        stratum,
        getDreamEnergySoftcapThreeStartLog(),
    );
    const softcapTwoSlope = getDreamEnergySoftcapTwoPowerSlope(stratum);
    const softcapThreeCrossSlope = getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum);

    if (lte(rawLog, softcapTwoStartRawLog)) {
        return pow(
            TEN,
            solveDreamEnergyActualLogFromRawLog(stratum, rawLog, ZERO, ZERO),
        );
    }

    if (lte(rawLog, softcapThreeStartRawLog)) {
        return pow(
            TEN,
            solveDreamEnergyActualLogFromRawLog(stratum, rawLog, softcapTwoSlope, ZERO),
        );
    }

    return pow(
        TEN,
        solveDreamEnergyActualLogFromRawLog(stratum, rawLog, softcapTwoSlope, softcapThreeCrossSlope),
    );
}

function getRawDreamEnergyFromStandardSoftcapped(
    stratum: StratumState,
    standardSoftcapped: Num,
): Num {
    const targetActual = max(standardSoftcapped, ZERO);
    if (lte(targetActual, DREAM_ENERGY_SOFTCAP_ONE_START)) return targetActual;

    return pow(TEN, getRawDreamEnergyLogFromActualLog(stratum, log10(targetActual)));
}

export function applyDreamEnergyConceptConflict(standardSoftcapped: Num): Num {
    if (lte(standardSoftcapped, DREAM_ENERGY_CONCEPT_CONFLICT_START)) {
        return standardSoftcapped;
    }

    const inputProgress = log10(div(
        standardSoftcapped,
        DREAM_ENERGY_CONCEPT_CONFLICT_START,
    ));
    const compressedRatio = add(ONE, mul(NATURAL_LOG_TEN, inputProgress));
    return mul(DREAM_ENERGY_CONCEPT_CONFLICT_START, compressedRatio);
}

export function removeDreamEnergyConceptConflict(conflicted: Num): Num {
    if (lte(conflicted, DREAM_ENERGY_CONCEPT_CONFLICT_START)) return conflicted;

    const outputRatio = div(conflicted, DREAM_ENERGY_CONCEPT_CONFLICT_START);
    const inputProgress = div(sub(outputRatio, ONE), NATURAL_LOG_TEN);
    return mul(
        DREAM_ENERGY_CONCEPT_CONFLICT_START,
        pow(TEN, inputProgress),
    );
}

export function getDreamEnergyShieldingStrength(stratum: StratumState): Num {
    const baseStrength = mul(
        max(ONE, getEntropyChaosExponent(stratum)),
        DREAM_ENERGY_SHIELDING_CHAOS_STRENGTH_SCALE,
    );
    const tuningRatio = max(
        ONE,
        div(getEntropyTuningExponent(stratum), ENTROPY_DEFAULT_TUNING_EXPONENT),
    );
    const tuningReduction = add(
        ONE,
        mul(log10(tuningRatio), DREAM_ENERGY_SHIELDING_TUNING_REDUCTION_SCALE),
    );
    return div(baseStrength, tuningReduction);
}

function getDreamEnergyShieldingRootGrowthPerDecade(stratum: StratumState): Num {
    return div(
        getDreamEnergyShieldingStrength(stratum),
        DREAM_ENERGY_SHIELDING_ROOT_GROWTH_DIVISOR,
    );
}

export function getDreamEnergyShieldingRootDegree(
    stratum: StratumState,
    standardSoftcapped: Num,
): Num {
    const progress = max(
        ZERO,
        log10(add(max(standardSoftcapped, ZERO), ONE)),
    );
    const curveScale = mul(
        getDreamEnergyShieldingRootGrowthPerDecade(stratum),
        DREAM_ENERGY_SHIELDING_ROOT_CURVE_CALIBRATION,
    );
    const curvedProgress = sub(sqrt(add(ONE, progress)), ONE);
    return add(ONE, mul(curveScale, curvedProgress));
}

export function isDreamEnergyShieldingEnabled(stratum: StratumState): boolean {
    return stratum.stratumId !== realityStratumId;
}

export function applyDreamEnergyShielding(stratum: StratumState, standardSoftcapped: Num): Num {
    if (!isDreamEnergyShieldingEnabled(stratum)) return standardSoftcapped;
    if (lte(standardSoftcapped, ZERO)) return ZERO;

    const rootDegree = getDreamEnergyShieldingRootDegree(stratum, standardSoftcapped);
    const inputProgress = log10(add(standardSoftcapped, ONE));
    return sub(
        pow(TEN, div(inputProgress, rootDegree)),
        ONE,
    );
}

export function removeDreamEnergyShielding(stratum: StratumState, shielded: Num): Num {
    if (!isDreamEnergyShieldingEnabled(stratum)) return shielded;
    if (lte(shielded, ZERO)) return ZERO;

    const outputProgress = max(
        ZERO,
        log10(add(shielded, ONE)),
    );
    const curveScale = mul(
        getDreamEnergyShieldingRootGrowthPerDecade(stratum),
        DREAM_ENERGY_SHIELDING_ROOT_CURVE_CALIBRATION,
    );
    const scaledOutput = mul(curveScale, outputProgress);
    const discriminantRoot = sqrt(add(
        pow(sub(scaledOutput, 2), 2),
        mul(outputProgress, 4),
    ));
    const inputProgressRoot = div(add(scaledOutput, discriminantRoot), 2);
    const inputProgress = max(ZERO, sub(pow(inputProgressRoot, 2), ONE));

    return sub(pow(TEN, inputProgress), ONE);
}

export function getActualDreamEnergyFromRaw(stratum: StratumState, raw: Num): Num {
    return applyDreamEnergyShielding(
        stratum,
        applyDreamEnergyConceptConflict(
            getActualDreamEnergyAfterStandardSoftcaps(stratum, raw),
        ),
    );
}

export function getRawDreamEnergyFromActual(stratum: StratumState, actual: Num): Num {
    return getRawDreamEnergyFromStandardSoftcapped(
        stratum,
        removeDreamEnergyConceptConflict(
            removeDreamEnergyShielding(stratum, max(actual, ZERO)),
        ),
    );
}

export function getDreamEnergyAfterConceptConflict(stratum: StratumState): Num {
    return removeDreamEnergyShielding(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergyBeforeConceptConflict(stratum: StratumState): Num {
    return removeDreamEnergyConceptConflict(getDreamEnergyAfterConceptConflict(stratum));
}

export function isDreamEnergyConceptConflictActive(stratum: StratumState): boolean {
    return gte(
        getDreamEnergyAfterConceptConflict(stratum),
        DREAM_ENERGY_CONCEPT_CONFLICT_START,
    );
}

export function getDreamEnergyConceptConflictExcessExponent(stratum: StratumState): Num {
    const afterConflict = getDreamEnergyAfterConceptConflict(stratum);
    if (lte(afterConflict, DREAM_ENERGY_CONCEPT_CONFLICT_START)) return ZERO;
    return logn(
        div(afterConflict, DREAM_ENERGY_CONCEPT_CONFLICT_START),
        DREAM_ENERGY_CONCEPT_CONFLICT_STRENGTH_BASE,
    );
}

export function getDreamEnergyConceptConflictStrengthMultiplier(stratum: StratumState): Num {
    return max(
        ONE,
        div(
            getDreamEnergyAfterConceptConflict(stratum),
            DREAM_ENERGY_CONCEPT_CONFLICT_START,
        ),
    );
}

export function isDreamEnergyShieldingActive(stratum: StratumState): boolean {
    return isDreamEnergyShieldingEnabled(stratum);
}

export function getDreamEnergyBeforeShielding(stratum: StratumState): Num {
    return removeDreamEnergyShielding(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergyShieldingDivisor(stratum: StratumState): Num {
    const actual = getDreamEnergy(stratum);
    if (lte(actual, ZERO)) return ONE;
    return max(ONE, div(getDreamEnergyBeforeShielding(stratum), actual));
}

export function syncDreamEnergyActualFromRaw(stratum: StratumState): void {
    stratum.rawDreamEnergy = getRawDreamEnergy(stratum);
    stratum.dreamEnergy = getActualDreamEnergyFromRaw(stratum, stratum.rawDreamEnergy);
    updateBestDreamEnergy(stratum);
}

export function setDreamEnergy(stratum: StratumState, actual: Num): void {
    stratum.dreamEnergy = max(actual, ZERO);
    stratum.rawDreamEnergy = getRawDreamEnergyFromActual(stratum, stratum.dreamEnergy);
    updateBestDreamEnergy(stratum);
}

export function addDreamEnergy(stratum: StratumState, actualAmount: Num): void {
    setDreamEnergy(stratum, add(getDreamEnergy(stratum), actualAmount));
}

export function addRawDreamEnergy(stratum: StratumState, rawAmount: Num): void {
    if (lte(rawAmount, ZERO)) return;
    stratum.rawDreamEnergy = add(getRawDreamEnergy(stratum), rawAmount);
    stratum.dreamEnergy = getActualDreamEnergyFromRaw(stratum, stratum.rawDreamEnergy);
    updateBestDreamEnergy(stratum);
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
    return div(
        getDreamEnergySoftcapOnePowerDisplayAt(stratum, dreamEnergy),
        getDreamEnergySoftcapOneBaseStrengthDisplay(stratum),
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
    const baseGrowth = getDreamEnergySoftcapTwoBaseStrengthGrowth(stratum);
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_THREE_START)) return baseGrowth;

    const baseStrength = getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    const basePower = convertDreamEnergySoftcapOneToPower(baseStrength);
    const baseEffectiveGrowth = getDreamEnergySoftcapTwoEffectiveBaseStrengthGrowth(stratum);
    const baseSlope = max(
        ZERO,
        sub(
            convertDreamEnergySoftcapOneToPower(mul(baseStrength, baseEffectiveGrowth)),
            basePower,
        ),
    );
    const extraSlopeFromAssimilation = mul(
        getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum),
        getPositiveLogExcess(log10(dreamEnergy), getDreamEnergySoftcapThreeStartLog()),
    );
    const localEffectiveGrowth = div(
        convertDreamEnergySoftcapOneToRaw(add(basePower, add(baseSlope, extraSlopeFromAssimilation))),
        baseStrength,
    );

    return add(
        ONE,
        div(
            max(ZERO, sub(localEffectiveGrowth, ONE)),
            DREAM_ENERGY_SOFTCAP_TWO_EFFECT_SCALE,
        ),
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
    return max(
        ONE,
        applySoftcapStrengthMultiplier(
            DREAM_ENERGY_SOFTCAP_THREE_STRENGTH_GROWTH,
            getConceptCrystalAssimilationStrengthMultiplier(stratum),
        ),
    );
}

export function getDreamEnergySoftcapThreeStrengthMultiplier(stratum: StratumState) {
    return getDreamEnergySoftcapThreeStrengthMultiplierAt(stratum, getDreamEnergy(stratum));
}

export function getDreamEnergySoftcapThreeStrengthMultiplierAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_THREE_START)) return ONE;
    const dreamEnergyLog = log10(dreamEnergy);

    return add(
        ONE,
        mul(
            getDreamEnergySoftcapThreeSecondCompressionCrossSlope(stratum),
            mul(
                getPositiveLogExcess(dreamEnergyLog, getDreamEnergySoftcapTwoStartLog()),
                getPositiveLogExcess(dreamEnergyLog, getDreamEnergySoftcapThreeStartLog()),
            ),
        ),
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
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_ONE_START)) {
        return getDreamEnergySoftcapOneBaseStrengthDisplay(stratum);
    }

    return convertDreamEnergySoftcapOneToRaw(
        getDreamEnergySoftCapOnePowerAt(stratum, dreamEnergy),
    );
}

export function getDreamEnergySoftCapOnePowerAt(stratum: StratumState, dreamEnergy: Num) {
    if (!gte(dreamEnergy, DREAM_ENERGY_SOFTCAP_ONE_START)) {
        return getDreamEnergySoftCapOneBasePower(stratum);
    }

    return getDreamEnergySoftcapPowerAtLog(stratum, log10(dreamEnergy));
}
