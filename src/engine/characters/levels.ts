import type { GameState } from "@/engine/core/state";
import { N, ONE, ZERO, add, gte, mul, pow, sub, type Num } from "@/engine/math/num";
import { getChaoticEther, setChaoticEther } from "@/engine/strata/common/chaotic-ether";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { getDreamEnergy, spendDreamEnergy } from "@/engine/strata/common/dream-energy";
import { realityStratumId } from "@/engine/strata/defs";
import {
  ALPHA_CHARACTER_ID,
  DAWN_CHARACTER_ID,
  DELTA_CHARACTER_ID,
} from "./definitions";
import {
  ensureCharacterSystemState,
  getCharacterLevel,
  syncCharacterProductionPowers,
} from "./logic";

export type CharacterLevelResource = "dream-energy" | "chaotic-ether-1" | "coherence-points";

export interface CharacterLevelCostDefinition {
  resource: CharacterLevelResource;
  baseCost: Num;
  costScale: Num;
}

export const CHARACTER_LEVEL_COST_DEFINITIONS: Record<string, CharacterLevelCostDefinition> = {
  [ALPHA_CHARACTER_ID]: {
    resource: "dream-energy",
    baseCost: N(10),
    costScale: N(15),
  },
  [DAWN_CHARACTER_ID]: {
    resource: "chaotic-ether-1",
    baseCost: N(1),
    costScale: N(6),
  },
  [DELTA_CHARACTER_ID]: {
    resource: "coherence-points",
    baseCost: N(1),
    costScale: N(3),
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
  return getCoherencePoints(reality);
}

export function canUpgradeCharacterLevel(state: GameState, characterId: string): boolean {
  const definition = getCharacterLevelCostDefinition(characterId);
  if (
    !definition
    || !ensureCharacterSystemState(state).ownedCharacterIds.includes(characterId)
  ) return false;
  return gte(
    getCharacterLevelResourceAmount(state, definition.resource),
    getCharacterLevelCost(state, characterId),
  );
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
