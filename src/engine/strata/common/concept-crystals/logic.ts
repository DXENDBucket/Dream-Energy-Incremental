import { ZERO, add, gte, lte, mul, normalizeNum, pow, sqrt, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { isConceptCrystalsUnlocked } from "@/engine/strata/common/milestones";
import {
  CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
  CONCEPT_CRYSTAL_INTERVAL_REDUCTION,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT_SCALE,
} from "./balance";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  createConceptCrystalNodeAmounts,
  createConceptCrystalsState,
  type ConceptCrystalsState,
} from "./state";

export function ensureConceptCrystalsState(stratum: StratumState): ConceptCrystalsState {
  stratum.conceptCrystals ??= createConceptCrystalsState();
  stratum.conceptCrystals.amount = normalizeNum(stratum.conceptCrystals.amount, 1);
  stratum.conceptCrystals.productionElapsedSec = normalizeNum(
    stratum.conceptCrystals.productionElapsedSec,
    0,
  );
  stratum.conceptCrystals.intervalUpgrades = normalizeNum(
    stratum.conceptCrystals.intervalUpgrades,
    0,
  );
  stratum.conceptCrystals.severedPathIndex = Number.isFinite(stratum.conceptCrystals.severedPathIndex)
    ? Math.max(0, Math.min(CONCEPT_CRYSTAL_NODE_IDS.length - 1, Math.floor(stratum.conceptCrystals.severedPathIndex)))
    : 0;

  const defaults = createConceptCrystalNodeAmounts();
  stratum.conceptCrystals.nodes ??= defaults;

  for (const nodeId of CONCEPT_CRYSTAL_NODE_IDS) {
    stratum.conceptCrystals.nodes[nodeId] = normalizeNum(
      stratum.conceptCrystals.nodes[nodeId],
      defaults[nodeId],
    );
  }

  return stratum.conceptCrystals;
}

export function getConceptCrystalProductionInterval(stratum: StratumState): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  return mul(
    CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
    pow(CONCEPT_CRYSTAL_INTERVAL_REDUCTION, conceptCrystals.intervalUpgrades),
  );
}

export function getConceptCrystalIntervalUpgradeRequirement(stratum: StratumState): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  return mul(
    CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT,
    pow(CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT_SCALE, conceptCrystals.intervalUpgrades),
  );
}

export function canUpgradeConceptCrystalInterval(stratum: StratumState): boolean {
  if (!isConceptCrystalsUnlocked(stratum)) return false;
  return gte(stratum.dreamEnergy, getConceptCrystalIntervalUpgradeRequirement(stratum));
}

export function upgradeConceptCrystalInterval(stratum: StratumState): void {
  if (!canUpgradeConceptCrystalInterval(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const requirement = getConceptCrystalIntervalUpgradeRequirement(stratum);

  stratum.dreamEnergy = sub(stratum.dreamEnergy, requirement);
  conceptCrystals.intervalUpgrades = add(conceptCrystals.intervalUpgrades, 1);
}

export function setConceptCrystalSeveredPath(stratum: StratumState, pathIndex: number): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const count = CONCEPT_CRYSTAL_NODE_IDS.length;
  conceptCrystals.severedPathIndex = ((Math.floor(pathIndex) % count) + count) % count;
}

export function rotateConceptCrystalSeveredPath(stratum: StratumState, direction: -1 | 1): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  setConceptCrystalSeveredPath(stratum, conceptCrystals.severedPathIndex + direction);
}

export function runConceptCrystalProduction(stratum: StratumState): void {
  if (!isConceptCrystalsUnlocked(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const gains: Partial<Record<(typeof CONCEPT_CRYSTAL_NODE_IDS)[number], Num>> = {};

  for (let index = 0; index < CONCEPT_CRYSTAL_NODE_IDS.length; index++) {
    const sourceId = CONCEPT_CRYSTAL_NODE_IDS[index]!;
    const targetId = CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!;
    const sourceAmount = conceptCrystals.nodes[sourceId];
    const gain = index === conceptCrystals.severedPathIndex ? sqrt(sourceAmount) : sourceAmount;

    gains[targetId] = add(gains[targetId] ?? ZERO, gain);
  }

  for (const nodeId of CONCEPT_CRYSTAL_NODE_IDS) {
    const gain = gains[nodeId];
    if (!gain || lte(gain, 0)) continue;
    conceptCrystals.nodes[nodeId] = add(conceptCrystals.nodes[nodeId], gain);
  }
}
