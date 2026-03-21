export interface MilestonesState {
  claimed: Record<string, boolean>;
}

export function createMilestonesState(): MilestonesState {
  return {
    claimed: {},
  };
}