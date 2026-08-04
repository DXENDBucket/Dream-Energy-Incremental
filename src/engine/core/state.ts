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
import { createCrushState, type CrushState } from "../crush/state.ts";

export interface GameSettingsState {
  autoSaveIntervalSec: number;
  condenseConfirmationEnabled: boolean;
  chaoticEtherConfirmationEnabled: boolean;
  crushConfirmationEnabled: boolean;
  prestigeConfirmationsEnabled?: boolean;
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
  crush: CrushState;
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
    crush: createCrushState(),
    settings: {
      autoSaveIntervalSec: 20,
      condenseConfirmationEnabled: true,
      chaoticEtherConfirmationEnabled: true,
      crushConfirmationEnabled: true,
    },
  };
}
