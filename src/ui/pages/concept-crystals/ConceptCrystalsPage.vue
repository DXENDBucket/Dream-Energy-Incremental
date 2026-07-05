<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { div, mul } from "@/engine/math/num";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  canUpgradeConceptCrystalInterval,
  ensureConceptCrystalsState,
  getConceptCrystalIntervalUpgradeRequirement,
  getConceptCrystalProductionInterval,
  rotateConceptCrystalSeveredPath,
  setConceptCrystalSeveredPath,
  upgradeConceptCrystalInterval,
  type ConceptCrystalNodeId,
} from "@/engine/strata/common/concept-crystals";
import { getActiveStratum } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const conceptCrystals = computed(() => ensureConceptCrystalsState(activeStratum.value));

const nodePositions: Record<ConceptCrystalNodeId, { x: number; y: number }> = {
  hope: { x: 50, y: 7 },
  conquest: { x: 84, y: 27 },
  law: { x: 84, y: 73 },
  shackle: { x: 50, y: 93 },
  enlightenment: { x: 16, y: 73 },
  war: { x: 16, y: 27 },
};

const conceptAmountText = computed(() => formatInt(conceptCrystals.value.amount));
const intervalText = computed(() => format(getConceptCrystalProductionInterval(activeStratum.value)));
const upgradeRequirementText = computed(() => formatInt(getConceptCrystalIntervalUpgradeRequirement(activeStratum.value)));
const upgradeCountText = computed(() => formatInt(conceptCrystals.value.intervalUpgrades));
const canUpgradeInterval = computed(() => canUpgradeConceptCrystalInterval(activeStratum.value));
const progressText = computed(() => {
  const interval = getConceptCrystalProductionInterval(activeStratum.value);
  if (interval.lte(0)) return "0";
  return format(mul(div(conceptCrystals.value.productionElapsedSec, interval), 100));
});

const severedPath = computed(() => {
  const index = conceptCrystals.value.severedPathIndex;
  const from = CONCEPT_CRYSTAL_NODE_IDS[index]!;
  const to = CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!;
  return {
    index,
    from,
    to,
    angle: 30 + index * 60,
  };
});

const nodeRows = computed(() => {
  return CONCEPT_CRYSTAL_NODE_IDS.map((id, index) => {
    const nextId = CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!;
    return {
      id,
      nextId,
      label: t(`conceptCrystals.nodes.${id}`),
      amountText: format(conceptCrystals.value.nodes[id]),
      position: nodePositions[id],
      isSeveredSource: severedPath.value.index === index,
    };
  });
});

function onRotate(direction: -1 | 1) {
  rotateConceptCrystalSeveredPath(activeStratum.value, direction);
}

function onSelectPath(index: number) {
  setConceptCrystalSeveredPath(activeStratum.value, index);
}

function onUpgradeInterval() {
  upgradeConceptCrystalInterval(activeStratum.value);
}
</script>

