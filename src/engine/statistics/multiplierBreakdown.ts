import type { Num } from "@/engine/math/num";
import {
  N,
  ONE,
  TEN,
  ZERO,
  add,
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
  applyCrushFiveFaithToCharacterBonus,
  getCrushFiveRevolutionChaoticEtherMultiplier,
  getCrushOneChaoticEtherGainMultiplier,
  getCrushSixPeaceConceptProductionSpeedMultiplier,
} from "@/engine/crush/effects";
import { DREAM_CRYSTAL_TIERS } from "@/engine/math/dream-crystals";
import {
  getDreamEnergy,
  getDreamEnergyDirectProductionBreakdown,
} from "@/engine/strata/common/dream-energy";
import {
  getDreamCrystalAmount,
  getDreamCrystalBought,
  getDreamCrystalBoughtPowerMultiplier,
  getDreamCrystalCurrentCoherenceMultiplier,
  getDreamCrystalFirstTierUpgradeMultiplier,
} from "@/engine/strata/common/dream-crystals";
import { applyEntropyToProduction } from "@/engine/strata/common/entropy";
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
import { getCoherenceElectromagneticPowerGainMultiplier } from "@/engine/strata/common/coherence/upgrades";
import { getConceptCrystalCoherencePointGainMultiplier } from "@/engine/strata/common/concept-crystals";
import {
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER,
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_START,
  CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR,
  CHAOTIC_ETHER_EXTRACT_REQUIREMENT,
} from "@/engine/strata/common/chaotic-ether/balance";
import {
  CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC,
  CONCEPT_CRYSTAL_INTERVAL_REDUCTION,
  CONCEPT_CRYSTAL_NODE_HARDCAP,
  CONCEPT_CRYSTAL_NODE_IDS,
  ensureConceptCrystalsState,
  type ConceptCrystalNodeId,
} from "@/engine/strata/common/concept-crystals";
import {
  ELECTROMAGNETIC_POWER_PER_CROSSING,
  getElectromagneticDreamCrystalMultiplier,
  getElectromagneticPowerPerCrossing,
  getElectromagneticUpgradeAdvancedPowerGainMultiplier,
  getElectromagneticUpgradePowerGainMultiplier,
} from "@/engine/electromagnetic-crystals";
import { isElectromagneticCrystalsUnlocked } from "@/engine/strata/common/milestones";

export type MultiplierBreakdownCategoryId =
  | "dream-energy"
  | "dream-crystals"
  | "coherence-points"
  | "chaotic-ether"
  | "electromagnetic-power"
  | "concept-speed";

export interface MultiplierBreakdownEntry {
  id: string;
  factor: Num;
  labelKey?: string;
  labelValues?: Record<string, string | number>;
  children?: MultiplierBreakdownEntry[];
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

function createDreamCrystalTierGroup(
  id: string,
  tiers: readonly number[],
  getFactor: (tier: number) => Num,
): MultiplierBreakdownEntry {
  const children = tiers.map(tier => ({
    id: `${id}-dc-${tier}`,
    factor: getFactor(tier),
  }));
  // The headline describes the selected target (DC1). Higher-tier rows are
  // supporting detail, rather than extra factors applied to DC1 a second time.
  return { id, factor: children[0]?.factor ?? ONE, children };
}

export function getDreamCrystalMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const firstTier = 1;
  const highestActiveTier = [...DREAM_CRYSTAL_TIERS]
    .reverse()
    .find(candidate => gt(getDreamCrystalAmount(stratum.dreamCrystals, candidate), ZERO))
    ?? firstTier;
  const activeTiers = DREAM_CRYSTAL_TIERS.filter(tier => tier <= highestActiveTier);
  const firstTierAmount = getDreamCrystalAmount(stratum.dreamCrystals, firstTier);
  const multiplierPower = applyCrushFiveFaithToCharacterBonus(
    stratum,
    stratum.dreamCrystalMultiplierPower ?? ONE,
  );
  const currentCoherenceFactor = getDreamCrystalCurrentCoherenceMultiplier(stratum);
  const entryCoherenceFactor = stratum.coherenceDreamCrystalMultiplier ?? ONE;
  const coherenceRecordsFactor = stratum.coherenceProgressionDreamCrystalMultiplier ?? ONE;
  const crushFactor = stratum.crushDreamCrystalMultiplier ?? ONE;
  const characterFactor = applyCrushFiveFaithToCharacterBonus(
    stratum,
    stratum.characterDreamCrystalMultiplier ?? ONE,
  );
  const electromagneticFactor = getElectromagneticDreamCrystalMultiplier(stratum);
  const speedFactor = max(ZERO, stratum.stratumSpeed);

