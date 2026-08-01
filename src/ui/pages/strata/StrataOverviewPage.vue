<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { ZERO } from "@/engine/math/num";
import { getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import {
  getPreviousStratumDefinition,
  getStratumDefinition,
  STRATUM_DEFINITIONS,
  type StratumDefinition,
} from "@/engine/strata/defs";
import {
  canTravelToStratum,
  getStratumEntryCoherenceCost,
  getStratumEntryEntropyGrowthRateMultiplier,
  getStratumTravelDirection,
  isStratumVisible,
  travelToStratum,
} from "@/engine/strata/lift";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const travelTargetId = ref<string | null>(null);
const depthBands = Array.from({ length: 6 }, (_, index) => index);
const shards = Array.from({ length: 16 }, (_, index) => index);

const visibleDefinitions = computed(() =>
  STRATUM_DEFINITIONS.filter(definition => isStratumVisible(props.game.state, definition.id)),
);
const maximumAvailableDepth = Math.max(
  ...STRATUM_DEFINITIONS
    .filter(definition => definition.contentStatus === "available")
    .map(definition => definition.depth),
  1,
);

const sourceDefinition = computed(() =>
  getStratumDefinition(props.game.state.activeStratumId),
);

const targetDefinition = computed(() =>
  travelTargetId.value ? getStratumDefinition(travelTargetId.value) : undefined,
);

const travelDirection = computed(() => {
  if (!travelTargetId.value) return undefined;
  return getStratumTravelDirection(props.game.state.activeStratumId, travelTargetId.value);
});

const isTravelDialogOpen = computed(() => Boolean(targetDefinition.value && travelDirection.value));
const isDescending = computed(() => travelDirection.value === "deeper");
const sourceName = computed(() => sourceDefinition.value ? t(sourceDefinition.value.labelKey) : "");
const targetName = computed(() => targetDefinition.value ? t(targetDefinition.value.labelKey) : "");

const entryCostText = computed(() => formatInt(
  targetDefinition.value
    ? getStratumEntryCoherenceCost(props.game.state, targetDefinition.value.id)
    : ZERO,
));

const entropyRateText = computed(() => format(
  targetDefinition.value
    ? getStratumEntryEntropyGrowthRateMultiplier(props.game.state, targetDefinition.value.id)
    : ZERO,
));

const carriedChaoticEtherTier = computed(() => sourceDefinition.value?.producedChaoticEtherTier ?? 0);
const carriedChaoticEtherText = computed(() => {
  const source = props.game.state.strata[props.game.state.activeStratumId];
  return format(source ? getChaoticEther(source, carriedChaoticEtherTier.value) : ZERO);
});

function nodeTop(definition: StratumDefinition): string {
  return `${10 + (definition.depth / maximumAvailableDepth) * 80}%`;
}

function isActive(definition: StratumDefinition): boolean {
  return props.game.state.activeStratumId === definition.id;
}

function isNodeDisabled(definition: StratumDefinition): boolean {
  return isActive(definition) || !canTravelToStratum(props.game.state, definition.id);
}

function nodeStateKey(definition: StratumDefinition): string | undefined {
  if (isActive(definition)) return "strataOverview.active";
  const direction = getStratumTravelDirection(props.game.state.activeStratumId, definition.id);
  if (direction === "shallower" && canTravelToStratum(props.game.state, definition.id)) {
    return "strataOverview.returnTarget";
  }
  if (!direction) return "strataOverview.needsPrevious";
  if (!canTravelToStratum(props.game.state, definition.id)) return "strataOverview.needsCoherence";
  return undefined;
}

function nodeStateParams(definition: StratumDefinition): Record<string, string> {
  const previous = getPreviousStratumDefinition(definition.id);
  return { stratum: previous ? t(previous.labelKey) : "" };
}

function selectStratum(definition: StratumDefinition): void {
  if (isNodeDisabled(definition)) return;
  travelTargetId.value = definition.id;
}

function closeTravelDialog(): void {
  travelTargetId.value = null;
}

function confirmTravel(): void {
  const targetId = travelTargetId.value;
  closeTravelDialog();
  if (targetId) travelToStratum(props.game.state, targetId);
}
</script>

<template>
  <div class="strata-overview">
    <div class="depth-map">
      <div class="skyline" aria-hidden="true" />

      <div
        v-for="band in depthBands"
        :key="band"
        class="depth-band"
        :style="{
          '--band-width': `${88 - band * 8}%`,
          '--band-top': `${13 + band * 14}%`,
        }"
        aria-hidden="true"
      />

      <span
        v-for="shard in shards"
        :key="shard"
        class="dream-shard"
        :style="{
          '--shard-left': `${10 + ((shard * 17) % 78)}%`,
          '--shard-top': `${18 + ((shard * 19) % 70)}%`,
          '--shard-size': `${10 + (shard % 4) * 5}px`,
          '--shard-rotation': `${(shard * 29) % 180}deg`,
          '--shard-delay': `${shard * -0.18}s`,
        }"
        aria-hidden="true"
      />

      <button
        v-for="definition in visibleDefinitions"
        :key="definition.id"
        class="stratum-node"
        :class="[`depth-${definition.depth}`, { active: isActive(definition) }]"
        :style="{ '--node-top': nodeTop(definition) }"
        :disabled="isNodeDisabled(definition)"
        @click="selectStratum(definition)"
      >
        <span class="node-orbit" aria-hidden="true" />
        <span class="node-core">
          <span class="node-title">{{ t(definition.labelKey) }}</span>
          <span v-if="nodeStateKey(definition)" class="node-state">
            {{ t(nodeStateKey(definition)!, nodeStateParams(definition)) }}
          </span>
        </span>
      </button>

      <transition name="travel-dialog-fade">
        <div
          v-if="isTravelDialogOpen"
          class="travel-dialog-backdrop"
          @click.self="closeTravelDialog"
        >
          <div class="travel-dialog" role="dialog" aria-modal="true">
            <div class="travel-dialog-kicker">{{ t("strataOverview.travelDialogKicker") }}</div>
            <h3 class="travel-dialog-title">
              {{ t(isDescending ? "strataOverview.descendTitle" : "strataOverview.ascendTitle", { target: targetName }) }}
            </h3>
            <p class="travel-dialog-copy">
              {{ t(isDescending ? "strataOverview.descendCopy" : "strataOverview.ascendCopy", { source: sourceName, target: targetName }) }}
            </p>

            <div v-if="isDescending" class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.travelCostLabel") }}</span>
                <strong>{{ t("strataOverview.travelCostValue", { cost: entryCostText }) }}</strong>
              </div>
              <div class="travel-readout">
                <span>{{ t("strataOverview.travelEntropyLabel") }}</span>
                <strong>{{ t("strataOverview.travelEntropyValue", { value: entropyRateText }) }}</strong>
              </div>
            </div>

            <div v-else class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.returnCarryLabel") }}</span>
                <strong>{{ t("strataOverview.returnCarryValue", { tier: carriedChaoticEtherTier, value: carriedChaoticEtherText }) }}</strong>
              </div>
              <div class="travel-readout">
                <span>{{ t("strataOverview.returnResetGenericLabel", { source: sourceName }) }}</span>
                <strong>{{ t("strataOverview.returnResetGenericValue") }}</strong>
              </div>
            </div>

            <p class="travel-note">
              {{ t(isDescending ? "strataOverview.travelNoteWithCost" : "strataOverview.returnGenericNote", { source: sourceName, target: targetName }) }}
            </p>

            <div class="travel-actions">
              <button class="travel-button secondary" @click="closeTravelDialog">
                {{ t("strataOverview.travelCancel") }}
              </button>
              <button class="travel-button primary" @click="confirmTravel">
                {{ t(isDescending ? "strataOverview.travelConfirm" : "strataOverview.returnConfirm") }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.strata-overview {
  width: min(980px, 96%);
  min-height: 620px;
}

.depth-map {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  border: 1px solid rgba(71, 91, 145, 0.72);
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 5%, rgba(209, 238, 255, 0.16), transparent 22%),
    linear-gradient(180deg, #111e35 0%, #0c1428 28%, #180e2d 64%, #08081c 100%);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.34), inset 0 0 42px rgba(128, 154, 255, 0.08);
  isolation: isolate;
}

.depth-map::before {
  content: "";
  position: absolute;
  inset: 12% 0 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(136, 207, 255, 0.2), transparent 16%);
  clip-path: polygon(8% 0, 92% 0, 80% 100%, 20% 100%);
}

