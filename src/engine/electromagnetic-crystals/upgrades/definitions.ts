import { N, type Num } from "@/engine/math/num";

export const ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID = "horizontal-judge-lines";
export const ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID = "magnetic-field-range";
export const ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID = "electric-field-range";
export const ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID = "power-gain";
export const ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID = "conversion-exponent";
export const ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID = "vertical-judge-lines";
export const ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID = "horizontal-judge-lines-three";
export const ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID = "coherence-point-gain";
export const ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID = "power-decay";
export const ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID = "advanced-power-gain";

export const ELECTROMAGNETIC_UPGRADE_ROW_ONE = [
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID,
  ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID,
] as const;

export const ELECTROMAGNETIC_UPGRADE_ROW_TWO = [
  ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID,
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID,
  ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID,
  ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID,
] as const;

export const ELECTROMAGNETIC_UPGRADE_ROWS = [
  ELECTROMAGNETIC_UPGRADE_ROW_ONE,
  ELECTROMAGNETIC_UPGRADE_ROW_TWO,
] as const;
export type ElectromagneticUpgradeId = (typeof ELECTROMAGNETIC_UPGRADE_ROWS)[number][number];
export type ElectromagneticUpgradeKind = "single" | "repeatable" | "placeholder";
export type ElectromagneticUpgradeResource = "electromagnetic-power" | "dream-energy" | "chaotic-ether";

export interface ElectromagneticUpgradeDefinition {
  id: ElectromagneticUpgradeId;
  kind: ElectromagneticUpgradeKind;
  resource?: ElectromagneticUpgradeResource;
  baseCost?: Num;
  costScale?: Num;
  maxPurchases?: Num;
}

export const ELECTROMAGNETIC_UPGRADE_DEFINITIONS: Record<
  ElectromagneticUpgradeId,
  ElectromagneticUpgradeDefinition
> = {
  [ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(250),
  },
  [ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(1.5e3),
  },
  [ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(2.3e3),
  },
  [ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID,
    kind: "repeatable",
    resource: "dream-energy",
    baseCost: N(1e79),
    costScale: N(5),
  },
  [ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID,
    kind: "repeatable",
    resource: "chaotic-ether",
    baseCost: N(1e25),
    costScale: N(5),
  },
  [ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(4e3),
  },
  [ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(5e4),
  },
  [ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID,
    kind: "single",
    resource: "electromagnetic-power",
    baseCost: N(3e12),
  },
  [ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID,
    kind: "repeatable",
    resource: "electromagnetic-power",
    baseCost: N(3e3),
    costScale: N(2),
    maxPurchases: N(40),
  },
  [ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID]: {
    id: ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID,
    kind: "repeatable",
    resource: "electromagnetic-power",
    baseCost: N(1e4),
    costScale: N(3),
  },
};

export function getElectromagneticUpgradeDefinition(
  id: ElectromagneticUpgradeId,
): ElectromagneticUpgradeDefinition {
  return ELECTROMAGNETIC_UPGRADE_DEFINITIONS[id];
}
