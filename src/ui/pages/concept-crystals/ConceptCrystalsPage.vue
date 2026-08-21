<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { div, mul } from "@/engine/math/num";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  INNER_CONCEPT_NODE_IDS,
  canCondenseConceptCrystal,
  canUpgradeConceptCrystalInterval,
  condenseConceptCrystal,
  ensureConceptCrystalsState,
  getConceptCrystalAssimilationStrengthMultiplier,
  getConceptCrystalCoherencePointGainMultiplier,
  getConceptCrystalCondenseRequirement,
  getConceptCrystalDreamCrystalCostGrowthFactor,
  getConceptCrystalIntervalUpgradeRequirement,
  getConceptCrystalNodeContribution,
  getConceptCrystalProductionInterval,
  getInnerConceptNetProduction,
  resetConceptCrystalNodes,
  setConceptCrystalSeveredPath,
  toggleInnerConceptProduction,
  toggleConceptCrystalSevering,
  upgradeConceptCrystalInterval,
  type ConceptCrystalNodeId,
  type InnerConceptNodeId,
} from "@/engine/strata/common/concept-crystals";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  getCrushFiveFaithCharacterBonusPower,
  getCrushFiveJusticeEntropyDivisor,
  getCrushFiveRevolutionChaoticEtherMultiplier,
  getCrushFourFreedomSoftcapEfficiency,
  getCrushTwoConsensusShieldingEfficiency,
  isCrushFiveActive,
  isCrushFourActive,
  isCrushTwoActive,
} from "@/engine/crush/effects";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const conceptCrystals = computed(() => ensureConceptCrystalsState(activeStratum.value));

const HEX_RADIUS_PERCENT = 36;
const HEX_HALF_RADIUS_PERCENT = HEX_RADIUS_PERCENT / 2;
const HEX_SIDE_OFFSET_PERCENT = Math.sqrt(3) * HEX_RADIUS_PERCENT / 2;

const nodePositions: Record<ConceptCrystalNodeId, { x: number; y: number }> = {
  hope: { x: 50, y: 50 - HEX_RADIUS_PERCENT },
  conquest: { x: 50 + HEX_SIDE_OFFSET_PERCENT, y: 50 - HEX_HALF_RADIUS_PERCENT },
  law: { x: 50 + HEX_SIDE_OFFSET_PERCENT, y: 50 + HEX_HALF_RADIUS_PERCENT },
  shackle: { x: 50, y: 50 + HEX_RADIUS_PERCENT },
  enlightenment: { x: 50 - HEX_SIDE_OFFSET_PERCENT, y: 50 + HEX_HALF_RADIUS_PERCENT },
  war: { x: 50 - HEX_SIDE_OFFSET_PERCENT, y: 50 - HEX_HALF_RADIUS_PERCENT },
};

const innerNodePositions: Record<InnerConceptNodeId, { x: number; y: number }> = {
  faith: { x: 50, y: 30 },
  justice: { x: 67.3, y: 60 },
  revolution: { x: 32.7, y: 60 },
};

const innerNodeSourcePairs: Record<
  InnerConceptNodeId,
  readonly [ConceptCrystalNodeId, ConceptCrystalNodeId]
> = {
  faith: ["hope", "conquest"],
  justice: ["law", "shackle"],
  revolution: ["enlightenment", "war"],
};

