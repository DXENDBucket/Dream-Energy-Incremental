import { ZERO } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";

export interface DreamCrystalAutobuyersState {
  enabled: Record<number, boolean>;
  elapsedSec: Num;
}

export function createDreamCrystalAutobuyersState(): DreamCrystalAutobuyersState {
  return {
    enabled: {},
    elapsedSec: ZERO,
  };
}
