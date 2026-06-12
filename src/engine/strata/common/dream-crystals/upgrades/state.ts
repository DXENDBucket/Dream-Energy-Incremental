import type { Num } from "@/engine/math/num";

export interface DreamCrystalUpgradesState {
  bought: Record<string, boolean>;
  repeatableBought: Record<string, Num>;
}

export function createDreamCrystalUpgradesState(): DreamCrystalUpgradesState {
  return {
    bought: {},
    repeatableBought: {},
  };
}
