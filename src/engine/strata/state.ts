import { N, ZERO } from "../math/num";
import type { Num } from "../math/num";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "./common/coherence/balance";
import {
  createEntropyState,
  type EntropyFormulaId,
  type EntropyState,
} from "./common/entropy/state";
import {
  createDreamCrystalsState,
  type DreamCrystalsState,
} from "./common/dream-crystals";
import {
  createMilestonesState,
  type MilestonesState,
} from "./common/milestones";

export interface StratumState {
  dreamEnergy: Num;
  coherencePoints: Num;
  coherenceProductionLoss: Num;
  chaoticEther: Num;
  entropy: EntropyState;
  dreamCrystals: DreamCrystalsState;
  milestones: MilestonesState;
  stratumSpeed: Num;
}

export interface CreateStratumStateOptions {
  entropyFormulaId?: EntropyFormulaId;
}

export function createStratumState(options: CreateStratumStateOptions = {}): StratumState {
  return {
    dreamEnergy: N(10),
    coherencePoints: ZERO,
    coherenceProductionLoss: COHERENCE_DEFAULT_PRODUCTION_LOSS,
    chaoticEther: ZERO,
    entropy: createEntropyState(options.entropyFormulaId),
    dreamCrystals: createDreamCrystalsState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}
