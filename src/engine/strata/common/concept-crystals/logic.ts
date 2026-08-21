import { N, ONE, TEN, ZERO, add, div, floor, gt, gte, log10, lte, max, min, mul, normalizeNum, pow, sqrt, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals/selectors";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals/state";
import { getDreamEnergy, setDreamEnergy, spendDreamEnergy } from "@/engine/strata/common/dream-energy";
import type { StratumState } from "@/engine/strata/state";
import { isConceptCrystalsUnlocked } from "@/engine/strata/common/milestones";
import { isCrushFiveActive, isCrushFourActive, isCrushThreeActive, isCrushTwoActive } from "@/engine/crush/effects";
import {
  CONCEPT_CRYSTAL_CONDENSE_DREAM_CRYSTAL_TIER,
  CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
  CONCEPT_CRYSTAL_ASSIMILATION_SCALE,
  CONCEPT_CRYSTAL_CP_GAIN_SCALE,
  CONCEPT_CRYSTAL_DC_COST_LOG_POWER,
  CONCEPT_CRYSTAL_DC_COST_SCALE,
  CONCEPT_CRYSTAL_INTERVAL_REDUCTION,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT,
  CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT_SCALE,
  CONCEPT_CRYSTAL_NODE_HARDCAP,
  CONCEPT_CRYSTAL_NODE_BASE_LOG_WEIGHT,
  CONCEPT_CRYSTAL_NODE_MAGNITUDE_POWER,
  CONCEPT_CRYSTAL_NODE_PER_CRYSTAL_LOG_WEIGHT,
  CONCEPT_CRYSTAL_NODE_SCALE_LOG_WEIGHT,
  CONCEPT_CRYSTAL_STANDARD_EFFECT_LOG_POWER,
} from "./balance";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  INNER_CONCEPT_NODE_IDS,
  createConceptCrystalNodeAmounts,
  createConceptCrystalsState,
  createInnerConceptNodeAmounts,
  createInnerConceptNodeSevering,
  type ConceptCrystalNodeId,
  type ConceptCrystalsState,
  type InnerConceptNodeId,
} from "./state";

const CONCEPT_CRYSTAL_PRODUCTION_RATIO = ONE;
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
    const normalized = normalizeNum(stratum.conceptCrystals.nodes[nodeId], defaults[nodeId]);
    stratum.conceptCrystals.nodes[nodeId] = gt(normalized, CONCEPT_CRYSTAL_NODE_HARDCAP)
      ? CONCEPT_CRYSTAL_NODE_HARDCAP
      : normalized;
  }

  const innerDefaults = createInnerConceptNodeAmounts();
  stratum.conceptCrystals.innerNodes ??= innerDefaults;
  stratum.conceptCrystals.innerSevered ??= createInnerConceptNodeSevering();

  for (const nodeId of INNER_CONCEPT_NODE_IDS) {
    const normalized = normalizeNum(stratum.conceptCrystals.innerNodes[nodeId], innerDefaults[nodeId]);
    stratum.conceptCrystals.innerNodes[nodeId] = min(
      CONCEPT_CRYSTAL_NODE_HARDCAP,
      max(ONE, normalized),
    );
    stratum.conceptCrystals.innerSevered[nodeId] =
      stratum.conceptCrystals.innerSevered[nodeId] === true;
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
  const baseRequirement = isCrushThreeActive(stratum)
    ? TEN
    : CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT;
  return mul(
    baseRequirement,
    pow(CONCEPT_CRYSTAL_INTERVAL_UPGRADE_REQUIREMENT_SCALE, conceptCrystals.intervalUpgrades),
  );
}

export function canUpgradeConceptCrystalInterval(stratum: StratumState): boolean {
  if (!isConceptCrystalsUnlocked(stratum)) return false;
  return gte(getDreamEnergy(stratum), getConceptCrystalIntervalUpgradeRequirement(stratum));
}

export function upgradeConceptCrystalInterval(stratum: StratumState): void {
  if (!canUpgradeConceptCrystalInterval(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const requirement = getConceptCrystalIntervalUpgradeRequirement(stratum);

  spendDreamEnergy(stratum, requirement);
  if (isCrushThreeActive(stratum) && getDreamEnergy(stratum).lt(TEN)) {
    setDreamEnergy(stratum, TEN);
  }
  conceptCrystals.intervalUpgrades = add(conceptCrystals.intervalUpgrades, 1);
}

export function getConceptCrystalCondenseRequirement(stratum: StratumState): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const heldConceptCrystals = max(floor(conceptCrystals.amount), ONE);
  return add(div(mul(heldConceptCrystals, add(heldConceptCrystals, ONE)), 2), ONE);
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
  conceptCrystals.innerNodes = createInnerConceptNodeAmounts();
  conceptCrystals.innerSevered = createInnerConceptNodeSevering();

  setDreamEnergy(stratum, TEN);
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
  conceptCrystals.innerNodes = createInnerConceptNodeAmounts();
  conceptCrystals.innerSevered = createInnerConceptNodeSevering();
}

export function toggleConceptCrystalSevering(stratum: StratumState): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  conceptCrystals.isSeveringEnabled = !conceptCrystals.isSeveringEnabled;
}

