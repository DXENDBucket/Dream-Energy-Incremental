import { N, ONE, ZERO, add, gte, mul, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getChaoticEther, getTotalChaoticEtherGained } from "@/engine/strata/common/chaotic-ether";
import type { StratumState } from "@/engine/strata/state";
import { getDreamCrystalBought } from "../selectors";
import {
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID,
  DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
  DREAM_CRYSTAL_UPGRADE_FREE_PURCHASES_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  type DreamCrystalUpgradeId,
  getDreamCrystalUpgradeDefinition,
} from "./definitions";
import {
  createDreamCrystalUpgradesState,
  type DreamCrystalUpgradesState,
} from "./state";

export function ensureDreamCrystalUpgradesState(stratum: StratumState): DreamCrystalUpgradesState {
  stratum.dreamCrystalUpgrades ??= createDreamCrystalUpgradesState();
  stratum.dreamCrystalUpgrades.bought ??= {};
  stratum.dreamCrystalUpgrades.repeatableBought ??= {};
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

export function canBuyDreamCrystalUpgrade(stratum: StratumState, id: DreamCrystalUpgradeId): boolean {
  const definition = getDreamCrystalUpgradeDefinition(id);
  if (definition.kind === "single" && hasDreamCrystalUpgrade(stratum, id)) return false;

  return gte(getChaoticEther(stratum), getDreamCrystalUpgradeCost(stratum, id));
}

export function buyDreamCrystalUpgrade(stratum: StratumState, id: DreamCrystalUpgradeId): void {
  if (!canBuyDreamCrystalUpgrade(stratum, id)) return;

  const definition = getDreamCrystalUpgradeDefinition(id);
  const upgrades = ensureDreamCrystalUpgradesState(stratum);
  const cost = getDreamCrystalUpgradeCost(stratum, id);

  stratum.chaoticEther = sub(getChaoticEther(stratum), cost);

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

export function getDreamCrystalFirstTierUpgradeMultiplier(stratum: StratumState, tier: number): Num {
  if (tier !== 1) return ONE;
  if (!hasDreamCrystalUpgrade(stratum, DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID)) return ONE;
  return pow(N(3), getTotalChaoticEtherGained(stratum));
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

export function getDreamCrystalRefineryEfficiencyMultiplier(stratum: StratumState): Num {
  const bought = getDreamCrystalRepeatableUpgradeBought(
    stratum,
    DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  );

  if (bought.lte(ZERO)) return ONE;
  return pow(N(2), bought);
}