.skyline {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 244, 255, 0.72), transparent);
  box-shadow: 0 0 18px rgba(156, 214, 255, 0.46);
}

.depth-band {
  position: absolute;
  left: 50%;
  top: var(--band-top);
  width: var(--band-width);
  height: 10%;
  transform: translateX(-50%);
  border: 1px solid rgba(126, 148, 221, 0.18);
  border-radius: 50%;
}

.dream-shard {
  position: absolute;
  left: var(--shard-left);
  top: var(--shard-top);
  width: var(--shard-size);
  aspect-ratio: 1;
  transform: rotate(var(--shard-rotation));
  border: 1px solid rgba(203, 222, 255, 0.24);
  background: linear-gradient(135deg, rgba(111, 211, 255, 0.26), rgba(206, 130, 255, 0.1));
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  opacity: 0.45;
  animation: shard-glimmer 4.6s ease-in-out infinite;
  animation-delay: var(--shard-delay);
}

.stratum-node {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: var(--node-top);
  width: 94px;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #f7fbff;
  cursor: pointer;
  font: inherit;
}

.stratum-node:disabled { cursor: not-allowed; }

.node-orbit {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(210, 234, 255, 0.62);
  border-radius: 50%;
  background: conic-gradient(from 18deg, transparent, rgba(121, 209, 255, 0.34), transparent 36%, rgba(225, 174, 255, 0.32), transparent 70%);
  box-shadow: 0 0 28px rgba(127, 199, 255, 0.28), inset 0 0 24px rgba(255, 255, 255, 0.08);
  animation: node-orbit 14s linear infinite;
}

