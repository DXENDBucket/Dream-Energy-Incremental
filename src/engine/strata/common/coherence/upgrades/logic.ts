import type { GameState } from "@/engine/core/state";
import type { StratumState } from "@/engine/strata/state";
import { N, ONE, ZERO, add, div, gte, log10, max, min, mul, normalizeNum, pow, sqrt, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  computeEntropyGrowthRateMultiplierFromCoherence,
  ENTROPY_DEFAULT_TUNING_EXPONENT,
} from "@/engine/strata/common/entropy";
import {
  COHERENCE_UPGRADE_AUTOBUYER_SPEED_ID,
  COHERENCE_UPGRADE_BEST_ENTRY_COHERENCE_ID,
  COHERENCE_UPGRADE_BEST_NEXT_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ENTROPY_TUNING_ID,
  COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID,
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  COHERENCE_UPGRADE_SOFTCAP_TWO_REPEATABLE_SLOWDOWN_ID,
  COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID,
  COHERENCE_UPGRADE_ROWS,
  type CoherenceUpgradeId,
  getCoherenceUpgradeDefinition,
} from "./definitions";
import {
  createCoherenceUpgradesState,
  type CoherenceUpgradesState,
} from "./state";
import { getConceptCrystalCoherencePointGainMultiplier } from "@/engine/strata/common/concept-crystals";
import {
  getNextStratumDefinition,
  STRATUM_DEFINITIONS,
} from "@/engine/strata/defs";

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
  if (isCoherenceRepeatableUpgradeMaxed(stratum, id)) return ZERO;

  const bought = getCoherenceRepeatableUpgradeBought(stratum, id);
  return mul(definition.baseCost ?? ZERO, pow(definition.costScale ?? ONE, bought));
}

export function getCoherenceUpgradeRowIndex(id: CoherenceUpgradeId): number {
  return COHERENCE_UPGRADE_ROWS.findIndex(row => row.some(rowId => rowId === id));
}

export function isCoherenceUpgradeRowUnlocked(stratum: StratumState, rowIndex: number): boolean {
  if (rowIndex <= 0) return true;

  for (let previousRowIndex = 0; previousRowIndex < rowIndex; previousRowIndex++) {
    const previousRow = COHERENCE_UPGRADE_ROWS[previousRowIndex] ?? [];

    for (const previousId of previousRow) {
      const definition = getCoherenceUpgradeDefinition(previousId);
      if (definition.kind === "single" && !hasCoherenceUpgrade(stratum, previousId)) {
        return false;
      }
    }
  }

  return true;
}

export function isCoherenceUpgradeUnlockedForPurchase(
  stratum: StratumState,
  id: CoherenceUpgradeId,
): boolean {
  return isCoherenceUpgradeRowUnlocked(stratum, getCoherenceUpgradeRowIndex(id));
}

export function isCoherenceRepeatableUpgradeMaxed(
  stratum: StratumState,
  id: CoherenceUpgradeId,
): boolean {
  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind !== "repeatable" || !definition.maxPurchases) return false;

  return gte(getCoherenceRepeatableUpgradeBought(stratum, id), definition.maxPurchases);
}

export function canBuyCoherenceUpgrade(stratum: StratumState, id: CoherenceUpgradeId): boolean {
  if (!isCoherenceUpgradeUnlockedForPurchase(stratum, id)) return false;

  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind === "placeholder") return false;
  if (definition.kind === "single" && hasCoherenceUpgrade(stratum, id)) return false;
  if (definition.kind === "repeatable" && isCoherenceRepeatableUpgradeMaxed(stratum, id)) return false;

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
    ? N(2)
    : ONE;
}

export function getCoherenceSoftcapTwoStrengthMultiplier(stratum: StratumState): Num {
  let fixedMultiplier = ONE;
  if (hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID)) {
    const fullSlowdown = computeEntropyGrowthRateMultiplierFromCoherence(getOwnedCoherencePoints(stratum));
    fixedMultiplier = div(add(ONE, fullSlowdown), N(2));
  }

  return mul(fixedMultiplier, getCoherenceSoftcapTwoRepeatableStrengthMultiplier(stratum));
}

