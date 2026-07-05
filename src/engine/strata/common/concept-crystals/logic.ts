import { N, ONE, TEN, ZERO, add, div, gte, log10, lte, max, mul, normalizeNum, pow, sqrt, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals/selectors";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals/state";
import type { StratumState } from "@/engine/strata/state";
import { isConceptCrystalsUnlocked } from "@/engine/strata/common/milestones";
import {
  CONCEPT_CRYSTAL_CONDENSE_DREAM_CRYSTAL_TIER,
  CONCEPT_CRYSTAL_CONDENSE_REQUIREMENT_STEP,
  CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
  CONCEPT_CRYSTAL_INTERVAL_REDUCTION,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT_SCALE,
} from "./balance";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  createConceptCrystalNodeAmounts,
  createConceptCrystalsState,
  type ConceptCrystalNodeId,
  type ConceptCrystalsState,
} from "./state";

const CONCEPT_CRYSTAL_PRODUCTION_RATIO = ONE;
const CONCEPT_CRYSTAL_DC_COST_SCALE = N(2);
const CONCEPT_CRYSTAL_CP_GAIN_SCALE = N(5);
const CONCEPT_CRYSTAL_ASSIMILATION_SCALE = ONE;

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
  stratum.conceptCrystals.isSeveringEnabled =
    stratum.conceptCrystals.isSeveringEnabled === true;
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

export function getConceptCrystalCondenseRequirement(stratum: StratumState): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  return mul(
    CONCEPT_CRYSTAL_CONDENSE_REQUIREMENT_STEP,
    max(conceptCrystals.amount, ONE),
  );
}

export function canCondenseConceptCrystal(stratum: StratumState): boolean {
  if (!isConceptCrystalsUnlocked(stratum)) return false;
  return gte(
    getDreamCrystalAmount(stratum.dreamCrystals, CONCEPT_CRYSTAL_CONDENSE_DREAM_CRYSTAL_TIER),
    getConceptCrystalCondenseRequirement(stratum),
  );
}

export function condenseConceptCrystal(stratum: StratumState): void {
  if (!canCondenseConceptCrystal(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  conceptCrystals.amount = add(conceptCrystals.amount, 1);
  conceptCrystals.nodes = createConceptCrystalNodeAmounts();

  stratum.dreamEnergy = TEN;
  stratum.dreamCrystals = createDreamCrystalsState();
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

export function resetConceptCrystalNodes(stratum: StratumState): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  conceptCrystals.nodes = createConceptCrystalNodeAmounts();
}

export function toggleConceptCrystalSevering(stratum: StratumState): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  conceptCrystals.isSeveringEnabled = !conceptCrystals.isSeveringEnabled;
}

function getConceptCrystalLogPower(stratum: StratumState, nodeId: (typeof CONCEPT_CRYSTAL_NODE_IDS)[number]): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const nodeAmount = max(conceptCrystals.nodes[nodeId], ONE);
  const logBase = add(ONE, log10(nodeAmount));

  return pow(max(logBase, ONE), max(conceptCrystals.amount, ONE));
}

function getConceptCrystalNodeEffect(
  stratum: StratumState,
  nodeId: ConceptCrystalNodeId,
  scale: Num,
): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  if (conceptCrystals.nodes[nodeId].lte(ONE)) return ONE;

  return max(ONE, add(ONE, mul(scale, sub(getConceptCrystalLogPower(stratum, nodeId), ONE))));
}

function getConceptCrystalNodeScale(nodeId: ConceptCrystalNodeId): Num {
  if (nodeId === "law" || nodeId === "war") return CONCEPT_CRYSTAL_DC_COST_SCALE;
  if (nodeId === "conquest" || nodeId === "enlightenment") return CONCEPT_CRYSTAL_CP_GAIN_SCALE;
  return CONCEPT_CRYSTAL_ASSIMILATION_SCALE;
}

export function getConceptCrystalNodeContribution(stratum: StratumState, nodeId: ConceptCrystalNodeId): Num {
  return getConceptCrystalNodeEffect(stratum, nodeId, getConceptCrystalNodeScale(nodeId));
}

export function getConceptCrystalDreamCrystalCostGrowthFactor(stratum: StratumState): Num {
  return div(
    getConceptCrystalNodeContribution(stratum, "war"),
    getConceptCrystalNodeContribution(stratum, "law"),
  );
}

export function getConceptCrystalCoherencePointGainMultiplier(stratum: StratumState): Num {
  return div(
    getConceptCrystalNodeContribution(stratum, "enlightenment"),
    getConceptCrystalNodeContribution(stratum, "conquest"),
  );
}

export function getConceptCrystalAssimilationStrengthMultiplier(stratum: StratumState): Num {
  return div(
    getConceptCrystalNodeContribution(stratum, "shackle"),
    getConceptCrystalNodeContribution(stratum, "hope"),
  );
}

export function runConceptCrystalProduction(stratum: StratumState): void {
  if (!isConceptCrystalsUnlocked(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const gains: Partial<Record<(typeof CONCEPT_CRYSTAL_NODE_IDS)[number], Num>> = {};

  for (let index = 0; index < CONCEPT_CRYSTAL_NODE_IDS.length; index++) {
    const sourceId = CONCEPT_CRYSTAL_NODE_IDS[index]!;
    const targetId = CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!;
    const sourceAmount = conceptCrystals.nodes[sourceId];
    const gain =
      conceptCrystals.isSeveringEnabled && index === conceptCrystals.severedPathIndex
        ? mul(sqrt(sourceAmount), CONCEPT_CRYSTAL_PRODUCTION_RATIO)
        : mul(sourceAmount, CONCEPT_CRYSTAL_PRODUCTION_RATIO);

    gains[targetId] = add(gains[targetId] ?? ZERO, gain);
  }

  for (const nodeId of CONCEPT_CRYSTAL_NODE_IDS) {
    const gain = gains[nodeId];
    if (!gain || lte(gain, 0)) continue;
    conceptCrystals.nodes[nodeId] = add(conceptCrystals.nodes[nodeId], gain);
  }
}
