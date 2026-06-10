import { firstStratumId } from "../strata/defs/ids.ts";
import { createLiftState, type LiftState } from "../strata/lift/state.ts";
import type { StratumState } from "../strata/state.ts";
import { createStratumState } from "../strata/state.ts";

export interface GameSettingsState {
  autoSaveIntervalSec: number;
}

export interface GameState {
  lastTickMs: number;
  simTimeSec: number;
  activeStratumId: string;
  strata: Record<string, StratumState>;
  lift: LiftState;
  settings: GameSettingsState;
}

export function createNewState(): GameState {

  return {
    lastTickMs: performance.now(),
    simTimeSec: 0,
    activeStratumId: firstStratumId,
    strata: {
      [firstStratumId]: createStratumState(),
    },
    lift: createLiftState(),
    settings: {
      autoSaveIntervalSec: 20,
    },
  };
}
