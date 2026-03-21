import type { GameState } from "../../core/state";
import type { StratumState } from "../state";
import type { Num } from "../../math/num";

export function getActiveStratum(state: GameState): StratumState {
  const stratum = state.strata[state.activeStratumId];

  if (!stratum) {
    throw new Error(`Active stratum '${state.activeStratumId}' not found.`);
  }

  return stratum;
}

export function getStratum(state: GameState, id: string): StratumState {
  const stratum = state.strata[id];

  if (!stratum) {
    throw new Error(`Stratum '${id}' not found.`);
  }

  return stratum;
}

export function getActiveDreamEnergy(state: GameState): Num {
  return getActiveStratum(state).dreamEnergy;
}

export function getStratumDreamEnergy(state: GameState, id: string): Num {
  return getStratum(state, id).dreamEnergy;
}

export function getDreamEnergy(stratum: StratumState): Num {
  return stratum.dreamEnergy;
}