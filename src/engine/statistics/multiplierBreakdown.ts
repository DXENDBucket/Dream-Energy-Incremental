import type { Num } from "@/engine/math/num";
import {
  N,
  ONE,
  TEN,
  ZERO,
  div,
  floor,
  gt,
  gte,
  log10,
  max,
  mul,
  pow,
  sqrt,
  sub,
} from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
  getDreamEnergy,
  getDreamEnergyDirectProductionBreakdown,
} from "@/engine/strata/common/dream-energy";
import {
  getDreamCrystalAmount,
  getDreamCrystalBoughtPowerMultiplier,
  getDreamCrystalCurrentCoherenceMultiplier,
  getDreamCrystalFirstTierUpgradeMultiplier,
} from "@/engine/strata/common/dream-crystals";
import { getCurrentDreamCrystalRefinementMultiplier } from "@/engine/strata/common/dream-crystals/refinement";
import {
  COHERENCE_CONDENSE_EXPONENT_OFFSET,
  COHERENCE_CONDENSE_REQUIREMENT,
  COHERENCE_DEFAULT_PRODUCTION_LOSS,
} from "@/engine/strata/common/coherence/balance";
import {
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  getCoherenceProductionLoss,
  getCoherenceRepeatableUpgradeBought,
} from "@/engine/strata/common/coherence";
import { getConceptCrystalCoherencePointGainMultiplier } from "@/engine/strata/common/concept-crystals";
import {
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER,
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_START,
  CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR,
  CHAOTIC_ETHER_EXTRACT_REQUIREMENT,
} from "@/engine/strata/common/chaotic-ether/balance";
import {
  CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
  CONCEPT_CRYSTAL_NODE_HARDCAP,
  CONCEPT_CRYSTAL_NODE_IDS,
  ensureConceptCrystalsState,
  getConceptCrystalProductionInterval,
  type ConceptCrystalNodeId,
} from "@/engine/strata/common/concept-crystals";

export type MultiplierBreakdownCategoryId =
  | "dream-energy"
  | "dream-crystals"
  | "coherence-points"
  | "chaotic-ether"
  | "concept-speed";

export interface MultiplierBreakdownEntry {
  id: string;
  factor: Num;
}

export interface MultiplierBreakdownData {
  baseValue: Num;
  totalValue: Num;
  entries: MultiplierBreakdownEntry[];
}

function stageFactor(after: Num, before: Num): Num {
  if (!gt(before, ZERO)) return ONE;
  return max(ZERO, div(after, before));
}

export function getDreamEnergyProductionMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const direct = getDreamEnergyDirectProductionBreakdown(stratum);
  return {
    baseValue: direct.baseProduction,
    totalValue: direct.totalProduction,
    entries: [
      { id: "entropy", factor: direct.entropyFactor },
      { id: "stratum-speed", factor: direct.stratumSpeedFactor },
      { id: "dream-energy-softcaps", factor: direct.standardSoftcapsFactor },
      { id: "concept-conflict", factor: direct.conceptConflictFactor },
      { id: "shielding", factor: direct.shieldingFactor },
    ],
  };
}

export function getDreamCrystalMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const tier = 1;
  const multiplicativeEntries: MultiplierBreakdownEntry[] = [
    { id: "refinement", factor: getCurrentDreamCrystalRefinementMultiplier(stratum, tier) },
    { id: "first-tier-upgrade", factor: getDreamCrystalFirstTierUpgradeMultiplier(stratum, tier) },
    { id: "purchases", factor: getDreamCrystalBoughtPowerMultiplier(stratum, tier) },
    { id: "current-coherence", factor: getDreamCrystalCurrentCoherenceMultiplier(stratum) },
    { id: "entry-coherence", factor: stratum.coherenceDreamCrystalMultiplier ?? ONE },
    { id: "coherence-records", factor: stratum.coherenceProgressionDreamCrystalMultiplier ?? ONE },
    { id: "crush-milestones", factor: stratum.crushDreamCrystalMultiplier ?? ONE },
    { id: "characters", factor: stratum.characterDreamCrystalMultiplier ?? ONE },
  ];

  const multiplierBeforePower = multiplicativeEntries.reduce(
    (product, entry) => mul(product, entry.factor),
    ONE,
  );
  const multiplierPower = stratum.dreamCrystalMultiplierPower ?? ONE;
  const finalMultiplier = pow(multiplierBeforePower, multiplierPower);
  const powerFactor = stageFactor(finalMultiplier, multiplierBeforePower);
  const baseValue = getDreamCrystalAmount(stratum.dreamCrystals, tier);
  const rawProduction = mul(baseValue, finalMultiplier);
  const totalValue = mul(rawProduction, stratum.stratumSpeed);

  return {
    baseValue,
    totalValue,
    entries: [
      ...multiplicativeEntries,
      { id: "multiplier-power", factor: powerFactor },
      { id: "stratum-speed", factor: max(ZERO, stratum.stratumSpeed) },
    ],
  };
}

