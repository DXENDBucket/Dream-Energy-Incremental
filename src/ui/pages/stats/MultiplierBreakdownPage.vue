<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameStore } from "@/store/gameStore";
import { format } from "@/engine/math/format";
import { ONE, mul, type Num } from "@/engine/math/num";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  type ConceptCrystalNodeId,
} from "@/engine/strata/common/concept-crystals";
import {
  getChaoticEtherMultiplierBreakdown,
  getCoherencePointMultiplierBreakdown,
  getConceptSpeedMultiplierBreakdown,
  getDreamCrystalMultiplierBreakdown,
  getDreamEnergyProductionMultiplierBreakdown,
  type MultiplierBreakdownCategoryId,
  type MultiplierBreakdownEntry,
} from "@/engine/statistics";

const props = defineProps<{
  game: GameStore;
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const selectedCategory = ref<MultiplierBreakdownCategoryId>("dream-energy");
const selectedConceptNode = ref<ConceptCrystalNodeId>("hope");

const categories: MultiplierBreakdownCategoryId[] = [
  "dream-energy",
  "dream-crystals",
  "coherence-points",
  "chaotic-ether",
  "concept-speed",
];

const data = computed(() => {
  switch (selectedCategory.value) {
    case "dream-crystals":
      return getDreamCrystalMultiplierBreakdown(activeStratum.value);
    case "coherence-points":
      return getCoherencePointMultiplierBreakdown(activeStratum.value);
    case "chaotic-ether":
      return getChaoticEtherMultiplierBreakdown(activeStratum.value);
    case "concept-speed":
      return getConceptSpeedMultiplierBreakdown(
        activeStratum.value,
        selectedConceptNode.value,
      );
    default:
      return getDreamEnergyProductionMultiplierBreakdown(activeStratum.value);
  }
});

const visibleEntries = computed(() => data.value.entries.filter(entry => !entry.factor.eq(ONE)));
const totalFactor = computed(() => data.value.entries.reduce(
  (product, entry) => mul(product, entry.factor),
  ONE,
));

function finiteLogWeight(factor: Num): number {
  if (factor.lte(0)) return 0;
  const value = Math.abs(factor.log10().toNumber());
  if (Number.isFinite(value)) return Math.min(value, 1e12);
  return 1e12;
}

const positiveEntries = computed(() => visibleEntries.value
  .filter(entry => entry.factor.gt(ONE))
  .map(entry => ({ entry, weight: finiteLogWeight(entry.factor) }))
  .filter(row => row.weight > 0));

const positiveWeight = computed(() => positiveEntries.value.reduce(
  (sum, row) => sum + row.weight,
  0,
));

const debuffWeight = computed(() => visibleEntries.value
  .filter(entry => entry.factor.lt(ONE))
  .reduce((sum, entry) => {
    if (entry.factor.lte(0)) return sum + Math.max(positiveWeight.value, 1);
    return sum + finiteLogWeight(entry.factor);
  }, 0));

const chartSegments = computed(() => positiveEntries.value.map((row, index) => ({
  id: row.entry.id,
  height: positiveWeight.value > 0 ? (row.weight / positiveWeight.value) * 100 : 0,
  color: `hsl(${205 + (index * 39) % 145} 72% ${48 + (index % 2) * 8}%)`,
})));

const debuffOverlayHeight = computed(() => {
  if (debuffWeight.value <= 0) return 0;
  if (positiveWeight.value <= 0) return 100;
  return Math.min(100, (debuffWeight.value / positiveWeight.value) * 100);
});

function entryContributionPercent(entry: MultiplierBreakdownEntry): string {
  const positive = entry.factor.gt(ONE);
  const weight = entry.factor.lte(0)
    ? Math.max(positiveWeight.value, 1)
    : finiteLogWeight(entry.factor);
  const grossWeight = positiveWeight.value + debuffWeight.value;
  if (grossWeight <= 0 || weight <= 0) return "0.0%";
  const value = Math.min(999.9, (weight / grossWeight) * 100).toFixed(1);
  return `${positive ? "+" : "−"}${value}%`;
}

function entryLabel(entry: MultiplierBreakdownEntry): string {
  return t(`multiplierBreakdown.entries.${entry.id}`);
}
</script>

<template>
  <div class="breakdown-page">
    <div class="category-tabs" role="tablist">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        class="category-tab"
        :class="{ active: selectedCategory === category }"
        @click="selectedCategory = category"
      >
        {{ t(`multiplierBreakdown.categories.${category}`) }}
      </button>
    </div>

    <div v-if="selectedCategory === 'concept-speed'" class="selector-row concept-selectors">
      <span>{{ t("multiplierBreakdown.conceptNode") }}</span>
      <button
        v-for="nodeId in CONCEPT_CRYSTAL_NODE_IDS"
        :key="nodeId"
        type="button"
        class="selector-button concept-button"
        :class="{ active: selectedConceptNode === nodeId }"
        @click="selectedConceptNode = nodeId"
      >
        {{ t(`conceptCrystals.nodes.${nodeId}`) }}
      </button>
    </div>

    <div v-if="selectedCategory === 'dream-energy'" class="scope-note">
      {{ t("multiplierBreakdown.directDreamEnergyNote") }}
    </div>

    <div v-else-if="selectedCategory === 'dream-crystals'" class="scope-note">
      {{ t("multiplierBreakdown.dreamCrystalTargetNote") }}
    </div>

    <section class="summary-card">
      <div class="summary-item">
        <span>{{ t("multiplierBreakdown.base") }}</span>
        <strong>{{ format(data.baseValue) }}</strong>
      </div>
      <div class="summary-item">
        <span>{{ t("multiplierBreakdown.totalFactor") }}</span>
        <strong>×{{ format(totalFactor) }}</strong>
      </div>
      <div class="summary-item total-output">
        <span>{{ t("multiplierBreakdown.final") }}</span>
        <strong>{{ format(data.totalValue) }}</strong>
      </div>
    </section>

    <section class="breakdown-card">
      <div class="chart-column" :title="t('multiplierBreakdown.chartTitle')">
        <div v-if="chartSegments.length === 0" class="neutral-fill"></div>
        <div
          v-for="segment in chartSegments"
          :key="segment.id"
          class="chart-segment"
          :style="{ height: `${segment.height}%`, background: segment.color }"
        ></div>
        <div
          v-if="debuffOverlayHeight > 0"
          class="debuff-overlay"
          :style="{ height: `${debuffOverlayHeight}%` }"
        ></div>
      </div>

      <div class="entry-list">
        <div class="list-heading">
          <span>{{ t("multiplierBreakdown.source") }}</span>
          <span>{{ t("multiplierBreakdown.contribution") }}</span>
          <span>{{ t("multiplierBreakdown.effect") }}</span>
        </div>

        <div v-if="visibleEntries.length === 0" class="empty-entry">
          {{ t("multiplierBreakdown.noModifiers") }}
        </div>

        <div
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="entry-row"
          :class="{ debuff: entry.factor.lt(ONE) }"
        >
          <span class="entry-name">{{ entryLabel(entry) }}</span>
          <span class="entry-percent">{{ entryContributionPercent(entry) }}</span>
          <strong class="entry-factor">×{{ format(entry.factor) }}</strong>
        </div>

        <div class="debuff-legend">
          <span class="legend-swatch"></span>
          {{ t("multiplierBreakdown.debuffLegend") }}
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.breakdown-page {
  width: min(1080px, 100%);
  margin: 0 auto;
  color: #e9efff;
}

.category-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(128px, 1fr));
  gap: 7px;
  margin-bottom: 12px;
}