  const refinementGroup = createDreamCrystalTierGroup(
    "refinement",
    activeTiers,
    tier => getCurrentDreamCrystalRefinementMultiplier(stratum, tier),
  );
  const firstTierUpgradeGroup = createDreamCrystalTierGroup(
    "first-tier-upgrade",
    activeTiers,
    tier => getDreamCrystalFirstTierUpgradeMultiplier(stratum, tier),
  );
  const purchasesGroup = createDreamCrystalTierGroup(
    "purchases",
    activeTiers,
    tier => getDreamCrystalBoughtPowerMultiplier(stratum, tier),
  );
  const currentCoherenceGroup = createDreamCrystalTierGroup(
    "current-coherence",
    activeTiers,
    () => currentCoherenceFactor,
  );
  const entryCoherenceGroup = createDreamCrystalTierGroup(
    "entry-coherence",
    activeTiers,
    () => entryCoherenceFactor,
  );
  const coherenceRecordsGroup = createDreamCrystalTierGroup(
    "coherence-records",
    activeTiers,
    () => coherenceRecordsFactor,
  );
  const crushGroup = createDreamCrystalTierGroup(
    "crush-milestones",
    activeTiers,
    () => crushFactor,
  );
  const charactersGroup = createDreamCrystalTierGroup(
    "characters",
    activeTiers,
    () => characterFactor,
  );
  const electromagneticGroup = createDreamCrystalTierGroup(
    "electromagnetic-power",
    activeTiers,
    () => electromagneticFactor,
  );

  const beforePowerByTier = new Map<number, Num>();
  const finalMultiplierByTier = new Map<number, Num>();
  for (const tier of activeTiers) {
    const beforePower = mul(
      mul(
        mul(
          getCurrentDreamCrystalRefinementMultiplier(stratum, tier),
          getDreamCrystalFirstTierUpgradeMultiplier(stratum, tier),
        ),
        getDreamCrystalBoughtPowerMultiplier(stratum, tier),
      ),
      mul(
        mul(currentCoherenceFactor, entryCoherenceFactor),
        mul(
          mul(coherenceRecordsFactor, crushFactor),
          mul(characterFactor, electromagneticFactor),
        ),
      ),
    );
    beforePowerByTier.set(tier, beforePower);
    finalMultiplierByTier.set(tier, pow(beforePower, multiplierPower));
  }

  const multiplierPowerGroup = createDreamCrystalTierGroup(
    "multiplier-power",
    activeTiers,
    tier => multiplierPower.eq(ONE)
      ? ONE
      : pow(
        beforePowerByTier.get(tier) ?? ONE,
        sub(multiplierPower, ONE),
      ),
  );
  const stratumSpeedGroup = createDreamCrystalTierGroup(
    "stratum-speed",
    activeTiers,
    () => speedFactor,
  );

  function getDirectTierBaseline(tier: number): Num {
    const amount = getDreamCrystalAmount(stratum.dreamCrystals, tier);
    if (!gt(amount, ZERO)) return ZERO;

    const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
    if (gt(bought, ZERO)) return amount.lt(bought) ? amount : bought;
    return amount.lt(ONE) ? amount : ONE;
  }

  const firstTierBase = getDirectTierBaseline(firstTier);
  const productionChainFactor = gt(firstTierBase, ZERO)
    ? max(ONE, div(firstTierAmount, firstTierBase))
    : ONE;

  // Per-transition stored amounts are useful attribution weights, but are not
  // instantaneous multipliers. Split the exact DC1 chain factor across them in
  // log-space so every child is >= 1 and their product remains the headline.
  const chainAttributions = activeTiers
    .filter(targetTier => targetTier < highestActiveTier)
    .map(targetTier => {
      const amount = getDreamCrystalAmount(stratum.dreamCrystals, targetTier);
      const baseline = getDirectTierBaseline(targetTier);
      const indicator = gt(baseline, ZERO) ? max(ONE, div(amount, baseline)) : ONE;
      return {
        sourceTier: targetTier + 1,
        targetTier,
        weight: max(ZERO, log10(indicator)),
      };
    });
  const totalChainWeight = chainAttributions.reduce(
    (total, attribution) => add(total, attribution.weight),
    ZERO,
  );
  const chainChildren: MultiplierBreakdownEntry[] = chainAttributions.map(attribution => ({
    id: `production-chain-${attribution.sourceTier}-to-${attribution.targetTier}`,
    factor: gt(totalChainWeight, ZERO)
      ? pow(productionChainFactor, div(attribution.weight, totalChainWeight))
      : ONE,
    labelKey: "multiplierBreakdown.entries.dcTierTransition",
    labelValues: {
      source: attribution.sourceTier,
      target: attribution.targetTier,
    },
  }));
  const productionChainGroup: MultiplierBreakdownEntry = {
    id: "production-chain",
    factor: productionChainFactor,
    children: chainChildren,
  };

