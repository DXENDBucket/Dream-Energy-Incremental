<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { GameStore } from "@/store/gameStore";
import { format } from "@/engine/math/format";
import { N, ONE, TEN, mul, type Num } from "@/engine/math/num";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  CONCEPT_CRYSTAL_NODE_IDS,
  type ConceptCrystalNodeId,
} from "@/engine/strata/common/concept-crystals";
import {
  isCrushFourActive,
  isCrushSixActive,
  isCrushTwoActive,
} from "@/engine/crush/effects";
import {
  getChaoticEtherMultiplierBreakdown,
  getCoherencePointMultiplierBreakdown,
  getConceptSpeedMultiplierBreakdown,
  getDreamCrystalMultiplierBreakdown,
  getDreamEnergyProductionMultiplierBreakdown,
  getElectromagneticPowerGainMultiplierBreakdown,
  type MultiplierBreakdownCategoryId,
  type MultiplierBreakdownData,
  type MultiplierBreakdownEntry,
} from "@/engine/statistics";

const props = defineProps<{
  game: GameStore;
}>();

const BREAKDOWN_SCIENTIFIC_THRESHOLD = N(0.01);
const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const selectedCategory = ref<MultiplierBreakdownCategoryId>("dream-energy");
const selectedConceptNode = ref<ConceptCrystalNodeId>("hope");
const hoveredEntryId = ref<string | null>(null);
const hoveredDetailId = ref<string | null>(null);
const expandedEntryIds = ref(new Set<string>());

const categories: MultiplierBreakdownCategoryId[] = [
  "dream-energy",
  "dream-crystals",
  "coherence-points",
  "chaotic-ether",
  "electromagnetic-power",
  "concept-speed",
];

function readData(): MultiplierBreakdownData {
  switch (selectedCategory.value) {
    case "dream-crystals":
      return getDreamCrystalMultiplierBreakdown(activeStratum.value);
    case "coherence-points":
      return getCoherencePointMultiplierBreakdown(activeStratum.value);
    case "chaotic-ether":
      return getChaoticEtherMultiplierBreakdown(activeStratum.value);
    case "electromagnetic-power":
      return getElectromagneticPowerGainMultiplierBreakdown(activeStratum.value);
    case "concept-speed":
      return getConceptSpeedMultiplierBreakdown(
        activeStratum.value,
        selectedConceptNode.value,
      );
    default:
      return getDreamEnergyProductionMultiplierBreakdown(activeStratum.value);
  }
}

// The engine runs every animation frame. A slower display snapshot keeps rapidly
// changing derived ratios (especially CP conversion efficiency and multiplier
// powers) readable and prevents the chart from being laid out continuously.
const data = shallowRef<MultiplierBreakdownData>(readData());
let refreshTimer: ReturnType<typeof setInterval> | undefined;

function refreshData(): void {
  data.value = readData();
}

watch(
  [selectedCategory, selectedConceptNode, () => activeStratum.value.stratumId],
  () => {
    hoveredEntryId.value = null;
    refreshData();
  },
);

onMounted(() => {
  refreshTimer = setInterval(refreshData, 250);
});

