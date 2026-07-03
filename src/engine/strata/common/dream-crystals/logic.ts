import type { StratumState } from "../../state";
import type { Num } from "@/engine/math/num";
import {
  ONE,
  ZERO,
  add,
  sub,
  gte,
} from "@/engine/math/num";
import { getDreamCrystalCost } from "@/engine/math/dream-crystals";
import { getDreamEnergy } from "../../manager/selectors";
import { getDreamCrystalAmount, getDreamCrystalBought } from "./selectors";
import { isDreamCrystalFreePurchasesUnlocked } from "./upgrades";

const DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT = 4096;

export function getCurrentDreamCrystalCost(stratum: StratumState, tier: number) {
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  return getDreamCrystalCost(tier, bought);
}

export function canBuyDreamCrystal(stratum: StratumState, tier: number) {
  return gte(stratum.dreamEnergy, getCurrentDreamCrystalCost(stratum, tier));
}

export function buyDreamCrystal(stratum: StratumState, tier: number) {
  if (!canBuyDreamCrystal(stratum, tier)) return;

  const cost = getCurrentDreamCrystalCost(stratum, tier);
  const crystal = stratum.dreamCrystals.tiers[tier];
  if (!isDreamCrystalFreePurchasesUnlocked(stratum)) {
    stratum.dreamEnergy = sub(stratum.dreamEnergy, cost);
  }
  if (!crystal) {
    throw new Error(`Dream Crystal tier ${tier} not found.`);
  }
  crystal.bought = add(crystal.bought, 1);
  crystal.amount = add(crystal.amount, 1);
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

  for (let step = 0; step < steps; step++) {
    totalCost = add(totalCost, getDreamCrystalCost(tier, add(bought, step)));
  }

  return totalCost;
}

export function getDreamCrystalBuyMaxCount(
  stratum: StratumState,
  tier: number,
) {
  if (isDreamCrystalFreePurchasesUnlocked(stratum)) {
    return getDreamCrystalFreeBuyMaxCount(stratum, tier);
  }

  let resource = getDreamEnergy(stratum);
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  let count = ZERO;

  for (let step = 0; step < DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT; step++) {
    const cost = getDreamCrystalCost(tier, add(bought, count));
    if (resource.lt(cost)) break;

    resource = sub(resource, cost);
    count = add(count, ONE);
  }

  return count;
}

export function getDreamCrystalFreeBuyMaxCount(
  stratum: StratumState,
  tier: number,
) {
  const resource = getDreamEnergy(stratum);
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  let count = ZERO;

  for (let step = 0; step < DREAM_CRYSTAL_BUY_MAX_STEP_LIMIT; step++) {
    const cost = getDreamCrystalCost(tier, add(bought, count));
    if (resource.lt(cost)) break;

    count = add(count, ONE);
  }

  return count;
}

export function buyMaxDreamCrystal(stratum: StratumState, tier: number) {
  const count = getDreamCrystalBuyMaxCount(stratum, tier);
  if (count.lte(ZERO)) return;

  const crystal = stratum.dreamCrystals.tiers[tier];

  if (!crystal) {
    throw new Error(`Dream Crystal tier ${tier} not found.`);
  }

  if (!isDreamCrystalFreePurchasesUnlocked(stratum)) {
    const totalCost = getDreamCrystalBulkCost(stratum, tier, count);
    stratum.dreamEnergy = sub(stratum.dreamEnergy, totalCost);
  }
  crystal.bought = add(crystal.bought, count);
  crystal.amount = add(crystal.amount, count);
}
