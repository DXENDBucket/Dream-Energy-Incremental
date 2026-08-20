import type { GameState } from "@/engine/core/state";
import { createNewState } from "@/engine/core/state";
import { N, gte, pow, type Num } from "@/engine/math/num";
import { getCoherencePointGain } from "@/engine/strata/common/coherence";
import { dreamSeaFourthStratumId } from "@/engine/strata/defs";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { CRUSH_MILESTONE_COUNT } from "./definitions";
import { createCrushState, type CrushState } from "./state";

export function ensureCrushState(state: GameState): CrushState {
  state.crush ??= createCrushState();

  const count = Number(state.crush.milestoneCount);
  state.crush.milestoneCount = Number.isFinite(count)
    ? Math.min(CRUSH_MILESTONE_COUNT, Math.max(0, Math.floor(count)))
    : 0;

  return state.crush;
}

export function getCrushMilestoneCount(state: GameState): number {
  return ensureCrushState(state).milestoneCount;
}

export function hasCrushMilestone(state: GameState, index: number): boolean {
  return getCrushMilestoneCount(state) >= index;
}

export function getCrushDreamCrystalMultiplierForCount(milestoneCount: number): Num {
  const normalizedCount = Math.min(
    CRUSH_MILESTONE_COUNT,
    Math.max(0, Math.floor(milestoneCount)),
  );
  return pow(N(10), normalizedCount);
}

export function getCrushDreamCrystalMultiplier(state: GameState): Num {
  return getCrushDreamCrystalMultiplierForCount(getCrushMilestoneCount(state));
}

export function syncCrushDreamCrystalMultipliers(state: GameState): void {
  const multiplier = getCrushDreamCrystalMultiplier(state);
  for (const stratum of Object.values(state.strata)) {
    stratum.crushDreamCrystalMultiplier = multiplier;
    stratum.crushMilestoneCount = getCrushMilestoneCount(state);
  }
}

export function isCrushUnlocked(state: GameState): boolean {
  return dreamSeaFourthStratumId in state.strata || getCrushMilestoneCount(state) > 0;
}

export function canCrush(state: GameState): boolean {
  if (state.activeStratumId !== dreamSeaFourthStratumId) return false;
  if (getCrushMilestoneCount(state) >= CRUSH_MILESTONE_COUNT) return false;
  return gte(getCoherencePointGain(getActiveStratum(state)), 1);
}

export function crush(state: GameState): boolean {
  if (!canCrush(state)) return false;

  const nextMilestoneCount = getCrushMilestoneCount(state) + 1;
  const preservedSettings = { ...state.settings };
  const fresh = createNewState();
  fresh.settings = preservedSettings;
  fresh.crush.milestoneCount = nextMilestoneCount;
  syncCrushDreamCrystalMultipliers(fresh);
  Object.assign(state, fresh);
  return true;
}
