import { N, ZERO } from "../math/num";
import type { Num } from "../math/num";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "./common/coherence/balance";
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
  dreamCrystals: DreamCrystalsState;
  milestones: MilestonesState;
  stratumSpeed: Num;
}

export function createStratumState(): StratumState {
  return {
    dreamEnergy: N(10),
    coherencePoints: ZERO,
    coherenceProductionLoss: COHERENCE_DEFAULT_PRODUCTION_LOSS,
    dreamCrystals: createDreamCrystalsState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}
