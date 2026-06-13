import type { GameState } from "@/engine/core/state";
import { ONE, TEN, ZERO, add, div, gt, gte, log10, max, min } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import {
  computeEntropyGrowthRateMultiplierFromCoherence,
  createEntropyState,
  ensureEntropyState,
  getDefaultEntropyChaosExponent,
} from "@/engine/strata/common/entropy";
import {
  addChaoticEther,
  getChaoticEther,
  getChaoticEtherProducedTierForStratumId,
  setChaoticEther,
} from "@/engine/strata/common/chaotic-ether";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceEntropyTuningExponent,
  getCoherenceNextDreamCrystalMultiplierBonus,
} from "@/engine/strata/common/coherence/upgrades";
import {
  dreamSeaFirstStratumId,
  dreamSeaSecondStratumId,
  realityStratumId,
} from "@/engine/strata/defs/ids";
import { getActiveStratum, getStratum } from "@/engine/strata/manager/selectors";
import { createStratumState, type StratumState } from "@/engine/strata/state";
import { LIFT_UNLOCK_REQUIREMENT } from "./balance";

export function getLiftUnlockRequirement(): Num {
  return LIFT_UNLOCK_REQUIREMENT;
}

export function getLiftUnlockProgress(state: GameState): Num {
  if (state.lift.isLiftUnlocked) return ONE;

  const current = getActiveStratum(state).dreamEnergy;
  const cappedCurrent = min(current, LIFT_UNLOCK_REQUIREMENT);
  const numerator = log10(add(cappedCurrent, ONE));
  const denominator = log10(add(LIFT_UNLOCK_REQUIREMENT, ONE));

  if (denominator.lte(ZERO)) return ONE;
  return div(numerator, denominator);
}

export function canUnlockLift(state: GameState): boolean {
  if (state.lift.isLiftUnlocked) return false;
  return gte(getActiveStratum(state).dreamEnergy, LIFT_UNLOCK_REQUIREMENT);
}

export function unlockLift(state: GameState): void {
  if (!canUnlockLift(state)) return;

  state.lift.isLiftUnlocked = true;
  state.lift.currentLiftPosition = state.activeStratumId;
}

export function getDreamSeaFirstEntryCoherenceCost(state: GameState): Num {
  return getCoherencePoints(getStratum(state, realityStratumId));
}

export function getDreamSeaFirstEntryEntropyGrowthRateMultiplier(state: GameState): Num {
  return computeEntropyGrowthRateMultiplierFromCoherence(getDreamSeaFirstEntryCoherenceCost(state));
}

export function isDreamSeaFirstStratumVisible(state: GameState): boolean {
  return (
    dreamSeaFirstStratumId in state.strata ||
    gt(getDreamSeaFirstEntryCoherenceCost(state), ZERO)
  );
}

export function canTravelToDreamSeaFirstStratum(state: GameState): boolean {
  if (!state.lift.isLiftUnlocked) return false;
  if (state.activeStratumId !== realityStratumId) return false;
  return gt(getDreamSeaFirstEntryCoherenceCost(state), ZERO);
}

export function travelToDreamSeaFirstStratum(state: GameState): boolean {
  if (!canTravelToDreamSeaFirstStratum(state)) return false;

  const reality = getStratum(state, realityStratumId);
  const cost = getDreamSeaFirstEntryCoherenceCost(state);
  const entropyGrowthRateMultiplier = computeEntropyGrowthRateMultiplierFromCoherence(cost);
  const entropyTuningExponent = getCoherenceEntropyTuningExponent(reality, cost);
  const dreamCrystalMultiplierBonus = getCoherenceNextDreamCrystalMultiplierBonus(reality);

  state.strata[dreamSeaFirstStratumId] ??= createStratumState({
    entropyFormulaId: "dream-sea-first",
  });

  const dreamSeaFirst = state.strata[dreamSeaFirstStratumId]!;
  const initialDreamEnergyBonus = getCoherenceDeeperInitialDreamEnergyBonus(reality);
  const entropy = ensureEntropyState(dreamSeaFirst);
  entropy.formulaId = "dream-sea-first";
  entropy.chaosExponent = getDefaultEntropyChaosExponent(entropy.formulaId);
  entropy.tuningExponent = entropyTuningExponent;
  entropy.growthRateMultiplier = entropyGrowthRateMultiplier;
  dreamSeaFirst.coherenceDreamCrystalMultiplier = max(
    dreamSeaFirst.coherenceDreamCrystalMultiplier ?? ONE,
    dreamCrystalMultiplierBonus,
  );
  if (gt(initialDreamEnergyBonus, ZERO)) {
    dreamSeaFirst.dreamEnergy = add(dreamSeaFirst.dreamEnergy, initialDreamEnergyBonus);
  }
  reality.coherencePoints = ZERO;

  state.activeStratumId = dreamSeaFirstStratumId;
  state.lift.currentLiftPosition = dreamSeaFirstStratumId;
  return true;
}

export function getDreamSeaSecondEntryCoherenceCost(state: GameState): Num {
  const dreamSeaFirst = state.strata[dreamSeaFirstStratumId];
  return dreamSeaFirst ? getCoherencePoints(dreamSeaFirst) : ZERO;
}

