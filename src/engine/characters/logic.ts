import type { GameState } from "@/engine/core/state";
import { add, mul, normalizeNum, ONE, sub, type Num } from "@/engine/math/num";
import { STRATUM_DEFINITIONS } from "@/engine/strata/defs";
import { applyCrushFiveFaithToCharacterBonus } from "@/engine/crush/effects";
import {
  ALPHA_CHARACTER_ID,
  ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID,
  CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID,
  CHARACTER_DEFINITIONS,
  CHARACTER_MIN_LEVEL,
  CHARACTER_PRODUCTION_SLOT_COUNT,
  CHARACTER_ROSTER_SLOT_COUNT,
  COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID,
  DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID,
  DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID,
  ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID,
  SHIELDING_EFFICIENCY_AFFIX_ID,
  clampCharacterLevel,
  getCharacterAffixValue,
  getCharacterDefinition,
  type CharacterAffixId,
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
  state.characters.levels ??= {};
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

  for (const characterId of characters.ownedCharacterIds) {
    characters.levels[characterId] = clampCharacterLevel(
      normalizeNum(characters.levels[characterId], CHARACTER_MIN_LEVEL),
    );
  }

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
  grantCharacter(state, ALPHA_CHARACTER_ID);
}

export function grantCharacter(state: GameState, characterId: string): void {
  if (!getCharacterDefinition(characterId)) return;
  const characters = ensureCharacterSystemState(state);
  if (!characters.ownedCharacterIds.includes(characterId)) {
    characters.ownedCharacterIds.push(characterId);
  }
  characters.levels[characterId] ??= CHARACTER_MIN_LEVEL;
  if (!findCharacterLocation(state, characterId)) {
    const emptyIndex = characters.rosterSlots.indexOf(null);
    if (emptyIndex >= 0) characters.rosterSlots[emptyIndex] = characterId;
  }
}

export function getCharacterLevel(state: GameState, characterId: string): Num {
  const level = ensureCharacterSystemState(state).levels[characterId] ?? CHARACTER_MIN_LEVEL;
  return clampCharacterLevel(normalizeNum(level, CHARACTER_MIN_LEVEL));
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

export function returnCharactersToRosterFromStratum(
  state: GameState,
  stratumId: string,
): void {
  const productionSlots = getCharacterProductionSlots(state, stratumId);
  const rosterSlots = getCharacterRosterSlots(state);
  let changed = false;

  for (let slotIndex = 0; slotIndex < productionSlots.length; slotIndex++) {
    const characterId = productionSlots[slotIndex];
    if (typeof characterId !== "string") continue;
    const emptyRosterIndex = rosterSlots.indexOf(null);
    if (emptyRosterIndex < 0) break;
    rosterSlots[emptyRosterIndex] = characterId;
    productionSlots[slotIndex] = null;
    changed = true;
  }

  if (changed) syncCharacterProductionPowers(state);
}

function getProductionCharacterAffixValues(
  state: GameState,
  stratumId: string,
  affixId: CharacterAffixId,
): Num[] {
  const values: Num[] = [];
  for (const characterId of getCharacterProductionSlots(state, stratumId)) {
    if (characterId === null) continue;
    const definition = getCharacterDefinition(characterId);
    if (!definition?.affixIds.includes(affixId)) continue;
    values.push(getCharacterAffixValue(affixId, getCharacterLevel(state, characterId)));
  }
  return values;
}

function getMultiplicativeCharacterAffix(
  state: GameState,
  stratumId: string,
  affixId: CharacterAffixId,
): Num {
  return getProductionCharacterAffixValues(state, stratumId, affixId)
    .reduce((product, value) => mul(product, value), ONE);
}

function applyFaithCharacterBonus(
  state: GameState,
  stratumId: string,
  bonus: Num,
  includeFaith: boolean,
): Num {
  const stratum = state.strata[stratumId];
  return includeFaith && stratum
    ? applyCrushFiveFaithToCharacterBonus(stratum, bonus)
    : bonus;
}

export function getCharacterDreamCrystalMultiplierPower(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  const power = getProductionCharacterAffixValues(
    state,
    stratumId,
    DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID,
  ).reduce((power, value) => add(power, sub(value, ONE)), ONE);
  return applyFaithCharacterBonus(state, stratumId, power, includeFaith);
}

export function getCharacterDreamCrystalMultiplier(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  const multiplier = mul(
    getMultiplicativeCharacterAffix(state, stratumId, DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID),
    getMultiplicativeCharacterAffix(state, stratumId, ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID),
  );
  return applyFaithCharacterBonus(state, stratumId, multiplier, includeFaith);
}

export function getCharacterCoherencePointGainMultiplier(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  return applyFaithCharacterBonus(state, stratumId, getMultiplicativeCharacterAffix(
    state,
    stratumId,
    COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID,
  ), includeFaith);
}

export function getCharacterChaoticEtherGainMultiplier(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  return applyFaithCharacterBonus(state, stratumId, getMultiplicativeCharacterAffix(
    state,
    stratumId,
    CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID,
  ), includeFaith);
}

export function getCharacterElectromagneticPowerGainMultiplier(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  return applyFaithCharacterBonus(state, stratumId, getMultiplicativeCharacterAffix(
    state,
    stratumId,
    ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID,
  ), includeFaith);
}

export function getCharacterShieldingEfficiency(
  state: GameState,
  stratumId: string,
  includeFaith = true,
): Num {
  return applyFaithCharacterBonus(
    state,
    stratumId,
    getMultiplicativeCharacterAffix(state, stratumId, SHIELDING_EFFICIENCY_AFFIX_ID),
    includeFaith,
  );
}

export function syncCharacterProductionPowers(state: GameState): void {
  ensureCharacterSystemState(state);
  for (const [stratumId, stratum] of Object.entries(state.strata)) {
    stratum.characterDreamCrystalMultiplier = getCharacterDreamCrystalMultiplier(state, stratumId, false);
    stratum.dreamCrystalMultiplierPower = getCharacterDreamCrystalMultiplierPower(state, stratumId, false);
    stratum.characterCoherencePointGainMultiplier = getCharacterCoherencePointGainMultiplier(
      state,
      stratumId,
      false,
    );
    stratum.characterChaoticEtherGainMultiplier = getCharacterChaoticEtherGainMultiplier(
      state,
      stratumId,
      false,
    );
    stratum.characterElectromagneticPowerGainMultiplier =
      getCharacterElectromagneticPowerGainMultiplier(state, stratumId, false);
    stratum.characterShieldingEfficiency = getCharacterShieldingEfficiency(state, stratumId, false);
  }
}
