import type { StratumState } from "@/engine/strata/state";
import { N, ONE, ZERO, add, div, gte, max, mul, normalizeNum, pow, sqrt, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  computeEntropyGrowthRateMultiplierFromCoherence,
  ENTROPY_DEFAULT_TUNING_EXPONENT,
} from "@/engine/strata/common/entropy";
import {
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ENTROPY_TUNING_ID,
  COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID,
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID,
  type CoherenceUpgradeId,
  getCoherenceUpgradeDefinition,
} from "./definitions";
import {
  createCoherenceUpgradesState,
  type CoherenceUpgradesState,
} from "./state";

export function ensureCoherenceUpgradesState(stratum: StratumState): CoherenceUpgradesState {
  stratum.coherenceUpgrades ??= createCoherenceUpgradesState();
  stratum.coherenceUpgrades.bought ??= {};
  stratum.coherenceUpgrades.repeatableBought ??= {};

  for (const [id, bought] of Object.entries(stratum.coherenceUpgrades.repeatableBought)) {
    stratum.coherenceUpgrades.repeatableBought[id] = normalizeNum(bought);
  }

  return stratum.coherenceUpgrades;
}

export function hasCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): boolean {
  return ensureCoherenceUpgradesState(stratum).bought[id] === true;
}

export function getCoherenceRepeatableUpgradeBought(
  stratum: StratumState,
  id: CoherenceUpgradeId,
): Num {
  return ensureCoherenceUpgradesState(stratum).repeatableBought[id] ?? ZERO;
}

function getOwnedCoherencePoints(stratum: StratumState): Num {
  return stratum.coherencePoints ?? ZERO;
}

export function getCoherenceUpgradeCost(stratum: StratumState, id: CoherenceUpgradeId): Num {
  const definition = getCoherenceUpgradeDefinition(id);

  if (definition.kind === "placeholder") return ZERO;
  if (definition.kind === "single") return definition.baseCost ?? ZERO;

  const bought = getCoherenceRepeatableUpgradeBought(stratum, id);
  return mul(definition.baseCost ?? ZERO, pow(definition.costScale ?? ONE, bought));
}

export function canBuyCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): boolean {
  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind === "placeholder") return false;
  if (definition.kind === "single" && hasCoherenceUpgrade(stratum, id)) return false;

  return gte(getOwnedCoherencePoints(stratum), getCoherenceUpgradeCost(stratum, id));
}

export function buyCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): void {
  if (!canBuyCoherenceUpgrade(stratum, id)) return;

  const definition = getCoherenceUpgradeDefinition(id);
  const upgrades = ensureCoherenceUpgradesState(stratum);
  const cost = getCoherenceUpgradeCost(stratum, id);

  stratum.coherencePoints = sub(getOwnedCoherencePoints(stratum), cost);

  if (definition.kind === "repeatable") {
    upgrades.repeatableBought[id] = add(getCoherenceRepeatableUpgradeBought(stratum, id), ONE);
    return;
  }

  upgrades.bought[id] = true;
}

export function getCoherenceEntropyTuningExponent(
  stratum: StratumState,
  spentCoherencePoints: Num,
): Num {
  if (!hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_ENTROPY_TUNING_ID)) {
    return ENTROPY_DEFAULT_TUNING_EXPONENT;
  }

  return mul(
    ENTROPY_DEFAULT_TUNING_EXPONENT,
    add(ONE, div(sqrt(max(spentCoherencePoints, ZERO)), N(3))),
  );
}

export function getCoherenceNextDreamCrystalMultiplierBonus(stratum: StratumState): Num {
  return hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID)
    ? N(1.5)
    : ONE;
}

export function getCoherenceSoftcapTwoStrengthMultiplier(stratum: StratumState): Num {
  if (!hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID)) return ONE;

  const fullSlowdown = computeEntropyGrowthRateMultiplierFromCoherence(getOwnedCoherencePoints(stratum));
  return div(add(ONE, fullSlowdown), N(2));
}

export function getCoherenceDeeperInitialDreamEnergyBonus(stratum: StratumState): Num {
  const bought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  );

  if (bought.lte(ZERO)) return ZERO;
  return mul(N(100), pow(N(10), sub(bought, ONE)));
}

export function getCoherencePointGainMultiplier(stratum: StratumState): Num {
  const bought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  );

  if (bought.lte(ZERO)) return ONE;
  return pow(N(2), bought);
}
