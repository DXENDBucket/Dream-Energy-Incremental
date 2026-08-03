import { add, div, floor, gte, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
  ensureDreamCrystalAutobuyersState,
  getDreamCrystalAutobuyerIntervalSec,
  getDreamCrystalRefineAutobuyerIntervalSec,
  runDreamCrystalAutobuyers,
  runDreamCrystalRefineAutobuyers,
} from "./logic";
import { isDreamCrystalAutobuyerUnlocked, isDreamCrystalRefineAutobuyerUnlocked } from "../upgrades";

export function tickDreamCrystalAutobuyers(stratum: StratumState, dtSec: Num): void {
  const autobuyers = ensureDreamCrystalAutobuyersState(stratum);

  if (isDreamCrystalAutobuyerUnlocked(stratum)) {
    autobuyers.elapsedSec = add(autobuyers.elapsedSec, dtSec);
    const intervalSec = getDreamCrystalAutobuyerIntervalSec(stratum);

    if (gte(autobuyers.elapsedSec, intervalSec)) {
      const elapsedCycles = floor(div(autobuyers.elapsedSec, intervalSec));
      autobuyers.elapsedSec = sub(
        autobuyers.elapsedSec,
        mul(intervalSec, elapsedCycles),
      );
      runDreamCrystalAutobuyers(stratum);
    }
  }

  if (isDreamCrystalRefineAutobuyerUnlocked(stratum)) {
    autobuyers.refineElapsedSec = add(autobuyers.refineElapsedSec, dtSec);
    const intervalSec = getDreamCrystalRefineAutobuyerIntervalSec(stratum);

    if (gte(autobuyers.refineElapsedSec, intervalSec)) {
      const elapsedCycles = floor(div(autobuyers.refineElapsedSec, intervalSec));
      autobuyers.refineElapsedSec = sub(
        autobuyers.refineElapsedSec,
        mul(intervalSec, elapsedCycles),
      );
      runDreamCrystalRefineAutobuyers(stratum);
    }
  }
}
