import type { GameState } from "@/engine/core/state";
import { ZERO, add, div, floor, gte, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  canCondenseCoherence,
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
  syncCoherenceAutobuyerDynamicAmount(stratum);
  if (!autobuyer.enabled) return;

  if (autobuyer.mode === "interval") {
    autobuyer.elapsedSec = add(autobuyer.elapsedSec, dtSec);
    if (!gte(autobuyer.elapsedSec, autobuyer.intervalSec)) return;

    const completedIntervals = floor(div(autobuyer.elapsedSec, autobuyer.intervalSec));
    autobuyer.elapsedSec = sub(
      autobuyer.elapsedSec,
      mul(autobuyer.intervalSec, completedIntervals),
    );
    if (canCondenseCoherence(state)) condenseCoherence(state);
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
