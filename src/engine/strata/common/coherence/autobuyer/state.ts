import { N, ZERO } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";

export type CoherenceAutobuyerMode = "interval" | "amount" | "ratio";

export interface CoherenceAutobuyerState {
  enabled: boolean;
  mode: CoherenceAutobuyerMode;
  elapsedSec: Num;
  intervalSec: Num;
  minimumGain: Num;
  dynamicAmount: boolean;
  dynamicAmountLastMultiplier: Num;
  gainRatio: Num;
}

export function createCoherenceAutobuyerState(): CoherenceAutobuyerState {
  return {
    enabled: false,
    mode: "interval",
    elapsedSec: ZERO,
    intervalSec: N(10),
    minimumGain: N(1),
    dynamicAmount: false,
    dynamicAmountLastMultiplier: N(1),
    gainRatio: N(2),
  };
}
