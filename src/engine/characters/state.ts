export interface CharacterSystemState {
  ownedCharacterIds: string[];
  productionSlotsByStratum: Record<string, Array<string | null>>;
}

export function createCharacterSystemState(): CharacterSystemState {
  return {
    ownedCharacterIds: [],
    productionSlotsByStratum: {},
  };
}
