import type { GameState } from "@/engine/core/state";
import { ONE, TEN, ZERO, add, div, floor, gt, gte, log10, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { isNum } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { ensureEntropyState } from "@/engine/strata/common/entropy";
import {
  dreamSeaFirstStratumId,
  dreamSeaSecondStratumId,
} from "@/engine/strata/defs/ids";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import type { StratumState } from "@/engine/strata/state";
import {
  CHAOTIC_ETHER_EXTRACT_EXPONENT_OFFSET,
  CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR,
  CHAOTIC_ETHER_EXTRACT_REQUIREMENT,
} from "./balance";

export type ChaoticEtherTier = number;
export type ChaoticEtherAmounts = Record<string, Num>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isNum(value);
}

function normalizeChaoticEtherAmounts(raw: unknown): ChaoticEtherAmounts {
  if (isNum(raw)) {
    return { "1": raw };
  }

  if (!isPlainRecord(raw)) {
    return {};
  }

  const amounts: ChaoticEtherAmounts = {};

  for (const [tier, amount] of Object.entries(raw)) {
    if (isNum(amount)) {
      amounts[tier] = amount;
    }
  }

  return amounts;
}

export function ensureChaoticEtherState(stratum: StratumState): void {
  stratum.chaoticEther = normalizeChaoticEtherAmounts(stratum.chaoticEther);
  stratum.totalChaoticEtherGained = normalizeChaoticEtherAmounts(stratum.totalChaoticEtherGained);
}

export function getChaoticEther(stratum: StratumState, tier: ChaoticEtherTier = 1): Num {
  ensureChaoticEtherState(stratum);
  return stratum.chaoticEther[tier.toString()] ?? ZERO;
}

export function getTotalChaoticEtherGained(stratum: StratumState, tier: ChaoticEtherTier = 1): Num {
  ensureChaoticEtherState(stratum);
  return stratum.totalChaoticEtherGained[tier.toString()] ?? ZERO;
}

export function setChaoticEther(
  stratum: StratumState,
  tier: ChaoticEtherTier,
  amount: Num,
): void {
  ensureChaoticEtherState(stratum);
  stratum.chaoticEther[tier.toString()] = amount;
}

export function addChaoticEther(
  stratum: StratumState,
  amount: Num,
  tier: ChaoticEtherTier = 1,
): void {
  setChaoticEther(stratum, tier, add(getChaoticEther(stratum, tier), amount));
  stratum.totalChaoticEtherGained[tier.toString()] = add(
    getTotalChaoticEtherGained(stratum, tier),
    amount,
  );
}

export function getChaoticEtherProducedTierForStratumId(stratumId: string): ChaoticEtherTier {
  if (stratumId === dreamSeaFirstStratumId) return 1;
  if (stratumId === dreamSeaSecondStratumId) return 2;
  return 0;
}

export function getDreamCrystalUpgradeChaoticEtherTier(stratum: StratumState): ChaoticEtherTier {
  const formulaId = stratum.entropy?.formulaId ?? "none";
  if (formulaId === "dream-sea-first") return 2;
  if (formulaId === "dream-sea-second") return 3;
  return 1;
}

export function getChaoticEtherGain(stratum: StratumState): Num {
  if (!gte(stratum.dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT)) return ZERO;

  const exponent = sub(
    div(log10(stratum.dreamEnergy), CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR),
    CHAOTIC_ETHER_EXTRACT_EXPONENT_OFFSET,
  );

  return floor(pow(TEN, exponent));
}

export function canExtractChaoticEther(state: GameState): boolean {
  if (getChaoticEtherProducedTierForStratumId(state.activeStratumId) <= 0) return false;

  const stratum = getActiveStratum(state);
  return gt(getChaoticEtherGain(stratum), ZERO);
}

export function extractChaoticEther(state: GameState): void {
  if (!canExtractChaoticEther(state)) return;

  const stratum = getActiveStratum(state);
  const gain = getChaoticEtherGain(stratum);
  const tier = getChaoticEtherProducedTierForStratumId(state.activeStratumId);
  const entropy = ensureEntropyState(stratum);

  addChaoticEther(stratum, gain, tier);
  stratum.dreamEnergy = TEN;
  stratum.dreamCrystals = createDreamCrystalsState();
  entropy.isStarted = true;
  entropy.value = ONE;
}
