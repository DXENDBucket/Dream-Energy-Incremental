import { N, ONE, ZERO, div, lte, max, mul, normalizeNum } from "@/engine/math/num";
import type { Num, NumInput } from "@/engine/math/num";
import {
  COHERENCE_UPGRADE_AUTOBUYER_ID,
  getCoherencePointGainMultiplier,
  hasCoherenceUpgrade,
} from "@/engine/strata/common/coherence/upgrades";
import type { StratumState } from "@/engine/strata/state";
import {
  createCoherenceAutobuyerState,
  type CoherenceAutobuyerMode,
  type CoherenceAutobuyerState,
} from "./state";

export const COHERENCE_AUTOBUYER_MIN_GAIN = ZERO;
export const COHERENCE_AUTOBUYER_MIN_RATIO = ZERO;
export const COHERENCE_AUTOBUYER_DEFAULT_INTERVAL_SEC = N(0.5);
export const COHERENCE_AUTOBUYER_MIN_INTERVAL_SEC = ZERO;

const VALID_MODES = new Set<CoherenceAutobuyerMode>(["interval", "amount", "ratio"]);

function normalizeFinite(value: unknown, fallback: NumInput): Num {
  const normalized = normalizeNum(value, fallback);
  return normalized.isFinite() ? normalized : N(fallback);
}

function parseFinite(value: NumInput, fallback: Num): Num {
  const parsed = N(value);
  return parsed.isFinite() ? parsed : fallback;
}

export function ensureCoherenceAutobuyerState(stratum: StratumState): CoherenceAutobuyerState {
  stratum.coherenceAutobuyer ??= createCoherenceAutobuyerState();
  const autobuyer = stratum.coherenceAutobuyer;

  autobuyer.enabled = autobuyer.enabled === true;
  autobuyer.mode = VALID_MODES.has(autobuyer.mode) ? autobuyer.mode : "interval";
  autobuyer.elapsedSec = max(ZERO, normalizeFinite(autobuyer.elapsedSec, ZERO));
  autobuyer.intervalSec = max(
    COHERENCE_AUTOBUYER_MIN_INTERVAL_SEC,
    normalizeFinite(autobuyer.intervalSec, COHERENCE_AUTOBUYER_DEFAULT_INTERVAL_SEC),
  );
  autobuyer.minimumGain = max(
    COHERENCE_AUTOBUYER_MIN_GAIN,
    normalizeFinite(autobuyer.minimumGain, ONE),
  );
  autobuyer.dynamicAmount = autobuyer.dynamicAmount === true;
  autobuyer.dynamicAmountLastMultiplier = max(
    ZERO,
    normalizeFinite(autobuyer.dynamicAmountLastMultiplier, ONE),
  );
  autobuyer.gainRatio = max(
    COHERENCE_AUTOBUYER_MIN_RATIO,
    normalizeFinite(autobuyer.gainRatio, 2),
  );
  return autobuyer;
}

export function isCoherenceAutobuyerUnlocked(stratum: StratumState): boolean {
  return hasCoherenceUpgrade(stratum, COHERENCE_UPGRADE_AUTOBUYER_ID);
}

export function setCoherenceAutobuyerEnabled(stratum: StratumState, enabled: boolean): void {
  if (!isCoherenceAutobuyerUnlocked(stratum)) return;
  ensureCoherenceAutobuyerState(stratum).enabled = enabled;
}

export function setCoherenceAutobuyerMode(
  stratum: StratumState,
  mode: CoherenceAutobuyerMode,
): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  autobuyer.mode = mode;
  autobuyer.elapsedSec = ZERO;
  if (mode === "amount") {
    autobuyer.dynamicAmountLastMultiplier = getCoherencePointGainMultiplier(stratum);
  }
}

export function setCoherenceAutobuyerInterval(stratum: StratumState, intervalSec: NumInput): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  autobuyer.intervalSec = max(
    COHERENCE_AUTOBUYER_MIN_INTERVAL_SEC,
    parseFinite(intervalSec, autobuyer.intervalSec),
  );
  autobuyer.elapsedSec = ZERO;
}

export function setCoherenceAutobuyerMinimumGain(stratum: StratumState, minimumGain: NumInput): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  autobuyer.minimumGain = max(
    COHERENCE_AUTOBUYER_MIN_GAIN,
    parseFinite(minimumGain, autobuyer.minimumGain),
  );
  autobuyer.dynamicAmountLastMultiplier = getCoherencePointGainMultiplier(stratum);
}

export function setCoherenceAutobuyerDynamicAmount(
  stratum: StratumState,
  enabled: boolean,
): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  autobuyer.dynamicAmount = enabled;
  autobuyer.dynamicAmountLastMultiplier = getCoherencePointGainMultiplier(stratum);
}

export function syncCoherenceAutobuyerDynamicAmount(stratum: StratumState): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  if (!autobuyer.dynamicAmount || autobuyer.mode !== "amount") return;

  const currentMultiplier = getCoherencePointGainMultiplier(stratum);
  const previousMultiplier = autobuyer.dynamicAmountLastMultiplier;
  if (lte(previousMultiplier, ZERO)) {
    autobuyer.dynamicAmountLastMultiplier = currentMultiplier;
    return;
  }

  if (!currentMultiplier.eq(previousMultiplier)) {
    autobuyer.minimumGain = max(
      COHERENCE_AUTOBUYER_MIN_GAIN,
      mul(autobuyer.minimumGain, div(currentMultiplier, previousMultiplier)),
    );
    autobuyer.dynamicAmountLastMultiplier = currentMultiplier;
  }
}

export function setCoherenceAutobuyerGainRatio(stratum: StratumState, ratio: NumInput): void {
  const autobuyer = ensureCoherenceAutobuyerState(stratum);
  autobuyer.gainRatio = max(
    COHERENCE_AUTOBUYER_MIN_RATIO,
    parseFinite(ratio, autobuyer.gainRatio),
  );
}

export function getCoherenceAutobuyerComparisonBase(currentCoherencePoints: Num): Num {
  return max(currentCoherencePoints, ONE);
}
