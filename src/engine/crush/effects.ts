import { N, ONE, ZERO, add, div, log10, logn, max, mul, pow, sub, type Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
  CONCEPT_CRYSTAL_CP_GAIN_SCALE,
  CONCEPT_CRYSTAL_NODE_BASE_LOG_WEIGHT,
  CONCEPT_CRYSTAL_NODE_MAGNITUDE_POWER,
  CONCEPT_CRYSTAL_NODE_PER_CRYSTAL_LOG_WEIGHT,
  CONCEPT_CRYSTAL_NODE_SCALE_LOG_WEIGHT,
  CONCEPT_CRYSTAL_STANDARD_EFFECT_LOG_POWER,
} from "@/engine/strata/common/concept-crystals/balance";

export function isCrushOneActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 1;
}

export function isCrushTwoActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 2;
}

export function isCrushThreeActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 3;
}

export function isCrushFourActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 4;
}

export function isCrushFiveActive(stratum: StratumState): boolean {
  return (stratum.crushMilestoneCount ?? 0) >= 5;
}

export function getCrushOneChaoticEtherGainMultiplier(stratum: StratumState): Num {
  if (!isCrushOneActive(stratum)) return ONE;
  const bestDreamEnergyLog2 = logn(max(stratum.bestDreamEnergy, ONE), N(2));
  return max(ONE, pow(bestDreamEnergyLog2, N(4)));
}

export function isDreamCrystalProductionDisabledByCrush(
  stratum: StratumState,
  sourceTier: number,
): boolean {
  if (isCrushFiveActive(stratum) && sourceTier >= 3) return true;
  if (isCrushThreeActive(stratum) && sourceTier >= 5) return true;
  return isCrushOneActive(stratum) && sourceTier >= 7;
}

function getInvertedConceptEfficiency(
  stratum: StratumState,
  nodeAmount: Num,
): Num {
  const heldConceptCrystals = max(stratum.conceptCrystals?.amount ?? ONE, ONE);
  const heldAmountExponent = add(
    ONE,
    mul(N(0.065), max(ZERO, sub(heldConceptCrystals, ONE))),
  );
  return pow(max(nodeAmount, ONE), div(heldAmountExponent, N(154)));
}

export function getCrushTwoConsensusShieldingEfficiency(stratum: StratumState): Num {
  if (!isCrushTwoActive(stratum)) return ONE;
  return getInvertedConceptEfficiency(
    stratum,
    stratum.conceptCrystals?.nodes?.conquest ?? ONE,
  );
}

export function getCrushFourFreedomSoftcapEfficiency(stratum: StratumState): Num {
  if (!isCrushFourActive(stratum)) return ONE;
  return getInvertedConceptEfficiency(
    stratum,
    stratum.conceptCrystals?.nodes?.shackle ?? ONE,
  );
}

export function applyCrushFourFreedomToSoftcapStrength(
  stratum: StratumState,
  strength: Num,
): Num {
  const efficiency = getCrushFourFreedomSoftcapEfficiency(stratum);
  return add(ONE, div(max(ZERO, sub(strength, ONE)), efficiency));
}

function getCrushFiveInnerConceptEfficiency(
  stratum: StratumState,
  nodeId: "faith" | "justice" | "revolution",
): Num {
  if (!isCrushFiveActive(stratum)) return ONE;
  return getInvertedConceptEfficiency(
    stratum,
    stratum.conceptCrystals?.innerNodes?.[nodeId] ?? ONE,
  );
}

export function getCrushFiveFaithCharacterBonusPower(stratum: StratumState): Num {
  const faithEfficiency = getCrushFiveInnerConceptEfficiency(stratum, "faith");
  return add(ONE, div(log10(max(faithEfficiency, ONE)), N(50)));
}

export function applyCrushFiveFaithToCharacterBonus(stratum: StratumState, bonus: Num): Num {
  if (!isCrushFiveActive(stratum)) return bonus;
  return pow(max(bonus, ONE), getCrushFiveFaithCharacterBonusPower(stratum));
}

export function getCrushFiveJusticeEntropyDivisor(stratum: StratumState): Num {
  return getCrushFiveInnerConceptEfficiency(stratum, "justice");
}

export function getCrushFiveRevolutionChaoticEtherMultiplier(stratum: StratumState): Num {
  if (!isCrushFiveActive(stratum)) return ONE;

  const amount = max(
    stratum.conceptCrystals?.innerNodes?.revolution ?? ONE,
    ONE,
  );
  const heldConceptCrystals = max(stratum.conceptCrystals?.amount ?? ONE, ONE);
  const magnitude = pow(
    max(ZERO, log10(amount)),
    CONCEPT_CRYSTAL_NODE_MAGNITUDE_POWER,
  );
  const scaleWeight = mul(
    CONCEPT_CRYSTAL_NODE_SCALE_LOG_WEIGHT,
    div(CONCEPT_CRYSTAL_CP_GAIN_SCALE, add(ONE, CONCEPT_CRYSTAL_CP_GAIN_SCALE)),
  );
  const heldWeight = mul(
    CONCEPT_CRYSTAL_NODE_PER_CRYSTAL_LOG_WEIGHT,
    max(ZERO, sub(heldConceptCrystals, ONE)),
  );
  const rawEffectLog = mul(
    add(add(CONCEPT_CRYSTAL_NODE_BASE_LOG_WEIGHT, scaleWeight), heldWeight),
    magnitude,
  );

  return pow(
    add(ONE, rawEffectLog),
    CONCEPT_CRYSTAL_STANDARD_EFFECT_LOG_POWER,
  );
}
