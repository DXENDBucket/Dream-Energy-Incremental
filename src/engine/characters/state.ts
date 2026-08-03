import { CHARACTER_ROSTER_SLOT_COUNT } from "./definitions";
import type { Num } from "@/engine/math/num";

export interface CharacterSystemState {
  ownedCharacterIds: string[];
  levels: Record<string, Num>;
  rosterSlots: Array<string | null>;
  productionSlotsByStratum: Record<string, Array<string | null>>;
}

export function createCharacterSystemState(): CharacterSystemState {
  return {
    ownedCharacterIds: [],
    levels: {},
    rosterSlots: Array.from({ length: CHARACTER_ROSTER_SLOT_COUNT }, () => null),
    productionSlotsByStratum: {},
  };
}
