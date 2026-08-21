import type { GameState } from "@/engine/core/state";
import { ONE, TEN, ZERO, add, div, gt, gte, log10, max, min, mul } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import {
  addChaoticEther,
  getChaoticEther,
  getChaoticEtherProducedTierForStratumId,
  setChaoticEther,
} from "@/engine/strata/common/chaotic-ether";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceEntropyTuningExponent,
  getCoherenceNextDreamCrystalMultiplierBonus,
  recordBestNextStratumEntryCoherencePoints,
  syncCoherenceProgressionDreamCrystalMultipliers,
} from "@/engine/strata/common/coherence/upgrades";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { addDreamEnergy, getDreamEnergy, setDreamEnergy } from "@/engine/strata/common/dream-energy";
import {
  computeEntropyGrowthRateMultiplierFromCoherence,
  createEntropyState,
  ensureEntropyState,
  getDefaultEntropyChaosExponent,
} from "@/engine/strata/common/entropy";
import {
  areAdjacentStrata,
  dreamSeaFirstStratumId,
  dreamSeaSecondStratumId,
  getPreviousStratumDefinition,
  getStratumDefinition,
  realityStratumId,
  requireStratumDefinition,
  type StratumDefinition,
} from "@/engine/strata/defs";
import { getActiveStratum, getStratum } from "@/engine/strata/manager/selectors";
import { createStratumState, type StratumState } from "@/engine/strata/state";
import { LIFT_UNLOCK_REQUIREMENT } from "./balance";
import { markRealityLiftMilestoneClaimed } from "@/engine/reality/milestones";
import { returnCharactersToRosterFromStratum } from "@/engine/characters";
import { hasCrushMilestone, syncCrushDreamCrystalMultipliers } from "@/engine/crush";

export type StratumTravelDirection = "deeper" | "shallower";

export function getLiftUnlockRequirement(): Num {
  return LIFT_UNLOCK_REQUIREMENT;
}

export function getLiftUnlockProgress(state: GameState): Num {
  if (state.lift.isLiftUnlocked) return ONE;

  const current = getDreamEnergy(getActiveStratum(state));
  const cappedCurrent = min(current, LIFT_UNLOCK_REQUIREMENT);
  const numerator = log10(add(cappedCurrent, ONE));
  const denominator = log10(add(LIFT_UNLOCK_REQUIREMENT, ONE));

  if (denominator.lte(ZERO)) return ONE;
  return div(numerator, denominator);
}

export function canUnlockLift(state: GameState): boolean {
  if (state.lift.isLiftUnlocked) return false;
  return gte(getDreamEnergy(getActiveStratum(state)), LIFT_UNLOCK_REQUIREMENT);
}

export function unlockLift(state: GameState): void {
  if (!canUnlockLift(state)) return;

  state.lift.isLiftUnlocked = true;
  state.lift.currentLiftPosition = state.activeStratumId;
  markRealityLiftMilestoneClaimed(state);
}

export function getStratumTravelDirection(
  sourceStratumId: string,
  targetStratumId: string,
): StratumTravelDirection | undefined {
  const source = getStratumDefinition(sourceStratumId);
  const target = getStratumDefinition(targetStratumId);
  if (!source || !target || !areAdjacentStrata(source.id, target.id)) return undefined;
  return target.depth > source.depth ? "deeper" : "shallower";
}

export function getStratumEntryCoherenceCost(state: GameState, targetStratumId: string): Num {
  const sourceDefinition = getPreviousStratumDefinition(targetStratumId);
  if (!sourceDefinition) return ZERO;

  const source = state.strata[sourceDefinition.id];
  return source ? getCoherencePoints(source) : ZERO;
}

export function getStratumEntryEntropyGrowthRateMultiplier(
  state: GameState,
  targetStratumId: string,
): Num {
  const targetDefinition = getStratumDefinition(targetStratumId);
  if (!targetDefinition) return ZERO;

  const baseMultiplier = mul(
    targetDefinition.entropyBaseGrowthMultiplier,
    computeEntropyGrowthRateMultiplierFromCoherence(
      getStratumEntryCoherenceCost(state, targetStratumId),
    ),
  );
  return hasCrushMilestone(state, 4) ? mul(baseMultiplier, 10) : baseMultiplier;
}

export function isStratumVisible(state: GameState, stratumId: string): boolean {
  const definition = getStratumDefinition(stratumId);
  if (!definition || definition.contentStatus !== "available") return false;
  if (definition.depth === 0 || stratumId in state.strata) return true;

  const previous = getPreviousStratumDefinition(stratumId);
  if (!previous || !(previous.id in state.strata)) return false;
  if (definition.visibilityRule === "entry-resource") {
    return gt(getStratumEntryCoherenceCost(state, stratumId), ZERO);
  }
  return true;
}

export function canTravelToStratum(state: GameState, targetStratumId: string): boolean {
  if (!state.lift.isLiftUnlocked) return false;

  const target = getStratumDefinition(targetStratumId);
  if (!target || target.contentStatus !== "available") return false;

  const direction = getStratumTravelDirection(state.activeStratumId, targetStratumId);
  if (!direction) return false;
  if (direction === "shallower") return targetStratumId in state.strata;
  if (target.entryTransitionKind !== "standard-lift") return false;
  return gt(getStratumEntryCoherenceCost(state, targetStratumId), ZERO);
}

