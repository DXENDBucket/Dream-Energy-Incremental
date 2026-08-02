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
const layerSpacingPercent = Math.min(15, 80 / maximumAvailableDepth);
const firstLayerTopPercent = 10;

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

function layerStyle(definition: StratumDefinition): Record<string, string> {
  return {
    "--layer-top": `${firstLayerTopPercent + definition.depth * layerSpacingPercent}%`,
    "--layer-width": `${88 - definition.depth * 7}%`,
    "--layer-hue": `${205 + definition.depth * 28}`,
  };
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
        class="stratum-layer"
        :class="[`depth-${definition.depth}`, { active: isActive(definition) }]"
        :style="layerStyle(definition)"
        :disabled="isNodeDisabled(definition)"
        @click="selectStratum(definition)"
      >
        <span class="layer-depth">{{ t("strataOverview.depthLabel", { depth: definition.depth }) }}</span>
        <span class="layer-content">
          <span class="layer-title">{{ t(definition.labelKey) }}</span>
          <span v-if="nodeStateKey(definition)" class="layer-state">
            {{ t(nodeStateKey(definition)!, nodeStateParams(definition)) }}
          </span>
        </span>
        <span class="layer-ripples" aria-hidden="true" />
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

.stratum-layer {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: var(--layer-top);
  width: var(--layer-width);
  height: 88px;
  transform: translate(-50%, -50%);
  overflow: hidden;
  border: 1px solid hsla(var(--layer-hue), 78%, 76%, 0.48);
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent, hsla(var(--layer-hue), 72%, 68%, 0.12) 18% 82%, transparent),
    linear-gradient(180deg, hsla(var(--layer-hue), 52%, 38%, 0.92), hsla(var(--layer-hue), 58%, 15%, 0.96));
  color: #f7fbff;
  cursor: pointer;
  font: inherit;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.3),
    0 0 24px hsla(var(--layer-hue), 72%, 62%, 0.14),
    inset 0 1px rgba(255, 255, 255, 0.16),
    inset 0 -18px 28px rgba(0, 0, 0, 0.2);
  transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.stratum-layer::before,
.stratum-layer::after {
  content: "";
  position: absolute;
  left: 4%;
  right: 4%;
  height: 1px;
  background: linear-gradient(90deg, transparent, hsla(var(--layer-hue), 95%, 88%, 0.7), transparent);
}

.stratum-layer::before { top: 13px; }
.stratum-layer::after { bottom: 13px; opacity: 0.45; }
.stratum-layer:disabled { cursor: not-allowed; }
.stratum-layer:disabled:not(.active) { filter: saturate(0.55) brightness(0.72); }
.stratum-layer:not(:disabled):hover { transform: translate(-50%, -50%) scale(1.012); box-shadow: 0 14px 34px rgba(0,0,0,.34), 0 0 34px hsla(var(--layer-hue), 78%, 68%, .28); }
.stratum-layer.active { border-color: hsla(var(--layer-hue), 100%, 90%, 0.9); box-shadow: 0 14px 34px rgba(0,0,0,.34), 0 0 38px hsla(var(--layer-hue), 92%, 72%, .42), inset 0 0 28px hsla(var(--layer-hue), 90%, 80%, .1); }

.layer-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 1;
}

.layer-depth {
  position: absolute;
  left: 18px;
  top: 50%;
  z-index: 1;
  transform: translateY(-50%);
  color: hsla(var(--layer-hue), 90%, 89%, 0.72);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.layer-title { font-size: 1.08rem; font-weight: 850; letter-spacing: .04em; text-shadow: 0 2px 12px rgba(0,0,0,.45); }
.layer-state { padding: 3px 9px; border: 1px solid hsla(var(--layer-hue), 90%, 88%, .36); border-radius: 999px; background: rgba(6,14,31,.48); color: #d9f2ff; font-size: .68rem; font-weight: 750; }

.layer-ripples {
  position: absolute;
  inset: 18px 8%;
  border: 1px solid hsla(var(--layer-hue), 86%, 84%, 0.12);
  border-radius: 50%;
  box-shadow: 0 0 0 12px hsla(var(--layer-hue), 80%, 76%, 0.045), 0 0 0 25px hsla(var(--layer-hue), 80%, 76%, 0.025);
}

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

@keyframes shard-glimmer { 0%, 100% { opacity: .2; } 50% { opacity: .58; } }

@media (max-width: 720px) {
  .strata-overview, .depth-map { min-height: 560px; }
  .stratum-layer { height: 78px; }
  .layer-depth { left: 10px; font-size: .6rem; }
  .layer-title { font-size: .95rem; }
  .layer-state { font-size: .6rem; }
  .travel-readout { flex-direction: column; gap: 3px; }
  .travel-readout strong { text-align: left; }
}
</style>