onUnmounted(() => {
  if (refreshTimer !== undefined) clearInterval(refreshTimer);
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

function formatBreakdownValue(value: Num): string {
  if (value.eq(0) || !value.isFinite()) return format(value);

  const negative = value.lt(0);
  const absolute = value.abs();
  if (absolute.gte(BREAKDOWN_SCIENTIFIC_THRESHOLD)) return format(value);

  let exponent = absolute.log10().floor().toNumber();
  let mantissa = absolute.div(TEN.pow(exponent)).toNumber();
  if (!Number.isFinite(exponent) || !Number.isFinite(mantissa)) return format(value);

  if (Number(mantissa.toFixed(2)) >= 10) {
    mantissa = 1;
    exponent += 1;
  }

  return `${negative ? "−" : ""}${mantissa.toFixed(2)}e${exponent}`;
}

const positiveEntries = computed(() => visibleEntries.value.filter(entry => entry.factor.gt(ONE)));
const debuffEntries = computed(() => visibleEntries.value.filter(entry => entry.factor.lt(ONE)));

const positiveWeight = computed(() => positiveEntries.value.reduce(
  (sum, entry) => sum + finiteLogWeight(entry.factor),
  0,
));

function entryWeight(entry: MultiplierBreakdownEntry): number {
  if (entry.factor.lte(0)) return Math.max(positiveWeight.value, 1);
  return finiteLogWeight(entry.factor);
}

const debuffWeight = computed(() => debuffEntries.value.reduce((sum, entry) => {
    if (entry.factor.lte(0)) return sum + Math.max(positiveWeight.value, 1);
    return sum + finiteLogWeight(entry.factor);
  }, 0));

const grossWeight = computed(() => positiveWeight.value + debuffWeight.value);

// Preserve the source order inside each group, but always put debuffs below buffs.
const orderedEntries = computed(() => [...positiveEntries.value, ...debuffEntries.value]);

function fixedEntryColor(id: string): string {
  let hash = 0;
  for (const character of id) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return `hsl(${190 + (hash % 165)} 72% ${48 + (hash % 2) * 8}%)`;
}

const chartSegments = computed(() => orderedEntries.value.map(entry => ({
  entry,
  id: entry.id,
  isDebuff: entry.factor.lt(ONE),
  height: grossWeight.value > 0 ? (entryWeight(entry) / grossWeight.value) * 100 : 0,
  color: fixedEntryColor(entry.id),
})));

function entryContributionPercent(entry: MultiplierBreakdownEntry): string {
  const positive = entry.factor.gt(ONE);
  const weight = entryWeight(entry);
  if (grossWeight.value <= 0 || weight <= 0) return "0.0%";
  const value = Math.min(999.9, (weight / grossWeight.value) * 100).toFixed(1);
  return `${positive ? "+" : "−"}${value}%`;
}

function childContributionPercent(
  child: MultiplierBreakdownEntry,
  siblings: MultiplierBreakdownEntry[],
): string {
  const positiveWeight = siblings
    .filter(entry => entry.factor.gt(ONE))
    .reduce((sum, entry) => sum + finiteLogWeight(entry.factor), 0);
  const weight = child.factor.lte(0)
    ? Math.max(positiveWeight, 1)
    : finiteLogWeight(child.factor);
  const totalWeight = siblings.reduce((sum, entry) => {
    if (entry.factor.lte(0)) return sum + Math.max(positiveWeight, 1);
    return sum + finiteLogWeight(entry.factor);
  }, 0);
  if (totalWeight <= 0 || weight <= 0) return "0.0%";
  return `${child.factor.gt(ONE) ? "+" : "−"}${((weight / totalWeight) * 100).toFixed(1)}%`;
}

function entryLabel(entry: MultiplierBreakdownEntry): string {
  const tierEffect = /^(.*)-dc-(\d+)$/.exec(entry.id);
  if (tierEffect) {
    return t("multiplierBreakdown.entries.dcTierEffect", {
      tier: tierEffect[2],
      effect: t(`multiplierBreakdown.entries.${tierEffect[1]}`),
    });
  }
  return t(
    entry.labelKey ?? `multiplierBreakdown.entries.${entry.id}`,
    entry.labelValues ?? {},
  );
}

function conceptNodeLabel(nodeId: ConceptCrystalNodeId): string {
  if (nodeId === "conquest" && isCrushTwoActive(activeStratum.value)) {
    return t("conceptCrystals.nodes.consensus");
  }
  if (nodeId === "shackle" && isCrushFourActive(activeStratum.value)) {
    return t("conceptCrystals.nodes.freedom");
  }
  if (nodeId === "war" && isCrushSixActive(activeStratum.value)) {
    return t("conceptCrystals.nodes.peace");
  }
  return t(`conceptCrystals.nodes.${nodeId}`);
}

function setHoveredEntry(id: string | null, detailId: string | null = null): void {
  hoveredEntryId.value = id;
  hoveredDetailId.value = detailId;
}

function isEntryExpanded(id: string): boolean {
  return expandedEntryIds.value.has(id);
}

function orderedChildren(entry: MultiplierBreakdownEntry): MultiplierBreakdownEntry[] {
  const children = entry.children ?? [];
  return [
    ...children.filter(child => !child.factor.lt(ONE)),
    ...children.filter(child => child.factor.lt(ONE)),
  ];
}

function toggleEntry(id: string): void {
  const next = new Set(expandedEntryIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedEntryIds.value = next;
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

    <div class="category-context">
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
          {{ conceptNodeLabel(nodeId) }}
        </button>
      </div>

      <div v-if="selectedCategory === 'dream-energy'" class="scope-note">
        {{ t("multiplierBreakdown.directDreamEnergyNote") }}
      </div>

      <div v-else-if="selectedCategory === 'dream-crystals'" class="scope-note">
        {{ t("multiplierBreakdown.dreamCrystalTargetNote") }}
      </div>

      <div v-else-if="selectedCategory === 'electromagnetic-power'" class="scope-note">
        {{ t("multiplierBreakdown.electromagneticPowerGainNote") }}
      </div>
    </div>

    <section class="summary-card">
      <div class="summary-item">
        <span>{{ t("multiplierBreakdown.base") }}</span>
        <strong>{{ formatBreakdownValue(data.baseValue) }}</strong>
      </div>
      <div class="summary-item">
        <span>{{ t("multiplierBreakdown.totalFactor") }}</span>
        <strong>×{{ formatBreakdownValue(totalFactor) }}</strong>
      </div>
      <div class="summary-item total-output">
        <span>{{ t("multiplierBreakdown.final") }}</span>
        <strong>{{ formatBreakdownValue(data.totalValue) }}</strong>
      </div>
    </section>

    <section class="breakdown-card">
      <div class="chart-column" :title="t('multiplierBreakdown.chartTitle')">
        <div v-if="chartSegments.length === 0" class="neutral-fill"></div>
        <div
          v-for="segment in chartSegments"
          :key="segment.id"
          class="chart-segment"
          :class="{
            debuff: segment.isDebuff,
            'linked-highlight': hoveredEntryId === segment.id,
          }"
          :style="{
            height: `${segment.height}%`,
            '--segment-color': segment.color,
          }"
          @mouseenter="setHoveredEntry(segment.id)"
          @mouseleave="setHoveredEntry(null)"
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
          v-for="entry in orderedEntries"
          :key="entry.id"
          class="entry-group"
        >
          <div
            class="entry-row"
            :class="{
              debuff: entry.factor.lt(ONE),
              'linked-highlight': hoveredEntryId === entry.id,
            }"
            @mouseenter="setHoveredEntry(entry.id)"
            @mouseleave="setHoveredEntry(null)"
          >
            <span class="entry-name-cell">
              <button
                v-if="entry.children?.length"
                type="button"
                class="entry-toggle"
                :aria-expanded="isEntryExpanded(entry.id)"
                @click.stop="toggleEntry(entry.id)"
              >
                {{ isEntryExpanded(entry.id) ? "−" : "+" }}
              </button>
              <span class="entry-name">{{ entryLabel(entry) }}</span>
            </span>
            <span class="entry-percent">{{ entryContributionPercent(entry) }}</span>
            <strong class="entry-factor">×{{ formatBreakdownValue(entry.factor) }}</strong>
          </div>

          <div
            v-if="entry.children?.length && isEntryExpanded(entry.id)"
            class="entry-children"
          >
            <div
              v-for="child in orderedChildren(entry)"
              :key="child.id"
              class="entry-child-row"
              :class="{
                debuff: child.factor.lt(ONE),
                'linked-highlight': hoveredDetailId === child.id,
              }"
              @mouseenter="setHoveredEntry(entry.id, child.id)"
              @mouseleave="setHoveredEntry(null)"
            >
              <span class="entry-name">{{ entryLabel(child) }}</span>
              <span class="entry-percent">
                {{ childContributionPercent(child, entry.children ?? []) }}
              </span>
              <strong class="entry-factor">×{{ formatBreakdownValue(child.factor) }}</strong>
            </div>
          </div>
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
:global(html) {
  scrollbar-gutter: stable;
}

