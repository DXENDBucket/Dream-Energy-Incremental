import type { GameState } from "@/engine/core/state";
import { ZERO } from "@/engine/math/num";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "@/engine/strata/common/coherence/balance";
import { ensureDreamCrystalAutobuyersState } from "@/engine/strata/common/dream-crystals/autobuyers";
import { ensureDreamCrystalUpgradesState } from "@/engine/strata/common/dream-crystals/upgrades";
import {
  ENTROPY_DEFAULT_TUNING_EXPONENT,
  ensureEntropyState,
} from "@/engine/strata/common/entropy";
import {
  dreamSeaFirstStratumId,
  realityStratumId,
} from "@/engine/strata/defs/ids";
import { createStratumState } from "@/engine/strata/state";

export function normalizeGameState(state: GameState): GameState {
  state.strata[realityStratumId] ??= createStratumState();

  for (const [id, stratum] of Object.entries(state.strata)) {
    stratum.coherencePoints ??= ZERO;
    stratum.coherenceProductionLoss ??= COHERENCE_DEFAULT_PRODUCTION_LOSS;
    stratum.chaoticEther ??= ZERO;
    ensureDreamCrystalUpgradesState(stratum);
    ensureDreamCrystalAutobuyersState(stratum);

    const entropy = ensureEntropyState(stratum);
    entropy.formulaId = id === dreamSeaFirstStratumId ? "dream-sea-first" : "none";
    if (id === dreamSeaFirstStratumId) {
      entropy.tuningExponent = ENTROPY_DEFAULT_TUNING_EXPONENT;
    }
  }

  if (!(state.activeStratumId in state.strata)) {
    state.activeStratumId = realityStratumId;
  }

  if (!(state.lift.currentLiftPosition in state.strata)) {
    state.lift.currentLiftPosition = state.activeStratumId;
  }

  return state;
}
