import type { StratumState } from "../../state";
import type { Num } from "@/engine/math/num";
import {
  ONE,
  ZERO,
  add,
  sub,
  mul,
  div,
  pow,
  floor,
  logn,
  gte,
} from "@/engine/math/num";
import { getDreamCrystalCost } from "@/engine/math/dream-crystals";
import { getDreamCrystalCostScale } from "@/engine/math/dream-crystals";
import { getDreamEnergy } from "../../manager/selectors";
import { getDreamCrystalAmount, getDreamCrystalBought } from "./selectors";

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
  stratum.dreamEnergy = sub(stratum.dreamEnergy, cost);
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
  const currentCost = getDreamCrystalCost(tier, bought);
  const scale = getDreamCrystalCostScale(tier);

  if (scale.eq(ONE)) {
    return mul(currentCost, count);
  }

  return mul(
    currentCost,
    div(
      sub(pow(scale, count), ONE),
      sub(scale, ONE),
    ),
  );
}

export function getDreamCrystalBuyMaxCount(
  stratum: StratumState,
  tier: number,
) {
  const resource = getDreamEnergy(stratum);
  const bought = getDreamCrystalBought(stratum.dreamCrystals, tier);
  const currentCost = getDreamCrystalCost(tier, bought);
  const scale = getDreamCrystalCostScale(tier);

  if (resource.lt(currentCost)) return ZERO;

  if (scale.eq(ONE)) {
    return floor(div(resource, currentCost));
  }

  const inside = add(
    ONE,
    div(
      mul(resource, sub(scale, ONE)),
      currentCost,
    ),
  );

  return floor(logn(inside, scale));
}

export function buyMaxDreamCrystal(stratum: StratumState, tier: number) {
  const count = getDreamCrystalBuyMaxCount(stratum, tier);
  if (count.lte(ZERO)) return;

  const totalCost = getDreamCrystalBulkCost(stratum, tier, count);
  const crystal = stratum.dreamCrystals.tiers[tier];

  if (!crystal) {
    throw new Error(`Dream Crystal tier ${tier} not found.`);
  }

  stratum.dreamEnergy = sub(stratum.dreamEnergy, totalCost);
  crystal.bought = add(crystal.bought, count);
  crystal.amount = add(crystal.amount, count);
}