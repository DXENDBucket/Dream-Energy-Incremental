import type { StratumState } from "../../state";
import { gte } from "@/engine/math/num";
import { getDreamEnergy } from "@/engine/strata/common/dream-energy";
import { hasMilestone } from "./selectors";
import {
  UNLOCK_COHERENCE_UPGRADES_MILESTONE_ID,
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_UPGRADES_MILESTONE_ID,
  MILESTONE_FOUR_PLACEHOLDER_ID,
  UNLOCK_ELECTROMAGNETIC_CRYSTALS_MILESTONE_ID,
} from "@/engine/strata/common/milestones/balance";
import { getMilestoneRequirement } from "./definitions";
import { isCrushThreeActive } from "@/engine/crush/effects";

export function canClaimMilestone(stratum: StratumState, id: string): boolean {
  if (hasMilestone(stratum.milestones, id)) return false;

  const requirement = getMilestoneRequirement(id);
  if (!requirement) return false;

  switch (requirement.type) {
    case "reach-dream-energy":
      return gte(getDreamEnergy(stratum), requirement.amount);
  }
}

export function claimMilestone(stratum: StratumState, id: string): void {
  if (!canClaimMilestone(stratum, id)) return;
  stratum.milestones.claimed[id] = true;
}

export function isRefineUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_REFINE_MILESTONE_ID);
}

export function isUpgradesUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_UPGRADES_MILESTONE_ID);
}

export function isCoherenceUpgradesUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_COHERENCE_UPGRADES_MILESTONE_ID);
}

export function isConceptCrystalsUnlocked(stratum: StratumState): boolean {
  return isCrushThreeActive(stratum)
    || hasMilestone(stratum.milestones, MILESTONE_FOUR_PLACEHOLDER_ID);
}

export function isElectromagneticCrystalsUnlocked(stratum: StratumState): boolean {
  return hasMilestone(stratum.milestones, UNLOCK_ELECTROMAGNETIC_CRYSTALS_MILESTONE_ID)
    || (
      isCrushThreeActive(stratum)
      && hasMilestone(stratum.milestones, MILESTONE_FOUR_PLACEHOLDER_ID)
    );
}
