import { N } from "@/engine/math/num";
import { DREAM_ENERGY_SOFTCAP_TWO_START } from "@/engine/math/dream-energy/balance";

export const UNLOCK_REFINE_MILESTONE_ID = "unlock-refine";
export const UNLOCK_UPGRADES_MILESTONE_ID = "unlock-upgrades";
export const UNLOCK_COHERENCE_UPGRADES_MILESTONE_ID = "unlock-coherence-upgrades";
export const MILESTONE_FOUR_PLACEHOLDER_ID = "milestone-four-placeholder";

export const UNLOCK_REFINE_REQUIREMENT = N(1e7)
export const UNLOCK_UPGRADES_REQUIREMENT = N(2147483647)
export const UNLOCK_COHERENCE_UPGRADES_REQUIREMENT = DREAM_ENERGY_SOFTCAP_TWO_START;
export const MILESTONE_FOUR_PLACEHOLDER_REQUIREMENT = N("1e28");
