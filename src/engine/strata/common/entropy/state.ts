import type { Num } from "@/engine/math/num";
import { ONE, ZERO } from "@/engine/math/num";
import {
  ENTROPY_DEFAULT_CHAOS_EXPONENT,
  ENTROPY_DEFAULT_TUNING_EXPONENT,
} from "./balance";

export type EntropyFormulaId = "none" | "dream-sea-first";

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
    chaosExponent: ENTROPY_DEFAULT_CHAOS_EXPONENT,
    growthRateMultiplier: ONE,
  };
}
