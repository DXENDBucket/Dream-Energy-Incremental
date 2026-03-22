import type { GameState } from "../core/state";
import type { StratumState } from "./state";
import { add, N, mul } from "../math/num";
import type { Num } from "../math/num";
import { getActiveStratum } from "./manager/selectors";
import { tickDreamCrystals } from "./common/dream-crystals";
import { tickDreamEnergy } from "./common/dream-energy";

export function tickStratum(stratum: StratumState, dtSec: Num): void {
  tickDreamCrystals(stratum, dtSec);
  tickDreamEnergy(stratum, dtSec);
}

export function tickActiveStratum(state: GameState, dtSec: Num): void {
  const stratum = getActiveStratum(state);
  let computedDtSec = dtSec;
  computedDtSec = mul(computedDtSec,stratum.stratumSpeed);
  tickStratum(stratum, computedDtSec);
}