import type { StratumState } from "@/engine/strata/state";
import type { CoherenceUpgradeId } from "./definitions";
import {
  createCoherenceUpgradesState,
  type CoherenceUpgradesState,
} from "./state";

export function ensureCoherenceUpgradesState(stratum: StratumState): CoherenceUpgradesState {
  stratum.coherenceUpgrades ??= createCoherenceUpgradesState();
  stratum.coherenceUpgrades.bought ??= {};
  return stratum.coherenceUpgrades;
}

export function hasCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): boolean {
  return ensureCoherenceUpgradesState(stratum).bought[id] === true;
}