<template>
  <div class="concept-page">
    <section class="concept-amount-band">
      <div class="amount-label">{{ t("conceptCrystals.amountLabel") }}</div>
      <div class="amount-value">{{ conceptAmountText }}</div>
    </section>

    <section class="hex-section">
      <div class="hex-board" :style="{ '--pointer-angle': `${severedPath.angle}deg` }">
        <svg class="hex-lines" viewBox="0 0 100 100" aria-hidden="true">
          <line
            v-for="(id, index) in CONCEPT_CRYSTAL_NODE_IDS"
            :key="id"
            :x1="nodePositions[id].x"
            :y1="nodePositions[id].y"
            :x2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].x"
            :y2="nodePositions[CONCEPT_CRYSTAL_NODE_IDS[(index + 1) % CONCEPT_CRYSTAL_NODE_IDS.length]!].y"
            :class="{ severed: severedPath.index === index }"
            class="hex-line"
          />
        </svg>

        <button
          v-for="node in nodeRows"
          :key="node.id"
          class="concept-node"
          :class="{ severed: node.isSeveredSource }"
          :style="{ left: `${node.position.x}%`, top: `${node.position.y}%` }"
          type="button"
          :title="t('conceptCrystals.pathTitle', {
            from: node.label,
            to: t(`conceptCrystals.nodes.${node.nextId}`),
          })"
          @click="onSelectPath(CONCEPT_CRYSTAL_NODE_IDS.indexOf(node.id))"
        >
          <span class="node-label">{{ node.label }}</span>
          <span class="node-amount">{{ node.amountText }}</span>
        </button>

        <div class="center-pointer">
          <div class="pointer-line"></div>
          <div class="pointer-core">
            <button type="button" class="pointer-button" :title="t('conceptCrystals.rotateLeft')" @click="onRotate(-1)">
              ‹
            </button>
            <div class="pointer-text">
              <span>{{ t("conceptCrystals.severed") }}</span>
              <strong>
                {{ t(`conceptCrystals.nodes.${severedPath.from}`) }}
                →
                {{ t(`conceptCrystals.nodes.${severedPath.to}`) }}
              </strong>
            </div>
            <button type="button" class="pointer-button" :title="t('conceptCrystals.rotateRight')" @click="onRotate(1)">
              ›
            </button>
          </div>
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
      <div class="effect-copy">{{ t("conceptCrystals.effect.copy") }}</div>
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
  min-height: 86px;
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

.hex-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hex-board {
  position: relative;
  width: min(620px, 94vw);
  aspect-ratio: 1.12;
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
  inset: 6%;
  width: 88%;
  height: 88%;
  overflow: visible;
}

.hex-line {
  stroke: rgba(138, 222, 255, 0.34);
  stroke-width: 1.25;
}

.hex-line.severed {
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 2.4;
  stroke-dasharray: 4 4;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.42));
}

.concept-node {
  position: absolute;
  width: 128px;
  min-height: 76px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(117, 223, 255, 0.58);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(18, 55, 77, 0.94) 0%, rgba(8, 23, 39, 0.98) 100%);
  color: #eafaff;
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 0 20px rgba(113, 219, 255, 0.06);
}

.concept-node:hover {
  border-color: rgba(220, 249, 255, 0.92);
  filter: brightness(1.08);
}

.concept-node.severed {
  border-color: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 0 24px rgba(255, 255, 255, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 0 22px rgba(255, 255, 255, 0.08);
}

.node-label {
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 900;
}

.node-amount {
  color: #bfeeff;
  font-family: var(--font-number);
  font-size: 1.12rem;
  font-weight: 900;
}

.center-pointer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pointer-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24%;
  height: 2px;
  transform-origin: left center;
  transform: rotate(var(--pointer-angle));
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(126, 229, 255, 0));
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.38);
}

.pointer-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 210px;
  min-height: 76px;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  border: 1px solid rgba(229, 250, 255, 0.7);
  border-radius: 999px;
  background: rgba(5, 14, 25, 0.92);
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 4px;
  padding: 8px;
  box-shadow:
    0 0 26px rgba(255, 255, 255, 0.12),
    inset 0 0 18px rgba(113, 219, 255, 0.08);
}

.pointer-button {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(132, 223, 255, 0.48);
  border-radius: 50%;
  background: rgba(18, 54, 75, 0.88);
  color: #ffffff;
  font: inherit;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
}

.pointer-button:hover {
  border-color: rgba(255, 255, 255, 0.9);
  filter: brightness(1.08);
}

.pointer-text {
  color: #bfeeff;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pointer-text strong {
  color: #ffffff;
  font-size: 0.82rem;
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

@media (max-width: 760px) {
  .concept-node {
    width: 104px;
    min-height: 68px;
  }

  .pointer-core {
    width: 184px;
  }

  .upgrade-section {
    grid-template-columns: 1fr;
  }
}
</style>
