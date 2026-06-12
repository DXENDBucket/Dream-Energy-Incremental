import type { StratumState } from "@/engine/strata/state";
import { N, ONE, ZERO, add, gte, mul, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getCoherencePoints } from "../logic";
import {
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
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

export function getCoherenceUpgradeCost(stratum: StratumState, id: CoherenceUpgradeId): Num {
  const definition = getCoherenceUpgradeDefinition(id);

  if (definition.kind !== "repeatable") return ZERO;

  const bought = getCoherenceRepeatableUpgradeBought(stratum, id);
  return mul(definition.baseCost ?? ZERO, pow(definition.costScale ?? ONE, bought));
}

export function canBuyCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): boolean {
  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind === "placeholder") return false;

  return gte(getCoherencePoints(stratum), getCoherenceUpgradeCost(stratum, id));
}

export function buyCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): void {
  if (!canBuyCoherenceUpgrade(stratum, id)) return;

  const definition = getCoherenceUpgradeDefinition(id);
  const upgrades = ensureCoherenceUpgradesState(stratum);
  const cost = getCoherenceUpgradeCost(stratum, id);

  stratum.coherencePoints = sub(getCoherencePoints(stratum), cost);

  if (definition.kind === "repeatable") {
    upgrades.repeatableBought[id] = add(getCoherenceRepeatableUpgradeBought(stratum, id), ONE);
  }
}

export function getCoherenceDeeperInitialDreamEnergyBonus(stratum: StratumState): Num {
  const bought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  );

  if (bought.lte(ZERO)) return ZERO;
  return mul(N(100), pow(N(10), sub(bought, ONE)));
}
