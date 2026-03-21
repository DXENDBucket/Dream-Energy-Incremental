import type { Num } from "@/engine/math/num";
import { N } from "@/engine/math/num";

export interface DreamCrystalTierState {
  amount: Num;   // 当前拥有数量，会包含高阶生成出来的数量
  bought: Num;   // 通过购买获得的次数，不包含生成
  refinement: Num;
}

export interface DreamCrystalsState {
  tiers: Record<number, DreamCrystalTierState>;
}

export function createDreamCrystalsState(): DreamCrystalsState {
  const tiers: Record<number, DreamCrystalTierState> = {};

  for (let tier = 1; tier <= 8; tier++) {
    tiers[tier] = {
      amount: N(0),
      bought: N(0),
      refinement: N(0),
    };
  }

  return { tiers };
}