.category-tab,
.selector-button {
  border: 1px solid #34496e;
  border-radius: 7px;
  background: #111a30;
  color: #aebddd;
  font-weight: 700;
  cursor: pointer;
  transition: 120ms ease;
}

.category-tab {
  min-height: 48px;
  padding: 7px 9px;
}

.category-tab:hover,
.selector-button:hover {
  border-color: #69b9d8;
  color: #f3fbff;
}

.category-tab.active,
.selector-button.active {
  border-color: #63d0e5;
  background: linear-gradient(180deg, #173f59, #132b47);
  color: #f4fdff;
  box-shadow: inset 0 0 14px rgba(62, 197, 225, 0.14);
}

.selector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  min-height: 38px;
  margin-bottom: 12px;
  color: #aebddd;
}

.selector-button {
  min-width: 38px;
  min-height: 32px;
  padding: 4px 10px;
}

.concept-button {
  min-width: 76px;
}

.scope-note {
  margin: 0 0 12px;
  padding: 9px 12px;
  border-left: 3px solid #62bed8;
  background: rgba(43, 105, 137, 0.12);
  color: #9dc9db;
  font-size: 0.9rem;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #2d3d60;
  border-radius: 9px;
  background: #2d3d60;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 68px;
  padding: 11px 15px;
  background: #10182b;
}

