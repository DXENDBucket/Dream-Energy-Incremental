import type { GameState } from "@/engine/core/state";
import { N } from "@/engine/math/num";
import { tickActiveStratum } from "@/engine/strata/tick";

export const LONG_TICK_THRESHOLD_SEC = 1;
export const OFFLINE_PROGRESS_MAX_STEPS = 100_000;
export const OFFLINE_PROGRESS_SKIP_STEPS = 10;

function sanitizeElapsedSeconds(elapsedSec: number): number {
  if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;
  return elapsedSec;
}

export function getOfflineProgressTickCount(elapsedSec: number): number {
  const sanitizedElapsedSec = sanitizeElapsedSeconds(elapsedSec);
  if (sanitizedElapsedSec <= 0) return 0;

  return Math.min(
    OFFLINE_PROGRESS_MAX_STEPS,
    Math.max(1, Math.ceil(sanitizedElapsedSec / LONG_TICK_THRESHOLD_SEC)),
  );
}

export function simulateActiveStratumProgressStep(state: GameState, elapsedSec: number): number {
  const simulatedSec = sanitizeElapsedSeconds(elapsedSec);
  if (simulatedSec <= 0) return 0;

  state.simTimeSec += simulatedSec;
  tickActiveStratum(state, N(simulatedSec));
  return simulatedSec;
}

export function simulateActiveStratumProgress(state: GameState, elapsedSec: number): number {
  const simulatedSec = sanitizeElapsedSeconds(elapsedSec);
  if (simulatedSec <= 0) return 0;

  const tickCount = getOfflineProgressTickCount(simulatedSec);
  const stepSec = simulatedSec / tickCount;

  for (let tick = 0; tick < tickCount; tick++) {
    simulateActiveStratumProgressStep(state, stepSec);
  }

  return simulatedSec;
}

export function getOfflineElapsedSec(state: GameState, nowWallClockMs = Date.now()): number {
  if (!Number.isFinite(state.lastWallClockMs)) return 0;
  return Math.max(0, (nowWallClockMs - state.lastWallClockMs) / 1000);
}
