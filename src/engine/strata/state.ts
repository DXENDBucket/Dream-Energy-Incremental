import { N } from "../math/num";
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
}

export function createStratumState(): StratumState {
  return {
    dreamEnergy: N(10),
    dreamCrystals: createDreamCrystalsState(),
    milestones: createMilestonesState(),
  };
}