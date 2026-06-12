export interface CoherenceUpgradesState {
  bought: Record<string, boolean>;
}

export function createCoherenceUpgradesState(): CoherenceUpgradesState {
  return {
    bought: {},
  };
}