const conceptAmountText = computed(() => formatInt(conceptCrystals.value.amount));
const condenseRequirementText = computed(() => formatInt(getConceptCrystalCondenseRequirement(activeStratum.value)));
const intervalText = computed(() => format(getConceptCrystalProductionInterval(activeStratum.value)));
const upgradeRequirementText = computed(() => formatInt(getConceptCrystalIntervalUpgradeRequirement(activeStratum.value)));
const upgradeCountText = computed(() => formatInt(conceptCrystals.value.intervalUpgrades));
const canUpgradeInterval = computed(() => canUpgradeConceptCrystalInterval(activeStratum.value));
const canCondense = computed(() => canCondenseConceptCrystal(activeStratum.value));
const isSeveringEnabled = computed(() => conceptCrystals.value.isSeveringEnabled);
const isConsensusActive = computed(() => isCrushTwoActive(activeStratum.value));
const isFreedomActive = computed(() => isCrushFourActive(activeStratum.value));
const isInnerConceptsActive = computed(() => isCrushFiveActive(activeStratum.value));
const dreamCrystalCostGrowthEffectText = computed(() => format(getConceptCrystalDreamCrystalCostGrowthFactor(activeStratum.value)));
const coherencePointGainEffectText = computed(() => format(getConceptCrystalCoherencePointGainMultiplier(activeStratum.value)));
const assimilationStrengthEffectText = computed(() => format(getConceptCrystalAssimilationStrengthMultiplier(activeStratum.value)));
const consensusShieldingEfficiencyText = computed(() => format(
  getCrushTwoConsensusShieldingEfficiency(activeStratum.value),
));
const freedomSoftcapEfficiencyText = computed(() => format(
  getCrushFourFreedomSoftcapEfficiency(activeStratum.value),
));
const faithCharacterPowerText = computed(() => format(
  getCrushFiveFaithCharacterBonusPower(activeStratum.value),
));
const justiceEntropyDivisorText = computed(() => format(
  getCrushFiveJusticeEntropyDivisor(activeStratum.value),
));
const revolutionChaoticEtherText = computed(() => format(
  getCrushFiveRevolutionChaoticEtherMultiplier(activeStratum.value),
));
const effectCopyKey = computed(() => {
  if (isInnerConceptsActive.value) return "conceptCrystals.effect.copyCrushFive";
  if (isFreedomActive.value) return "conceptCrystals.effect.copyCrushFour";
  if (isConsensusActive.value) return "conceptCrystals.effect.copyCrushTwo";
  return "conceptCrystals.effect.copy";
});
function conceptNodeEffectKey(id: ConceptCrystalNodeId): string {
  if (id === "conquest" && isConsensusActive.value) return "consensus";
  if (id === "shackle" && isFreedomActive.value) return "freedom";
  return id;
}
function conceptNodeLabel(id: ConceptCrystalNodeId): string {
  return t(`conceptCrystals.nodes.${conceptNodeEffectKey(id)}`);
}
const conceptContributionRows = computed(() => {
  return CONCEPT_CRYSTAL_NODE_IDS.map(id => ({
    id,
    effectKey: conceptNodeEffectKey(id),
    amountText: format(conceptCrystals.value.nodes[id]),
    contributionText: format(
      id === "conquest" && isConsensusActive.value
        ? getCrushTwoConsensusShieldingEfficiency(activeStratum.value)
        : id === "shackle" && isFreedomActive.value
          ? getCrushFourFreedomSoftcapEfficiency(activeStratum.value)
        : getConceptCrystalNodeContribution(activeStratum.value, id),
    ),
  }));
});
const progressText = computed(() => {
  const interval = getConceptCrystalProductionInterval(activeStratum.value);
  if (interval.lte(0)) return "0";
  return format(mul(div(conceptCrystals.value.productionElapsedSec, interval), 100));
});

const severedPath = computed(() => {
  const index = conceptCrystals.value.severedPathIndex;
  return { index };
});

const nodeRows = computed(() => {
  return CONCEPT_CRYSTAL_NODE_IDS.map((id, index) => {
    return {
      id,
      label: conceptNodeLabel(id),
      amountText: format(conceptCrystals.value.nodes[id]),
      position: nodePositions[id],
      isSeveredSource: isSeveringEnabled.value && severedPath.value.index === index,
    };
  });
});

const innerNodeRows = computed(() => INNER_CONCEPT_NODE_IDS.map((id) => {
  const netProduction = getInnerConceptNetProduction(activeStratum.value, id);
  return {
    id,
    label: t(`conceptCrystals.nodes.${id}`),
    amountText: format(conceptCrystals.value.innerNodes[id]),
    netProductionText: format(netProduction),
    netProductionNegative: netProduction.lt(0),
    isSevered: conceptCrystals.value.innerSevered[id],
    position: innerNodePositions[id],
    sources: innerNodeSourcePairs[id],
  };
}));

