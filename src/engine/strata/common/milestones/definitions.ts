import type { Num } from "@/engine/math/num";
import {
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_REFINE_REQUIREMENT,
  UNLOCK_UPGRADES_MILESTONE_ID,
  UNLOCK_UPGRADES_REQUIREMENT,
} from "./balance";

export const MILESTONE_ORDER = [UNLOCK_REFINE_MILESTONE_ID, UNLOCK_UPGRADES_MILESTONE_ID] as const;

export type MilestoneId = (typeof MILESTONE_ORDER)[number];

export type MilestoneRequirement =
  | {
      type: "reach-dream-energy";
      amount: Num;
    };

export const MILESTONE_DEFINITIONS = {
  [UNLOCK_REFINE_MILESTONE_ID]: {
    requirement: {
      type: "reach-dream-energy",
      amount: UNLOCK_REFINE_REQUIREMENT,
    },
  },
  [UNLOCK_UPGRADES_MILESTONE_ID]: {
    requirement: {
      type: "reach-dream-energy",
      amount: UNLOCK_UPGRADES_REQUIREMENT,
    },
  },
} as const satisfies Record<MilestoneId, { requirement: MilestoneRequirement }>;

export function isMilestoneId(id: string): id is MilestoneId {
  return id in MILESTONE_DEFINITIONS;
}

export function getMilestoneRequirement(id: string): MilestoneRequirement | null {
  if (!isMilestoneId(id)) return null;
  return MILESTONE_DEFINITIONS[id].requirement;
}
