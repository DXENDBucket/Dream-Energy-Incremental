import type { Num } from "@/engine/math/num";
import { ONE, ZERO, add, div, gt, log10, lte, max, min, mul, normalizeNum, pow } from "@/engine/math/num";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals";
import type { StratumState } from "@/engine/strata/state";
import { ENTROPY_DEFAULT_TUNING_EXPONENT } from "./balance";
import { createEntropyState, getDefaultEntropyChaosExponent } from "./state";

export function ensureEntropyState(stratum: StratumState) {
  stratum.entropy ??= createEntropyState();
  stratum.entropy.value = normalizeNum(stratum.entropy.value, ZERO);
  stratum.entropy.isStarted ??= false;
  stratum.entropy.formulaId ??= "none";
  stratum.entropy.tuningExponent = normalizeNum(
    stratum.entropy.tuningExponent,
    ENTROPY_DEFAULT_TUNING_EXPONENT,
  );
  stratum.entropy.chaosExponent = normalizeNum(
    stratum.entropy.chaosExponent,
    getDefaultEntropyChaosExponent(stratum.entropy.formulaId),
  );
  stratum.entropy.growthRateMultiplier = normalizeNum(stratum.entropy.growthRateMultiplier, ONE);
  return stratum.entropy;
}

export function getEntropyValue(stratum: StratumState): Num {
  return ensureEntropyState(stratum).value;
}

export function getEntropyTuningExponent(stratum: StratumState): Num {
  return ensureEntropyState(stratum).tuningExponent;
}

export function getEntropyChaosExponent(stratum: StratumState): Num {
  return ensureEntropyState(stratum).chaosExponent;
}

export function getEntropyGrowthRateMultiplier(stratum: StratumState): Num {
  return ensureEntropyState(stratum).growthRateMultiplier;
}

export function computeEntropyGrowthRateMultiplierFromCoherence(coherencePoints: Num): Num {
  return div(ONE, add(log10(max(coherencePoints, ONE)), ONE));
}

export function hasAnyDreamCrystal(stratum: StratumState): boolean {
  for (let tier = 1; tier <= 8; tier++) {
    if (gt(getDreamCrystalAmount(stratum.dreamCrystals, tier), ZERO)) return true;
  }

  return false;
}

export function applyEntropyToProduction(stratum: StratumState, raw: Num): Num {
  if (lte(raw, ZERO)) return ZERO;

  const entropyState = ensureEntropyState(stratum);
  if (entropyState.formulaId === "none") return raw;

  const entropy = min(max(entropyState.value, ZERO), ONE);
  if (lte(entropy, ZERO)) return raw;
  if (entropy.gte(ONE)) return ZERO;

  const tuningExponent = entropyState.tuningExponent;
  const chaosExponent = entropyState.chaosExponent;
  const productionExponent = pow(
    max(ZERO, add(ONE, mul(pow(entropy, tuningExponent), -1))),
    chaosExponent,
  );

  return mul(pow(raw, productionExponent), max(ZERO, add(ONE, mul(entropy, -1))));
}