const innerNegativeLines = computed(() => INNER_CONCEPT_NODE_IDS.map((id, index) => {
  const nextId = INNER_CONCEPT_NODE_IDS[(index + 1) % INNER_CONCEPT_NODE_IDS.length]!;
  const source = innerNodePositions[id];
  const target = innerNodePositions[nextId];
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const unitX = dx / distance;
  const unitY = dy / distance;
  return {
    id,
    x1: source.x + unitX * 7.5,
    y1: source.y + unitY * 7.5,
    x2: target.x - unitX * 8.5,
    y2: target.y - unitY * 8.5,
  };
}));

function onToggleOuterPath(index: number) {
  if (isSeveringEnabled.value && severedPath.value.index === index) {
    toggleConceptCrystalSevering(activeStratum.value);
    return;
  }
  setConceptCrystalSeveredPath(activeStratum.value, index);
  if (!isSeveringEnabled.value) toggleConceptCrystalSevering(activeStratum.value);
}

function onToggleInnerProduction(nodeId: InnerConceptNodeId) {
  toggleInnerConceptProduction(activeStratum.value, nodeId);
}

function onUpgradeInterval() {
  upgradeConceptCrystalInterval(activeStratum.value);
}

function onResetNodes() {
  resetConceptCrystalNodes(activeStratum.value);
}

function onCondenseConceptCrystal() {
  condenseConceptCrystal(activeStratum.value);
}
</script>

