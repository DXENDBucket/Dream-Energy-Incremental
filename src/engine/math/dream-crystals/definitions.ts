export const DREAM_CRYSTAL_TIERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type DreamCrystalTier = (typeof DREAM_CRYSTAL_TIERS)[number];
