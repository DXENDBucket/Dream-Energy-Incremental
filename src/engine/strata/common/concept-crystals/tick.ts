import { ZERO, add, gte, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { isConceptCrystalsUnlocked } from "@/engine/strata/common/milestones";
import {
  ensureConceptCrystalsState,
  getConceptCrystalProductionInterval,
  runConceptCrystalProduction,
} from "./logic";

export function tickConceptCrystals(stratum: StratumState, dtSec: Num): void {
  if (!isConceptCrystalsUnlocked(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const interval = getConceptCrystalProductionInterval(stratum);

  if (interval.lte(ZERO)) return;

  conceptCrystals.productionElapsedSec = add(conceptCrystals.productionElapsedSec, dtSec);

  while (gte(conceptCrystals.productionElapsedSec, interval)) {
    conceptCrystals.productionElapsedSec = sub(conceptCrystals.productionElapsedSec, interval);
    runConceptCrystalProduction(stratum);
  }
}