.node-core {
  position: absolute;
  inset: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 20%, rgba(255,255,255,.25), transparent 30%), linear-gradient(180deg, #5d4892, #1b1849);
  box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.12), 0 10px 24px rgba(0, 0, 0, 0.28);
}

.depth-0 .node-core { background: linear-gradient(180deg, #5786b8, #172e53); }
.depth-2 .node-core { background: linear-gradient(180deg, #7e3e6e, #231340); }
.depth-3 .node-core { background: linear-gradient(180deg, #754337, #2c1529); }
.depth-4 .node-core { background: linear-gradient(180deg, #49334f, #120d24); }
.stratum-node.active .node-orbit { box-shadow: 0 0 40px rgba(175, 225, 255, .55), inset 0 0 26px rgba(255,255,255,.14); }
.stratum-node:disabled:not(.active) { opacity: .62; }

.node-title { font-size: .94rem; font-weight: 800; }
.node-state { padding: 2px 7px; border: 1px solid rgba(220,243,255,.42); border-radius: 999px; background: rgba(10,22,43,.62); color: #c9edff; font-size: .66rem; font-weight: 700; }

.travel-dialog-backdrop {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(3, 6, 18, 0.7);
  backdrop-filter: blur(5px);
}

.travel-dialog {
  width: min(430px, 100%);
  padding: 24px;
  border: 1px solid rgba(198, 224, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, #131b36 0%, #0a0c1f 100%);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.44), 0 0 34px rgba(132, 201, 255, 0.18);
  color: #eef5ff;
  text-align: left;
}

.travel-dialog-kicker { color: #8fbcff; font-size: .74rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.travel-dialog-title { margin: 8px 0 10px; font-size: 1.45rem; }
.travel-dialog-copy, .travel-note { color: #bcc9df; line-height: 1.55; }
.travel-readouts { display: grid; gap: 8px; margin: 18px 0; }
.travel-readout { display: flex; justify-content: space-between; gap: 16px; padding: 10px 12px; border: 1px solid rgba(129,158,211,.25); border-radius: 6px; background: rgba(36,52,88,.35); }
.travel-readout span { color: #aab8d2; }
.travel-readout strong { color: #e9f5ff; text-align: right; }
.travel-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.travel-button { padding: 9px 15px; border: 1px solid #5871a8; border-radius: 6px; color: #eef5ff; font: inherit; font-weight: 700; cursor: pointer; }
.travel-button.secondary { background: #222c48; }
.travel-button.primary { background: linear-gradient(180deg, #4666a4, #293f78); }

.travel-dialog-fade-enter-active, .travel-dialog-fade-leave-active { transition: opacity .16s ease; }
.travel-dialog-fade-enter-from, .travel-dialog-fade-leave-to { opacity: 0; }

@keyframes node-orbit { to { transform: rotate(360deg); } }
@keyframes shard-glimmer { 0%, 100% { opacity: .2; } 50% { opacity: .58; } }

@media (max-width: 720px) {
  .strata-overview, .depth-map { min-height: 560px; }
  .stratum-node { width: 82px; }
  .node-state { max-width: 76px; }
  .travel-readout { flex-direction: column; gap: 3px; }
  .travel-readout strong { text-align: left; }
}
</style>
