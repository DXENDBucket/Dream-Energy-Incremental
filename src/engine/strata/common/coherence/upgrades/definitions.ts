import { N } from "@/engine/math/num";

export const COHERENCE_UPGRADE_PLACEHOLDER_ONE_ID = "coherence-upgrade-1";
export const COHERENCE_UPGRADE_PLACEHOLDER_TWO_ID = "coherence-upgrade-2";
export const COHERENCE_UPGRADE_PLACEHOLDER_THREE_ID = "coherence-upgrade-3";
export const COHERENCE_UPGRADE_PLACEHOLDER_FOUR_ID = "coherence-upgrade-4";
export const COHERENCE_UPGRADE_PLACEHOLDER_FIVE_ID = "coherence-upgrade-5";
export const COHERENCE_UPGRADE_ENTROPY_TUNING_ID = COHERENCE_UPGRADE_PLACEHOLDER_ONE_ID;
export const COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID = COHERENCE_UPGRADE_PLACEHOLDER_TWO_ID;
export const COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID = COHERENCE_UPGRADE_PLACEHOLDER_THREE_ID;
export const COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID = COHERENCE_UPGRADE_PLACEHOLDER_FOUR_ID;
export const COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID = COHERENCE_UPGRADE_PLACEHOLDER_FIVE_ID;

export const COHERENCE_UPGRADE_ROW_ONE = [
  COHERENCE_UPGRADE_PLACEHOLDER_ONE_ID,
  COHERENCE_UPGRADE_PLACEHOLDER_TWO_ID,
  COHERENCE_UPGRADE_PLACEHOLDER_THREE_ID,
  COHERENCE_UPGRADE_PLACEHOLDER_FOUR_ID,
  COHERENCE_UPGRADE_PLACEHOLDER_FIVE_ID,
] as const;

export type CoherenceUpgradeId = (typeof COHERENCE_UPGRADE_ROW_ONE)[number];
export type CoherenceUpgradeKind = "placeholder" | "single" | "repeatable";

export interface CoherenceUpgradeDefinition {
  id: CoherenceUpgradeId;
  kind: CoherenceUpgradeKind;
  baseCost?: ReturnType<typeof N>;
  costScale?: ReturnType<typeof N>;
}

export const COHERENCE_UPGRADE_DEFINITIONS = {
  [COHERENCE_UPGRADE_PLACEHOLDER_ONE_ID]: {
    id: COHERENCE_UPGRADE_PLACEHOLDER_ONE_ID,
    kind: "single",
    baseCost: N(100),
  },
  [COHERENCE_UPGRADE_PLACEHOLDER_TWO_ID]: {
    id: COHERENCE_UPGRADE_PLACEHOLDER_TWO_ID,
    kind: "single",
    baseCost: N(500),
  },
  [COHERENCE_UPGRADE_PLACEHOLDER_THREE_ID]: {
    id: COHERENCE_UPGRADE_PLACEHOLDER_THREE_ID,
    kind: "single",
    baseCost: N(4000),
  },
  [COHERENCE_UPGRADE_PLACEHOLDER_FOUR_ID]: {
    id: COHERENCE_UPGRADE_PLACEHOLDER_FOUR_ID,
    kind: "repeatable",
    baseCost: N(20),
    costScale: N(12),
  },
  [COHERENCE_UPGRADE_PLACEHOLDER_FIVE_ID]: {
    id: COHERENCE_UPGRADE_PLACEHOLDER_FIVE_ID,
    kind: "repeatable",
    baseCost: N(100),
    costScale: N(10),
  },
} as const satisfies Record<CoherenceUpgradeId, CoherenceUpgradeDefinition>;

export function getCoherenceUpgradeDefinition(id: CoherenceUpgradeId): CoherenceUpgradeDefinition {
  return COHERENCE_UPGRADE_DEFINITIONS[id];
}