<template>
  <div class="concept-page">
    <section class="concept-amount-band">
      <div class="amount-main">
        <div class="amount-label">{{ t("conceptCrystals.amountLabel") }}</div>
        <div class="amount-value">{{ conceptAmountText }}</div>
        <div class="amount-actions">
          <button type="button" class="amount-action-button" @click="onResetNodes">
            {{ t("conceptCrystals.resetNodes") }}
          </button>
        </div>
      </div>
      <div class="amount-condense">
        <button
          type="button"
          class="condense-button"
          :disabled="!canCondense"
          @click="onCondenseConceptCrystal"
        >
          {{ t("conceptCrystals.condense.button") }}
        </button>
        <div class="condense-hint">
          {{ t("conceptCrystals.condense.requirement", { amount: condenseRequirementText }) }}
        </div>
      </div>
    </section>

    <section class="hex-section">
      <div class="hex-board">
        <svg class="hex-lines" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <marker id="inner-negative-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" class="inner-negative-arrow-head" />
            </marker>
          </defs>

          <g v-for="(id, index) in CONCEPT_CRYSTAL_NODE_IDS" :key="id">
            <line
              :x1="nodePositions[id].x"
              :y1="nodePositions[id].y"
              :x2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].x"
              :y2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].y"
              :class="{ severed: isSeveringEnabled && severedPath.index === index }"
              class="hex-line"
            />
            <line
              :x1="nodePositions[id].x"
              :y1="nodePositions[id].y"
              :x2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].x"
              :y2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].y"
              class="production-line-hit"
              @click="onToggleOuterPath(index)"
            >
              <title>{{ t("conceptCrystals.togglePathTitle", {
                from: conceptNodeLabel(id),
                to: conceptNodeLabel(CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!),
              }) }}</title>
            </line>
          </g>

          <template v-if="isInnerConceptsActive">
            <g v-for="innerNode in innerNodeRows" :key="`source-${innerNode.id}`">
              <template v-for="sourceId in innerNode.sources" :key="`${innerNode.id}-${sourceId}`">
                <line
                  :x1="nodePositions[sourceId].x"
                  :y1="nodePositions[sourceId].y"
                  :x2="innerNode.position.x"
                  :y2="innerNode.position.y"
                  class="inner-source-line"
                  :class="{ severed: innerNode.isSevered }"
                />
                <line
                  :x1="nodePositions[sourceId].x"
                  :y1="nodePositions[sourceId].y"
                  :x2="innerNode.position.x"
                  :y2="innerNode.position.y"
                  class="production-line-hit"
                  @click="onToggleInnerProduction(innerNode.id)"
                >
                  <title>{{ t("conceptCrystals.toggleInnerProductionTitle", { concept: innerNode.label }) }}</title>
                </line>
              </template>
            </g>

            <line
              v-for="line in innerNegativeLines"
              :key="`negative-${line.id}`"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              class="inner-negative-line"
              marker-end="url(#inner-negative-arrow)"
            />
          </template>
        </svg>

        <div
          v-for="node in nodeRows"
          :key="node.id"
          class="concept-node"
          :class="{ severed: node.isSeveredSource }"
          :style="{ left: `${node.position.x}%`, top: `${node.position.y}%` }"
        >
          <span class="node-label">{{ node.label }}</span>
          <span class="node-amount">{{ node.amountText }}</span>
        </div>

        <template v-if="isInnerConceptsActive">
          <div
            v-for="innerNode in innerNodeRows"
            :key="innerNode.id"
            class="concept-node inner-concept-node"
            :class="{ severed: innerNode.isSevered }"
            :style="{ left: `${innerNode.position.x}%`, top: `${innerNode.position.y}%` }"
          >
            <span class="node-label">{{ innerNode.label }}</span>
            <span class="node-amount">{{ innerNode.amountText }}</span>
            <span
              class="inner-net-production"
              :class="{ negative: innerNode.netProductionNegative, severed: innerNode.isSevered }"
            >
              {{ innerNode.isSevered
                ? t("conceptCrystals.innerFrozen")
                : t("conceptCrystals.innerNetProduction", { value: innerNode.netProductionText }) }}
            </span>
          </div>
        </template>

        <div v-if="isInnerConceptsActive" class="inner-cycle-label">
          {{ t("conceptCrystals.innerCycleLabel") }}
        </div>
      </div>

      <div class="cycle-line">
        {{ t("conceptCrystals.cycleLine", { interval: intervalText, progress: progressText }) }}
      </div>
    </section>

    <section class="upgrade-section">
      <div>
        <div class="upgrade-title">{{ t("conceptCrystals.upgrade.title") }}</div>
        <div class="upgrade-copy">
          {{ t("conceptCrystals.upgrade.copy", { count: upgradeCountText }) }}
        </div>
      </div>
      <button
        type="button"
        class="upgrade-button"
        :disabled="!canUpgradeInterval"
        @click="onUpgradeInterval"
      >
        {{ t("conceptCrystals.upgrade.button", { cost: upgradeRequirementText }) }}
      </button>
    </section>

    <section class="effect-section">
      <div class="effect-title">{{ t("conceptCrystals.effect.title") }}</div>
      <div class="effect-copy">
        {{ t(effectCopyKey) }}
      </div>
      <div class="effect-grid">
        <div class="effect-line">
          {{ t("conceptCrystals.effect.dcCostGrowth", { value: dreamCrystalCostGrowthEffectText }) }}
        </div>
        <div class="effect-line">
          {{ t("conceptCrystals.effect.cpGain", { value: coherencePointGainEffectText }) }}
        </div>
        <div class="effect-line">
          {{ t("conceptCrystals.effect.assimilation", { value: assimilationStrengthEffectText }) }}
        </div>
        <div v-if="isConsensusActive" class="effect-line">
          {{ t("conceptCrystals.effect.shieldingEfficiency", { value: consensusShieldingEfficiencyText }) }}
        </div>
        <div v-if="isFreedomActive" class="effect-line">
          {{ t("conceptCrystals.effect.softcapEfficiency", { value: freedomSoftcapEfficiencyText }) }}
        </div>
        <div v-if="isInnerConceptsActive" class="effect-line inner-effect-line">
          {{ t("conceptCrystals.effect.faith", { value: faithCharacterPowerText }) }}
        </div>
        <div v-if="isInnerConceptsActive" class="effect-line inner-effect-line">
          {{ t("conceptCrystals.effect.justice", { value: justiceEntropyDivisorText }) }}
        </div>
        <div v-if="isInnerConceptsActive" class="effect-line inner-effect-line">
          {{ t("conceptCrystals.effect.revolution", { value: revolutionChaoticEtherText }) }}
        </div>
      </div>
      <div class="contribution-grid">
        <div
          v-for="row in conceptContributionRows"
          :key="row.id"
          class="contribution-line"
        >
          {{ t(`conceptCrystals.effect.contributions.${row.effectKey}`, {
            amount: row.amountText,
            contribution: row.contributionText,
          }) }}
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.concept-page {
  width: min(1080px, 96%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.concept-amount-band,
.upgrade-section,
.effect-section {
  border: 1px solid rgba(129, 215, 255, 0.46);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 31, 48, 0.95) 0%, rgba(7, 16, 29, 0.98) 100%);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.26),
    inset 0 0 22px rgba(88, 214, 255, 0.06);
}

