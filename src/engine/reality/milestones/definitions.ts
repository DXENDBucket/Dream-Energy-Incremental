import { N } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";
import { LIFT_UNLOCK_REQUIREMENT } from "@/engine/strata/lift/balance";

export const REALITY_MILESTONE_LIFT_UNLOCK_ID = "reality-lift-unlock";
export const REALITY_MILESTONE_CHARACTER_PRODUCTION_ID = "reality-character-production";

export const REALITY_MILESTONE_ORDER = [
  REALITY_MILESTONE_LIFT_UNLOCK_ID,
  REALITY_MILESTONE_CHARACTER_PRODUCTION_ID,
] as const;

export type RealityMilestoneId = (typeof REALITY_MILESTONE_ORDER)[number];

export interface RealityMilestoneDefinition {
  id: RealityMilestoneId;
  dreamEnergyRequirement: Num;
  titleKey: string;
  rewardKey: string;
  descriptionKey: string;
}

export const REALITY_MILESTONE_DEFINITIONS: Record<RealityMilestoneId, RealityMilestoneDefinition> = {
  [REALITY_MILESTONE_LIFT_UNLOCK_ID]: {
    id: REALITY_MILESTONE_LIFT_UNLOCK_ID,
    dreamEnergyRequirement: LIFT_UNLOCK_REQUIREMENT,
    titleKey: "realityMilestones.items.liftUnlock.title",
    rewardKey: "realityMilestones.items.liftUnlock.reward",
    descriptionKey: "realityMilestones.items.liftUnlock.description",
  },
  [REALITY_MILESTONE_CHARACTER_PRODUCTION_ID]: {
    id: REALITY_MILESTONE_CHARACTER_PRODUCTION_ID,
    dreamEnergyRequirement: N("1e47"),
    titleKey: "realityMilestones.items.characterProduction.title",
    rewardKey: "realityMilestones.items.characterProduction.reward",
    descriptionKey: "realityMilestones.items.characterProduction.description",
  },
};

export function getRealityMilestoneDefinition(id: RealityMilestoneId): RealityMilestoneDefinition {
  return REALITY_MILESTONE_DEFINITIONS[id];
}
