import { N, type Num } from "@/engine/math/num";

export const ALPHA_CHARACTER_ID = "alpha";
export const DAWN_CHARACTER_ID = "dawn";
export const DELTA_CHARACTER_ID = "delta";
export const CHARACTER_PRODUCTION_SLOT_COUNT = 2;
export const CHARACTER_ROSTER_SLOT_COUNT = 40;
export const CHARACTER_MIN_LEVEL = 1;
export const CHARACTER_MAX_LEVEL = 100;

export const DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID = "dream-crystal-multiplier";
export const DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID = "dream-crystal-multiplier-power";
export const COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID = "coherence-point-gain-multiplier";
export const CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID = "chaotic-ether-gain-multiplier";

export type CharacterAffixId =
  | typeof DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID
  | typeof DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID
  | typeof COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID
  | typeof CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID;

export type CharacterAffixGrowthCurveId = "shared-dc-multiplier" | "flat";

export interface CharacterAffixDefinition {
  id: CharacterAffixId;
  labelKey: string;
  baseValue: Num;
  growthCurveId: CharacterAffixGrowthCurveId;
  operator: "multiply" | "power";
}

/**
 * Alpha, Dawn and Delta reference this same affix definition. Its level curve
 * can therefore be filled in once when character leveling becomes functional.
 */
export const CHARACTER_AFFIX_DEFINITIONS: Record<CharacterAffixId, CharacterAffixDefinition> = {
  [DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID]: {
    id: DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.dreamCrystalMultiplier",
    baseValue: N(10),
    growthCurveId: "shared-dc-multiplier",
    operator: "multiply",
  },
  [DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID]: {
    id: DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID,
    labelKey: "characters.affixes.dreamCrystalMultiplierPower",
    baseValue: N("1.01"),
    growthCurveId: "flat",
    operator: "power",
  },
  [COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID]: {
    id: COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.coherencePointGainMultiplier",
    baseValue: N(3),
    growthCurveId: "flat",
    operator: "multiply",
  },
  [CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID]: {
    id: CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.chaoticEtherGainMultiplier",
    baseValue: N(10),
    growthCurveId: "flat",
    operator: "multiply",
  },
};

export interface CharacterDefinition {
  id: string;
  symbol: string;
  nameKey: string;
  theme: "monochrome" | "cyan" | "gold";
  affixIds: readonly CharacterAffixId[];
}

export const CHARACTER_DEFINITIONS: readonly CharacterDefinition[] = [
  {
    id: ALPHA_CHARACTER_ID,
    symbol: "α",
    nameKey: "characters.alpha.name",
    theme: "monochrome",
    affixIds: [DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID, DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID],
  },
  {
    id: DAWN_CHARACTER_ID,
    symbol: "☀",
    nameKey: "characters.dawn.name",
    theme: "cyan",
    affixIds: [DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID, COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID],
  },
  {
    id: DELTA_CHARACTER_ID,
    symbol: "Δ",
    nameKey: "characters.delta.name",
    theme: "gold",
    affixIds: [DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID, CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID],
  },
];

export function getCharacterDefinition(id: string): CharacterDefinition | undefined {
  return CHARACTER_DEFINITIONS.find(character => character.id === id);
}

export function getCharacterAffixDefinition(id: CharacterAffixId): CharacterAffixDefinition {
  return CHARACTER_AFFIX_DEFINITIONS[id];
}

export function getCharacterAffixValue(id: CharacterAffixId, _level: number): Num {
  // Level upgrades are intentionally not active yet. Growth is routed through
  // this function so the shared curve can be implemented without editing roles.
  return getCharacterAffixDefinition(id).baseValue;
}