function getCoherenceConversionBeforeMultiplier(stratum: StratumState, loss: Num): Num {
  const dreamEnergy = getDreamEnergy(stratum);
  if (!gt(dreamEnergy, COHERENCE_CONDENSE_REQUIREMENT) || !gt(loss, ZERO)) return ZERO;
  return pow(
    TEN,
    sub(div(log10(dreamEnergy), loss), COHERENCE_CONDENSE_EXPONENT_OFFSET),
  );
}

export function getCoherencePointMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const baseValue = getCoherenceConversionBeforeMultiplier(
    stratum,
    stratum.coherenceProductionLoss ?? COHERENCE_DEFAULT_PRODUCTION_LOSS,
  );
  const adjustedConversion = getCoherenceConversionBeforeMultiplier(
    stratum,
    getCoherenceProductionLoss(stratum),
  );
  const pointUpgradeBought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  );
  const pointUpgradeFactor = pointUpgradeBought.lte(ZERO)
    ? ONE
    : pow(N(2), pointUpgradeBought);
  const conceptFactor = getConceptCrystalCoherencePointGainMultiplier(stratum);
  const characterFactor = stratum.characterCoherencePointGainMultiplier ?? ONE;
  const totalValue = floor(mul(mul(adjustedConversion, pointUpgradeFactor), mul(conceptFactor, characterFactor)));

  return {
    baseValue,
    totalValue,
    entries: [
      { id: "conversion-efficiency", factor: stageFactor(adjustedConversion, baseValue) },
      { id: "coherence-upgrades", factor: pointUpgradeFactor },
      { id: "concept-balance", factor: conceptFactor },
      { id: "characters", factor: characterFactor },
    ],
  };
}

interface ChaoticEtherGainStages {
  base: Num;
  accelerated: Num;
}

function getChaoticEtherGainStages(stratum: StratumState): ChaoticEtherGainStages {
  const dreamEnergy = getDreamEnergy(stratum);
  if (!gte(dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT)) {
    return { base: ZERO, accelerated: ZERO };
  }

  const dreamEnergyRatio = div(dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT);
  const baseGain = pow(dreamEnergyRatio, div(ONE, CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR));
  if (baseGain.lte(CHAOTIC_ETHER_EXTRACT_ACCELERATION_START)) {
    return { base: baseGain, accelerated: baseGain };
  }

  return {
    base: baseGain,
    accelerated: div(
      pow(
        dreamEnergyRatio,
        div(CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER, CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR),
      ),
      pow(
        CHAOTIC_ETHER_EXTRACT_ACCELERATION_START,
        sub(CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER, ONE),
      ),
    ),
  };
}

export function getChaoticEtherMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const gain = getChaoticEtherGainStages(stratum);
  const characterFactor = stratum.characterChaoticEtherGainMultiplier ?? ONE;
  return {
    baseValue: gain.base,
    totalValue: floor(mul(gain.accelerated, characterFactor)),
    entries: [
      { id: "extraction-acceleration", factor: stageFactor(gain.accelerated, gain.base) },
      { id: "characters", factor: characterFactor },
    ],
  };
}

export function getConceptSpeedMultiplierBreakdown(
  stratum: StratumState,
  nodeId: ConceptCrystalNodeId,
): MultiplierBreakdownData {
  const concepts = ensureConceptCrystalsState(stratum);
  const targetIndex = Math.max(0, CONCEPT_CRYSTAL_NODE_IDS.indexOf(nodeId));
  const sourceIndex = (targetIndex + CONCEPT_CRYSTAL_NODE_IDS.length - 1)
    % CONCEPT_CRYSTAL_NODE_IDS.length;
  const sourceId = CONCEPT_CRYSTAL_NODE_IDS[sourceIndex]!;
  const sourceAmount = concepts.nodes[sourceId];
  const intervalFactor = div(
    CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
    getConceptCrystalProductionInterval(stratum),
  );
  const isSevered = concepts.isSeveringEnabled && concepts.severedPathIndex === sourceIndex;
  const severingFactor = isSevered ? stageFactor(sqrt(sourceAmount), sourceAmount) : ONE;
  const hardcapFactor = gte(concepts.nodes[nodeId], CONCEPT_CRYSTAL_NODE_HARDCAP) ? ZERO : ONE;
  const baseValue = div(sourceAmount, CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC);
  const totalValue = mul(
    baseValue,
    mul(intervalFactor, mul(max(ZERO, stratum.stratumSpeed), mul(severingFactor, hardcapFactor))),
  );

  return {
    baseValue,
    totalValue,
    entries: [
      { id: "concept-interval", factor: intervalFactor },
      { id: "stratum-speed", factor: max(ZERO, stratum.stratumSpeed) },
      { id: "severing", factor: severingFactor },
      { id: "concept-hardcap", factor: hardcapFactor },
    ],
  };
}
