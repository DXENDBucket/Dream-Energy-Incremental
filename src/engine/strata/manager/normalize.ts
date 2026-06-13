import type { GameState } from "@/engine/core/state";
import { ONE, ZERO } from "@/engine/math/num";
import { ensureChaoticEtherState } from "@/engine/strata/common/chaotic-ether";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "@/engine/strata/common/coherence/balance";
import { ensureCoherenceUpgradesState } from "@/engine/strata/common/coherence/upgrades";
import { ensureDreamCrystalAutobuyersState } from "@/engine/strata/common/dream-crystals/autobuyers";
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

export function normalizeGameState(state: GameState): GameState {
  state.strata[realityStratumId] ??= createStratumState();

  for (const [id, stratum] of Object.entries(state.strata)) {
    stratum.coherencePoints ??= ZERO;
    stratum.coherenceProductionLoss ??= COHERENCE_DEFAULT_PRODUCTION_LOSS;
    stratum.coherenceDreamCrystalMultiplier ??= ONE;
    ensureChaoticEtherState(stratum);
    ensureCoherenceUpgradesState(stratum);
    ensureDreamCrystalUpgradesState(stratum);
    ensureDreamCrystalAutobuyersState(stratum);

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
