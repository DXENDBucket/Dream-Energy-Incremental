export interface RealityMilestonesState {
  claimed: Record<string, boolean>;
}

export function createRealityMilestonesState(): RealityMilestonesState {
  return { claimed: {} };
}