export function getCoherenceSoftcapTwoRepeatableStrengthMultiplier(stratum: StratumState): Num {
  const bought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_SOFTCAP_TWO_REPEATABLE_SLOWDOWN_ID,
  );
  return pow(N("0.99"), bought);
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

  const upgradeMultiplier = bought.lte(ZERO) ? ONE : pow(N(2), bought);
  return mul(
    mul(upgradeMultiplier, getConceptCrystalCoherencePointGainMultiplier(stratum)),
    stratum.characterCoherencePointGainMultiplier ?? ONE,
  );
}

export const COHERENCE_AUTOBUYER_INTERVAL_REDUCTION_PER_LEVEL_SEC = N(0.05);

export function getCoherenceAutobuyerIntervalReductionSec(stratum: StratumState): Num {
  const bought = getCoherenceRepeatableUpgradeBought(
    stratum,
    COHERENCE_UPGRADE_AUTOBUYER_SPEED_ID,
  );
  const maxPurchases = getCoherenceUpgradeDefinition(
    COHERENCE_UPGRADE_AUTOBUYER_SPEED_ID,
  ).maxPurchases ?? bought;
  return mul(
    COHERENCE_AUTOBUYER_INTERVAL_REDUCTION_PER_LEVEL_SEC,
    min(maxPurchases, bought),
  );
}

function getCoherenceRecordMultiplier(record: Num): Num {
  return max(ONE, log10(max(record, ONE)));
}

export function recordBestNextStratumEntryCoherencePoints(
  stratum: StratumState,
  coherencePoints: Num,
): void {
  stratum.bestNextStratumEntryCoherencePoints = max(
    stratum.bestNextStratumEntryCoherencePoints ?? ZERO,
    coherencePoints,
  );
}

export function getCoherenceBestNextDreamEnergy(
  state: GameState,
  sourceStratumId: string,
): Num {
  const nextStratumId = getNextStratumDefinition(sourceStratumId)?.id;
  if (!nextStratumId) return ZERO;

  return state.strata[nextStratumId]?.bestDreamEnergy ?? ZERO;
}

export function getCoherenceBestNextDreamEnergyMultiplier(
  state: GameState,
  sourceStratumId: string,
): Num {
  const source = state.strata[sourceStratumId];
  if (!source || !hasCoherenceUpgrade(source, COHERENCE_UPGRADE_BEST_NEXT_DREAM_ENERGY_ID)) {
    return ONE;
  }

  return getCoherenceRecordMultiplier(getCoherenceBestNextDreamEnergy(state, sourceStratumId));
}

export function getCoherenceBestEntryCoherenceMultiplier(stratum: StratumState): Num {
  if (!hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_BEST_ENTRY_COHERENCE_ID)) return ONE;

  return getCoherenceRecordMultiplier(stratum.bestNextStratumEntryCoherencePoints ?? ZERO);
}

export function syncCoherenceProgressionDreamCrystalMultipliers(state: GameState): void {
  for (const stratum of Object.values(state.strata)) {
    stratum.coherenceProgressionDreamCrystalMultiplier = ONE;
  }

  for (const definition of STRATUM_DEFINITIONS) {
    const sourceStratumId = definition.id;
    const source = state.strata[sourceStratumId];
    if (!source) continue;

    const nextStratumId = getNextStratumDefinition(sourceStratumId)?.id;
    const next = nextStratumId ? state.strata[nextStratumId] : undefined;
    const bestDreamEnergyMultiplier = getCoherenceBestNextDreamEnergyMultiplier(
      state,
      sourceStratumId,
    );
    const bestEntryCoherenceMultiplier = getCoherenceBestEntryCoherenceMultiplier(source);
    const combinedMultiplier = mul(bestDreamEnergyMultiplier, bestEntryCoherenceMultiplier);

    source.coherenceProgressionDreamCrystalMultiplier = mul(
      source.coherenceProgressionDreamCrystalMultiplier,
      combinedMultiplier,
    );

    if (next) {
      next.coherenceProgressionDreamCrystalMultiplier = mul(
        next.coherenceProgressionDreamCrystalMultiplier,
        combinedMultiplier,
      );
    }
  }
}
