import { N, ZERO } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { buyMaxDreamCrystal } from "../logic";
import { DREAM_CRYSTAL_TIERS } from "@/engine/math/dream-crystals";
import { isDreamCrystalAutobuyerUnlocked } from "../upgrades";
import {
  createDreamCrystalAutobuyersState,
  type DreamCrystalAutobuyersState,
} from "./state";

export const DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC = N(8);

export function ensureDreamCrystalAutobuyersState(stratum: StratumState): DreamCrystalAutobuyersState {
  stratum.dreamCrystalAutobuyers ??= createDreamCrystalAutobuyersState();
  stratum.dreamCrystalAutobuyers.enabled ??= {};
  stratum.dreamCrystalAutobuyers.elapsedSec ??= ZERO;
  return stratum.dreamCrystalAutobuyers;
}

export function isDreamCrystalAutobuyerEnabled(stratum: StratumState, tier: number): boolean {
  return ensureDreamCrystalAutobuyersState(stratum).enabled[tier] === true;
}

export function setDreamCrystalAutobuyerEnabled(
  stratum: StratumState,
  tier: number,
  enabled: boolean,
): void {
  if (!isDreamCrystalAutobuyerUnlocked(stratum)) return;
  ensureDreamCrystalAutobuyersState(stratum).enabled[tier] = enabled;
}

export function toggleDreamCrystalAutobuyer(stratum: StratumState, tier: number): void {
  setDreamCrystalAutobuyerEnabled(stratum, tier, !isDreamCrystalAutobuyerEnabled(stratum, tier));
}

export function getDreamCrystalAutobuyerElapsedSec(stratum: StratumState): Num {
  return ensureDreamCrystalAutobuyersState(stratum).elapsedSec;
}

export function getDreamCrystalAutobuyerRemainingSec(stratum: StratumState): Num {
  const elapsed = getDreamCrystalAutobuyerElapsedSec(stratum);
  const remaining = DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC.sub(elapsed);
  return remaining.lt(ZERO) ? ZERO : remaining;
}

export function runDreamCrystalAutobuyers(stratum: StratumState): void {
  if (!isDreamCrystalAutobuyerUnlocked(stratum)) return;

  for (const tier of DREAM_CRYSTAL_TIERS) {
    if (isDreamCrystalAutobuyerEnabled(stratum, tier)) {
      buyMaxDreamCrystal(stratum, tier);
    }
  }
}