.breakdown-page {
  width: min(1080px, 100%);
  min-width: 0;
  box-sizing: border-box;
  margin: 0 auto;
  color: #e9efff;
  overflow-anchor: none;
}

.category-tabs {
  display: flex;
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
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  min-height: 48px;
  padding: 7px 9px;
  overflow-wrap: anywhere;
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
  margin: 0;
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
  margin: 0;
  padding: 9px 12px;
  border-left: 3px solid #62bed8;
  background: rgba(43, 105, 137, 0.12);
  color: #9dc9db;
  font-size: 0.9rem;
}

.category-context {
  display: flex;
  align-items: flex-start;
  min-height: 50px;
  margin-bottom: 12px;
}

.category-context > * {
  width: 100%;
  box-sizing: border-box;
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
  min-width: 0;
  overflow: hidden;
  color: #eaf8ff;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  font-size: 1.18rem;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.total-output strong {
  color: #69d8e8;
}

.breakdown-card {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: stretch;
  gap: 15px;
  width: 100%;
  min-height: 430px;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid #2b3b5e;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(17, 26, 47, 0.98), rgba(10, 16, 31, 0.98));
}

.chart-column {
  position: relative;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 390px;
  overflow: hidden;
  border: 2px solid #6b7fa7;
  background: #0a1020;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.38);
}

