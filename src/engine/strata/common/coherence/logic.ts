import type { GameState } from "@/engine/core/state";
import { TEN, ZERO, add, div, floor, gte, log10, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import type { StratumState } from "@/engine/strata/state";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  COHERENCE_CONDENSE_EXPONENT_OFFSET,
  COHERENCE_CONDENSE_REQUIREMENT,
  COHERENCE_DEFAULT_PRODUCTION_LOSS,
} from "./balance";

export function getCoherencePoints(stratum: StratumState): Num {
  return stratum.coherencePoints ?? ZERO;
}

export function getCoherenceProductionLoss(stratum: StratumState): Num {
  return stratum.coherenceProductionLoss ?? COHERENCE_DEFAULT_PRODUCTION_LOSS;
}

export function getCoherencePointGain(stratum: StratumState): Num {
  if (!gte(stratum.dreamEnergy, COHERENCE_CONDENSE_REQUIREMENT)) return ZERO;

  const exponent = sub(
    div(log10(stratum.dreamEnergy), getCoherenceProductionLoss(stratum)),
    COHERENCE_CONDENSE_EXPONENT_OFFSET,
  );

  return floor(pow(TEN, exponent));
}

export function canCondenseCoherence(state: GameState): boolean {
  if (!state.lift.isLiftUnlocked) return false;
  return gte(getCoherencePointGain(getActiveStratum(state)), 1);
}

export function condenseCoherence(state: GameState): void {
  if (!canCondenseCoherence(state)) return;

  const stratum = getActiveStratum(state);
  const gain = getCoherencePointGain(stratum);

  stratum.coherencePoints = add(getCoherencePoints(stratum), gain);
  stratum.dreamEnergy = TEN;
  stratum.dreamCrystals = createDreamCrystalsState();
}
