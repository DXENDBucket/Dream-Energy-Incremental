import type { Num } from "@/engine/math/num";

export interface CoherenceUpgradesState {
  bought: Record<string, boolean>;
  repeatableBought: Record<string, Num>;
}

export function createCoherenceUpgradesState(): CoherenceUpgradesState {
  return {
    bought: {},
    repeatableBought: {},
  };
}
