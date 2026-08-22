import type { GameState } from "@/engine/core/state";
import { gte } from "@/engine/math/num";
import { grantStarterCharacters } from "@/engine/characters";
import { getDreamEnergy } from "@/engine/strata/common/dream-energy";
import { realityStratumId } from "@/engine/strata/defs";
import {
  getRealityMilestoneDefinition,
  REALITY_MILESTONE_CHARACTER_PRODUCTION_ID,
  REALITY_MILESTONE_LIFT_UNLOCK_ID,
  type RealityMilestoneId,
} from "./definitions";
import { createRealityMilestonesState, type RealityMilestonesState } from "./state";

export function ensureRealityMilestonesState(state: GameState): RealityMilestonesState {
  state.realityMilestones ??= createRealityMilestonesState();
  state.realityMilestones.claimed ??= {};
  return state.realityMilestones;
}

export function hasRealityMilestone(state: GameState, id: RealityMilestoneId): boolean {
  return ensureRealityMilestonesState(state).claimed[id] === true;
}

export function canClaimRealityMilestone(state: GameState, id: RealityMilestoneId): boolean {
  if (hasRealityMilestone(state, id)) return false;
  const reality = state.strata[realityStratumId];
  if (!reality) return false;
  return gte(getDreamEnergy(reality), getRealityMilestoneDefinition(id).dreamEnergyRequirement);
}

export function applyRealityMilestoneReward(state: GameState, id: RealityMilestoneId): void {
  if (id === REALITY_MILESTONE_LIFT_UNLOCK_ID) {
    state.lift.isLiftUnlocked = true;
    state.lift.currentLiftPosition = state.activeStratumId;
  } else if (id === REALITY_MILESTONE_CHARACTER_PRODUCTION_ID) {
    grantStarterCharacters(state);
  }
}

export function claimRealityMilestone(state: GameState, id: RealityMilestoneId): boolean {
  if (!canClaimRealityMilestone(state, id)) return false;
  ensureRealityMilestonesState(state).claimed[id] = true;
  applyRealityMilestoneReward(state, id);
  return true;
}

export function markRealityLiftMilestoneClaimed(state: GameState): void {
  ensureRealityMilestonesState(state).claimed[REALITY_MILESTONE_LIFT_UNLOCK_ID] = true;
}

export function isCharacterProductionUnlocked(state: GameState): boolean {
  return (state.crush?.milestoneCount ?? 0) >= 6
    || hasRealityMilestone(state, REALITY_MILESTONE_CHARACTER_PRODUCTION_ID);
}
