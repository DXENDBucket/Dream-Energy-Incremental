import type { GameState } from "@/engine/core/state";
import { ONE, ZERO, max, normalizeNum } from "@/engine/math/num";
import { ensureChaoticEtherState } from "@/engine/strata/common/chaotic-ether";
import { COHERENCE_DEFAULT_PRODUCTION_LOSS } from "@/engine/strata/common/coherence/balance";
import { ensureCoherenceAutobuyerState } from "@/engine/strata/common/coherence/autobuyer";
import {
  ensureCoherenceUpgradesState,
  syncCoherenceProgressionDreamCrystalMultipliers,
} from "@/engine/strata/common/coherence/upgrades";
import { ensureConceptCrystalsState } from "@/engine/strata/common/concept-crystals";
import { ensureDreamCrystalAutobuyersState } from "@/engine/strata/common/dream-crystals/autobuyers";
import { createDreamCrystalsState } from "@/engine/strata/common/dream-crystals";
import { ensureDreamCrystalUpgradesState } from "@/engine/strata/common/dream-crystals/upgrades";
import {
  getRawDreamEnergyFromActual,
  syncDreamEnergyActualFromRaw,
} from "@/engine/strata/common/dream-energy";
import {
  ensureEntropyState,
  getDefaultEntropyChaosExponent,
} from "@/engine/strata/common/entropy";
import {
  getStratumDefinition,
  realityStratumId,
} from "@/engine/strata/defs";
import { createStratumState } from "@/engine/strata/state";
import type { StratumState } from "@/engine/strata/state";
import { createMilestonesState } from "@/engine/strata/common/milestones";
import {
  grantStarterCharacters,
  normalizeCharacterSystemState,
  syncCharacterProductionPowers,
} from "@/engine/characters";
import {
  ensureRealityMilestonesState,
  hasRealityMilestone,
  markRealityLiftMilestoneClaimed,
  REALITY_MILESTONE_CHARACTER_PRODUCTION_ID,
  REALITY_MILESTONE_LIFT_UNLOCK_ID,
} from "@/engine/reality/milestones";
import { ensureCrushState, syncCrushDreamCrystalMultipliers } from "@/engine/crush";
import {
  ensureElectromagneticCrystalsState,
  type ElectromagneticCrystalsState,
} from "@/engine/electromagnetic-crystals";

function normalizeDreamCrystalsState(stratum: StratumState): void {
  const defaults = createDreamCrystalsState();
  stratum.dreamCrystals ??= defaults;
  stratum.dreamCrystals.tiers ??= {};

  for (let tier = 1; tier <= 8; tier++) {
    const rawTier = stratum.dreamCrystals.tiers[tier] ?? defaults.tiers[tier]!;

    stratum.dreamCrystals.tiers[tier] = {
      amount: normalizeNum(rawTier.amount),
      bought: normalizeNum(rawTier.bought),
      refinement: normalizeNum(rawTier.refinement),
    };
  }
}