function getConceptCrystalNodeLogWeight(stratum: StratumState, scale: Num): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const scaleWeight = mul(
    CONCEPT_CRYSTAL_NODE_SCALE_LOG_WEIGHT,
    div(scale, add(ONE, scale)),
  );
  const additionalCrystalWeight = mul(
    CONCEPT_CRYSTAL_NODE_PER_CRYSTAL_LOG_WEIGHT,
    max(ZERO, sub(conceptCrystals.amount, ONE)),
  );

  return add(
    add(CONCEPT_CRYSTAL_NODE_BASE_LOG_WEIGHT, scaleWeight),
    additionalCrystalWeight,
  );
}

export function toggleInnerConceptProduction(
  stratum: StratumState,
  nodeId: InnerConceptNodeId,
): void {
  if (!isCrushFiveActive(stratum)) return;
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  conceptCrystals.innerSevered[nodeId] = !conceptCrystals.innerSevered[nodeId];
}

function getConceptCrystalNodeEffect(
  stratum: StratumState,
  nodeId: ConceptCrystalNodeId,
  scale: Num,
): Num {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  if (conceptCrystals.nodes[nodeId].lte(ONE)) return ONE;

  const magnitude = pow(
    max(ZERO, log10(conceptCrystals.nodes[nodeId])),
    CONCEPT_CRYSTAL_NODE_MAGNITUDE_POWER,
  );

  return pow(TEN, mul(getConceptCrystalNodeLogWeight(stratum, scale), magnitude));
}

function getConceptCrystalNodeScale(nodeId: ConceptCrystalNodeId): Num {
  if (nodeId === "law" || nodeId === "war") return CONCEPT_CRYSTAL_DC_COST_SCALE;
  if (nodeId === "conquest" || nodeId === "enlightenment") return CONCEPT_CRYSTAL_CP_GAIN_SCALE;
  return CONCEPT_CRYSTAL_ASSIMILATION_SCALE;
}

export function getConceptCrystalNodeContribution(stratum: StratumState, nodeId: ConceptCrystalNodeId): Num {
  return getConceptCrystalNodeEffect(stratum, nodeId, getConceptCrystalNodeScale(nodeId));
}

function softenConceptCrystalRatio(rawFactor: Num, logPower: Num): Num {
  if (gte(rawFactor, ONE)) {
    return pow(
      add(ONE, log10(rawFactor)),
      logPower,
    );
  }

  return div(
    ONE,
    pow(
      add(ONE, log10(div(ONE, rawFactor))),
      logPower,
    ),
  );
}

export function getConceptCrystalDreamCrystalCostGrowthFactor(stratum: StratumState): Num {
  const rawFactor = div(
    getConceptCrystalNodeContribution(stratum, "war"),
    getConceptCrystalNodeContribution(stratum, "law"),
  );

  return softenConceptCrystalRatio(rawFactor, CONCEPT_CRYSTAL_DC_COST_LOG_POWER);
}

export function getConceptCrystalCoherencePointGainMultiplier(stratum: StratumState): Num {
  const enlightenment = getConceptCrystalNodeContribution(stratum, "enlightenment");
  const rawFactor = isCrushTwoActive(stratum)
    ? enlightenment
    : div(enlightenment, getConceptCrystalNodeContribution(stratum, "conquest"));

  return softenConceptCrystalRatio(rawFactor, CONCEPT_CRYSTAL_STANDARD_EFFECT_LOG_POWER);
}

export function getConceptCrystalAssimilationStrengthMultiplier(stratum: StratumState): Num {
  const hope = getConceptCrystalNodeContribution(stratum, "hope");
  const rawFactor = isCrushFourActive(stratum)
    ? div(ONE, hope)
    : div(getConceptCrystalNodeContribution(stratum, "shackle"), hope);

  return softenConceptCrystalRatio(rawFactor, CONCEPT_CRYSTAL_STANDARD_EFFECT_LOG_POWER);
}

