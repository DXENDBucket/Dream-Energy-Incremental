import type { GameState } from "@/engine/core/state";
import { N } from "@/engine/math/num";
import { tickActiveStratum } from "@/engine/strata/tick";

export const LONG_TICK_THRESHOLD_SEC = 5;
export const OFFLINE_PROGRESS_MAX_SEC = 30 * 60;
export const OFFLINE_PROGRESS_MAX_STEPS = 1200;

function sanitizeElapsedSeconds(elapsedSec: number): number {
  if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;
  return Math.min(elapsedSec, OFFLINE_PROGRESS_MAX_SEC);
}

function getProgressStepSeconds(elapsedSec: number): number {
  if (elapsedSec <= LONG_TICK_THRESHOLD_SEC) return elapsedSec;
  return Math.max(LONG_TICK_THRESHOLD_SEC, elapsedSec / OFFLINE_PROGRESS_MAX_STEPS);
}

export function simulateActiveStratumProgress(state: GameState, elapsedSec: number): number {
  const simulatedSec = sanitizeElapsedSeconds(elapsedSec);
  if (simulatedSec <= 0) return 0;

  const stepSec = getProgressStepSeconds(simulatedSec);
  let remainingSec = simulatedSec;

  while (remainingSec > 0) {
    const currentStepSec = Math.min(stepSec, remainingSec);
    state.simTimeSec += currentStepSec;
    tickActiveStratum(state, N(currentStepSec));
    remainingSec -= currentStepSec;
  }

  return simulatedSec;
}

export function getOfflineElapsedSec(state: GameState, nowWallClockMs = Date.now()): number {
  if (!Number.isFinite(state.lastWallClockMs)) return 0;
  return Math.max(0, (nowWallClockMs - state.lastWallClockMs) / 1000);
}