.concept-amount-band {
  min-height: 122px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
}

.amount-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.amount-label {
  color: #bfeeff;
  font-size: 0.88rem;
  font-weight: 800;
}

.amount-value {
  margin-top: 4px;
  color: #ffffff;
  font-family: var(--font-number);
  font-size: 2.2rem;
  font-weight: 900;
  text-shadow: 0 0 18px rgba(123, 222, 255, 0.38);
}

.amount-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.amount-action-button {
  min-width: 132px;
  min-height: 34px;
  border: 1px solid rgba(121, 224, 255, 0.48);
  border-radius: 999px;
  background: rgba(15, 45, 66, 0.86);
  color: #dcf7ff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  cursor: pointer;
}

.amount-action-button:hover {
  border-color: rgba(255, 255, 255, 0.86);
  filter: brightness(1.08);
}

.amount-action-button.active {
  background: rgba(218, 246, 255, 0.16);
  color: #ffffff;
  box-shadow: 0 0 14px rgba(157, 232, 255, 0.16);
}

.amount-condense {
  justify-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condense-button {
  min-height: 56px;
  border: 1px solid rgba(174, 238, 255, 0.66);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(42, 104, 132, 0.96) 0%, rgba(13, 43, 64, 0.98) 100%);
  color: #ffffff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  box-shadow:
    0 0 18px rgba(112, 222, 255, 0.12),
    inset 0 0 18px rgba(255, 255, 255, 0.04);
}

.condense-button:hover:not(:disabled) {
  filter: brightness(1.08);
}

.condense-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.condense-hint {
  color: #adddec;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.35;
  text-align: center;
}

.hex-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hex-board {
  position: relative;
  width: min(620px, 94vw);
  aspect-ratio: 1;
  border: 1px solid rgba(120, 206, 255, 0.34);
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 48%, rgba(99, 211, 255, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(8, 22, 38, 0.98) 0%, rgba(4, 10, 19, 0.99) 100%);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.32),
    inset 0 0 34px rgba(91, 218, 255, 0.06);
}

.hex-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.hex-line {
  stroke: rgba(138, 222, 255, 0.34);
  stroke-width: 1.25;
  pointer-events: none;
}

.hex-line.severed {
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 2.4;
  stroke-dasharray: 4 4;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.42));
}

.production-line-hit {
  stroke: transparent;
  stroke-width: 5;
  pointer-events: stroke;
  cursor: pointer;
}

.hex-lines g:hover > .hex-line,
.hex-lines g:hover .inner-source-line {
  filter: drop-shadow(0 0 5px rgba(197, 243, 255, 0.72));
}

.inner-source-line {
  stroke: rgba(126, 215, 255, 0.42);
  stroke-width: 0.85;
  pointer-events: none;
}

.inner-source-line.severed {
  stroke: rgba(210, 222, 229, 0.56);
  stroke-dasharray: 2.2 2.2;
  opacity: 0.55;
}

.inner-negative-line {
  stroke: rgba(255, 117, 148, 0.5);
  stroke-width: 0.72;
  stroke-dasharray: 1.8 1.5;
  pointer-events: none;
}

.inner-negative-arrow-head {
  fill: rgba(255, 117, 148, 0.72);
}

