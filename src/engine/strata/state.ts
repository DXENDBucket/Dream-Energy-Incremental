import { N, ONE, ZERO } from "../math/num";
import type { Num } from "../math/num";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "./common/coherence/balance";
import {
  createCoherenceUpgradesState,
  type CoherenceUpgradesState,
} from "./common/coherence/upgrades";
import {
  createConceptCrystalsState,
  type ConceptCrystalsState,
} from "./common/concept-crystals";
import type { ChaoticEtherAmounts } from "./common/chaotic-ether";
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
  rawDreamEnergy: Num;
  coherencePoints: Num;
  coherenceProductionLoss: Num;
  coherenceDreamCrystalMultiplier: Num;
  chaoticEther: ChaoticEtherAmounts;
  totalChaoticEtherGained: ChaoticEtherAmounts;
  coherenceUpgrades: CoherenceUpgradesState;
  conceptCrystals: ConceptCrystalsState;
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
    rawDreamEnergy: N(10),
    coherencePoints: ZERO,
    coherenceProductionLoss: COHERENCE_DEFAULT_PRODUCTION_LOSS,
    coherenceDreamCrystalMultiplier: ONE,
    chaoticEther: { "1": ZERO },
    totalChaoticEtherGained: { "1": ZERO },
    coherenceUpgrades: createCoherenceUpgradesState(),
    conceptCrystals: createConceptCrystalsState(),
    entropy: createEntropyState(options.entropyFormulaId),
    dreamCrystals: createDreamCrystalsState(),
    dreamCrystalUpgrades: createDreamCrystalUpgradesState(),
    dreamCrystalAutobuyers: createDreamCrystalAutobuyersState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}
