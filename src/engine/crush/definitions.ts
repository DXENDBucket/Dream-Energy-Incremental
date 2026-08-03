export const CRUSH_MILESTONE_COUNT = 8;

export interface CrushMilestoneDefinition {
  index: number;
  titleKey: string;
  effectKey: string;
}

export const CRUSH_MILESTONE_DEFINITIONS: readonly CrushMilestoneDefinition[] = Array.from(
  { length: CRUSH_MILESTONE_COUNT },
  (_, offset) => {
    const index = offset + 1;
    return {
      index,
      titleKey: `crushMilestones.items.${index}.title`,
      effectKey: `crushMilestones.items.${index}.effect`,
    };
  },
);
