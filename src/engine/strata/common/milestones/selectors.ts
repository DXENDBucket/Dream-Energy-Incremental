import type { MilestonesState } from "./state";

export function hasMilestone(milestones: MilestonesState, id: string): boolean {
  return milestones.claimed[id] === true;
}