import { firstStratumId } from "../strata/defs/ids.ts";
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
    settings: {
      autoSaveIntervalSec: 20,
    },
  };
}