.concept-node {
  position: absolute;
  width: 112px;
  height: 112px;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(117, 223, 255, 0.58);
  border-radius: 50%;
  background:
    linear-gradient(180deg, rgba(18, 55, 77, 0.94) 0%, rgba(8, 23, 39, 0.98) 100%);
  color: #eafaff;
  font: inherit;
  cursor: default;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 0 20px rgba(113, 219, 255, 0.06);
}

.concept-node.severed {
  border-color: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 0 24px rgba(255, 255, 255, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 0 22px rgba(255, 255, 255, 0.08);
}

.inner-concept-node {
  width: 88px;
  height: 88px;
  border-color: rgba(222, 237, 255, 0.62);
  background:
    radial-gradient(circle at 50% 32%, rgba(255, 255, 255, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(35, 54, 72, 0.97), rgba(9, 19, 31, 0.99));
  gap: 2px;
  z-index: 2;
}

.inner-concept-node .node-label {
  font-size: 0.82rem;
}

.inner-concept-node .node-amount {
  font-size: 0.88rem;
}

.inner-net-production {
  color: #a8f0ce;
  font-family: var(--font-number);
  font-size: 0.61rem;
  font-weight: 850;
}

.inner-net-production.negative {
  color: #ff9aad;
}

.inner-net-production.severed {
  color: #cad3dc;
}

.inner-cycle-label {
  position: absolute;
  left: 50%;
  top: 49%;
  transform: translate(-50%, -50%);
  color: rgba(255, 185, 201, 0.8);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  pointer-events: none;
}

.node-label {
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.12;
  max-width: 86%;
  text-align: center;
  overflow-wrap: anywhere;
}

.node-amount {
  color: #bfeeff;
  font-family: var(--font-number);
  font-size: 1.12rem;
  font-weight: 900;
}

.cycle-line {
  color: #a9dff0;
  font-size: 0.9rem;
  font-weight: 800;
  text-align: center;
}

.upgrade-section {
  display: grid;
  grid-template-columns: 1fr minmax(210px, 280px);
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
}

.upgrade-title,
.effect-title {
  color: #ffffff;
  font-size: 1.02rem;
  font-weight: 900;
}

.upgrade-copy,
.effect-copy {
  margin-top: 6px;
  color: #b9dced;
  line-height: 1.45;
}

.upgrade-button {
  min-height: 54px;
  border: 1px solid rgba(121, 224, 255, 0.66);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(29, 85, 112, 0.95) 0%, rgba(12, 37, 58, 0.98) 100%);
  color: #ffffff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.upgrade-button:hover:not(:disabled) {
  filter: brightness(1.08);
}

.upgrade-button:disabled {
  cursor: not-allowed;
  opacity: 0.54;
}

.effect-section {
  padding: 16px 18px;
}

.effect-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.effect-line {
  min-height: 46px;
  border: 1px solid rgba(129, 215, 255, 0.2);
  border-radius: 6px;
  background: rgba(7, 18, 31, 0.64);
  color: #dff7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  font-size: 0.82rem;
  font-weight: 850;
  line-height: 1.35;
  text-align: center;
}

.inner-effect-line {
  border-color: rgba(255, 138, 169, 0.24);
  background: rgba(34, 13, 26, 0.5);
}

.contribution-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.contribution-line {
  min-height: 40px;
  border: 1px solid rgba(129, 215, 255, 0.15);
  border-radius: 6px;
  background: rgba(4, 12, 22, 0.58);
  color: #ccecf7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px 9px;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.35;
  text-align: center;
}

@media (max-width: 760px) {
  .concept-amount-band {
    grid-template-columns: 1fr;
  }

  .concept-node {
    width: 92px;
    height: 92px;
  }

  .inner-concept-node {
    width: 72px;
    height: 72px;
  }

  .upgrade-section {
    grid-template-columns: 1fr;
  }

  .effect-grid {
    grid-template-columns: 1fr;
  }

  .contribution-grid {
    grid-template-columns: 1fr;
  }
}
</style>
