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

export const INNER_CONCEPT_NODE_IDS = [
  "faith",
  "justice",
  "revolution",
] as const;

export type InnerConceptNodeId = (typeof INNER_CONCEPT_NODE_IDS)[number];
export type InnerConceptNodeAmounts = Record<InnerConceptNodeId, Num>;
export type InnerConceptNodeSevering = Record<InnerConceptNodeId, boolean>;

export interface ConceptCrystalsState {
  amount: Num;
  nodes: ConceptCrystalNodeAmounts;
  innerNodes: InnerConceptNodeAmounts;
  innerSevered: InnerConceptNodeSevering;
  isSeveringEnabled: boolean;
  severedPathIndex: number;
  productionElapsedSec: Num;
  intervalUpgrades: Num;
}

export function createInnerConceptNodeAmounts(): InnerConceptNodeAmounts {
  return {
    faith: ONE,
    justice: ONE,
    revolution: ONE,
  };
}

export function createInnerConceptNodeSevering(): InnerConceptNodeSevering {
  return {
    faith: false,
    justice: false,
    revolution: false,
  };
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
    innerNodes: createInnerConceptNodeAmounts(),
    innerSevered: createInnerConceptNodeSevering(),
    isSeveringEnabled: false,
    severedPathIndex: 0,
    productionElapsedSec: ZERO,
    intervalUpgrades: ZERO,
  };
}
