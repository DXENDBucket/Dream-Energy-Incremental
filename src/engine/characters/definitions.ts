import { N, type Num } from "@/engine/math/num";

export const ALPHA_CHARACTER_ID = "alpha";
export const CHARACTER_PRODUCTION_SLOT_COUNT = 5;
export const CHARACTER_ROSTER_SLOT_COUNT = 40;

export interface CharacterDefinition {
  id: string;
  symbol: string;
  nameKey: string;
  theme: "monochrome";
  dreamCrystalMultiplierPowerBonus: Num;
}

export const CHARACTER_DEFINITIONS: readonly CharacterDefinition[] = [
  {
    id: ALPHA_CHARACTER_ID,
    symbol: "α",
    nameKey: "characters.alpha.name",
    theme: "monochrome",
    dreamCrystalMultiplierPowerBonus: N("0.005"),
  },
];

export function getCharacterDefinition(id: string): CharacterDefinition | undefined {
  return CHARACTER_DEFINITIONS.find(character => character.id === id);
}