export function getDreamSeaSecondEntryEntropyGrowthRateMultiplier(state: GameState): Num {
  return computeEntropyGrowthRateMultiplierFromCoherence(getDreamSeaSecondEntryCoherenceCost(state));
}

export function isDreamSeaSecondStratumVisible(state: GameState): boolean {
  return (
    dreamSeaFirstStratumId in state.strata ||
    dreamSeaSecondStratumId in state.strata
  );
}

export function canTravelToDreamSeaSecondStratum(state: GameState): boolean {
  if (!state.lift.isLiftUnlocked) return false;
  if (state.activeStratumId !== dreamSeaFirstStratumId) return false;
  return gt(getDreamSeaSecondEntryCoherenceCost(state), ZERO);
}

export function travelToDreamSeaSecondStratum(state: GameState): boolean {
  if (!canTravelToDreamSeaSecondStratum(state)) return false;

  const dreamSeaFirst = getStratum(state, dreamSeaFirstStratumId);
  const cost = getDreamSeaSecondEntryCoherenceCost(state);
  const entropyGrowthRateMultiplier = computeEntropyGrowthRateMultiplierFromCoherence(cost);
  const entropyTuningExponent = getCoherenceEntropyTuningExponent(dreamSeaFirst, cost);
  const dreamCrystalMultiplierBonus = getCoherenceNextDreamCrystalMultiplierBonus(dreamSeaFirst);

  state.strata[dreamSeaSecondStratumId] ??= createStratumState({
    entropyFormulaId: "dream-sea-second",
  });

  const dreamSeaSecond = state.strata[dreamSeaSecondStratumId]!;
  const initialDreamEnergyBonus = getCoherenceDeeperInitialDreamEnergyBonus(dreamSeaFirst);
  const entropy = ensureEntropyState(dreamSeaSecond);
  entropy.formulaId = "dream-sea-second";
  entropy.chaosExponent = getDefaultEntropyChaosExponent(entropy.formulaId);
  entropy.tuningExponent = entropyTuningExponent;
  entropy.growthRateMultiplier = entropyGrowthRateMultiplier;
  dreamSeaSecond.coherenceDreamCrystalMultiplier = max(
    dreamSeaSecond.coherenceDreamCrystalMultiplier ?? ONE,
    dreamCrystalMultiplierBonus,
  );
  if (gt(initialDreamEnergyBonus, ZERO)) {
    dreamSeaSecond.dreamEnergy = add(dreamSeaSecond.dreamEnergy, initialDreamEnergyBonus);
  }
  dreamSeaFirst.coherencePoints = ZERO;

  state.activeStratumId = dreamSeaSecondStratumId;
  state.lift.currentLiftPosition = dreamSeaSecondStratumId;
  return true;
}

function carryProducedChaoticEther(
  source: StratumState,
  target: StratumState,
  sourceId: string,
): void {
  const tier = getChaoticEtherProducedTierForStratumId(sourceId);
  if (tier <= 0) return;

  const carriedChaoticEther = getChaoticEther(source, tier);

  if (gt(carriedChaoticEther, ZERO)) {
    addChaoticEther(target, carriedChaoticEther, tier);
  }

  setChaoticEther(source, tier, ZERO);
}

function resetStratumAfterReturn(
  stratum: StratumState,
  formulaId: "dream-sea-first" | "dream-sea-second",
): void {
  stratum.dreamEnergy = TEN;
  stratum.dreamCrystals = createDreamCrystalsState();
  stratum.entropy = createEntropyState(formulaId);
}

export function canTravelBackToDreamSeaFirstStratum(state: GameState): boolean {
  return (
    state.activeStratumId === dreamSeaSecondStratumId &&
    dreamSeaFirstStratumId in state.strata
  );
}

export function travelBackToDreamSeaFirstStratum(state: GameState): boolean {
  if (!canTravelBackToDreamSeaFirstStratum(state)) return false;

  const dreamSeaFirst = getStratum(state, dreamSeaFirstStratumId);
  const dreamSeaSecond = getStratum(state, dreamSeaSecondStratumId);

  carryProducedChaoticEther(dreamSeaSecond, dreamSeaFirst, dreamSeaSecondStratumId);
  resetStratumAfterReturn(dreamSeaSecond, "dream-sea-second");

  state.activeStratumId = dreamSeaFirstStratumId;
  state.lift.currentLiftPosition = dreamSeaFirstStratumId;
  return true;
}

export function travelToRealityStratum(state: GameState): boolean {
  if (!(realityStratumId in state.strata)) return false;
  if (state.activeStratumId !== dreamSeaFirstStratumId) return false;

  const reality = getStratum(state, realityStratumId);

  const dreamSeaFirst = getStratum(state, dreamSeaFirstStratumId);
  carryProducedChaoticEther(dreamSeaFirst, reality, dreamSeaFirstStratumId);
  resetStratumAfterReturn(dreamSeaFirst, "dream-sea-first");

  state.activeStratumId = realityStratumId;
  state.lift.currentLiftPosition = realityStratumId;
  return true;
}
