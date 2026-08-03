export interface CharacterSystemState {
  ownedCharacterIds: string[];
  rosterSlots: Array<string | null>;
  productionSlotsByStratum: Record<string, Array<string | null>>;
}

export function createCharacterSystemState(): CharacterSystemState {
  return {
    ownedCharacterIds: [],
    rosterSlots: Array.from({ length: CHARACTER_ROSTER_SLOT_COUNT }, () => null),
    productionSlotsByStratum: {},
  };
}
import { CHARACTER_ROSTER_SLOT_COUNT } from "./definitions";
