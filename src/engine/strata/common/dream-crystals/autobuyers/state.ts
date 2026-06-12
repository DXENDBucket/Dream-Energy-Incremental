import { ZERO } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";

export interface DreamCrystalAutobuyersState {
  enabled: Record<number, boolean>;
  elapsedSec: Num;
  refineEnabled: Record<number, boolean>;
  refineElapsedSec: Num;
}

export function createDreamCrystalAutobuyersState(): DreamCrystalAutobuyersState {
  return {
    enabled: {},
    elapsedSec: ZERO,
    refineEnabled: {},
    refineElapsedSec: ZERO,
  };
}
