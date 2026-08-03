import type { GameState } from "@/engine/core/state";
import { N, gte, sub, type Num } from "@/engine/math/num";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { realityStratumId } from "@/engine/strata/defs";
import { DAWN_CHARACTER_ID, DELTA_CHARACTER_ID } from "./definitions";
import { ensureCharacterSystemState, grantCharacter } from "./logic";

export const CHARACTER_UNLOCK_ORDER = [DAWN_CHARACTER_ID, DELTA_CHARACTER_ID] as const;
export type UnlockableCharacterId = (typeof CHARACTER_UNLOCK_ORDER)[number];

export const CHARACTER_UNLOCK_COSTS: Record<UnlockableCharacterId, Num> = {
  [DAWN_CHARACTER_ID]: N(5e9),
  [DELTA_CHARACTER_ID]: N(2e11),
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
  return reality !== undefined
    && gte(getCoherencePoints(reality), CHARACTER_UNLOCK_COSTS[characterId]);
}

export function unlockCharacter(
  state: GameState,
  characterId: UnlockableCharacterId,
): boolean {
  if (!canUnlockCharacter(state, characterId)) return false;
  const reality = state.strata[realityStratumId]!;
  reality.coherencePoints = sub(
    getCoherencePoints(reality),
    CHARACTER_UNLOCK_COSTS[characterId],
  );
  grantCharacter(state, characterId);
  return true;
}
