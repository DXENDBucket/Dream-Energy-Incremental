import { N, ONE, add, floor, log10, max, min, mul, pow, sub, type Num } from "@/engine/math/num";

export const ALPHA_CHARACTER_ID = "alpha";
export const DAWN_CHARACTER_ID = "dawn";
export const DELTA_CHARACTER_ID = "delta";
export const MECHANIST_CHARACTER_ID = "mechanist";
export const ACE_CHARACTER_ID = "ace";
export const CHARACTER_PRODUCTION_SLOT_COUNT = 2;
export const CHARACTER_ROSTER_SLOT_COUNT = 40;
export const CHARACTER_MIN_LEVEL = N(1);
export const CHARACTER_MAX_LEVEL = N(100);

export const DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID = "dream-crystal-multiplier";
export const DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID = "dream-crystal-multiplier-power";
export const COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID = "coherence-point-gain-multiplier";
export const CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID = "chaotic-ether-gain-multiplier";
export const ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID = "electromagnetic-power-gain-multiplier";
export const ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID = "ace-dream-crystal-multiplier";
export const SHIELDING_EFFICIENCY_AFFIX_ID = "shielding-efficiency";

export type CharacterAffixId =
  | typeof DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID
  | typeof DREAM_CRYSTAL_MULTIPLIER_POWER_AFFIX_ID
  | typeof COHERENCE_POINT_GAIN_MULTIPLIER_AFFIX_ID
  | typeof CHAOTIC_ETHER_GAIN_MULTIPLIER_AFFIX_ID
  | typeof ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID
  | typeof ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID
  | typeof SHIELDING_EFFICIENCY_AFFIX_ID;

export type CharacterAffixGrowthCurveId =
  | "shared-dc-multiplier"
  | "squared-shared-dc-multiplier"
  | "alpha-power"
  | "support-multiplier"
  | "shielding-efficiency";

export interface CharacterAffixDefinition {
  id: CharacterAffixId;
  labelKey: string;
  baseValue: Num;
  growthCurveId: CharacterAffixGrowthCurveId;
  operator: "multiply" | "power";
}

/**
 * Alpha, Dawn, Delta and Mechanist reference this same affix definition. Its level curve
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
  [ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID]: {
    id: ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.electromagneticPowerGainMultiplier",
    baseValue: N(3),
    growthCurveId: "support-multiplier",
    operator: "multiply",
  },
  [ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID]: {
    id: ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID,
    labelKey: "characters.affixes.dreamCrystalMultiplier",
    baseValue: N(100),
    growthCurveId: "squared-shared-dc-multiplier",
    operator: "multiply",
  },
  [SHIELDING_EFFICIENCY_AFFIX_ID]: {
    id: SHIELDING_EFFICIENCY_AFFIX_ID,
    labelKey: "characters.affixes.shieldingEfficiency",
    baseValue: N("1.05"),
    growthCurveId: "shielding-efficiency",
    operator: "multiply",
  },
};

export interface CharacterDefinition {
  id: string;
  symbol: string;
  nameKey: string;
  theme: "monochrome" | "cyan" | "gold" | "orange" | "shielding";
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
  {
    id: MECHANIST_CHARACTER_ID,
    symbol: "⚡",
    nameKey: "characters.mechanist.name",
    theme: "orange",
    affixIds: [DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID, ELECTROMAGNETIC_POWER_GAIN_MULTIPLIER_AFFIX_ID],
  },
  {
    id: ACE_CHARACTER_ID,
    symbol: "🛡",
    nameKey: "characters.ace.name",
    theme: "shielding",
    affixIds: [ACE_DREAM_CRYSTAL_MULTIPLIER_AFFIX_ID, SHIELDING_EFFICIENCY_AFFIX_ID],
  },
];

export function getCharacterDefinition(id: string): CharacterDefinition | undefined {
  return CHARACTER_DEFINITIONS.find(character => character.id === id);
}

export function getCharacterAffixDefinition(id: CharacterAffixId): CharacterAffixDefinition {
  return CHARACTER_AFFIX_DEFINITIONS[id];
}

export function clampCharacterLevel(level: Num): Num {
  return min(CHARACTER_MAX_LEVEL, max(CHARACTER_MIN_LEVEL, floor(level)));
}

export function getCharacterAffixValue(id: CharacterAffixId, level: Num): Num {
  const affix = getCharacterAffixDefinition(id);
  const clampedLevel = clampCharacterLevel(level);
  const levelsAboveOne = sub(clampedLevel, ONE);

  if (affix.growthCurveId === "shared-dc-multiplier") {
    return mul(affix.baseValue, pow(N("1.1"), levelsAboveOne));
  }
  if (affix.growthCurveId === "squared-shared-dc-multiplier") {
    return pow(mul(N(10), pow(N("1.1"), levelsAboveOne)), N(2));
  }
  if (affix.growthCurveId === "support-multiplier") {
    return mul(affix.baseValue, pow(N("1.06"), levelsAboveOne));
  }
  if (affix.growthCurveId === "shielding-efficiency") {
    return pow(N("1.05"), clampedLevel);
  }

  return add(affix.baseValue, mul(N("0.01"), log10(clampedLevel)));
}
