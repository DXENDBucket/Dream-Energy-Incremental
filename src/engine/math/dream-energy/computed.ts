import type { StratumState } from "@/engine/strata";
import { getDreamCrystalMultiplier } from "../dream-crystals";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals";
import { getDreamEnergy } from "@/engine/strata";
import { format } from "../format";
import { mul, div, ZERO, TEN, N, type Num, sub, ONE, add } from "../num";
import { DREAM_ENERGY_SOFTCAP_ONE_DEFAULT_SCALE, DREAM_ENERGY_SOFTCAP_POWER_DISPLAY } from "./balance";


const SCALE = DREAM_ENERGY_SOFTCAP_ONE_DEFAULT_SCALE;

export function getDreamEnergyIncrement(
    stratum: StratumState,
) {
    const multiplier = getDreamCrystalMultiplier(stratum, 1);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, 1);
    return mul(multiplier, amount)
}

export function getDreamEnergyPercentageIncrement(
    stratum: StratumState,
) {
    const increment = getDreamEnergyIncrement(stratum);
    const amount = getDreamEnergy(stratum);

    if (amount.eq(ZERO)) return ZERO;
    return div(increment, amount);
}

export function getDreamEnergyPercentageText(
    stratum: StratumState,
) {
    const percentage = mul(getDreamEnergyPercentageIncrement(stratum), 100);
    return `+${format(percentage)}%/s`;
}

export function convertDreamEnergySoftcapOneToRaw(power: Num) {
    return mul(SCALE, div(power, sub(ONE, power)));
}

export function convertDreamEnergySoftcapOneToPower(raw: Num) {
    return div(raw, add(raw, SCALE));
}