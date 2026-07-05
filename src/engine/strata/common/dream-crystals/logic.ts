import type { StratumState } from "../../state";
import type { Num } from "@/engine/math/num";
import {
  ONE,
  ZERO,
  add,
  sub,
  gte,
  N,
} from "@/engine/math/num";
import { getDreamCrystalCost, getNextDreamCrystalCost } from "@/engine/math/dream-crystals";
import { getDreamEnergy } from "../../manager/selectors";
import { getDreamCrystalAmount, getDreamCrystalBought } from "./selectors";
import { isDreamCrystalFreePurchasesUnlocked } from "./upgrades";
import { spendDreamEnergy } from "@/engine/strata/common/dream-energy";

const DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT = 4096;

export interface DreamCrystalBuyMaxPurchase {
  count: Num;
  totalCost: Num;
}

export function getCurrentDreamCrystalCost(stratum: StratumState, tier: number) {
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  return getDreamCrystalCost(tier, bought, stratum);
}

export function canBuyDreamCrystal(stratum: StratumState, tier: number) {
  return gte(getDreamEnergy(stratum), getCurrentDreamCrystalCost(stratum, tier));
}

export function buyDreamCrystal(stratum: StratumState, tier: number) {
  if (!canBuyDreamCrystal(stratum, tier)) return;

  const cost = getCurrentDreamCrystalCost(stratum, tier);
  const crystal = stratum.dreamCrystals.tiers[tier];
  if (!crystal) {
    throw new Error(`Dream Crystal tier ${tier} not found.`);
  }
  crystal.bought = add(crystal.bought, 1);
  crystal.amount = add(crystal.amount, 1);
  if (!isDreamCrystalFreePurchasesUnlocked(stratum)) {
    spendDreamEnergy(stratum, cost);
  }
}

//Buy Max
export function getDreamCrystalBulkCost(
  stratum: StratumState,
  tier: number,
  count: Num,
) {
  if (count.lte(ZERO)) return ZERO;

  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  const steps = Math.min(
    DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT,
    Math.max(0, count.floor().toNumber()),
  );
  let totalCost = ZERO;
  let currentBought = bought;
  let currentCost = getDreamCrystalCost(tier, currentBought, stratum);

  for (let step = 0; step < steps; step++) {
    totalCost = add(totalCost, currentCost);
    currentCost = getNextDreamCrystalCost(tier, currentBought, currentCost, stratum);
    currentBought = add(currentBought, ONE);
  }

  return totalCost;
}

export function getDreamCrystalBuyMaxCount(
  stratum: StratumState,
  tier: number,
) {
  return getDreamCrystalBuyMaxPurchase(stratum, tier).count;
}

export function getDreamCrystalBuyMaxPurchase(
  stratum: StratumState,
  tier: number,
): DreamCrystalBuyMaxPurchase {
  if (isDreamCrystalFreePurchasesUnlocked(stratum)) {
    return {
      count: getDreamCrystalFreeBuyMaxCount(stratum, tier),
      totalCost: ZERO,
    };
  }

  let resource = getDreamEnergy(stratum);
  let currentBought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  let currentCost = getDreamCrystalCost(tier, currentBought, stratum);
  let count = ZERO;
  let totalCost = ZERO;

  for (let step = 0; step < DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT; step++) {
    if (resource.lt(currentCost)) break;

    resource = sub(resource, currentCost);
    totalCost = add(totalCost, currentCost);
    count = add(count, ONE);
    currentCost = getNextDreamCrystalCost(tier, currentBought, currentCost, stratum);
    currentBought = add(currentBought, ONE);
  }

  return { count, totalCost };
}

export function getDreamCrystalFreeBuyMaxCount(
  stratum: StratumState,
  tier: number,
) {
  const resource = getDreamEnergy(stratum);
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  const firstCost = getDreamCrystalCost(tier, bought, stratum);
  if (resource.lt(firstCost)) return ZERO;

  const cap = DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT;
  const cappedCost = getDreamCrystalCost(tier, add(bought, cap - 1), stratum);
  if (gte(resource, cappedCost)) return N(cap);

  let low = 1;
  let high = cap;

  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    const cost = getDreamCrystalCost(tier, add(bought, mid - 1), stratum);

    if (gte(resource, cost)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return N(low);
}

export function buyMaxDreamCrystal(stratum: StratumState, tier: number) {
  const purchase = getDreamCrystalBuyMaxPurchase(stratum, tier);
  const { count, totalCost } = purchase;
  if (count.lte(ZERO)) return;

  const crystal = stratum.dreamCrystals.tiers[tier];

  if (!crystal) {
    throw new Error(`Dream Crystal tier ${tier} not found.`);
  }

  if (!isDreamCrystalFreePurchasesUnlocked(stratum)) {
    spendDreamEnergy(stratum, totalCost);
  }
  crystal.bought = add(crystal.bought, count);
  crystal.amount = add(crystal.amount, count);
}
