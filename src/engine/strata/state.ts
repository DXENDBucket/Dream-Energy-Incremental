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
  createDreamCrystalAutobuyersState,
  type DreamCrystalAutobuyersState,
} from "./common/dream-crystals/autobuyers";
import {
  createDreamCrystalUpgradesState,
  type DreamCrystalUpgradesState,
} from "./common/dream-crystals/upgrades";
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
  dreamCrystalUpgrades: DreamCrystalUpgradesState;
  dreamCrystalAutobuyers: DreamCrystalAutobuyersState;
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
    dreamCrystalUpgrades: createDreamCrystalUpgradesState(),
    dreamCrystalAutobuyers: createDreamCrystalAutobuyersState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}
