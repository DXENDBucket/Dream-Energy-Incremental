import type { GameState } from "@/engine/core/state";
import { ONE, ZERO, normalizeNum } from "@/engine/math/num";
import { ensureChaoticEtherState } from "@/engine/strata/common/chaotic-ether";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "@/engine/strata/common/coherence/balance";
import { ensureCoherenceUpgradesState } from "@/engine/strata/common/coherence/upgrades";
import { ensureDreamCrystalAutobuyersState } from "@/engine/strata/common/dream-crystals/autobuyers";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { ensureDreamCrystalUpgradesState } from "@/engine/strata/common/dream-crystals/upgrades";
import {
  ensureEntropyState,
  getDefaultEntropyChaosExponent,
} from "@/engine/strata/common/entropy";
import {
  dreamSeaFirstStratumId,
  dreamSeaSecondStratumId,
  realityStratumId,
} from "@/engine/strata/defs/ids";
import { createStratumState } from "@/engine/strata/state";
import type { StratumState } from "@/engine/strata/state";
import { createMilestonesState } from "@/engine/strata/common/milestones";

function normalizeDreamCrystalsState(stratum: StratumState): void {
  const defaults = createDreamCrystalsState();
  stratum.dreamCrystals ??= defaults;
  stratum.dreamCrystals.tiers ??= {};

  for (let tier = 1; tier <= 8; tier++) {
    const rawTier = stratum.dreamCrystals.tiers[tier] ?? defaults.tiers[tier]!;

    stratum.dreamCrystals.tiers[tier] = {
      amount: normalizeNum(rawTier.amount),
      bought: normalizeNum(rawTier.bought),
      refinement: normalizeNum(rawTier.refinement),
    };
  }
}

export function normalizeGameState(state: GameState): GameState {
  state.strata[realityStratumId] ??= createStratumState();

  for (const [id, stratum] of Object.entries(state.strata)) {
    stratum.dreamEnergy = normalizeNum(stratum.dreamEnergy, 10);
    stratum.coherencePoints = normalizeNum(stratum.coherencePoints, ZERO);
    stratum.coherenceProductionLoss = normalizeNum(
      stratum.coherenceProductionLoss,
      COHERENCE_DEFAULT_PRODUCTION_LOSS,
    );
    stratum.coherenceDreamCrystalMultiplier = normalizeNum(stratum.coherenceDreamCrystalMultiplier, ONE);
    stratum.stratumSpeed = normalizeNum(stratum.stratumSpeed, ONE);
    normalizeDreamCrystalsState(stratum);
    ensureChaoticEtherState(stratum);
    ensureCoherenceUpgradesState(stratum);
    ensureDreamCrystalUpgradesState(stratum);
    ensureDreamCrystalAutobuyersState(stratum);
    stratum.milestones ??= createMilestonesState();
    stratum.milestones.claimed ??= {};

    const entropy = ensureEntropyState(stratum);
    if (id === dreamSeaFirstStratumId) {
      entropy.formulaId = "dream-sea-first";
    } else if (id === dreamSeaSecondStratumId) {
      entropy.formulaId = "dream-sea-second";
    } else {
      entropy.formulaId = "none";
    }
    entropy.chaosExponent = getDefaultEntropyChaosExponent(entropy.formulaId);
  }

  if (!(state.activeStratumId in state.strata)) {
    state.activeStratumId = realityStratumId;
  }

  if (!(state.lift.currentLiftPosition in state.strata)) {
    state.lift.currentLiftPosition = state.activeStratumId;
  }

  return state;
}
