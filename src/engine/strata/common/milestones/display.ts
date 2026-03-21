import { formatInt } from "@/engine/math/format";
import {
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_REFINE_REQUIREMENT,
  UNLOCK_UPGRADES_MILESTONE_ID,
  UNLOCK_UPGRADES_REQUIREMENT
} from "./balance";

export const MILESTONE_ORDER = [UNLOCK_REFINE_MILESTONE_ID, UNLOCK_UPGRADES_MILESTONE_ID] as const;

export const MILESTONE_META = {
  [UNLOCK_REFINE_MILESTONE_ID]: {
    title: "Milestone 1", 
    rewardText: "Unlock Dream Crystal Refinement. ",
    description: "Refinement resets all other crystals, and gives a bonus based on number and quality of crystals reset",
  },
  [UNLOCK_UPGRADES_MILESTONE_ID]: {
    title: "Milestone 2",
    rewardText: "Unlock Dream Crystal Upgrades. ",
    description: "Dream crystal upgrades enhance production.",
  },
} as const;

export function getMilestoneRequirementText(id: string): string {
  switch (id) {
    case UNLOCK_REFINE_MILESTONE_ID:
      return `Reach ${formatInt(UNLOCK_REFINE_REQUIREMENT)} Dream Energy.`;
    case UNLOCK_UPGRADES_MILESTONE_ID:
      return `Reach ${formatInt(UNLOCK_UPGRADES_REQUIREMENT)} Dream Energy.`;
    default:
      return "Unknown requirement.";
  }
}