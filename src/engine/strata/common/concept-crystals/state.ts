import { ONE, ZERO } from "@/engine/math/num";
import type { Num } from "@/engine/math/num";

export const CONCEPT_CRYSTAL_NODE_IDS = [
  "hope",
  "conquest",
  "law",
  "shackle",
  "enlightenment",
  "war",
] as const;

export type ConceptCrystalNodeId = (typeof CONCEPT_CRYSTAL_NODE_IDS)[number];
export type ConceptCrystalNodeAmounts = Record<ConceptCrystalNodeId, Num>;

export interface ConceptCrystalsState {
  amount: Num;
  nodes: ConceptCrystalNodeAmounts;
  severedPathIndex: number;
  productionElapsedSec: Num;
  intervalUpgrades: Num;
}

export function createConceptCrystalNodeAmounts(): ConceptCrystalNodeAmounts {
  return {
    hope: ONE,
    conquest: ONE,
    law: ONE,
    shackle: ONE,
    enlightenment: ONE,
    war: ONE,
  };
}

export function createConceptCrystalsState(): ConceptCrystalsState {
  return {
    amount: ONE,
    nodes: createConceptCrystalNodeAmounts(),
    severedPathIndex: 0,
    productionElapsedSec: ZERO,
    intervalUpgrades: ZERO,
  };
}
