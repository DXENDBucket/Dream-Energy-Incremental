import type { GameState } from "@/engine/core/state";
import { N, gte, sub, type Num } from "@/engine/math/num";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { getChaoticEther, setChaoticEther } from "@/engine/strata/common/chaotic-ether";
import { getElectromagneticPower, spendElectromagneticPower } from "@/engine/electromagnetic-crystals";
import { realityStratumId } from "@/engine/strata/defs";
import {
  ACE_CHARACTER_ID,
  DAWN_CHARACTER_ID,
  DELTA_CHARACTER_ID,
  MECHANIST_CHARACTER_ID,
} from "./definitions";
import { ensureCharacterSystemState, grantCharacter } from "./logic";

export const CHARACTER_UNLOCK_ORDER = [
  DAWN_CHARACTER_ID,
  DELTA_CHARACTER_ID,
  MECHANIST_CHARACTER_ID,
  ACE_CHARACTER_ID,
] as const;
export type UnlockableCharacterId = (typeof CHARACTER_UNLOCK_ORDER)[number];

export interface CharacterUnlockDefinition {
  requirement: Num;
  secondaryRequirement?: Num;
  kind: "coherence-points-cost" | "best-dream-energy" | "chaotic-ether-and-power-cost";
}

export const CHARACTER_UNLOCK_DEFINITIONS: Record<UnlockableCharacterId, CharacterUnlockDefinition> = {
  [DAWN_CHARACTER_ID]: { requirement: N(5e9), kind: "coherence-points-cost" },
  [DELTA_CHARACTER_ID]: { requirement: N(2e11), kind: "coherence-points-cost" },
  [MECHANIST_CHARACTER_ID]: { requirement: N(1e79), kind: "best-dream-energy" },
  [ACE_CHARACTER_ID]: {
    requirement: N(1e35),
    secondaryRequirement: N(1e19),
    kind: "chaotic-ether-and-power-cost",
  },
};

export function isCharacterOwned(state: GameState, characterId: string): boolean {
  return ensureCharacterSystemState(state).ownedCharacterIds.includes(characterId);
}

export function isCharacterUnlockAvailable(
  _state: GameState,
  _characterId: UnlockableCharacterId,
): boolean {
  return true;
}

export function canUnlockCharacter(
  state: GameState,
  characterId: UnlockableCharacterId,
): boolean {
  if (isCharacterOwned(state, characterId)) return false;
  if (!isCharacterUnlockAvailable(state, characterId)) return false;
  const reality = state.strata[realityStratumId];
  if (!reality) return false;
  const definition = CHARACTER_UNLOCK_DEFINITIONS[characterId];
  if (definition.kind === "chaotic-ether-and-power-cost") {
    return gte(getChaoticEther(reality, 1), definition.requirement)
      && gte(getElectromagneticPower(reality), definition.secondaryRequirement ?? 0);
  }
  return definition.kind === "best-dream-energy"
    ? gte(reality.bestDreamEnergy, definition.requirement)
    : gte(getCoherencePoints(reality), definition.requirement);
}

export function unlockCharacter(
  state: GameState,
  characterId: UnlockableCharacterId,
): boolean {
  if (!canUnlockCharacter(state, characterId)) return false;
  const reality = state.strata[realityStratumId]!;
  const definition = CHARACTER_UNLOCK_DEFINITIONS[characterId];
  if (definition.kind === "coherence-points-cost") {
    reality.coherencePoints = sub(getCoherencePoints(reality), definition.requirement);
  } else if (definition.kind === "chaotic-ether-and-power-cost") {
    setChaoticEther(reality, 1, sub(getChaoticEther(reality, 1), definition.requirement));
    spendElectromagneticPower(reality, definition.secondaryRequirement ?? N(0));
  }
  grantCharacter(state, characterId);
  return true;
}
