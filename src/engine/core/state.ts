import { firstStratumId } from "../strata/defs/ids.ts";
import { createLiftState, type LiftState } from "../strata/lift/state.ts";
import type { StratumState } from "../strata/state.ts";
import { createStratumState } from "../strata/state.ts";
import {
  createCharacterSystemState,
  type CharacterSystemState,
} from "../characters/state.ts";
import {
  createRealityMilestonesState,
  type RealityMilestonesState,
} from "../reality/milestones/state.ts";

export interface GameSettingsState {
  autoSaveIntervalSec: number;
}

export interface GameState {
  lastTickMs: number;
  lastWallClockMs: number;
  simTimeSec: number;
  activeStratumId: string;
  strata: Record<string, StratumState>;
  lift: LiftState;
  characters: CharacterSystemState;
  realityMilestones: RealityMilestonesState;
  settings: GameSettingsState;
}

export function createNewState(): GameState {

  return {
    lastTickMs: performance.now(),
    lastWallClockMs: Date.now(),
    simTimeSec: 0,
    activeStratumId: firstStratumId,
    strata: {
      [firstStratumId]: createStratumState(),
    },
    lift: createLiftState(),
    characters: createCharacterSystemState(),
    realityMilestones: createRealityMilestonesState(),
    settings: {
      autoSaveIntervalSec: 20,
    },
  };
}
