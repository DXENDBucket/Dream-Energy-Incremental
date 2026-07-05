import { add, div, floor, gte, mul, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
  DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC,
  DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC,
  ensureDreamCrystalAutobuyersState,
  runDreamCrystalAutobuyers,
  runDreamCrystalRefineAutobuyers,
} from "./logic";
import { isDreamCrystalAutobuyerUnlocked, isDreamCrystalRefineAutobuyerUnlocked } from "../upgrades";

export function tickDreamCrystalAutobuyers(stratum: StratumState, dtSec: Num): void {
  const autobuyers = ensureDreamCrystalAutobuyersState(stratum);

  if (isDreamCrystalAutobuyerUnlocked(stratum)) {
    autobuyers.elapsedSec = add(autobuyers.elapsedSec, dtSec);

    if (gte(autobuyers.elapsedSec, DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC)) {
      const elapsedCycles = floor(div(autobuyers.elapsedSec, DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC));
      autobuyers.elapsedSec = sub(
        autobuyers.elapsedSec,
        mul(DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC, elapsedCycles),
      );
      runDreamCrystalAutobuyers(stratum);
    }
  }

  if (isDreamCrystalRefineAutobuyerUnlocked(stratum)) {
    autobuyers.refineElapsedSec = add(autobuyers.refineElapsedSec, dtSec);

    if (gte(autobuyers.refineElapsedSec, DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC)) {
      const elapsedCycles = floor(div(autobuyers.refineElapsedSec, DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC));
      autobuyers.refineElapsedSec = sub(
        autobuyers.refineElapsedSec,
        mul(DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC, elapsedCycles),
      );
      runDreamCrystalRefineAutobuyers(stratum);
    }
  }
}
