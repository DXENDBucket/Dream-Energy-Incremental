import { N, ZERO, normalizeNum } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import type { StratumState } from "@/engine/strata/state";
import { buyMaxDreamCrystal } from "../logic";
import { refineDreamCrystal } from "../refinement";
import { DREAM_CRYSTAL_TIERS } from "@/engine/math/dream-crystals";
import { isDreamCrystalAutobuyerUnlocked, isDreamCrystalRefineAutobuyerUnlocked } from "../upgrades";
import {
  createDreamCrystalAutobuyersState,
  type DreamCrystalAutobuyersState,
} from "./state";

export const DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC = N(8);
export const DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC = N(8);

export function ensureDreamCrystalAutobuyersState(stratum: StratumState): DreamCrystalAutobuyersState {
  stratum.dreamCrystalAutobuyers ??= createDreamCrystalAutobuyersState();
  stratum.dreamCrystalAutobuyers.enabled ??= {};
  stratum.dreamCrystalAutobuyers.elapsedSec = normalizeNum(
    stratum.dreamCrystalAutobuyers.elapsedSec,
    ZERO,
  );
  stratum.dreamCrystalAutobuyers.refineEnabled ??= {};
  stratum.dreamCrystalAutobuyers.refineElapsedSec = normalizeNum(
    stratum.dreamCrystalAutobuyers.refineElapsedSec,
    ZERO,
  );
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

export function isDreamCrystalRefineAutobuyerEnabled(stratum: StratumState, tier: number): boolean {
  return ensureDreamCrystalAutobuyersState(stratum).refineEnabled[tier] === true;
}

export function setDreamCrystalRefineAutobuyerEnabled(
  stratum: StratumState,
  tier: number,
  enabled: boolean,
): void {
  if (!isDreamCrystalRefineAutobuyerUnlocked(stratum)) return;
  ensureDreamCrystalAutobuyersState(stratum).refineEnabled[tier] = enabled;
}

export function toggleDreamCrystalRefineAutobuyer(stratum: StratumState, tier: number): void {
  setDreamCrystalRefineAutobuyerEnabled(
    stratum,
    tier,
    !isDreamCrystalRefineAutobuyerEnabled(stratum, tier),
  );
}

export function getDreamCrystalAutobuyerElapsedSec(stratum: StratumState): Num {
  return ensureDreamCrystalAutobuyersState(stratum).elapsedSec;
}

export function getDreamCrystalAutobuyerRemainingSec(stratum: StratumState): Num {
  const elapsed = getDreamCrystalAutobuyerElapsedSec(stratum);
  const remaining = DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC.sub(elapsed);
  return remaining.lt(ZERO) ? ZERO : remaining;
}

export function getDreamCrystalRefineAutobuyerElapsedSec(stratum: StratumState): Num {
  return ensureDreamCrystalAutobuyersState(stratum).refineElapsedSec;
}

export function getDreamCrystalRefineAutobuyerRemainingSec(stratum: StratumState): Num {
  const elapsed = getDreamCrystalRefineAutobuyerElapsedSec(stratum);
  const remaining = DREAM_CRYSTAL_REFINE_AUTOBUYER_INTERVAL_SEC.sub(elapsed);
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

export function runDreamCrystalRefineAutobuyers(stratum: StratumState): void {
  if (!isDreamCrystalRefineAutobuyerUnlocked(stratum)) return;

  for (const tier of DREAM_CRYSTAL_TIERS) {
    if (isDreamCrystalRefineAutobuyerEnabled(stratum, tier)) {
      refineDreamCrystal(stratum, tier);
    }
  }
}