.summary-item span {
  color: #8493b6;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-item strong {
  color: #eaf8ff;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  font-size: 1.18rem;
}

.total-output strong {
  color: #69d8e8;
}

.breakdown-card {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 15px;
  min-height: 430px;
  padding: 14px;
  border: 1px solid #2b3b5e;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(17, 26, 47, 0.98), rgba(10, 16, 31, 0.98));
}

.chart-column {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  align-self: stretch;
  min-height: 390px;
  overflow: hidden;
  border: 2px solid #6b7fa7;
  background: #0a1020;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.38);
}

.chart-segment {
  width: 100%;
  min-height: 2px;
  border-top: 1px solid rgba(235, 249, 255, 0.5);
}

.neutral-fill {
  height: 100%;
  background: linear-gradient(180deg, #263650, #172238);
}

.debuff-overlay {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  border-top: 2px dashed #ff9b9b;
  background-color: rgba(96, 15, 31, 0.34);
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 129, 144, 0.42) 0,
    rgba(255, 129, 144, 0.42) 2px,
    transparent 2px,
    transparent 9px
  );
  pointer-events: none;
}

.entry-list {
  min-width: 0;
}

.list-heading,
.entry-row {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) 100px minmax(110px, auto);
  align-items: center;
  gap: 12px;
}

.list-heading {
  min-height: 34px;
  padding: 0 12px;
  color: #7788ad;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-row {
  min-height: 47px;
  margin-bottom: 6px;
  padding: 7px 12px;
  border: 1px solid #2b3c60;
  border-left: 4px solid #49a9d2;
  background: rgba(23, 34, 57, 0.86);
}

.entry-row.debuff {
  border-style: dashed;
  border-left-color: #df6e7d;
  background: rgba(74, 24, 39, 0.42);
}

.entry-name {
  color: #dbe8ff;
  font-weight: 750;
}

.entry-percent {
  color: #74cfe4;
  font-family: "Consolas", monospace;
  text-align: right;
}

.debuff .entry-percent,
.debuff .entry-factor {
  color: #ff9daa;
}

.entry-factor {
  color: #f5f8ff;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  text-align: right;
}

.empty-entry {
  padding: 28px 14px;
  border: 1px dashed #354566;
  color: #7f8dae;
  text-align: center;
}

.debuff-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: #8795b4;
  font-size: 0.8rem;
}

.legend-swatch {
  width: 30px;
  height: 14px;
  border: 1px dashed #e57b8b;
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 129, 144, 0.4) 0,
    rgba(255, 129, 144, 0.4) 2px,
    transparent 2px,
    transparent 7px
  );
}

@media (max-width: 820px) {
  .category-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card {
    grid-template-columns: 1fr;
  }

  .breakdown-card {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .list-heading,
  .entry-row {
    grid-template-columns: minmax(110px, 1fr) 72px minmax(86px, auto);
    gap: 7px;
  }
}
</style>
