<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import { N, add, max, type Num } from "@/engine/math/num";
import { DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID, ensureDreamCrystalUpgradesState } from "@/engine/strata/common/dream-crystals/upgrades";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { addChaoticEther, getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import { ensureEntropyState } from "@/engine/strata/common/entropy";
import {
  UNLOCK_COHERENCE_UPGRADES_MILESTONE_ID,
  UNLOCK_COHERENCE_UPGRADES_REQUIREMENT,
  UNLOCK_REFINE_MILESTONE_ID,
  UNLOCK_REFINE_REQUIREMENT,
  UNLOCK_UPGRADES_MILESTONE_ID,
  UNLOCK_UPGRADES_REQUIREMENT,
} from "@/engine/strata/common/milestones/balance";
import { dreamSeaFirstStratumId, realityStratumId } from "@/engine/strata/defs/ids";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { createStratumState, type StratumState } from "@/engine/strata/state";

type DebugActionId =
  | "reach-refinement"
  | "reach-upgrades"
  | "unlock-lift"
  | "prepare-dream-sea"
  | "activate-dream-sea"
  | "reach-coherence-upgrades"
  | "unlock-autobuyer"
  | "unlock-current-mechanics"
  | "add-active-de"
  | "add-active-cp"
  | "add-active-ce"
  | "add-reality-cp"
  | "add-reality-ce";

interface DebugAction {
  id: DebugActionId;
  titleKey: string;
  descriptionKey: string;
}

interface DebugActionGroup {
  titleKey: string;
  actions: DebugAction[];
}

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const lastActionId = ref<DebugActionId | null>(null);

const ACTIVE_DE_GRANT = N("1e40");
const ACTIVE_CP_GRANT = N(1000);
const ACTIVE_CE_GRANT = N(1000);
const REALITY_CP_GRANT = N(1000);
const REALITY_CE_GRANT = N(1000);

const activeStratum = computed(() => getActiveStratum(props.game.state));
const activeStratumIdText = computed(() => props.game.state.activeStratumId);
const activeDreamEnergyText = computed(() => format(activeStratum.value.dreamEnergy));
const activeCoherenceText = computed(() => format(getCoherencePoints(activeStratum.value)));
const activeChaoticEtherText = computed(() => format(getChaoticEther(activeStratum.value)));
const liftStatusText = computed(() => {
  return props.game.state.lift.isLiftUnlocked
    ? t("debugProgression.status.unlocked")
    : t("debugProgression.status.locked");
});
const lastActionText = computed(() => {
  if (!lastActionId.value) return t("debugProgression.status.ready");
  return t(`debugProgression.done.${lastActionId.value}`);
});

const actionGroups = computed<DebugActionGroup[]>(() => [
  {
    titleKey: "debugProgression.groups.stages",
    actions: [
      {
        id: "reach-refinement",
        titleKey: "debugProgression.actions.reachRefinement.title",
        descriptionKey: "debugProgression.actions.reachRefinement.description",
      },
      {
        id: "reach-upgrades",
        titleKey: "debugProgression.actions.reachUpgrades.title",
        descriptionKey: "debugProgression.actions.reachUpgrades.description",
      },
      {
        id: "prepare-dream-sea",
        titleKey: "debugProgression.actions.prepareDreamSea.title",
        descriptionKey: "debugProgression.actions.prepareDreamSea.description",
      },
      {
        id: "activate-dream-sea",
        titleKey: "debugProgression.actions.activateDreamSea.title",
        descriptionKey: "debugProgression.actions.activateDreamSea.description",
      },
      {
        id: "reach-coherence-upgrades",
        titleKey: "debugProgression.actions.reachCoherenceUpgrades.title",
        descriptionKey: "debugProgression.actions.reachCoherenceUpgrades.description",
      },
    ],
  },
  {
    titleKey: "debugProgression.groups.mechanics",
    actions: [
      {
        id: "unlock-lift",
        titleKey: "debugProgression.actions.unlockLift.title",
        descriptionKey: "debugProgression.actions.unlockLift.description",
      },
      {
        id: "unlock-autobuyer",
        titleKey: "debugProgression.actions.unlockAutobuyer.title",
        descriptionKey: "debugProgression.actions.unlockAutobuyer.description",
      },
      {
        id: "unlock-current-mechanics",
        titleKey: "debugProgression.actions.unlockCurrentMechanics.title",
        descriptionKey: "debugProgression.actions.unlockCurrentMechanics.description",
      },
    ],
  },
  {
    titleKey: "debugProgression.groups.resources",
    actions: [
      {
        id: "add-active-de",
        titleKey: "debugProgression.actions.addActiveDE.title",
        descriptionKey: "debugProgression.actions.addActiveDE.description",
      },
      {
        id: "add-active-cp",
        titleKey: "debugProgression.actions.addActiveCP.title",
        descriptionKey: "debugProgression.actions.addActiveCP.description",
      },
      {
        id: "add-active-ce",
        titleKey: "debugProgression.actions.addActiveCE.title",
        descriptionKey: "debugProgression.actions.addActiveCE.description",
      },
      {
        id: "add-reality-cp",
        titleKey: "debugProgression.actions.addRealityCP.title",
        descriptionKey: "debugProgression.actions.addRealityCP.description",
      },
      {
        id: "add-reality-ce",
        titleKey: "debugProgression.actions.addRealityCE.title",
        descriptionKey: "debugProgression.actions.addRealityCE.description",
      },
    ],
  },
]);

function ensureRealityStratum(): StratumState {
  const existing = props.game.state.strata[realityStratumId];
  if (existing) return existing;

  const created = createStratumState();
  props.game.state.strata[realityStratumId] = created;
  return created;
}

function ensureDreamSeaFirstStratum(): StratumState {
  const existing = props.game.state.strata[dreamSeaFirstStratumId];
  if (existing) return existing;

  const created = createStratumState({
    entropyFormulaId: "dream-sea-first",
  });
  props.game.state.strata[dreamSeaFirstStratumId] = created;
  return created;
}

function setDreamEnergyAtLeast(stratum: StratumState, amount: Num): void {
  stratum.dreamEnergy = max(stratum.dreamEnergy, amount);
}

function claimMilestone(stratum: StratumState, id: string): void {
  stratum.milestones.claimed[id] = true;
}

function claimEarlyMilestones(stratum: StratumState): void {
  claimMilestone(stratum, UNLOCK_REFINE_MILESTONE_ID);
  claimMilestone(stratum, UNLOCK_UPGRADES_MILESTONE_ID);
}

function claimAllKnownMilestones(stratum: StratumState): void {
  claimEarlyMilestones(stratum);
  claimMilestone(stratum, UNLOCK_COHERENCE_UPGRADES_MILESTONE_ID);
}

function unlockLift(): void {
  props.game.state.lift.isLiftUnlocked = true;
  props.game.state.lift.currentLiftPosition = props.game.state.activeStratumId;
}

function addCoherencePoints(stratum: StratumState, amount: Num): void {
  stratum.coherencePoints = add(getCoherencePoints(stratum), amount);
}

function activateDreamSeaFirst(): void {
  unlockLift();

  const dreamSeaFirst = ensureDreamSeaFirstStratum();
  const entropy = ensureEntropyState(dreamSeaFirst);
  entropy.formulaId = "dream-sea-first";

  props.game.state.activeStratumId = dreamSeaFirstStratumId;
  props.game.state.lift.currentLiftPosition = dreamSeaFirstStratumId;
}

function runAction(id: DebugActionId): void {
  switch (id) {
    case "reach-refinement":
      setDreamEnergyAtLeast(activeStratum.value, UNLOCK_REFINE_REQUIREMENT);
      claimMilestone(activeStratum.value, UNLOCK_REFINE_MILESTONE_ID);
      break;
    case "reach-upgrades":
      setDreamEnergyAtLeast(activeStratum.value, UNLOCK_UPGRADES_REQUIREMENT);
      claimEarlyMilestones(activeStratum.value);
      break;
    case "unlock-lift":
      unlockLift();
      break;
    case "prepare-dream-sea":
      unlockLift();
      addCoherencePoints(ensureRealityStratum(), REALITY_CP_GRANT);
      break;
    case "activate-dream-sea":
      activateDreamSeaFirst();
      break;
    case "reach-coherence-upgrades":
      setDreamEnergyAtLeast(activeStratum.value, UNLOCK_COHERENCE_UPGRADES_REQUIREMENT);
      claimAllKnownMilestones(activeStratum.value);
      break;
    case "unlock-autobuyer":
      ensureDreamCrystalUpgradesState(activeStratum.value).bought[DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID] = true;
      break;
    case "unlock-current-mechanics":
      setDreamEnergyAtLeast(activeStratum.value, UNLOCK_COHERENCE_UPGRADES_REQUIREMENT);
      claimAllKnownMilestones(activeStratum.value);
      unlockLift();
      ensureDreamCrystalUpgradesState(activeStratum.value).bought[DREAM_CRYSTAL_UPGRADE_AUTOBUYER_ID] = true;
      break;
    case "add-active-de":
      activeStratum.value.dreamEnergy = add(activeStratum.value.dreamEnergy, ACTIVE_DE_GRANT);
      break;
    case "add-active-cp":
      addCoherencePoints(activeStratum.value, ACTIVE_CP_GRANT);
      break;
    case "add-active-ce":
      addChaoticEther(activeStratum.value, ACTIVE_CE_GRANT);
      break;
    case "add-reality-cp":
      addCoherencePoints(ensureRealityStratum(), REALITY_CP_GRANT);
      break;
    case "add-reality-ce":
      addChaoticEther(ensureRealityStratum(), REALITY_CE_GRANT);
      break;
  }

  lastActionId.value = id;
}
</script>

<template>
  <div class="debug-progression-page">
    <div class="debug-status">
      <div class="status-item">
        <span class="status-label">{{ t("debugProgression.status.activeStratum") }}</span>
        <span class="status-value">{{ activeStratumIdText }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">{{ t("resource.dreamEnergy") }}</span>
        <span class="status-value">{{ activeDreamEnergyText }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">{{ t("resource.coherencePoints") }}</span>
        <span class="status-value">{{ activeCoherenceText }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">{{ t("resource.chaoticEther") }}</span>
        <span class="status-value">{{ activeChaoticEtherText }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">{{ t("debugProgression.status.lift") }}</span>
        <span class="status-value">{{ liftStatusText }}</span>
      </div>
    </div>

    <div class="last-action">{{ lastActionText }}</div>

    <section
      v-for="group in actionGroups"
      :key="group.titleKey"
      class="debug-section"
    >
      <h3 class="section-title">{{ t(group.titleKey) }}</h3>
      <div class="action-grid">
        <button
          v-for="action in group.actions"
          :key="action.id"
          class="debug-action"
          @click="runAction(action.id)"
        >
          <span class="action-title">{{ t(action.titleKey) }}</span>
          <span class="action-description">{{ t(action.descriptionKey) }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.debug-progression-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.debug-status {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid rgba(84, 101, 145, 0.72);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(17, 25, 47, 0.96) 0%, rgba(10, 15, 30, 0.98) 100%);
}

.status-label {
  display: block;
  color: #96a5cf;
  font-size: 0.76rem;
  font-weight: 800;
}

.status-value {
  display: block;
  margin-top: 5px;
  color: #f2f6ff;
  font-size: 0.94rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.last-action {
  min-height: 30px;
  color: #ffbad0;
  font-size: 0.88rem;
  font-weight: 800;
  text-align: center;
  text-shadow: 0 0 12px rgba(244, 78, 109, 0.24);
}

.debug-section {
  margin-top: 16px;
}

.section-title {
  margin: 0 0 10px;
  color: #f6d8e2;
  font-size: 1.02rem;
  font-weight: 900;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 10px;
}

.debug-action {
  min-height: 96px;
  padding: 12px 13px;
  border: 1px solid rgba(161, 70, 96, 0.78);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(45, 17, 31, 0.96) 0%, rgba(19, 9, 18, 0.98) 100%);
  color: #fceaf0;
  font: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 7px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.24),
    inset 0 0 18px rgba(244, 78, 109, 0.05);
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    filter 0.15s ease;
}

.debug-action:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 132, 164, 0.82);
  filter: brightness(1.06);
}

.action-title {
  color: #fff8fb;
  font-size: 0.92rem;
  font-weight: 900;
}

.action-description {
  color: #d9adbd;
  font-size: 0.78rem;
  line-height: 1.35;
}

@media (max-width: 980px) {
  .debug-status,
  .action-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}

@media (max-width: 620px) {
  .debug-status,
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
