import type { GameState } from "@/engine/core/state";
import { ONE, ZERO, div, gt, gte, log10, min, add } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  computeEntropyTuningExponentFromCoherence,
  ensureEntropyState,
} from "@/engine/strata/common/entropy";
import { getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  dreamSeaFirstStratumId,
  realityStratumId,
} from "@/engine/strata/defs/ids";
import { getActiveStratum, getStratum } from "@/engine/strata/manager/selectors";
import { createStratumState } from "@/engine/strata/state";
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

export function getDreamSeaFirstEntryTuningExponent(state: GameState): Num {
  return computeEntropyTuningExponentFromCoherence(getDreamSeaFirstEntryCoherenceCost(state));
}

export function isDreamSeaFirstStratumVisible(state: GameState): boolean {
  return (
    dreamSeaFirstStratumId in state.strata ||
    gt(getDreamSeaFirstEntryCoherenceCost(state), ZERO)
  );
}

export function canTravelToDreamSeaFirstStratum(state: GameState): boolean {
  if (!state.lift.isLiftUnlocked) return false;
  return gt(getDreamSeaFirstEntryCoherenceCost(state), ZERO);
}

export function travelToDreamSeaFirstStratum(state: GameState): boolean {
  if (!canTravelToDreamSeaFirstStratum(state)) return false;

  const reality = getStratum(state, realityStratumId);
  const cost = getDreamSeaFirstEntryCoherenceCost(state);
  const tuningExponent = computeEntropyTuningExponentFromCoherence(cost);

  state.strata[dreamSeaFirstStratumId] ??= createStratumState({
    entropyFormulaId: "dream-sea-first",
  });

  const dreamSeaFirst = state.strata[dreamSeaFirstStratumId]!;
  const entropy = ensureEntropyState(dreamSeaFirst);
  entropy.formulaId = "dream-sea-first";
  entropy.tuningExponent = tuningExponent;
  reality.coherencePoints = ZERO;

  state.activeStratumId = dreamSeaFirstStratumId;
  state.lift.currentLiftPosition = dreamSeaFirstStratumId;
  return true;
}

export function travelToRealityStratum(state: GameState): boolean {
  if (!(realityStratumId in state.strata)) return false;

  const reality = getStratum(state, realityStratumId);

  if (state.activeStratumId === dreamSeaFirstStratumId && dreamSeaFirstStratumId in state.strata) {
    const dreamSeaFirst = state.strata[dreamSeaFirstStratumId]!;
    const carriedChaoticEther = getChaoticEther(dreamSeaFirst);

    if (gt(carriedChaoticEther, ZERO)) {
      reality.chaoticEther = add(reality.chaoticEther ?? ZERO, carriedChaoticEther);
    }

    state.strata[dreamSeaFirstStratumId] = createStratumState({
      entropyFormulaId: "dream-sea-first",
    });
  }

  state.activeStratumId = realityStratumId;
  state.lift.currentLiftPosition = realityStratumId;
  return true;
}