.chart-segment {
  position: relative;
  width: 100%;
  min-height: 2px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(235, 249, 255, 0.5);
  background: var(--segment-color);
  transition: filter 120ms ease;
}

.neutral-fill {
  height: 100%;
  background: linear-gradient(180deg, #263650, #172238);
}

.chart-segment.debuff {
  border: 1px dashed #ff9b9b;
  background-color: rgba(96, 15, 31, 0.48);
  background-image: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--segment-color) 70%, #ff8797) 0,
    color-mix(in srgb, var(--segment-color) 70%, #ff8797) 2px,
    transparent 2px,
    transparent 9px
  );
}

.entry-list {
  min-width: 0;
}

.list-heading,
.entry-row,
.entry-child-row {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) 110px 180px;
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
  position: relative;
  min-height: 47px;
  box-sizing: border-box;
  margin-bottom: 6px;
  padding: 7px 12px;
  border: 1px solid #2b3c60;
  border-left: 4px solid #49a9d2;
  background: rgba(23, 34, 57, 0.86);
}

.entry-group {
  min-width: 0;
  transform-origin: top center;
}

.entry-name-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.entry-toggle {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #54729e;
  border-radius: 3px;
  background: #101a2d;
  color: #bcefff;
  font: 800 1rem/1 "Consolas", monospace;
  cursor: pointer;
}

.entry-toggle:hover {
  border-color: #8ddff0;
  background: #18314a;
}

.entry-children {
  margin: -1px 0 8px 18px;
  padding: 7px;
  border: 1px dashed #405274;
  border-top: 0;
  background: rgba(8, 14, 27, 0.72);
}

.entry-child-row {
  position: relative;
  min-height: 38px;
  box-sizing: border-box;
  padding: 5px 10px;
  border-bottom: 1px dashed #344563;
  background: rgba(20, 30, 49, 0.62);
}

.entry-child-row:last-child {
  border-bottom: 0;
}

.entry-child-row.debuff {
  border-color: #744252;
  background: rgba(66, 24, 38, 0.34);
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
  min-width: 0;
  overflow: hidden;
  color: #f5f8ff;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  font-variant-numeric: tabular-nums;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-percent {
  font-variant-numeric: tabular-nums;
}

.chart-segment.linked-highlight,
.entry-row.linked-highlight,
.entry-child-row.linked-highlight {
  z-index: 4;
  animation: linked-border-flash 720ms ease-in-out infinite;
}

.chart-segment.linked-highlight::after,
.entry-row.linked-highlight::after,
.entry-child-row.linked-highlight::after {
  position: absolute;
  inset: -1px;
  content: "";
  border: 2px solid rgba(161, 237, 255, 0.92);
  box-shadow:
    inset 0 0 10px rgba(117, 220, 255, 0.42),
    0 0 9px rgba(117, 220, 255, 0.62);
  pointer-events: none;
}

.chart-segment.debuff.linked-highlight::after,
.entry-row.debuff.linked-highlight::after,
.entry-child-row.debuff.linked-highlight::after {
  border-color: rgba(255, 153, 169, 0.96);
  box-shadow:
    inset 0 0 10px rgba(255, 105, 130, 0.42),
    0 0 9px rgba(255, 105, 130, 0.62);
}

@keyframes linked-border-flash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
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
    overflow-x: auto;
  }

  .category-tab {
    flex: 0 0 132px;
    width: 132px;
    min-width: 132px;
  }

  .summary-card {
    grid-template-columns: 1fr;
  }

  .breakdown-card {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .list-heading,
  .entry-row,
  .entry-child-row {
    grid-template-columns: minmax(110px, 1fr) 72px 110px;
    gap: 7px;
  }
}
</style>