function configureDeeperStratum(
  source: StratumState,
  target: StratumState,
  targetDefinition: StratumDefinition,
  spentCoherencePoints: Num,
): void {
  const entropy = ensureEntropyState(target);
  entropy.formulaId = targetDefinition.entropyFormulaId;
  entropy.chaosExponent = getDefaultEntropyChaosExponent(entropy.formulaId);
  entropy.tuningExponent = getCoherenceEntropyTuningExponent(source, spentCoherencePoints);
  entropy.growthRateMultiplier = computeEntropyGrowthRateMultiplierFromCoherence(spentCoherencePoints);

  target.coherenceDreamCrystalMultiplier = max(
    target.coherenceDreamCrystalMultiplier ?? ONE,
    getCoherenceNextDreamCrystalMultiplierBonus(source),
  );

  const initialDreamEnergyBonus = getCoherenceDeeperInitialDreamEnergyBonus(source);
  if (gt(initialDreamEnergyBonus, ZERO)) addDreamEnergy(target, initialDreamEnergyBonus);
}

function travelDeeper(state: GameState, targetDefinition: StratumDefinition): boolean {
  const source = getActiveStratum(state);
  const spentCoherencePoints = getCoherencePoints(source);
  recordBestNextStratumEntryCoherencePoints(source, spentCoherencePoints);

  state.strata[targetDefinition.id] ??= createStratumState({
    stratumId: targetDefinition.id,
    entropyFormulaId: targetDefinition.entropyFormulaId,
  });

  configureDeeperStratum(
    source,
    state.strata[targetDefinition.id]!,
    targetDefinition,
    spentCoherencePoints,
  );
  source.coherencePoints = ZERO;
  return true;
}

function carryProducedChaoticEther(
  source: StratumState,
  target: StratumState,
  sourceId: string,
): void {
  const tier = getChaoticEtherProducedTierForStratumId(sourceId);
  if (tier <= 0) return;

  const carriedChaoticEther = getChaoticEther(source, tier);
  if (gt(carriedChaoticEther, ZERO)) addChaoticEther(target, carriedChaoticEther, tier);
  setChaoticEther(source, tier, ZERO);
}

function resetStratumAfterReturn(stratum: StratumState, definition: StratumDefinition): void {
  setDreamEnergy(stratum, TEN);
  stratum.dreamCrystals = createDreamCrystalsState();
  stratum.entropy = createEntropyState(definition.entropyFormulaId);
}

function travelShallower(state: GameState, targetDefinition: StratumDefinition): boolean {
  const sourceDefinition = requireStratumDefinition(state.activeStratumId);
  const source = getActiveStratum(state);
  const target = getStratum(state, targetDefinition.id);

  carryProducedChaoticEther(source, target, sourceDefinition.id);
  returnCharactersToRosterFromStratum(state, sourceDefinition.id);
  resetStratumAfterReturn(source, sourceDefinition);
  return true;
}

export function travelToStratum(state: GameState, targetStratumId: string): boolean {
  if (!canTravelToStratum(state, targetStratumId)) return false;

  const targetDefinition = requireStratumDefinition(targetStratumId);
  const direction = getStratumTravelDirection(state.activeStratumId, targetStratumId)!;
  const didTravel = direction === "deeper"
    ? travelDeeper(state, targetDefinition)
    : travelShallower(state, targetDefinition);

  if (!didTravel) return false;
  state.activeStratumId = targetStratumId;
  state.lift.currentLiftPosition = targetStratumId;
  syncCoherenceProgressionDreamCrystalMultipliers(state);
  syncCrushDreamCrystalMultipliers(state);
  return true;
}

// Compatibility helpers for existing callers and older tests.
export function getDreamSeaFirstEntryCoherenceCost(state: GameState): Num {
  return getStratumEntryCoherenceCost(state, dreamSeaFirstStratumId);
}

export function getDreamSeaFirstEntryEntropyGrowthRateMultiplier(state: GameState): Num {
  return getStratumEntryEntropyGrowthRateMultiplier(state, dreamSeaFirstStratumId);
}

export function isDreamSeaFirstStratumVisible(state: GameState): boolean {
  return isStratumVisible(state, dreamSeaFirstStratumId);
}

export function canTravelToDreamSeaFirstStratum(state: GameState): boolean {
  return state.activeStratumId === realityStratumId
    && canTravelToStratum(state, dreamSeaFirstStratumId);
}

export function travelToDreamSeaFirstStratum(state: GameState): boolean {
  return canTravelToDreamSeaFirstStratum(state)
    && travelToStratum(state, dreamSeaFirstStratumId);
}

export function getDreamSeaSecondEntryCoherenceCost(state: GameState): Num {
  return getStratumEntryCoherenceCost(state, dreamSeaSecondStratumId);
}

export function getDreamSeaSecondEntryEntropyGrowthRateMultiplier(state: GameState): Num {
  return getStratumEntryEntropyGrowthRateMultiplier(state, dreamSeaSecondStratumId);
}

export function isDreamSeaSecondStratumVisible(state: GameState): boolean {
  return isStratumVisible(state, dreamSeaSecondStratumId);
}

export function canTravelToDreamSeaSecondStratum(state: GameState): boolean {
  return state.activeStratumId === dreamSeaFirstStratumId
    && canTravelToStratum(state, dreamSeaSecondStratumId);
}

export function travelToDreamSeaSecondStratum(state: GameState): boolean {
  return canTravelToDreamSeaSecondStratum(state)
    && travelToStratum(state, dreamSeaSecondStratumId);
}

export function canTravelBackToDreamSeaFirstStratum(state: GameState): boolean {
  return state.activeStratumId === dreamSeaSecondStratumId
    && canTravelToStratum(state, dreamSeaFirstStratumId);
}

export function travelBackToDreamSeaFirstStratum(state: GameState): boolean {
  return canTravelBackToDreamSeaFirstStratum(state)
    && travelToStratum(state, dreamSeaFirstStratumId);
}

export function travelToRealityStratum(state: GameState): boolean {
  return state.activeStratumId === dreamSeaFirstStratumId
    && travelToStratum(state, realityStratumId);
}
