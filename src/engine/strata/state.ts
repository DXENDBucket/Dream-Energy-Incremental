import { N, ZERO } from "../math/num";
import type { Num } from "../math/num";
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
  dreamCrystals: DreamCrystalsState;
  milestones: MilestonesState;
  stratumSpeed: Num;
}

export function createStratumState(): StratumState {
  return {
    dreamEnergy: N(10),
    dreamCrystals: createDreamCrystalsState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}