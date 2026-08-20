import type { StratumState } from "@/engine/strata/state";
import {
  N,
  ONE,
  ZERO,
  add,
  floor,
  gte,
  max,
  mul,
  normalizeNum,
  pow,
  sub,
  type Num,
} from "@/engine/math/num";
import { getDreamEnergy, spendDreamEnergy } from "@/engine/strata/common/dream-energy";
import {
  getChaoticEther,
  getDreamCrystalUpgradeChaoticEtherTier,
  setChaoticEther,
} from "@/engine/strata/common/chaotic-ether";
import {
  ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID,
  ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID,
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID,
  ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_ROWS,
  ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID,
  getElectromagneticUpgradeDefinition,
  type ElectromagneticUpgradeId,
} from "./definitions";
import {
  createElectromagneticUpgradesState,
  type ElectromagneticUpgradesState,
} from "./state";

export function ensureElectromagneticUpgradesState(
  stratum: StratumState,
): ElectromagneticUpgradesState {
  stratum.electromagneticCrystals.upgrades ??= createElectromagneticUpgradesState();
  const upgrades = stratum.electromagneticCrystals.upgrades;
  upgrades.bought ??= {};
  upgrades.repeatableBought ??= {};

  for (const [id, bought] of Object.entries(upgrades.repeatableBought)) {
    upgrades.repeatableBought[id] = max(ZERO, floor(normalizeNum(bought, ZERO)));
  }
  return upgrades;
}

export function hasElectromagneticUpgrade(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): boolean {
  return stratum.electromagneticCrystals.upgrades?.bought?.[id] === true;
}

export function getElectromagneticRepeatableUpgradeBought(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): Num {
  return stratum.electromagneticCrystals.upgrades?.repeatableBought?.[id] ?? ZERO;
}

export function getElectromagneticUpgradeCost(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): Num {
  const definition = getElectromagneticUpgradeDefinition(id);
  if (!definition.baseCost) return ZERO;
  if (definition.kind !== "repeatable") return definition.baseCost;
  return mul(
    definition.baseCost,
    pow(definition.costScale ?? ONE, getElectromagneticRepeatableUpgradeBought(stratum, id)),
  );
}

export function getElectromagneticUpgradeRowIndex(id: ElectromagneticUpgradeId): number {
  return ELECTROMAGNETIC_UPGRADE_ROWS.findIndex(row => row.some(rowId => rowId === id));
}

export function isElectromagneticUpgradeRowUnlocked(
  stratum: StratumState,
  rowIndex: number,
): boolean {
  if (rowIndex <= 0) return true;
  for (let previousRowIndex = 0; previousRowIndex < rowIndex; previousRowIndex++) {
    for (const previousId of ELECTROMAGNETIC_UPGRADE_ROWS[previousRowIndex] ?? []) {
      const definition = getElectromagneticUpgradeDefinition(previousId);
      if (definition.kind === "single" && !hasElectromagneticUpgrade(stratum, previousId)) {
        return false;
      }
    }
  }
  return true;
}

export function isElectromagneticUpgradeUnlockedForPurchase(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): boolean {
  return isElectromagneticUpgradeRowUnlocked(stratum, getElectromagneticUpgradeRowIndex(id));
}

function getElectromagneticUpgradeResourceAmount(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): Num {
  const definition = getElectromagneticUpgradeDefinition(id);
  if (definition.resource === "electromagnetic-power") {
    return stratum.electromagneticCrystals.power;
  }
  if (definition.resource === "dream-energy") return getDreamEnergy(stratum);
  if (definition.resource === "chaotic-ether") {
    return getChaoticEther(stratum, getDreamCrystalUpgradeChaoticEtherTier(stratum));
  }
  return ZERO;
}

export function canBuyElectromagneticUpgrade(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): boolean {
  if (!isElectromagneticUpgradeUnlockedForPurchase(stratum, id)) return false;
  const definition = getElectromagneticUpgradeDefinition(id);
  if (definition.kind === "placeholder") return false;
  if (definition.kind === "single" && hasElectromagneticUpgrade(stratum, id)) return false;
  return gte(
    getElectromagneticUpgradeResourceAmount(stratum, id),
    getElectromagneticUpgradeCost(stratum, id),
  );
}

export function buyElectromagneticUpgrade(
  stratum: StratumState,
  id: ElectromagneticUpgradeId,
): boolean {
  if (!canBuyElectromagneticUpgrade(stratum, id)) return false;
  const definition = getElectromagneticUpgradeDefinition(id);
  const cost = getElectromagneticUpgradeCost(stratum, id);

  if (definition.resource === "electromagnetic-power") {
    stratum.electromagneticCrystals.power = sub(stratum.electromagneticCrystals.power, cost);
  } else if (definition.resource === "dream-energy") {
    spendDreamEnergy(stratum, cost);
  } else if (definition.resource === "chaotic-ether") {
    const tier = getDreamCrystalUpgradeChaoticEtherTier(stratum);
    setChaoticEther(stratum, tier, sub(getChaoticEther(stratum, tier), cost));
  }

  const upgrades = ensureElectromagneticUpgradesState(stratum);
  if (definition.kind === "repeatable") {
    upgrades.repeatableBought[id] = add(
      getElectromagneticRepeatableUpgradeBought(stratum, id),
      ONE,
    );
  } else {
    upgrades.bought[id] = true;
  }
  return true;
}

export function hasElectromagneticHorizontalJudgeLines(stratum: StratumState): boolean {
  return hasElectromagneticUpgrade(stratum, ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID);
}

export function hasElectromagneticThreeHorizontalJudgeLines(stratum: StratumState): boolean {
  return hasElectromagneticUpgrade(
    stratum,
    ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID,
  );
}

export function hasElectromagneticMagneticFieldRangeUpgrade(stratum: StratumState): boolean {
  return hasElectromagneticUpgrade(stratum, ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID);
}

export function hasElectromagneticElectricFieldRangeUpgrade(stratum: StratumState): boolean {
  return hasElectromagneticUpgrade(stratum, ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID);
}

export function hasElectromagneticVerticalJudgeLineUpgrade(stratum: StratumState): boolean {
  return hasElectromagneticUpgrade(stratum, ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID);
}

export function getElectromagneticUpgradePowerGainMultiplier(stratum: StratumState): Num {
  return pow(
    N(2),
    getElectromagneticRepeatableUpgradeBought(stratum, ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID),
  );
}

export function getElectromagneticUpgradeConversionExponentBonus(stratum: StratumState): Num {
  return mul(
    N(0.5),
    getElectromagneticRepeatableUpgradeBought(
      stratum,
      ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID,
    ),
  );
}

export function getElectromagneticUpgradeDecayRateMultiplier(stratum: StratumState): Num {
  return pow(
    N("0.75"),
    getElectromagneticRepeatableUpgradeBought(stratum, ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID),
  );
}
