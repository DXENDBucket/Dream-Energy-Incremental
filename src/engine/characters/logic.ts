import type { GameState } from "@/engine/core/state";
import { add, mul, ONE, type Num } from "@/engine/math/num";
import { STRATUM_DEFINITIONS } from "@/engine/strata/defs";
import {
  ALPHA_CHARACTER_ID,
  CHARACTER_DEFINITIONS,
  CHARACTER_PRODUCTION_SLOT_COUNT,
  CHARACTER_ROSTER_SLOT_COUNT,
  getCharacterDefinition,
} from "./definitions";
import { createCharacterSystemState, type CharacterSystemState } from "./state";

function createEmptyProductionSlots(): Array<string | null> {
  return Array.from({ length: CHARACTER_PRODUCTION_SLOT_COUNT }, () => null);
}

function createEmptyRosterSlots(): Array<string | null> {
  return Array.from({ length: CHARACTER_ROSTER_SLOT_COUNT }, () => null);
}

export function ensureCharacterSystemState(state: GameState): CharacterSystemState {
  state.characters ??= createCharacterSystemState();
  state.characters.ownedCharacterIds ??= [];
  state.characters.rosterSlots ??= createEmptyRosterSlots();
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
  const placedIds = new Set<string>();
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
        && !placedIds.has(characterId)
      ) {
        normalized[index] = characterId;
        placedIds.add(characterId);
      }
    }
    characters.productionSlotsByStratum[stratumId] = normalized;
  }

  const normalizedRoster = createEmptyRosterSlots();
  for (let index = 0; index < CHARACTER_ROSTER_SLOT_COUNT; index++) {
    const characterId = characters.rosterSlots[index];
    if (
      typeof characterId === "string"
      && ownedIds.has(characterId)
      && !placedIds.has(characterId)
    ) {
      normalizedRoster[index] = characterId;
      placedIds.add(characterId);
    }
  }

  for (const characterId of characters.ownedCharacterIds) {
    if (placedIds.has(characterId)) continue;
    const emptyIndex = normalizedRoster.indexOf(null);
    if (emptyIndex < 0) break;
    normalizedRoster[emptyIndex] = characterId;
    placedIds.add(characterId);
  }
  characters.rosterSlots = normalizedRoster;

  return characters;
}

export function grantStarterCharacters(state: GameState): void {
  const characters = ensureCharacterSystemState(state);
  if (!characters.ownedCharacterIds.includes(ALPHA_CHARACTER_ID)) {
    characters.ownedCharacterIds.push(ALPHA_CHARACTER_ID);
  }
  if (!findCharacterLocation(state, ALPHA_CHARACTER_ID)) {
    const emptyIndex = characters.rosterSlots.indexOf(null);
    if (emptyIndex >= 0) characters.rosterSlots[emptyIndex] = ALPHA_CHARACTER_ID;
  }
}

export function getCharacterRosterSlots(state: GameState): Array<string | null> {
  const characters = ensureCharacterSystemState(state);
  while (characters.rosterSlots.length < CHARACTER_ROSTER_SLOT_COUNT) {
    characters.rosterSlots.push(null);
  }
  return characters.rosterSlots;
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
  return getCharacterRosterSlots(state).filter((id): id is string => id !== null);
}

type CharacterLocation =
  | { kind: "roster"; slotIndex: number }
  | { kind: "production"; stratumId: string; slotIndex: number };

function findCharacterLocation(
  state: GameState,
  characterId: string,
): CharacterLocation | undefined {
  const characters = ensureCharacterSystemState(state);
  const rosterIndex = characters.rosterSlots.indexOf(characterId);
  if (rosterIndex >= 0) return { kind: "roster", slotIndex: rosterIndex };

  for (const [stratumId, slots] of Object.entries(characters.productionSlotsByStratum)) {
    const slotIndex = slots.indexOf(characterId);
    if (slotIndex >= 0) return { kind: "production", stratumId, slotIndex };
  }
  return undefined;
}

function getCharacterAtLocation(state: GameState, location: CharacterLocation): string | null {
  return location.kind === "roster"
    ? getCharacterRosterSlots(state)[location.slotIndex] ?? null
    : getCharacterProductionSlots(state, location.stratumId)[location.slotIndex] ?? null;
}

function setCharacterAtLocation(
  state: GameState,
  location: CharacterLocation,
  characterId: string | null,
): void {
  if (location.kind === "roster") {
    getCharacterRosterSlots(state)[location.slotIndex] = characterId;
  } else {
    getCharacterProductionSlots(state, location.stratumId)[location.slotIndex] = characterId;
  }
}

function moveCharacterToLocation(
  state: GameState,
  characterId: string,
  target: CharacterLocation,
): boolean {
  const characters = ensureCharacterSystemState(state);
  if (!characters.ownedCharacterIds.includes(characterId)) return false;

  const source = findCharacterLocation(state, characterId);
  if (!source) return false;
  const isSameLocation = source.kind === target.kind
    && source.slotIndex === target.slotIndex
    && (
      source.kind === "roster"
      || (target.kind === "production" && source.stratumId === target.stratumId)
    );
  if (isSameLocation) return true;

  const displacedCharacterId = getCharacterAtLocation(state, target);
  setCharacterAtLocation(state, source, displacedCharacterId);
  setCharacterAtLocation(state, target, characterId);
  syncCharacterProductionPowers(state);
  return true;
}

export function moveCharacterToRosterSlot(
  state: GameState,
  slotIndex: number,
  characterId: string,
): boolean {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= CHARACTER_ROSTER_SLOT_COUNT) {
    return false;
  }
  return moveCharacterToLocation(state, characterId, { kind: "roster", slotIndex });
}

export function assignCharacterToProduction(
  state: GameState,
  stratumId: string,
  slotIndex: number,
  characterId: string,
): boolean {
  if (
    !Number.isInteger(slotIndex)
    || slotIndex < 0
    || slotIndex >= CHARACTER_PRODUCTION_SLOT_COUNT
  ) return false;
  return moveCharacterToLocation(state, characterId, {
    kind: "production",
    stratumId,
    slotIndex,
  });
}

export function unassignCharacterFromProduction(
  state: GameState,
  stratumId: string,
  slotIndex: number,
): boolean {
  const slots = getCharacterProductionSlots(state, stratumId);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= slots.length) return false;
  const characterId = slots[slotIndex];
  if (typeof characterId !== "string") return false;
  const emptyRosterIndex = getCharacterRosterSlots(state).indexOf(null);
  if (emptyRosterIndex < 0) return false;
  return moveCharacterToRosterSlot(state, emptyRosterIndex, characterId);
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

export function getCharacterDreamCrystalMultiplier(
  state: GameState,
  stratumId: string,
): Num {
  return getCharacterProductionSlots(state, stratumId).reduce((multiplier, characterId) => {
    if (characterId === null) return multiplier;
    const definition = getCharacterDefinition(characterId);
    return definition
      ? mul(multiplier, definition.dreamCrystalMultiplier)
      : multiplier;
  }, ONE);
}

export function syncCharacterProductionPowers(state: GameState): void {
  ensureCharacterSystemState(state);
  for (const [stratumId, stratum] of Object.entries(state.strata)) {
    stratum.characterDreamCrystalMultiplier = getCharacterDreamCrystalMultiplier(state, stratumId);
    stratum.dreamCrystalMultiplierPower = getCharacterDreamCrystalMultiplierPower(state, stratumId);
  }
}