export function normalizeGameState(state: GameState): GameState {
  state.lastTickMs = Number.isFinite(state.lastTickMs) ? state.lastTickMs : performance.now();
  state.lastWallClockMs = Number.isFinite(state.lastWallClockMs) ? state.lastWallClockMs : Date.now();
  state.simTimeSec = Number.isFinite(state.simTimeSec) ? state.simTimeSec : 0;
  state.settings ??= {
    autoSaveIntervalSec: 20,
    condenseConfirmationEnabled: true,
    chaoticEtherConfirmationEnabled: true,
    crushConfirmationEnabled: true,
  };
  state.settings.autoSaveIntervalSec = Number.isFinite(state.settings.autoSaveIntervalSec)
    ? state.settings.autoSaveIntervalSec
    : 20;
  if (typeof state.settings.prestigeConfirmationsEnabled === "boolean") {
    const legacySetting = state.settings.prestigeConfirmationsEnabled;
    state.settings.condenseConfirmationEnabled = legacySetting;
    state.settings.chaoticEtherConfirmationEnabled = legacySetting;
    state.settings.crushConfirmationEnabled = legacySetting;
    delete state.settings.prestigeConfirmationsEnabled;
  } else {
    state.settings.condenseConfirmationEnabled =
      typeof state.settings.condenseConfirmationEnabled === "boolean"
        ? state.settings.condenseConfirmationEnabled
        : true;
    state.settings.chaoticEtherConfirmationEnabled =
      typeof state.settings.chaoticEtherConfirmationEnabled === "boolean"
        ? state.settings.chaoticEtherConfirmationEnabled
        : true;
    state.settings.crushConfirmationEnabled =
      typeof state.settings.crushConfirmationEnabled === "boolean"
        ? state.settings.crushConfirmationEnabled
        : true;
  }

  state.strata[realityStratumId] ??= createStratumState();
  const legacyState = state as GameState & {
    electromagneticCrystals?: ElectromagneticCrystalsState;
  };
  if (legacyState.electromagneticCrystals) {
    state.strata[realityStratumId].electromagneticCrystals = legacyState.electromagneticCrystals;
    delete legacyState.electromagneticCrystals;
  }
  ensureRealityMilestonesState(state);
  ensureCrushState(state);
  normalizeCharacterSystemState(state);

  if (state.lift.isLiftUnlocked) {
    markRealityLiftMilestoneClaimed(state);
  } else if (hasRealityMilestone(state, REALITY_MILESTONE_LIFT_UNLOCK_ID)) {
    state.lift.isLiftUnlocked = true;
  }

  if (hasRealityMilestone(state, REALITY_MILESTONE_CHARACTER_PRODUCTION_ID)) {
    grantStarterCharacters(state);
  }

  for (const [id, stratum] of Object.entries(state.strata)) {
    stratum.stratumId = id;
    stratum.dreamEnergy = normalizeNum(stratum.dreamEnergy, 10);
    stratum.rawDreamEnergy = normalizeNum(stratum.rawDreamEnergy, stratum.dreamEnergy);
    stratum.bestDreamEnergy = max(
      normalizeNum(stratum.bestDreamEnergy, stratum.dreamEnergy),
      stratum.dreamEnergy,
    );
    stratum.coherencePoints = normalizeNum(stratum.coherencePoints, ZERO);
    stratum.bestNextStratumEntryCoherencePoints = normalizeNum(
      stratum.bestNextStratumEntryCoherencePoints,
      ZERO,
    );
    stratum.coherenceProductionLoss = normalizeNum(
      stratum.coherenceProductionLoss,
      COHERENCE_DEFAULT_PRODUCTION_LOSS,
    );
    stratum.coherenceDreamCrystalMultiplier = normalizeNum(stratum.coherenceDreamCrystalMultiplier, ONE);
    stratum.coherenceProgressionDreamCrystalMultiplier = normalizeNum(
      stratum.coherenceProgressionDreamCrystalMultiplier,
      ONE,
    );
    stratum.stratumSpeed = normalizeNum(stratum.stratumSpeed, ONE);
    normalizeDreamCrystalsState(stratum);
    ensureChaoticEtherState(stratum);
    ensureCoherenceAutobuyerState(stratum);
    ensureCoherenceUpgradesState(stratum);
    ensureConceptCrystalsState(stratum);
    ensureElectromagneticCrystalsState(stratum);
    ensureDreamCrystalUpgradesState(stratum);
    ensureDreamCrystalAutobuyersState(stratum);
    stratum.rawDreamEnergy = getRawDreamEnergyFromActual(stratum, stratum.dreamEnergy);
    syncDreamEnergyActualFromRaw(stratum);
    stratum.milestones ??= createMilestonesState();
    stratum.milestones.claimed ??= {};

    const entropy = ensureEntropyState(stratum);
    entropy.formulaId = getStratumDefinition(id)?.entropyFormulaId ?? "none";
    entropy.chaosExponent = getDefaultEntropyChaosExponent(entropy.formulaId);
  }

  if (!(state.activeStratumId in state.strata)) {
    state.activeStratumId = realityStratumId;
  }

  if (!(state.lift.currentLiftPosition in state.strata)) {
    state.lift.currentLiftPosition = state.activeStratumId;
  }

  syncCoherenceProgressionDreamCrystalMultipliers(state);
  syncCrushDreamCrystalMultipliers(state);
  syncCharacterProductionPowers(state);

  return state;
}
