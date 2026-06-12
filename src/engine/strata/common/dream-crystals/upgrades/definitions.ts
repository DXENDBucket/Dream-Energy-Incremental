import { N } from "@/engine/math/num";

export const DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID = "first-tier-triple";
export const DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID = "free-purchases";
export const DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID = "placeholder";
export const DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID = DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID;
export const DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID = "bought-power";
export const DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID = "refinery-efficiency";

export const DREAM_CRYSTAL_UPGRADE_ROW_ONE = [
  DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
  DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID,
  DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID,
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
] as const;

export type DreamCrystalUpgradeId = (typeof DREAM_CRYSTAL_UPGRADE_ROW_ONE)[number];

export type DreamCrystalUpgradeKind = "single" | "repeatable";

export interface DreamCrystalUpgradeDefinition {
  id: DreamCrystalUpgradeId;
  kind: DreamCrystalUpgradeKind;
  baseCost: ReturnType<typeof N>;
  costScale?: ReturnType<typeof N>;
}

export const DREAM_CRYSTAL_UPGRADE_DEFINITIONS = {
  [DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
    kind: "single",
    baseCost: N(1),
  },
  [DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID,
    kind: "single",
    baseCost: N(20),
  },
  [DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID,
    kind: "single",
    baseCost: N(100),
  },
  [DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
    kind: "repeatable",
    baseCost: N(3),
    costScale: N(10),
  },
  [DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
    kind: "repeatable",
    baseCost: N(5),
    costScale: N(5),
  },
} as const satisfies Record<DreamCrystalUpgradeId, DreamCrystalUpgradeDefinition>;

export function getDreamCrystalUpgradeDefinition(id: DreamCrystalUpgradeId) {
  return DREAM_CRYSTAL_UPGRADE_DEFINITIONS[id];
}
