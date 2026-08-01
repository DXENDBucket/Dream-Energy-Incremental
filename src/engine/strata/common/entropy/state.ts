import type { Num } from "@/engine/math/num";
import { ONE, ZERO } from "@/engine/math/num";
import {
  getStratumDefinitionByEntropyFormula,
  type EntropyFormulaId,
} from "@/engine/strata/defs";
import {
  ENTROPY_DEFAULT_CHAOS_EXPONENT,
  ENTROPY_DEFAULT_TUNING_EXPONENT,
} from "./balance";

export type { EntropyFormulaId } from "@/engine/strata/defs";

export interface EntropyState {
  value: Num;
  isStarted: boolean;
  formulaId: EntropyFormulaId;
  tuningExponent: Num;
  chaosExponent: Num;
  growthRateMultiplier: Num;
}

export function createEntropyState(formulaId: EntropyFormulaId = "none"): EntropyState {
  return {
    value: ZERO,
    isStarted: false,
    formulaId,
    tuningExponent: ENTROPY_DEFAULT_TUNING_EXPONENT,
    chaosExponent: getDefaultEntropyChaosExponent(formulaId),
    growthRateMultiplier: ONE,
  };
}

export function getDefaultEntropyChaosExponent(formulaId: EntropyFormulaId): Num {
  return getStratumDefinitionByEntropyFormula(formulaId)?.entropyChaosExponent
    ?? ENTROPY_DEFAULT_CHAOS_EXPONENT;
}
