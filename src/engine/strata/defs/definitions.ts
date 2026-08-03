import { N } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  dreamSeaFirstStratumId,
  dreamSeaFifthStratumId,
  dreamSeaFourthStratumId,
  dreamSeaSecondStratumId,
  dreamSeaThirdStratumId,
  realityStratumId,
} from "./ids";

export type EntropyFormulaId =
  | "none"
  | "dream-sea-first"
  | "dream-sea-second"
  | "dream-sea-third"
  | "dream-sea-fourth"
  | "dream-sea-fifth";

export type StratumContentStatus = "available" | "planned";
export type StratumVisibilityRule = "entry-resource" | "previous-created";
export type StratumEntryTransitionKind = "standard-lift" | "major-reset";

export interface StratumDefinition {
  id: string;
  depth: number;
  labelKey: string;
  contentStatus: StratumContentStatus;
  visibilityRule: StratumVisibilityRule;
  entryTransitionKind: StratumEntryTransitionKind;
  entropyFormulaId: EntropyFormulaId;
  entropyChaosExponent: Num;
  entropyBaseGrowthMultiplier: Num;
  producedChaoticEtherTier: number;
  dreamCrystalUpgradeChaoticEtherTier: number;
}

/**
 * The single source of truth for stratum order and per-stratum rules.
 * Planned strata are deliberately present in the progression graph but are
 * hidden and cannot be entered until their contentStatus becomes "available".
 */
export const STRATUM_DEFINITIONS: readonly StratumDefinition[] = [
  {
    id: realityStratumId,
    depth: 0,
    labelKey: "strataOverview.reality",
    contentStatus: "available",
    visibilityRule: "previous-created",
    entryTransitionKind: "standard-lift",
    entropyFormulaId: "none",
    entropyChaosExponent: N(2),
    entropyBaseGrowthMultiplier: N(1),
    producedChaoticEtherTier: 0,
    dreamCrystalUpgradeChaoticEtherTier: 1,
  },
  {
    id: dreamSeaFirstStratumId,
    depth: 1,
    labelKey: "strataOverview.dreamSeaFirst",
    contentStatus: "available",
    visibilityRule: "entry-resource",
    entryTransitionKind: "standard-lift",
    entropyFormulaId: "dream-sea-first",
    entropyChaosExponent: N(2),
    entropyBaseGrowthMultiplier: N(1),
    producedChaoticEtherTier: 1,
    dreamCrystalUpgradeChaoticEtherTier: 2,
  },
  {
    id: dreamSeaSecondStratumId,
    depth: 2,
    labelKey: "strataOverview.dreamSeaSecond",
    contentStatus: "available",
    visibilityRule: "previous-created",
    entryTransitionKind: "standard-lift",
    entropyFormulaId: "dream-sea-second",
    entropyChaosExponent: N(3),
    entropyBaseGrowthMultiplier: N(1),
    producedChaoticEtherTier: 2,
    dreamCrystalUpgradeChaoticEtherTier: 3,
  },
  {
    id: dreamSeaThirdStratumId,
    depth: 3,
    labelKey: "strataOverview.dreamSeaThird",
    contentStatus: "available",
    visibilityRule: "previous-created",
    entryTransitionKind: "standard-lift",
    entropyFormulaId: "dream-sea-third",
    entropyChaosExponent: N(15),
    entropyBaseGrowthMultiplier: N(10),
    producedChaoticEtherTier: 3,
    dreamCrystalUpgradeChaoticEtherTier: 4,
  },
  {
    id: dreamSeaFourthStratumId,
    depth: 4,
    labelKey: "strataOverview.dreamSeaFourth",
    contentStatus: "available",
    visibilityRule: "previous-created",
    entryTransitionKind: "standard-lift",
    entropyFormulaId: "dream-sea-fourth",
    entropyChaosExponent: N(30),
    entropyBaseGrowthMultiplier: N(50),
    producedChaoticEtherTier: 4,
    dreamCrystalUpgradeChaoticEtherTier: 5,
  },
  {
    id: dreamSeaFifthStratumId,
    depth: 5,
    labelKey: "strataOverview.dreamSeaFifth",
    contentStatus: "planned",
    visibilityRule: "previous-created",
    entryTransitionKind: "major-reset",
    entropyFormulaId: "dream-sea-fifth",
    entropyChaosExponent: N(2),
    entropyBaseGrowthMultiplier: N(1),
    producedChaoticEtherTier: 5,
    dreamCrystalUpgradeChaoticEtherTier: 6,
  },
] as const;

for (const [index, definition] of STRATUM_DEFINITIONS.entries()) {
  if (definition.depth !== index) {
    throw new Error(`Stratum '${definition.id}' has depth ${definition.depth}; expected ${index}.`);
  }
}

if (new Set(STRATUM_DEFINITIONS.map(definition => definition.id)).size !== STRATUM_DEFINITIONS.length) {
  throw new Error("Stratum definitions contain duplicate ids.");
}

if (
  new Set(STRATUM_DEFINITIONS.map(definition => definition.entropyFormulaId)).size
  !== STRATUM_DEFINITIONS.length
) {
  throw new Error("Stratum definitions contain duplicate Entropy formula ids.");
}

const STRATUM_DEFINITION_BY_ID = new Map(
  STRATUM_DEFINITIONS.map(definition => [definition.id, definition]),
);

const STRATUM_DEFINITION_BY_ENTROPY_FORMULA = new Map(
  STRATUM_DEFINITIONS.map(definition => [definition.entropyFormulaId, definition]),
);

export function getStratumDefinition(id: string): StratumDefinition | undefined {
  return STRATUM_DEFINITION_BY_ID.get(id);
}

export function requireStratumDefinition(id: string): StratumDefinition {
  const definition = getStratumDefinition(id);
  if (!definition) throw new Error(`Unknown stratum '${id}'.`);
  return definition;
}

export function getStratumDefinitionByEntropyFormula(
  formulaId: EntropyFormulaId,
): StratumDefinition | undefined {
  return STRATUM_DEFINITION_BY_ENTROPY_FORMULA.get(formulaId);
}

export function getPreviousStratumDefinition(id: string): StratumDefinition | undefined {
  const definition = getStratumDefinition(id);
  return definition ? STRATUM_DEFINITIONS[definition.depth - 1] : undefined;
}

export function getNextStratumDefinition(id: string): StratumDefinition | undefined {
  const definition = getStratumDefinition(id);
  return definition ? STRATUM_DEFINITIONS[definition.depth + 1] : undefined;
}

export function areAdjacentStrata(firstId: string, secondId: string): boolean {
  const first = getStratumDefinition(firstId);
  const second = getStratumDefinition(secondId);
  return Boolean(first && second && Math.abs(first.depth - second.depth) === 1);
}
