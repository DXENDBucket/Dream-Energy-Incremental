import type { GameState } from "@/engine/core/state";
import { ONE, ZERO, div, gte, log10, min, add } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
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
