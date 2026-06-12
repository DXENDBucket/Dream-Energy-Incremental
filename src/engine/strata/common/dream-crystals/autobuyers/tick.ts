import { add, gte, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import {
  DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC,
  ensureDreamCrystalAutobuyersState,
  runDreamCrystalAutobuyers,
} from "./logic";
import { isDreamCrystalAutobuyerUnlocked } from "../upgrades";

export function tickDreamCrystalAutobuyers(stratum: StratumState, dtSec: Num): void {
  const autobuyers = ensureDreamCrystalAutobuyersState(stratum);
  if (!isDreamCrystalAutobuyerUnlocked(stratum)) return;

  autobuyers.elapsedSec = add(autobuyers.elapsedSec, dtSec);

  while (gte(autobuyers.elapsedSec, DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC)) {
    autobuyers.elapsedSec = sub(autobuyers.elapsedSec, DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC);
    runDreamCrystalAutobuyers(stratum);
  }
}