  const rawFirstTierProduction = mul(
    firstTierAmount,
    finalMultiplierByTier.get(firstTier) ?? ONE,
  );
  const entropyAdjustedProduction = applyEntropyToProduction(stratum, rawFirstTierProduction);
  const entropyFactor = stageFactor(entropyAdjustedProduction, rawFirstTierProduction);
  const totalValue = mul(entropyAdjustedProduction, speedFactor);

  return {
    baseValue: firstTierBase,
    totalValue,
    entries: [
      productionChainGroup,
      refinementGroup,
      firstTierUpgradeGroup,
      purchasesGroup,
      currentCoherenceGroup,
      entryCoherenceGroup,
      coherenceRecordsGroup,
      crushGroup,
      charactersGroup,
      electromagneticGroup,
      multiplierPowerGroup,
      { id: "entropy", factor: entropyFactor },
      stratumSpeedGroup,
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
  const characterFactor = applyCrushFiveFaithToCharacterBonus(
    stratum,
    stratum.characterCoherencePointGainMultiplier ?? ONE,
  );
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
  const characterFactor = applyCrushFiveFaithToCharacterBonus(
    stratum,
    stratum.characterChaoticEtherGainMultiplier ?? ONE,
  );
  const crushOneFactor = getCrushOneChaoticEtherGainMultiplier(stratum);
  const revolutionFactor = getCrushFiveRevolutionChaoticEtherMultiplier(stratum);
  return {
    baseValue: gain.base,
    totalValue: floor(mul(
      mul(mul(gain.accelerated, characterFactor), crushOneFactor),
      revolutionFactor,
    )),
    entries: [
      { id: "extraction-acceleration", factor: stageFactor(gain.accelerated, gain.base) },
      { id: "characters", factor: characterFactor },
      { id: "crush-one", factor: crushOneFactor },
      { id: "revolution", factor: revolutionFactor },
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
  const intervalFactor = pow(
    div(ONE, CONCEPT_CRYSTAL_INTERVAL_REDUCTION),
    concepts.intervalUpgrades,
  );
  const peaceFactor = getCrushSixPeaceConceptProductionSpeedMultiplier(stratum);
  const isSevered = concepts.isSeveringEnabled && concepts.severedPathIndex === sourceIndex;
  const severingFactor = isSevered ? stageFactor(sqrt(sourceAmount), sourceAmount) : ONE;
  const hardcapFactor = gte(concepts.nodes[nodeId], CONCEPT_CRYSTAL_NODE_HARDCAP) ? ZERO : ONE;
  const baseValue = div(sourceAmount, CONCEPT_CRYSTAL_BASE_PRODUCTION_INTERVAL_SEC);
  const totalValue = mul(
    baseValue,
    mul(
      intervalFactor,
      mul(
        peaceFactor,
        mul(max(ZERO, stratum.stratumSpeed), mul(severingFactor, hardcapFactor)),
      ),
    ),
  );

  return {
    baseValue,
    totalValue,
    entries: [
      { id: "concept-interval", factor: intervalFactor },
      { id: "peace", factor: peaceFactor },
      { id: "stratum-speed", factor: max(ZERO, stratum.stratumSpeed) },
      { id: "severing", factor: severingFactor },
      { id: "concept-hardcap", factor: hardcapFactor },
    ],
  };
}

export function getElectromagneticPowerGainMultiplierBreakdown(
  stratum: StratumState,
): MultiplierBreakdownData {
  const unlocked = isElectromagneticCrystalsUnlocked(stratum);
  const characterFactor = applyCrushFiveFaithToCharacterBonus(
    stratum,
    stratum.characterElectromagneticPowerGainMultiplier ?? ONE,
  );
  const basicUpgradeFactor = getElectromagneticUpgradePowerGainMultiplier(stratum);
  const advancedUpgradeFactor = getElectromagneticUpgradeAdvancedPowerGainMultiplier(stratum);
  const coherenceFactor = getCoherenceElectromagneticPowerGainMultiplier(stratum);

  return {
    baseValue: unlocked ? ELECTROMAGNETIC_POWER_PER_CROSSING : ZERO,
    totalValue: unlocked ? getElectromagneticPowerPerCrossing(stratum) : ZERO,
    entries: [
      { id: "characters", factor: characterFactor },
      { id: "ep-power-gain-upgrade", factor: basicUpgradeFactor },
      { id: "ep-line-gain-upgrade", factor: advancedUpgradeFactor },
      { id: "coherence-ep-gain", factor: coherenceFactor },
    ],
  };
}
