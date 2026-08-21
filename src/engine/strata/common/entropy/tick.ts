import type { Num } from "@/engine/math/num";
import { ONE, add, gte, min, mul } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { ENTROPY_GAIN_PER_SECOND } from "./balance";
import {
  ensureEntropyState,
  getEntropyBaseGrowthMultiplier,
  getEntropyGrowthRateMultiplier,
  hasAnyDreamCrystal,
} from "./logic";

export function tickEntropy(stratum: StratumState, dtSec: Num): void {
  const entropy = ensureEntropyState(stratum);
  if (entropy.formulaId === "none") return;

  if (!entropy.isStarted && hasAnyDreamCrystal(stratum)) {
    entropy.isStarted = true;
  }

  if (!entropy.isStarted) return;
  if (gte(entropy.value, ONE)) return;

  entropy.value = min(
    ONE,
    add(
      entropy.value,
      mul(
        mul(
          mul(ENTROPY_GAIN_PER_SECOND, getEntropyBaseGrowthMultiplier(stratum)),
          getEntropyGrowthRateMultiplier(stratum),
        ),
        dtSec,
      ),
    ),
  );
}
