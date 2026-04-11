import { formatRequirementAmount } from "@/ui/formatters/progression";
import type {
  MilestoneId,
  MilestoneRequirement,
} from "@/engine/strata/common/milestones";
import {
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_UPGRADES_MILESTONE_ID,
} from "@/engine/strata/common/milestones/balance";

type Translate = (key: string, named?: Record<string, unknown>) => string;

const MILESTONE_UI_KEYS = {
  [UNLOCK_REFINE_MILESTONE_ID]: {
    titleKey: "milestones.content.unlockRefine.title",
    rewardKey: "milestones.content.unlockRefine.reward",
    descriptionKey: "milestones.content.unlockRefine.description",
  },
  [UNLOCK_UPGRADES_MILESTONE_ID]: {
    titleKey: "milestones.content.unlockUpgrades.title",
    rewardKey: "milestones.content.unlockUpgrades.reward",
    descriptionKey: "milestones.content.unlockUpgrades.description",
  },
} as const satisfies Record<
  MilestoneId,
  {
    titleKey: string;
    rewardKey: string;
    descriptionKey: string;
  }
>;

export function getMilestoneUiText(t: Translate, id: MilestoneId) {
  const keys = MILESTONE_UI_KEYS[id];

  return {
    title: t(keys.titleKey),
    rewardText: t(keys.rewardKey),
    description: t(keys.descriptionKey),
  };
}

export function getMilestoneRequirementLabel(
  t: Translate,
  requirement: MilestoneRequirement | null,
): string {
  if (!requirement) return t("milestones.unknownRequirement");

  switch (requirement.type) {
    case "reach-dream-energy":
      return t("milestones.requirements.reachDreamEnergy", {
        amount: formatRequirementAmount(requirement.amount),
      });
  }
}
