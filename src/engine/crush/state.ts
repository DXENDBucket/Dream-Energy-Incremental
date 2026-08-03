export interface CrushState {
  milestoneCount: number;
}

export function createCrushState(): CrushState {
  return {
    milestoneCount: 0,
  };
}
