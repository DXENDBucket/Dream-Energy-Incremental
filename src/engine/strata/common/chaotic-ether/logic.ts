import type { GameState } from "@/engine/core/state";
import { ONE, TEN, ZERO, add, div, floor, gt, gte, lte, mul, pow, sub } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { isNum, tryRestoreNum } from "@/engine/math/num";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { getDreamEnergy, setDreamEnergy } from "@/engine/strata/common/dream-energy";
import { ensureEntropyState } from "@/engine/strata/common/entropy";
import {
  getStratumDefinition,
  getStratumDefinitionByEntropyFormula,
} from "@/engine/strata/defs";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import type { StratumState } from "@/engine/strata/state";
import { getCrushOneChaoticEtherGainMultiplier } from "@/engine/crush/effects";
import {
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER,
  CHAOTIC_ETHER_EXTRACT_ACCELERATION_START,
  CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR,
  CHAOTIC_ETHER_EXTRACT_REQUIREMENT,
} from "./balance";

export type ChaoticEtherTier = number;
export type ChaoticEtherAmounts = Record<string, Num>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isNum(value);
}

function normalizeChaoticEtherAmountsInPlace(raw: unknown): ChaoticEtherAmounts {
  const directAmount = tryRestoreNum(raw);
  if (directAmount) {
    return { "1": directAmount };
  }

  if (!isPlainRecord(raw)) {
    return {};
  }

  const amounts = raw as ChaoticEtherAmounts;

  for (const [tier, amount] of Object.entries(amounts)) {
    const restoredAmount = tryRestoreNum(amount);
    if (restoredAmount) {
      amounts[tier] = restoredAmount;
    } else {
      delete amounts[tier];
    }
  }

  return amounts;
}

export function ensureChaoticEtherState(stratum: StratumState): void {
  const chaoticEther = normalizeChaoticEtherAmountsInPlace(stratum.chaoticEther);
  if (stratum.chaoticEther !== chaoticEther) {
    stratum.chaoticEther = chaoticEther;
  }

  if (stratum.totalChaoticEtherGained == null) {
    stratum.totalChaoticEtherGained = { ...stratum.chaoticEther };
    return;
  }

  const totalChaoticEtherGained = normalizeChaoticEtherAmountsInPlace(stratum.totalChaoticEtherGained);
  if (stratum.totalChaoticEtherGained !== totalChaoticEtherGained) {
    stratum.totalChaoticEtherGained = totalChaoticEtherGained;
  }
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
  return getStratumDefinition(stratumId)?.producedChaoticEtherTier ?? 0;
}

export function getDreamCrystalUpgradeChaoticEtherTier(stratum: StratumState): ChaoticEtherTier {
  const definition = getStratumDefinition(stratum.stratumId);
  if (definition) return definition.dreamCrystalUpgradeChaoticEtherTier;

  const formulaId = stratum.entropy?.formulaId ?? "none";
  return getStratumDefinitionByEntropyFormula(formulaId)?.dreamCrystalUpgradeChaoticEtherTier ?? 1;
}

export function getChaoticEtherGain(stratum: StratumState): Num {
  const dreamEnergy = getDreamEnergy(stratum);
  if (!gte(dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT)) return ZERO;

  const dreamEnergyRatio = div(dreamEnergy, CHAOTIC_ETHER_EXTRACT_REQUIREMENT);
  const baseGain = pow(dreamEnergyRatio, div(ONE, CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR));
  const gainMultiplier = mul(
    stratum.characterChaoticEtherGainMultiplier ?? ONE,
    getCrushOneChaoticEtherGainMultiplier(stratum),
  );
  if (lte(baseGain, CHAOTIC_ETHER_EXTRACT_ACCELERATION_START)) {
    return floor(mul(baseGain, gainMultiplier));
  }

  return floor(mul(div(
    pow(
      dreamEnergyRatio,
      div(CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER, CHAOTIC_ETHER_EXTRACT_LOG_DIVISOR),
    ),
    pow(
      CHAOTIC_ETHER_EXTRACT_ACCELERATION_START,
      sub(CHAOTIC_ETHER_EXTRACT_ACCELERATION_POWER, ONE),
    ),
  ), gainMultiplier));
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
  setDreamEnergy(stratum, TEN);
  stratum.dreamCrystals = createDreamCrystalsState();
  entropy.isStarted = true;
  entropy.value = ONE;
}