export function runConceptCrystalProduction(stratum: StratumState): void {
  if (!isConceptCrystalsUnlocked(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  if (isCrushFiveActive(stratum)) {
    runInnerConceptProduction(stratum);
  }
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
    conceptCrystals.nodes[nodeId] = min(
      add(conceptCrystals.nodes[nodeId], gain),
      CONCEPT_CRYSTAL_NODE_HARDCAP,
    );
  }
}

const INNER_CONCEPT_SOURCE_PAIRS: Record<
  InnerConceptNodeId,
  readonly [ConceptCrystalNodeId, ConceptCrystalNodeId]
> = {
  faith: ["hope", "conquest"],
  justice: ["law", "shackle"],
  revolution: ["enlightenment", "war"],
};

const INNER_CONCEPT_PREVIOUS_NODE: Record<InnerConceptNodeId, InnerConceptNodeId> = {
  faith: "revolution",
  justice: "faith",
  revolution: "justice",
};

export function getInnerConceptPositiveProduction(
  stratum: StratumState,
  nodeId: InnerConceptNodeId,
): Num {
  if (!isCrushFiveActive(stratum)) return ZERO;
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const [firstSource, secondSource] = INNER_CONCEPT_SOURCE_PAIRS[nodeId];
  return sqrt(mul(
    conceptCrystals.nodes[firstSource],
    conceptCrystals.nodes[secondSource],
  ));
}

export function getInnerConceptNetProduction(
  stratum: StratumState,
  nodeId: InnerConceptNodeId,
): Num {
  if (!isCrushFiveActive(stratum)) return ZERO;
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  if (conceptCrystals.innerSevered[nodeId]) return ZERO;
  return sub(
    getInnerConceptPositiveProduction(stratum, nodeId),
    conceptCrystals.innerNodes[INNER_CONCEPT_PREVIOUS_NODE[nodeId]],
  );
}

function runInnerConceptProduction(stratum: StratumState): void {
  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const nextAmounts = { ...conceptCrystals.innerNodes };

  for (const nodeId of INNER_CONCEPT_NODE_IDS) {
    if (conceptCrystals.innerSevered[nodeId]) continue;
    nextAmounts[nodeId] = min(
      CONCEPT_CRYSTAL_NODE_HARDCAP,
      max(ONE, add(
        conceptCrystals.innerNodes[nodeId],
        getInnerConceptNetProduction(stratum, nodeId),
      )),
    );
  }

  conceptCrystals.innerNodes = nextAmounts;
}

type ConceptCrystalMatrix = Num[][];

function createConceptCrystalIdentityMatrix(): ConceptCrystalMatrix {
  return CONCEPT_CRYSTAL_NODE_IDS.map((_, row) =>
    CONCEPT_CRYSTAL_NODE_IDS.map((__, column) => (row === column ? ONE : ZERO))
  );
}

function createConceptCrystalProductionMatrix(): ConceptCrystalMatrix {
  const matrix = createConceptCrystalIdentityMatrix();

  for (let index = 0; index < CONCEPT_CRYSTAL_NODE_IDS.length; index++) {
    const targetIndex = (index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length;
    matrix[targetIndex]![index] = add(matrix[targetIndex]![index]!, CONCEPT_CRYSTAL_PRODUCTION_RATIO);
  }

  return matrix;
}

function multiplyConceptCrystalMatrices(
  left: ConceptCrystalMatrix,
  right: ConceptCrystalMatrix,
): ConceptCrystalMatrix {
  return CONCEPT_CRYSTAL_NODE_IDS.map((_, row) =>
    CONCEPT_CRYSTAL_NODE_IDS.map((__, column) => {
      let value = ZERO;

      for (let inner = 0; inner < CONCEPT_CRYSTAL_NODE_IDS.length; inner++) {
        value = add(value, mul(left[row]![inner]!, right[inner]![column]!));
      }

      return value;
    })
  );
}

function getConceptCrystalProductionMatrixPower(cycles: number): ConceptCrystalMatrix {
  let remaining = Math.max(0, Math.floor(cycles));
  let result = createConceptCrystalIdentityMatrix();
  let power = createConceptCrystalProductionMatrix();

  while (remaining > 0) {
    if (remaining % 2 === 1) {
      result = multiplyConceptCrystalMatrices(result, power);
    }

    remaining = Math.floor(remaining / 2);
    if (remaining > 0) {
      power = multiplyConceptCrystalMatrices(power, power);
    }
  }

  return result;
}

export function runConceptCrystalProductionCycles(stratum: StratumState, cycles: number): number {
  if (!isConceptCrystalsUnlocked(stratum)) return 0;
  if (!Number.isFinite(cycles) || cycles <= 0) return 0;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const wholeCycles = Math.floor(cycles);
  if (wholeCycles <= 0) return 0;

  if (conceptCrystals.isSeveringEnabled || isCrushFiveActive(stratum)) {
    const processedCycles = Math.min(wholeCycles, isCrushFiveActive(stratum) ? 4096 : 512);
    for (let cycle = 0; cycle < processedCycles; cycle++) {
      runConceptCrystalProduction(stratum);
    }
    return processedCycles;
  }

  const matrix = getConceptCrystalProductionMatrixPower(wholeCycles);
  const current = CONCEPT_CRYSTAL_NODE_IDS.map(nodeId => conceptCrystals.nodes[nodeId]);

  for (let row = 0; row < CONCEPT_CRYSTAL_NODE_IDS.length; row++) {
    let nextAmount = ZERO;

    for (let column = 0; column < CONCEPT_CRYSTAL_NODE_IDS.length; column++) {
      nextAmount = add(nextAmount, mul(matrix[row]![column]!, current[column]!));
    }

    conceptCrystals.nodes[CONCEPT_CRYSTAL_NODE_IDS[row]!] = min(
      nextAmount,
      CONCEPT_CRYSTAL_NODE_HARDCAP,
    );
  }

  return wholeCycles;
}
