import { N, ONE, add, floor, log10, max, mul, pow, sub, type Num } from "@/engine/math/num";

export const ALPHA_CHARACTER_ID = "alpha";
export const DAWN_CHARACTER_ID = "dawn";
export const DELTA_CHARACTER_ID = "delta";
export const CHARACTER_PRODUCTION_SLOT_COUNT = 2;
export const CHARACTER_ROSTER_SLOT_COUNT = 40;
export const CHARACTER_MIN_LEVEL = N(1);

export const DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID = "dream-crystal-multiplier";
export const DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID = "dream-crystal-multiplier-power";
export const COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID = "coherence-point-gain-multiplier";
export const CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID = "chaotic-ether-gain-multiplier";

export type CharacterAffixId =
  | typeof DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID
  | typeof DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID
  | typeof COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID
  | typeof CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID;

export type CharacterAffixGrowthCurveId =
  | "shared-dc-multiplier"
  | "alpha-power"
  | "support-multiplier";

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
    growthCurveId: "alpha-power",
    operator: "power",
  },
  [COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID]: {
    id: COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.coherencePointGainMultiplier",
    baseValue: N(3),
    growthCurveId: "support-multiplier",
    operator: "multiply",
  },
  [CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID]: {
    id: CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.chaoticEtherGainMultiplier",
    baseValue: N(10),
    growthCurveId: "support-multiplier",
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

export function clampCharacterLevel(level: Num): Num {
  return max(CHARACTER_MIN_LEVEL, floor(level));
}

export function getCharacterAffixValue(id: CharacterAffixId, level: Num): Num {
  const affix = getCharacterAffixDefinition(id);
  const clampedLevel = clampCharacterLevel(level);
  const levelsAboveOne = sub(clampedLevel, ONE);

  if (affix.growthCurveId === "shared-dc-multiplier") {
    return mul(affix.baseValue, pow(N("1.1"), levelsAboveOne));
  }
  if (affix.growthCurveId === "support-multiplier") {
    return mul(affix.baseValue, pow(N("1.06"), levelsAboveOne));
  }

  return add(affix.baseValue, mul(N("0.01"), log10(clampedLevel)));
}
