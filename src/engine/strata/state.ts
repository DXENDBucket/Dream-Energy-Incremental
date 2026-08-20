import { N, ONE, ZERO } from "../math/num";
import type { Num } from "../math/num";
import {
  getStratumDefinitionByEntropyFormula,
  realityStratumId,
} from "./defs";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "./common/coherence/balance";
import {
  createCoherenceAutobuyerState,
  type CoherenceAutobuyerState,
} from "./common/coherence/autobuyer/state";
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
import {
  createElectromagneticCrystalsState,
  type ElectromagneticCrystalsState,
} from "../electromagnetic-crystals/state";

export interface StratumState {
  stratumId: string;
  dreamEnergy: Num;
  rawDreamEnergy: Num;
  bestDreamEnergy: Num;
  coherencePoints: Num;
  bestNextStratumEntryCoherencePoints: Num;
  coherenceProductionLoss: Num;
  coherenceDreamCrystalMultiplier: Num;
  coherenceProgressionDreamCrystalMultiplier: Num;
  crushDreamCrystalMultiplier: Num;
  crushMilestoneCount: number;
  characterDreamCrystalMultiplier: Num;
  dreamCrystalMultiplierPower: Num;
  characterCoherencePointGainMultiplier: Num;
  characterChaoticEtherGainMultiplier: Num;
  characterElectromagneticPowerGainMultiplier: Num;
  characterShieldingEfficiency: Num;
  coherenceAutobuyer: CoherenceAutobuyerState;
  chaoticEther: ChaoticEtherAmounts;
  totalChaoticEtherGained: ChaoticEtherAmounts;
  coherenceUpgrades: CoherenceUpgradesState;
  conceptCrystals: ConceptCrystalsState;
  electromagneticCrystals: ElectromagneticCrystalsState;
  entropy: EntropyState;
  dreamCrystals: DreamCrystalsState;
  dreamCrystalUpgrades: DreamCrystalUpgradesState;
  dreamCrystalAutobuyers: DreamCrystalAutobuyersState;
  milestones: MilestonesState;
  stratumSpeed: Num;
}

export interface CreateStratumStateOptions {
  stratumId?: string;
  entropyFormulaId?: EntropyFormulaId;
}

export function createStratumState(options: CreateStratumStateOptions = {}): StratumState {
  const stratumId = options.stratumId
    ?? (options.entropyFormulaId
      ? getStratumDefinitionByEntropyFormula(options.entropyFormulaId)?.id
      : undefined)
    ?? realityStratumId;

  return {
    stratumId,
    dreamEnergy: N(10),
    rawDreamEnergy: N(10),
    bestDreamEnergy: N(10),
    coherencePoints: ZERO,
    bestNextStratumEntryCoherencePoints: ZERO,
    coherenceProductionLoss: COHERENCE_DEFAULT_PRODUCTION_LOSS,
    coherenceDreamCrystalMultiplier: ONE,
    coherenceProgressionDreamCrystalMultiplier: ONE,
    crushDreamCrystalMultiplier: ONE,
    crushMilestoneCount: 0,
    characterDreamCrystalMultiplier: ONE,
    dreamCrystalMultiplierPower: ONE,
    characterCoherencePointGainMultiplier: ONE,
    characterChaoticEtherGainMultiplier: ONE,
    characterElectromagneticPowerGainMultiplier: ONE,
    characterShieldingEfficiency: ONE,
    coherenceAutobuyer: createCoherenceAutobuyerState(),
    chaoticEther: { "1": ZERO },
    totalChaoticEtherGained: { "1": ZERO },
    coherenceUpgrades: createCoherenceUpgradesState(),
    conceptCrystals: createConceptCrystalsState(),
    electromagneticCrystals: createElectromagneticCrystalsState(),
    entropy: createEntropyState(options.entropyFormulaId),
    dreamCrystals: createDreamCrystalsState(),
    dreamCrystalUpgrades: createDreamCrystalUpgradesState(),
    dreamCrystalAutobuyers: createDreamCrystalAutobuyersState(),
    milestones: createMilestonesState(),
    stratumSpeed: N(1),
  };
}
