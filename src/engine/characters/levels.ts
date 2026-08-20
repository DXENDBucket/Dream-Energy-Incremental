import type { GameState } from "@/engine/core/state";
import {
  N,
  ONE,
  TEN,
  ZERO,
  add,
  div,
  floor,
  gt,
  gte,
  logn,
  lte,
  max,
  min,
  mul,
  pow,
  sub,
  type Num,
} from "@/engine/math/num";
import { getChaoticEther, setChaoticEther } from "@/engine/strata/common/chaotic-ether";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { getDreamEnergy, spendDreamEnergy } from "@/engine/strata/common/dream-energy";
import { getElectromagneticPower, spendElectromagneticPower } from "@/engine/electromagnetic-crystals";
import { realityStratumId } from "@/engine/strata/defs";
import {
  ALPHA_CHARACTER_ID,
  CHARACTER_MAX_LEVEL,
  DAWN_CHARACTER_ID,
  DELTA_CHARACTER_ID,
  MECHANIST_CHARACTER_ID,
} from "./definitions";
import {
  ensureCharacterSystemState,
  getCharacterLevel,
  syncCharacterProductionPowers,
} from "./logic";

export type CharacterLevelResource =
  | "dream-energy"
  | "chaotic-ether-1"
  | "coherence-points"
  | "electromagnetic-power";

export interface CharacterLevelCostDefinition {
  resource: CharacterLevelResource;
  baseCost: Num;
  costScale: Num;
}

export const CHARACTER_LEVEL_COST_DEFINITIONS: Record<string, CharacterLevelCostDefinition> = {
  [ALPHA_CHARACTER_ID]: {
    resource: "dream-energy",
    baseCost: N("1e47"),
    costScale: N(15),
  },
  [DAWN_CHARACTER_ID]: {
    resource: "chaotic-ether-1",
    baseCost: N("1e12"),
    costScale: N(6),
  },
  [DELTA_CHARACTER_ID]: {
    resource: "coherence-points",
    baseCost: N("5e9"),
    costScale: N(3),
  },
  [MECHANIST_CHARACTER_ID]: {
    resource: "electromagnetic-power",
    baseCost: N(50),
    costScale: N(1.5),
  },
};

export function getCharacterLevelCostDefinition(
  characterId: string,
): CharacterLevelCostDefinition | undefined {
  return CHARACTER_LEVEL_COST_DEFINITIONS[characterId];
}

export function getCharacterLevelCost(state: GameState, characterId: string): Num {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (!definition) return ZERO;
  return mul(
    definition.baseCost,
    pow(definition.costScale, sub(getCharacterLevel(state, characterId), ONE)),
  );
}

export function getCharacterLevelResourceAmount(
  state: GameState,
  resource: CharacterLevelResource,
): Num {
  const reality = state.strata[realityStratumId];
  if (!reality) return ZERO;
  if (resource === "dream-energy") return getDreamEnergy(reality);
  if (resource === "chaotic-ether-1") return getChaoticEther(reality, 1);
  if (resource === "electromagnetic-power") return getElectromagneticPower(reality);
  return getCoherencePoints(reality);
}

function getSpendableCharacterLevelResourceAmount(
  state: GameState,
  resource: CharacterLevelResource,
): Num {
  const amount = getCharacterLevelResourceAmount(state, resource);
  return resource === "dream-energy" ? max(ZERO, sub(amount, TEN)) : amount;
}

export function canUpgradeCharacterLevel(state: GameState, characterId: string): boolean {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (
    !definition
    || !ensureCharacterSystemState(state).ownedCharacterIds.includes(characterId)
    || gte(getCharacterLevel(state, characterId), CHARACTER_MAX_LEVEL)
  ) return false;
  return gte(
    getSpendableCharacterLevelResourceAmount(state, definition.resource),
    getCharacterLevelCost(state, characterId),
  );
}

export function getCharacterLevelBulkCost(
  state: GameState,
  characterId: string,
  levelCount: Num,
): Num {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (!definition || lte(levelCount, ZERO)) return ZERO;
  const count = min(
    floor(levelCount),
    max(ZERO, sub(CHARACTER_MAX_LEVEL, getCharacterLevel(state, characterId))),
  );
  if (lte(count, ZERO)) return ZERO;
  const firstCost = getCharacterLevelCost(state, characterId);
  return div(
    mul(firstCost, sub(pow(definition.costScale, count), ONE)),
    sub(definition.costScale, ONE),
  );
}

export function getMaxAffordableCharacterLevels(state: GameState, characterId: string): Num {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (!definition || !ensureCharacterSystemState(state).ownedCharacterIds.includes(characterId)) {
    return ZERO;
  }

  const remainingLevels = max(
    ZERO,
    sub(CHARACTER_MAX_LEVEL, getCharacterLevel(state, characterId)),
  );
  if (lte(remainingLevels, ZERO)) return ZERO;

  const available = getSpendableCharacterLevelResourceAmount(state, definition.resource);
  const firstCost = getCharacterLevelCost(state, characterId);
  if (!gte(available, firstCost)) return ZERO;

  const geometricTarget = add(
    ONE,
    div(mul(available, sub(definition.costScale, ONE)), firstCost),
  );
  let count = min(
    remainingLevels,
    max(ZERO, floor(logn(geometricTarget, definition.costScale))),
  );

  if (gt(getCharacterLevelBulkCost(state, characterId, count), available)) {
    count = max(ZERO, sub(count, ONE));
  } else if (
    lte(add(count, ONE), remainingLevels)
    && lte(getCharacterLevelBulkCost(state, characterId, add(count, ONE)), available)
  ) {
    count = add(count, ONE);
  }
  return floor(count);
}

function spendCharacterLevelResource(
  state: GameState,
  resource: CharacterLevelResource,
  cost: Num,
): void {
  const reality = state.strata[realityStratumId]!;
  if (resource === "dream-energy") {
    spendDreamEnergy(reality, cost);
  } else if (resource === "chaotic-ether-1") {
    setChaoticEther(reality, 1, sub(getChaoticEther(reality, 1), cost));
  } else if (resource === "electromagnetic-power") {
    spendElectromagneticPower(reality, cost);
  } else {
    reality.coherencePoints = sub(getCoherencePoints(reality), cost);
  }
}

export function upgradeCharacterLevel(state: GameState, characterId: string): boolean {
  if (!canUpgradeCharacterLevel(state, characterId)) return false;
  const definition = getCharacterLevelCostDefinition(characterId)!;
  const cost = getCharacterLevelCost(state, characterId);
  spendCharacterLevelResource(state, definition.resource, cost);
  ensureCharacterSystemState(state).levels[characterId] = add(
    getCharacterLevel(state, characterId),
    ONE,
  );
  syncCharacterProductionPowers(state);
  return true;
}

export function upgradeCharacterLevelMax(state: GameState, characterId: string): boolean {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (!definition) return false;
  const levelCount = getMaxAffordableCharacterLevels(state, characterId);
  if (lte(levelCount, ZERO)) return false;

  const totalCost = getCharacterLevelBulkCost(state, characterId, levelCount);
  spendCharacterLevelResource(state, definition.resource, totalCost);
  ensureCharacterSystemState(state).levels[characterId] = add(
    getCharacterLevel(state, characterId),
    levelCount,
  );
  syncCharacterProductionPowers(state);
  return true;
}
