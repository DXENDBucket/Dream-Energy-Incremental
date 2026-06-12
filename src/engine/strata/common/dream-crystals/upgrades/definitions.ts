import { N } from "@/engine/math/num";

export const DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID = "first-tier-triple";
export const DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID = "free-purchases";
export const DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID = "placeholder";
export const DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID = DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID;
export const DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID = "bought-power";
export const DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID = "refinery-efficiency";
export const DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID = "softcap-two-weaken";
export const DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID = "refine-keep-crystals";
export const DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID = "refine-autobuyer";
export const DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID = "refinery-log-base";
export const DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID = "softcap-one-weaken";

export const DREAM_CRYSTAL_UPGRADE_ROW_ONE = [
  DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
  DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID,
  DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID,
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
] as const;

export const DREAM_CRYSTAL_UPGRADE_ROW_TWO = [
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID,
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID,
] as const;

export const DREAM_CRYSTAL_UPGRADE_ROWS = [
  DREAM_CRYSTAL_UPGRADE_ROW_ONE,
  DREAM_CRYSTAL_UPGRADE_ROW_TWO,
] as const;

export type DreamCrystalUpgradeId = (typeof DREAM_CRYSTAL_UPGRADE_ROWS)[number][number];

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
    baseCost: N(10),
  },
  [DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_PLACEHOLDER_ID,
    kind: "single",
    baseCost: N(30),
  },
  [DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
    kind: "repeatable",
    baseCost: N(5),
    costScale: N(10),
  },
  [DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
    kind: "repeatable",
    baseCost: N(10),
    costScale: N(2),
  },
  [DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID,
    kind: "single",
    baseCost: N(50),
  },
  [DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID,
    kind: "single",
    baseCost: N(50),
  },
  [DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID,
    kind: "single",
    baseCost: N(100),
  },
  [DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID,
    kind: "repeatable",
    baseCost: N(50),
    costScale: N(3),
  },
  [DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID]: {
    id: DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID,
    kind: "repeatable",
    baseCost: N(15),
    costScale: N(3),
  },
} as const satisfies Record<DreamCrystalUpgradeId, DreamCrystalUpgradeDefinition>;

export function getDreamCrystalUpgradeDefinition(id: DreamCrystalUpgradeId) {
  return DREAM_CRYSTAL_UPGRADE_DEFINITIONS[id];
}
