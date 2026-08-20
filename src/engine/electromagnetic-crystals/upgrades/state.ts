import { type Num } from "@/engine/math/num";

export interface ElectromagneticUpgradesState {
  bought: Record<string, boolean>;
  repeatableBought: Record<string, Num>;
}

export function createElectromagneticUpgradesState(): ElectromagneticUpgradesState {
  return {
    bought: {},
    repeatableBought: {},
  };
}
