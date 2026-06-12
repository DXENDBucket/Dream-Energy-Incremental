import type { GameState } from "@/engine/core/state";
import { ONE, ZERO, add, floor, gt, log10, sqrt } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { ensureEntropyState } from "@/engine/strata/common/entropy";
import { dreamSeaFirstStratumId } from "@/engine/strata/defs/ids";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import type { StratumState } from "@/engine/strata/state";

export function getChaoticEther(stratum: StratumState): Num {
  return stratum.chaoticEther ?? ZERO;
}

export function getChaoticEtherGain(stratum: StratumState): Num {
  if (!gt(stratum.dreamEnergy, ONE)) return ZERO;
  return floor(log10(sqrt(stratum.dreamEnergy)));
}

export function canExtractChaoticEther(state: GameState): boolean {
  if (state.activeStratumId !== dreamSeaFirstStratumId) return false;

  const stratum = getActiveStratum(state);
  const entropy = ensureEntropyState(stratum);
  if (entropy.value.gte(ONE)) return false;

  return gt(getChaoticEtherGain(stratum), ZERO);
}

export function extractChaoticEther(state: GameState): void {
  if (!canExtractChaoticEther(state)) return;

  const stratum = getActiveStratum(state);
  const gain = getChaoticEtherGain(stratum);
  const entropy = ensureEntropyState(stratum);

  stratum.chaoticEther = add(getChaoticEther(stratum), gain);
  entropy.isStarted = true;
  entropy.value = ONE;
}
