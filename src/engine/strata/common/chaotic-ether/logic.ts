import type { GameState } from "@/engine/core/state";
import { ONE, TEN, ZERO, add, div, floor, gt, gte, log10, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { ensureEntropyState } from "@/engine/strata/common/entropy";
import { dreamSeaFirstStratumId } from "@/engine/strata/defs/ids";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import type { StratumState } from "@/engine/strata/state";
import {
  CHAOTIC_ETHER_EXTRACT_EXPONENT_OFFSET,
  CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR,
  CHAOTIC_ETHER_EXTRACT_REQUIREMENT,
} from "./balance";

export function getChaoticEther(stratum: StratumState): Num {
  return stratum.chaoticEther ?? ZERO;
}

export function getTotalChaoticEtherGained(stratum: StratumState): Num {
  return stratum.totalChaoticEtherGained ?? ZERO;
}

export function addChaoticEther(stratum: StratumState, amount: Num): void {
  stratum.chaoticEther = add(getChaoticEther(stratum), amount);
  stratum.totalChaoticEtherGained = add(getTotalChaoticEtherGained(stratum), amount);
}

export function getChaoticEtherGain(stratum: StratumState): Num {
  if (!gte(stratum.dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT)) return ZERO;

  const exponent = sub(
    div(log10(stratum.dreamEnergy), CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR),
    CHAOTIC_ETHER_EXTRACT_EXPONENT_OFFSET,
  );

  return floor(pow(TEN, exponent));
}

export function canExtractChaoticEther(state: GameState): boolean {
  if (state.activeStratumId !== dreamSeaFirstStratumId) return false;

  const stratum = getActiveStratum(state);
  return gt(getChaoticEtherGain(stratum), ZERO);
}

export function extractChaoticEther(state: GameState): void {
  if (!canExtractChaoticEther(state)) return;

  const stratum = getActiveStratum(state);
  const gain = getChaoticEtherGain(stratum);
  const entropy = ensureEntropyState(stratum);

  addChaoticEther(stratum, gain);
  stratum.dreamEnergy = TEN;
  stratum.dreamCrystals = createDreamCrystalsState();
  entropy.isStarted = true;
  entropy.value = ONE;
}
