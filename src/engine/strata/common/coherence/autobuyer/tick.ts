import type { GameState } from "@/engine/core/state";
import { ZERO, add, div, floor, gte, lte, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  condenseCoherence,
  getCoherencePointGain,
  getCoherencePoints,
} from "@/engine/strata/common/coherence/logic";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  ensureCoherenceAutobuyerState,
  getCoherenceAutobuyerComparisonBase,
  isCoherenceAutobuyerUnlocked,
  syncCoherenceAutobuyerDynamicAmount,
} from "./logic";

export function tickCoherenceAutobuyer(state: GameState, dtSec: Num): void {
  const stratum = getActiveStratum(state);
  if (!isCoherenceAutobuyerUnlocked(stratum)) return;

  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  syncCoherenceAutobuyerDynamicAmount(stratum, autobuyer);
  if (!autobuyer.enabled) return;

  if (autobuyer.mode === "interval") {
    if (lte(autobuyer.intervalSec, ZERO)) {
      autobuyer.elapsedSec = ZERO;
      condenseCoherence(state);
      return;
    }

    const nextElapsedSec = add(autobuyer.elapsedSec, dtSec);
    if (!gte(nextElapsedSec, autobuyer.intervalSec)) {
      autobuyer.elapsedSec = nextElapsedSec;
      return;
    }

    const completedIntervals = floor(div(nextElapsedSec, autobuyer.intervalSec));
    autobuyer.elapsedSec = sub(
      nextElapsedSec,
      mul(autobuyer.intervalSec, completedIntervals),
    );
    condenseCoherence(state);
    return;
  }

  const pendingGain = getCoherencePointGain(stratum);
  if (autobuyer.mode === "amount") {
    if (gte(pendingGain, autobuyer.minimumGain)) condenseCoherence(state);
    return;
  }

  const requiredGain = mul(
    getCoherenceAutobuyerComparisonBase(getCoherencePoints(stratum)),
    autobuyer.gainRatio,
  );
  if (gte(pendingGain, requiredGain)) condenseCoherence(state);
}
