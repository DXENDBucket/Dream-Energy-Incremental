import { N, ONE, ZERO, add, gte, log10, max, mul, normalizeNum, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  getChaoticEther,
  getDreamCrystalUpgradeChaoticEtherTier,
  getTotalChaoticEtherGained,
  setChaoticEther,
} from "@/engine/strata/common/chaotic-ether";
import type { StratumState } from "@/engine/strata/state";
import { getDreamCrystalBought } from "../selectors";
import {
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID,
  DREAM_CRYSTAL_UPGRADE_COHERENCE_CONVERSION_ID,
  DREAM_CRYSTAL_UPGRADE_COST_GROWTH_SLOWDOWN_ID,
  DREAM_CRYSTAL_UPGRADE_CURRENT_COHERENCE_MULTIPLIER_ID,
  DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
  DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_HALVING_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID,
  DREAM_CRYSTAL_UPGRADE_ROWS,
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID,
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID,
  DREAM_CRYSTAL_UPGRADE_TOTAL_CE_SOFTCAP_TWO_ID,
  type DreamCrystalUpgradeId,
  getDreamCrystalUpgradeDefinition,
} from "./definitions";
import {
  createDreamCrystalUpgradesState,
  type DreamCrystalUpgradesState,
} from "./state";

const FIRST_TIER_UPGRADE_CE_SOFTCAP_START = N(10);
const REFINERY_MINIMUM_VALID_LOG_BASE = N("1.000000001");

export function ensureDreamCrystalUpgradesState(stratum: StratumState): DreamCrystalUpgradesState {
  stratum.dreamCrystalUpgrades ??= createDreamCrystalUpgradesState();
  stratum.dreamCrystalUpgrades.bought ??= {};
  stratum.dreamCrystalUpgrades.repeatableBought ??= {};

  for (const [id, bought] of Object.entries(stratum.dreamCrystalUpgrades.repeatableBought)) {
    stratum.dreamCrystalUpgrades.repeatableBought[id] = normalizeNum(bought);
  }

  return stratum.dreamCrystalUpgrades;
}

export function hasDreamCrystalUpgrade(stratum: StratumState, id: DreamCrystalUpgradeId): boolean {
  return ensureDreamCrystalUpgradesState(stratum).bought[id] === true;
}

export function getDreamCrystalRepeatableUpgradeBought(
  stratum: StratumState,
  id: DreamCrystalUpgradeId,
): Num {
  return ensureDreamCrystalUpgradesState(stratum).repeatableBought[id] ?? ZERO;
}

export function getDreamCrystalUpgradeCost(stratum: StratumState, id: DreamCrystalUpgradeId): Num {
  const definition = getDreamCrystalUpgradeDefinition(id);

  if (definition.kind === "repeatable") {
    const bought = getDreamCrystalRepeatableUpgradeBought(stratum, id);
    return mul(definition.baseCost, pow(definition.costScale ?? ONE, bought));
  }

  return definition.baseCost;
}

export function getDreamCrystalUpgradeRowIndex(id: DreamCrystalUpgradeId): number {
  return DREAM_CRYSTAL_UPGRADE_ROWS.findIndex(row => row.some(rowId => rowId === id));
}

export function isDreamCrystalUpgradeRowUnlocked(stratum: StratumState, rowIndex: number): boolean {
  if (rowIndex <= 0) return true;

  for (let previousRowIndex = 0; previousRowIndex < rowIndex; previousRowIndex++) {
    const previousRow = DREAM_CRYSTAL_UPGRADE_ROWS[previousRowIndex] ?? [];

    for (const previousId of previousRow) {
      const definition = getDreamCrystalUpgradeDefinition(previousId);
      if (definition.kind === "single" && !hasDreamCrystalUpgrade(stratum, previousId)) {
        return false;
      }
    }
  }

  return true;
}

export function isDreamCrystalUpgradeUnlockedForPurchase(
  stratum: StratumState,
  id: DreamCrystalUpgradeId,
): boolean {
  return isDreamCrystalUpgradeRowUnlocked(stratum, getDreamCrystalUpgradeRowIndex(id));
}

export function canBuyDreamCrystalUpgrade(stratum: StratumState, id: DreamCrystalUpgradeId): boolean {
  if (!isDreamCrystalUpgradeUnlockedForPurchase(stratum, id)) return false;

  const definition = getDreamCrystalUpgradeDefinition(id);
  if (definition.kind === "single" && hasDreamCrystalUpgrade(stratum, id)) return false;

  const tier = getDreamCrystalUpgradeChaoticEtherTier(stratum);
  return gte(getChaoticEther(stratum, tier), getDreamCrystalUpgradeCost(stratum, id));
}

