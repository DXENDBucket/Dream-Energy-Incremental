import type { GameState } from "../core/state";
import type { StratumState } from "./state";
import { add, N } from "../math/num";
import { getActiveStratum } from "./manager/selectors";
import { tickDreamCrystals } from "./common/dream-crystals";
import { tickDreamEnergy } from "./common/dream-energy";

export function tickStratum(stratum: StratumState, dtSec: number): void {
  tickDreamCrystals(stratum, dtSec);
  tickDreamEnergy(stratum, dtSec);
}

export function tickActiveStratum(state: GameState, dtSec: number): void {
  const stratum = getActiveStratum(state);
  tickStratum(stratum, dtSec);
}