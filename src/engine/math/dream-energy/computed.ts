import type { StratumState } from "@/engine/strata";
import { getDreamCrystalMultiplier } from "../dream-crystals";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals";
import { getDreamEnergy } from "@/engine/strata";
import { applyEntropyToProduction } from "@/engine/strata/common/entropy";
import { mul, div, ZERO, TEN, type Num, sub, ONE, add, log10, pow, lte } from "../num";
import { DREAM_ENERGY_SOFTCAP_ONE_DEFAULT_POWER, DREAM_ENERGY_SOFTCAP_POWER_DISPLAY } from "./balance";


const SOFTCAP_ONE_DEFAULT_POWER = DREAM_ENERGY_SOFTCAP_ONE_DEFAULT_POWER;
const SOFTCAP_ONE_LOG_DENOMINATOR = log10(add(DREAM_ENERGY_SOFTCAP_POWER_DISPLAY, ONE));

export function getDreamEnergyIncrement(
    stratum: StratumState,
) {
    return applyEntropyToProduction(stratum, getDreamEnergyBaseIncrement(stratum));
}

export function getDreamEnergyBaseIncrement(
    stratum: StratumState,
) {
    const multiplier = getDreamCrystalMultiplier(stratum, 1);
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, 1);
    return mul(multiplier, amount);
}

export function getDreamEnergyPercentageIncrement(
    stratum: StratumState,
) {
    const increment = getDreamEnergyIncrement(stratum);
    const amount = getDreamEnergy(stratum);

    if (amount.eq(ZERO)) return ZERO;
    return div(increment, amount);
}

export function convertDreamEnergySoftcapOneToRaw(power: Num) {
    if (lte(power, ZERO)) return ZERO;
    return sub(
        pow(
            TEN,
            div(mul(power, SOFTCAP_ONE_LOG_DENOMINATOR), SOFTCAP_ONE_DEFAULT_POWER),
        ),
        ONE,
    );
}

export function convertDreamEnergySoftcapOneToPower(raw: Num) {
    if (lte(raw, ZERO)) return ZERO;
    return mul(
        SOFTCAP_ONE_DEFAULT_POWER,
        div(log10(add(raw, ONE)), SOFTCAP_ONE_LOG_DENOMINATOR),
    );
}
