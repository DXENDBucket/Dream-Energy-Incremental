import type { StratumState } from "../../state";
import { gte } from "@/engine/math/num";
import { hasMilestone } from "./selectors";
import {
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_REFINE_REQUIREMENT,
} from "@/engine/strata/common/milestones/balance";

export function canClaimMilestone(stratum: StratumState, id: string): boolean {
  if (hasMilestone(stratum.milestones, id)) return false;

  switch (id) {
    case UNLOCK_REFINE_MILESTONE_ID:
      return gte(stratum.dreamEnergy, UNLOCK_REFINE_REQUIREMENT);
    default:
      return false;
  }
}

export function claimMilestone(stratum: StratumState, id: string): void {
  if (!canClaimMilestone(stratum, id)) return;
  stratum.milestones.claimed[id] = true;
}

export function isRefineUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_REFINE_MILESTONE_ID);
}