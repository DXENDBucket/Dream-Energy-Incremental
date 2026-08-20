import type { GameState } from "@/engine/core/state";
import { N, TEN, ZERO, add, div, floor, gt, gte, log10, mul, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { getDreamCrystalCoherenceProductionLossMultiplier } from "@/engine/strata/common/dream-crystals/upgrades";
import {
  COHERENCE_UPGRADE_PASSIVE_POINT_GAIN_ID,
  getCoherencePointGainMultiplier,
} from "@/engine/strata/common/coherence/upgrades";
import { getDreamEnergy, setDreamEnergy } from "@/engine/strata/common/dream-energy";
import type { StratumState } from "@/engine/strata/state";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { dreamSeaFourthStratumId } from "@/engine/strata/defs";
import {
  COHERENCE_CONDENSE_EXPONENT_OFFSET,
  COHERENCE_CONDENSE_REQUIREMENT,
  COHERENCE_DEFAULT_PRODUCTION_LOSS,
} from "./balance";

export function getCoherencePoints(stratum: StratumState): Num {
  return stratum.coherencePoints ?? ZERO;
}

export function getCoherenceProductionLoss(stratum: StratumState): Num {
  return mul(
    stratum.coherenceProductionLoss ?? COHERENCE_DEFAULT_PRODUCTION_LOSS,
    getDreamCrystalCoherenceProductionLossMultiplier(stratum),
  );
}

export function getCoherencePointGain(stratum: StratumState): Num {
  const dreamEnergy = getDreamEnergy(stratum);
  if (!gt(dreamEnergy, COHERENCE_CONDENSE_REQUIREMENT)) return ZERO;

  const exponent = sub(
    div(log10(dreamEnergy), getCoherenceProductionLoss(stratum)),
    COHERENCE_CONDENSE_EXPONENT_OFFSET,
  );

  return floor(mul(pow(TEN, exponent), getCoherencePointGainMultiplier(stratum)));
}

export const COHERENCE_PASSIVE_POINT_GAIN_RATIO_PER_SECOND = N("0.01");

export function getPassiveCoherencePointGainPerSecond(stratum: StratumState): Num {
  if (stratum.coherenceUpgrades?.bought?.[COHERENCE_UPGRADE_PASSIVE_POINT_GAIN_ID] !== true) {
    return ZERO;
  }
  return mul(getCoherencePointGain(stratum), COHERENCE_PASSIVE_POINT_GAIN_RATIO_PER_SECOND);
}

export function tickPassiveCoherencePointGain(stratum: StratumState, dtSec: Num): void {
  const gain = mul(getPassiveCoherencePointGainPerSecond(stratum), dtSec);
  if (!gt(gain, ZERO)) return;
  stratum.coherencePoints = add(getCoherencePoints(stratum), gain);
}

export function canCondenseCoherence(state: GameState): boolean {
  if (!state.lift.isLiftUnlocked) return false;
  if (state.activeStratumId === dreamSeaFourthStratumId) return false;
  return gte(getCoherencePointGain(getActiveStratum(state)), 1);
}

export function condenseCoherence(state: GameState): void {
  if (!canCondenseCoherence(state)) return;

  const stratum = getActiveStratum(state);
  const gain = getCoherencePointGain(stratum);

  stratum.coherencePoints = add(getCoherencePoints(stratum), gain);
  setDreamEnergy(stratum, TEN);
  stratum.dreamCrystals = createDreamCrystalsState();
}
