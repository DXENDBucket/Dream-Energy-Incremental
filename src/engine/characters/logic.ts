import type { GameState } from "@/engine/core/state";
import { add, ONE, type Num } from "@/engine/math/num";
import { STRATUM_DEFINITIONS } from "@/engine/strata/defs";
import {
  ALPHA_CHARACTER_ID,
  CHARACTER_DEFINITIONS,
  CHARACTER_PRODUCTION_SLOT_COUNT,
  getCharacterDefinition,
} from "./definitions";
import { createCharacterSystemState, type CharacterSystemState } from "./state";

function createEmptyProductionSlots(): Array<string | null> {
  return Array.from({ length: CHARACTER_PRODUCTION_SLOT_COUNT }, () => null);
}

export function ensureCharacterSystemState(state: GameState): CharacterSystemState {
  state.characters ??= createCharacterSystemState();
  state.characters.ownedCharacterIds ??= [];
  state.characters.productionSlotsByStratum ??= {};

  return state.characters;
}

export function normalizeCharacterSystemState(state: GameState): CharacterSystemState {
  const characters = ensureCharacterSystemState(state);

  const validIds = new Set(CHARACTER_DEFINITIONS.map(character => character.id));
  characters.ownedCharacterIds = [...new Set(
    characters.ownedCharacterIds.filter(id => validIds.has(id)),
  )];

  const ownedIds = new Set(characters.ownedCharacterIds);
  const assignedIds = new Set<string>();
  const orderedStratumIds = [
    ...STRATUM_DEFINITIONS.map(definition => definition.id),
    ...Object.keys(characters.productionSlotsByStratum),
  ];

  for (const stratumId of new Set(orderedStratumIds)) {
    const existing = characters.productionSlotsByStratum[stratumId] ?? [];
    const normalized = createEmptyProductionSlots();
    for (let index = 0; index < CHARACTER_PRODUCTION_SLOT_COUNT; index++) {
      const characterId = existing[index];
      if (
        typeof characterId === "string"
        && ownedIds.has(characterId)
        && !assignedIds.has(characterId)
      ) {
        normalized[index] = characterId;
        assignedIds.add(characterId);
      }
    }
    characters.productionSlotsByStratum[stratumId] = normalized;
  }

  return characters;
}

export function grantStarterCharacters(state: GameState): void {
  const characters = ensureCharacterSystemState(state);
  if (!characters.ownedCharacterIds.includes(ALPHA_CHARACTER_ID)) {
    characters.ownedCharacterIds.push(ALPHA_CHARACTER_ID);
  }
}

export function getCharacterProductionSlots(
  state: GameState,
  stratumId: string,
): Array<string | null> {
  const characters = ensureCharacterSystemState(state);
  if (!Array.isArray(characters.productionSlotsByStratum[stratumId])) {
    characters.productionSlotsByStratum[stratumId] = createEmptyProductionSlots();
  }
  return characters.productionSlotsByStratum[stratumId]!;
}

export function getAssignedCharacterIds(state: GameState): Set<string> {
  const characters = ensureCharacterSystemState(state);
  return new Set(Object.values(characters.productionSlotsByStratum).flatMap(slots =>
    slots.filter((id): id is string => typeof id === "string"),
  ));
}

export function getUnassignedCharacterIds(state: GameState): string[] {
  const characters = ensureCharacterSystemState(state);
  const assignedIds = getAssignedCharacterIds(state);
  return characters.ownedCharacterIds.filter(id => !assignedIds.has(id));
}

export function assignCharacterToProduction(
  state: GameState,
  stratumId: string,
  slotIndex: number,
  characterId: string,
): boolean {
  const characters = ensureCharacterSystemState(state);
  if (
    !Number.isInteger(slotIndex)
    || slotIndex < 0
    || slotIndex >= CHARACTER_PRODUCTION_SLOT_COUNT
    || !characters.ownedCharacterIds.includes(characterId)
  ) return false;

  for (const slots of Object.values(characters.productionSlotsByStratum)) {
    for (let index = 0; index < slots.length; index++) {
      if (slots[index] === characterId) slots[index] = null;
    }
  }

  getCharacterProductionSlots(state, stratumId)[slotIndex] = characterId;
  syncCharacterProductionPowers(state);
  return true;
}

export function unassignCharacterFromProduction(
  state: GameState,
  stratumId: string,
  slotIndex: number,
): boolean {
  const slots = getCharacterProductionSlots(state, stratumId);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= slots.length) return false;
  if (slots[slotIndex] === null) return false;
  slots[slotIndex] = null;
  syncCharacterProductionPowers(state);
  return true;
}

export function getCharacterDreamCrystalMultiplierPower(
  state: GameState,
  stratumId: string,
): Num {
  return getCharacterProductionSlots(state, stratumId).reduce((power, characterId) => {
    if (characterId === null) return power;
    const definition = getCharacterDefinition(characterId);
    return definition
      ? add(power, definition.dreamCrystalMultiplierPowerBonus)
      : power;
  }, ONE);
}

export function syncCharacterProductionPowers(state: GameState): void {
  ensureCharacterSystemState(state);
  for (const [stratumId, stratum] of Object.entries(state.strata)) {
    stratum.dreamCrystalMultiplierPower = getCharacterDreamCrystalMultiplierPower(state, stratumId);
  }
}
