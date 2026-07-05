import { ZERO, add, div, lte, max, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { isConceptCrystalsUnlocked } from "@/engine/strata/common/milestones";
import {
  ensureConceptCrystalsState,
  getConceptCrystalProductionInterval,
  runConceptCrystalProductionCycles,
} from "./logic";

const CONCEPT_CRYSTAL_MAX_BATCH_CYCLES = 1_000_000_000_000;

export function tickConceptCrystals(stratum: StratumState, dtSec: Num): void {
  if (!isConceptCrystalsUnlocked(stratum)) return;

  const conceptCrystals = ensureConceptCrystalsState(stratum);
  const interval = getConceptCrystalProductionInterval(stratum);

  if (interval.lte(ZERO)) return;

  conceptCrystals.productionElapsedSec = add(conceptCrystals.productionElapsedSec, dtSec);

  const cycleCount = div(conceptCrystals.productionElapsedSec, interval).floor();
  if (lte(cycleCount, ZERO)) return;

  const cycleCountNumber = Math.min(
    CONCEPT_CRYSTAL_MAX_BATCH_CYCLES,
    Math.max(0, cycleCount.toNumber()),
  );
  const processedCycles = runConceptCrystalProductionCycles(stratum, cycleCountNumber);
  if (processedCycles <= 0) return;

  const consumedSec = mul(interval, processedCycles);
  conceptCrystals.productionElapsedSec = max(ZERO, sub(conceptCrystals.productionElapsedSec, consumedSec));

  if (processedCycles < cycleCountNumber) {
    conceptCrystals.productionElapsedSec = ZERO;
  }
}