export function buyDreamCrystalUpgrade(stratum: StratumState, id: DreamCrystalUpgradeId): void {
  if (!canBuyDreamCrystalUpgrade(stratum, id)) return;

  const definition = getDreamCrystalUpgradeDefinition(id);
  const upgrades = ensureDreamCrystalUpgradesState(stratum);
  const cost = getDreamCrystalUpgradeCost(stratum, id);
  const tier = getDreamCrystalUpgradeChaoticEtherTier(stratum);

  setChaoticEther(stratum, tier, sub(getChaoticEther(stratum, tier), cost));

  if (definition.kind === "repeatable") {
    upgrades.repeatableBought[id] = add(getDreamCrystalRepeatableUpgradeBought(stratum, id), ONE);
    return;
  }

  upgrades.bought[id] = true;
}

export function isDreamCrystalFreePurchasesUnlocked(stratum: StratumState): boolean {
  return hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID);
}

export function isDreamCrystalAutobuyerUnlocked(stratum: StratumState): boolean {
  return hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID);
}

export function isDreamCrystalRefineKeepCrystalsUnlocked(stratum: StratumState): boolean {
  return hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID);
}

export function isDreamCrystalRefineAutobuyerUnlocked(stratum: StratumState): boolean {
  return hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID);
}

export function getDreamCrystalSoftcapOneStrengthMultiplier(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(
    stratum,
    DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID,
  );

  if (bought.lte(ZERO)) return ONE;
  return pow(N(0.5), bought);
}

export function getDreamCrystalSoftcapTwoStrengthMultiplier(stratum: StratumState): Num {
  const fixedMultiplier = hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID)
    ? N(0.5)
    : ONE;
  return mul(fixedMultiplier, getDreamCrystalTotalCESoftcapTwoStrengthMultiplier(stratum));
}

export function getDreamCrystalTotalCESoftcapTwoStrengthMultiplier(stratum: StratumState): Num {
  if (!hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_TOTAL_CE_SOFTCAP_TWO_ID)) return ONE;

  const totalChaoticEtherGained = max(getTotalChaoticEtherGained(
    stratum,
    getDreamCrystalUpgradeChaoticEtherTier(stratum),
  ), ONE);
  return pow(N(0.995), log10(totalChaoticEtherGained));
}

export function getDreamCrystalFirstTierUpgradeMultiplier(stratum: StratumState, tier: number): Num {
  if (tier !== 1) return ONE;
  if (!hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID)) return ONE;

  const totalChaoticEtherGained = max(getTotalChaoticEtherGained(
    stratum,
    getDreamCrystalUpgradeChaoticEtherTier(stratum),
  ), ZERO);

  if (totalChaoticEtherGained.lte(FIRST_TIER_UPGRADE_CE_SOFTCAP_START)) {
    return pow(N(3), totalChaoticEtherGained);
  }

  const extraChaoticEther = max(
    sub(totalChaoticEtherGained, FIRST_TIER_UPGRADE_CE_SOFTCAP_START),
    ONE,
  );

  return mul(
    pow(N(3), FIRST_TIER_UPGRADE_CE_SOFTCAP_START),
    add(log10(extraChaoticEther), ONE),
  );
}

export function getDreamCrystalBoughtPowerBase(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(stratum, DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID);
  if (bought.lte(ZERO)) return ONE;

  return add(N(1.01), mul(bought, N(0.01)));
}

export function getDreamCrystalBoughtPowerMultiplier(stratum: StratumState, tier: number): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(stratum, DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID);
  if (bought.lte(ZERO)) return ONE;

  return pow(getDreamCrystalBoughtPowerBase(stratum), getDreamCrystalBought(stratum.dreamCrystals, tier));
}

export function getDreamCrystalCurrentCoherenceMultiplier(stratum: StratumState): Num {
  if (!hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_CURRENT_COHERENCE_MULTIPLIER_ID)) {
    return ONE;
  }

  return max(ONE, log10(max(stratum.coherencePoints ?? ZERO, ONE)));
}

export function getDreamCrystalRefineryEfficiencyMultiplier(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(
    stratum,
    DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  );

  if (bought.lte(ZERO)) return ONE;
  return pow(N(2), bought);
}

export function getDreamCrystalRefineryLogBase(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(
    stratum,
    DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID,
  );

  const adjustedBase = add(ONE, mul(N(4), pow(N(0.9), bought)));
  const finalMultiplier = hasDreamCrystalUpgrade(
    stratum,
    DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_HALVING_ID,
  ) ? N(0.5) : ONE;

  return max(REFINERY_MINIMUM_VALID_LOG_BASE, mul(adjustedBase, finalMultiplier));
}

export function getDreamCrystalCoherenceProductionLossMultiplier(stratum: StratumState): Num {
  return hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_COHERENCE_CONVERSION_ID)
    ? N(5).div(9)
    : ONE;
}

export function getDreamCrystalCostGrowthSlowdownMultiplier(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(
    stratum,
    DREAM_CRYSTAL_UPGRADE_COST_GROWTH_SLOWDOWN_ID,
  );
  return pow(N(0.99), bought);
}
