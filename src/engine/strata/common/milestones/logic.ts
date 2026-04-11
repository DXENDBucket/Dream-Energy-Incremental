import type { StratumState } from "../../state";
import { gte } from "@/engine/math/num";
import { hasMilestone } from "./selectors";
import {
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_UPGRADES_MILESTONE_ID,
} from "@/engine/strata/common/milestones/balance";
import { getMilestoneRequirement } from "./definitions";

export function canClaimMilestone(stratum: StratumState, id: string): boolean {
  if (hasMilestone(stratum.milestones, id)) return false;

  const requirement = getMilestoneRequirement(id);
  if (!requirement) return false;

  switch (requirement.type) {
    case "reach-dream-energy":
      return gte(stratum.dreamEnergy, requirement.amount);
  }
}

export function claimMilestone(stratum: StratumState, id: string): void {
  if (!canClaimMilestone(stratum, id)) return;
  stratum.milestones.claimed[id] = true;
}

export function isRefineUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_REFINE_MILESTONE_ID);
}
