<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { ZERO } from "@/engine/math/num";
import { getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import {
  dreamSeaFirstStratumId,
  dreamSeaSecondStratumId,
  firstStratumId,
} from "@/engine/strata/defs/ids";
import {
  canTravelBackToDreamSeaFirstStratum,
  canTravelToDreamSeaFirstStratum,
  canTravelToDreamSeaSecondStratum,
  getDreamSeaFirstEntryCoherenceCost,
  getDreamSeaFirstEntryEntropyGrowthRateMultiplier,
  getDreamSeaSecondEntryCoherenceCost,
  getDreamSeaSecondEntryEntropyGrowthRateMultiplier,
  isDreamSeaFirstStratumVisible,
  isDreamSeaSecondStratumVisible,
  travelBackToDreamSeaFirstStratum,
  travelToDreamSeaFirstStratum,
  travelToDreamSeaSecondStratum,
  travelToRealityStratum,
} from "@/engine/strata/lift";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
type TravelDialogTarget = "reality" | "dreamSeaFirst" | "dreamSeaFirstReturn" | "dreamSeaSecond";

const realityIsActive = computed(() => props.game.state.activeStratumId === firstStratumId);
const realityIsAvailable = computed(() => firstStratumId in props.game.state.strata);
const realityNodeDisabled = computed(() => !realityIsAvailable.value || realityIsActive.value || !dreamSeaFirstIsActive.value);
const dreamSeaFirstIsActive = computed(() => props.game.state.activeStratumId === dreamSeaFirstStratumId);
const dreamSeaFirstIsVisible = computed(() => isDreamSeaFirstStratumVisible(props.game.state));
const dreamSeaFirstCanTravel = computed(() => canTravelToDreamSeaFirstStratum(props.game.state));
const dreamSeaFirstCanReturnTo = computed(() => canTravelBackToDreamSeaFirstStratum(props.game.state));
const dreamSeaFirstNodeDisabled = computed(() => {
  if (dreamSeaFirstIsActive.value) return true;
  if (dreamSeaFirstCanReturnTo.value) return false;
  return !dreamSeaFirstCanTravel.value;
});
const dreamSeaSecondIsActive = computed(() => props.game.state.activeStratumId === dreamSeaSecondStratumId);
const dreamSeaSecondIsVisible = computed(() => isDreamSeaSecondStratumVisible(props.game.state));
const dreamSeaSecondCanTravel = computed(() => canTravelToDreamSeaSecondStratum(props.game.state));
const travelDialogTarget = ref<TravelDialogTarget | null>(null);
const travelDialogOpen = computed(() => travelDialogTarget.value !== null);
const dreamSeaFirstEntryCost = computed(() => getDreamSeaFirstEntryCoherenceCost(props.game.state));
const dreamSeaSecondEntryCost = computed(() => getDreamSeaSecondEntryCoherenceCost(props.game.state));
const dreamSeaFirstCostText = computed(() => {
  return formatInt(dreamSeaFirstEntryCost.value);
});
const dreamSeaSecondCostText = computed(() => {
  return formatInt(dreamSeaSecondEntryCost.value);
});
const dreamSeaFirstEntropyRateText = computed(() => {
  return format(getDreamSeaFirstEntryEntropyGrowthRateMultiplier(props.game.state));
});
const dreamSeaSecondEntropyRateText = computed(() => {
  return format(getDreamSeaSecondEntryEntropyGrowthRateMultiplier(props.game.state));
});
const returnChaoticEtherText = computed(() => {
  const dreamSeaFirst = props.game.state.strata[dreamSeaFirstStratumId];
  return format(dreamSeaFirst ? getChaoticEther(dreamSeaFirst, 1) : ZERO);
});
const returnToFirstChaoticEtherText = computed(() => {
  const dreamSeaSecond = props.game.state.strata[dreamSeaSecondStratumId];
  return format(dreamSeaSecond ? getChaoticEther(dreamSeaSecond, 2) : ZERO);
});
const travelDialogTitle = computed(() => {
  if (travelDialogTarget.value === "reality") return t("strataOverview.returnDialogTitle");
  if (travelDialogTarget.value === "dreamSeaFirstReturn") return t("strataOverview.returnToFirstDialogTitle");
  if (travelDialogTarget.value === "dreamSeaSecond") return t("strataOverview.travelSecondDialogTitle");
  return t("strataOverview.travelDialogTitle");
});
const travelDialogCopy = computed(() => {
  if (travelDialogTarget.value === "reality") return t("strataOverview.returnDialogCopy");
  if (travelDialogTarget.value === "dreamSeaFirstReturn") return t("strataOverview.returnToFirstDialogCopy");
  if (travelDialogTarget.value === "dreamSeaSecond") return t("strataOverview.travelSecondDialogCopy");
  return t("strataOverview.travelDialogCopy");
});
const travelDialogNote = computed(() => {
  if (travelDialogTarget.value === "reality") return t("strataOverview.returnNote");
  if (travelDialogTarget.value === "dreamSeaFirstReturn") return t("strataOverview.returnToFirstNote");
  return t("strataOverview.travelNoteWithCost");
});
const travelDialogConfirmText = computed(() => {
  if (travelDialogTarget.value === "reality") return t("strataOverview.returnConfirm");
  if (travelDialogTarget.value === "dreamSeaFirstReturn") return t("strataOverview.returnToFirstConfirm");
  return t("strataOverview.travelConfirm");
});
const depthBands = Array.from({ length: 5 }, (_, index) => index);
const shards = Array.from({ length: 14 }, (_, index) => index);

function openTravelDialog(target: TravelDialogTarget) {
  travelDialogTarget.value = target;
}

function selectReality() {
  if (realityNodeDisabled.value) return;
  openTravelDialog("reality");
}

function selectDreamSeaFirst() {
  if (dreamSeaFirstIsActive.value) return;
  if (dreamSeaFirstCanReturnTo.value) {
    openTravelDialog("dreamSeaFirstReturn");
    return;
  }
  if (!dreamSeaFirstCanTravel.value) return;
  openTravelDialog("dreamSeaFirst");
}

function selectDreamSeaSecond() {
  if (dreamSeaSecondIsActive.value || !dreamSeaSecondCanTravel.value) return;
  openTravelDialog("dreamSeaSecond");
}

function closeTravelDialog() {
  travelDialogTarget.value = null;
}

function confirmTravel() {
  const target = travelDialogTarget.value;
  closeTravelDialog();

  if (target === "dreamSeaFirst") {
    travelToDreamSeaFirstStratum(props.game.state);
  } else if (target === "dreamSeaSecond") {
    travelToDreamSeaSecondStratum(props.game.state);
  } else if (target === "dreamSeaFirstReturn") {
    travelBackToDreamSeaFirstStratum(props.game.state);
  } else if (target === "reality") {
    travelToRealityStratum(props.game.state);
  }
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
          '--band-index': band,
          '--band-width': `${86 - band * 9}%`,
          '--band-top': `${18 + band * 13}%`,
        }"
        aria-hidden="true"
      />

      <span
        v-for="shard in shards"
        :key="shard"
        class="dream-shard"
        :style="{
          '--shard-left': `${10 + ((shard * 17) % 78)}%`,
          '--shard-top': `${28 + ((shard * 19) % 58)}%`,
          '--shard-size': `${10 + (shard % 4) * 5}px`,
          '--shard-rotation': `${(shard * 29) % 180}deg`,
          '--shard-delay': `${shard * -0.18}s`,
        }"
        aria-hidden="true"
      />

      <button
        class="stratum-node reality-node"
        :class="{ active: realityIsActive }"
        :disabled="realityNodeDisabled"
        @click="selectReality"
      >
        <span class="node-orbit" aria-hidden="true" />
        <span class="node-core">
          <span class="node-title">{{ t("strataOverview.reality") }}</span>
          <span v-if="realityIsActive" class="node-state">{{ t("strataOverview.active") }}</span>
        </span>
      </button>

      <button
        v-if="dreamSeaFirstIsVisible"
        class="stratum-node dream-sea-node"
        :class="{ active: dreamSeaFirstIsActive }"
        :disabled="dreamSeaFirstNodeDisabled"
        @click="selectDreamSeaFirst"
      >
        <span class="node-orbit" aria-hidden="true" />
        <span class="node-core">
          <span class="node-title">{{ t("strataOverview.dreamSeaFirst") }}</span>
          <span v-if="dreamSeaFirstIsActive" class="node-state">{{ t("strataOverview.active") }}</span>
          <span v-else-if="dreamSeaFirstCanReturnTo" class="node-state">{{ t("strataOverview.returnTarget") }}</span>
          <span v-else-if="!dreamSeaFirstCanTravel" class="node-state">{{ t("strataOverview.needsCoherence") }}</span>
        </span>
      </button>

      <button
        v-if="dreamSeaSecondIsVisible"
        class="stratum-node dream-sea-second-node"
        :class="{ active: dreamSeaSecondIsActive }"
        :disabled="dreamSeaSecondIsActive || !dreamSeaSecondCanTravel"
        @click="selectDreamSeaSecond"
      >
        <span class="node-orbit" aria-hidden="true" />
        <span class="node-core">
          <span class="node-title">{{ t("strataOverview.dreamSeaSecond") }}</span>
          <span v-if="dreamSeaSecondIsActive" class="node-state">{{ t("strataOverview.active") }}</span>
          <span v-else-if="!dreamSeaFirstIsActive" class="node-state">{{ t("strataOverview.needsFirst") }}</span>
          <span v-else-if="!dreamSeaSecondCanTravel" class="node-state">{{ t("strataOverview.needsCoherence") }}</span>
        </span>
      </button>

      <transition name="travel-dialog-fade">
        <div
          v-if="travelDialogOpen"
          class="travel-dialog-backdrop"
          @click.self="closeTravelDialog"
        >
          <div class="travel-dialog" role="dialog" aria-modal="true">
            <div class="travel-dialog-glow" aria-hidden="true" />

            <div class="travel-dialog-kicker">{{ t("strataOverview.travelDialogKicker") }}</div>
            <h3 class="travel-dialog-title">
              {{ travelDialogTitle }}
            </h3>
            <p class="travel-dialog-copy">
              {{ travelDialogCopy }}
            </p>

            <div v-if="travelDialogTarget === 'dreamSeaFirst'" class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.travelCostLabel") }}</span>
                <strong>{{ t("strataOverview.travelCostValue", { cost: dreamSeaFirstCostText }) }}</strong>
              </div>

              <div class="travel-readout">
                <span>{{ t("strataOverview.travelEntropyLabel") }}</span>
                <strong>{{ t("strataOverview.travelEntropyValue", { value: dreamSeaFirstEntropyRateText }) }}</strong>
              </div>
            </div>

            <div v-else-if="travelDialogTarget === 'dreamSeaSecond'" class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.travelCostLabel") }}</span>
                <strong>{{ t("strataOverview.travelCostValue", { cost: dreamSeaSecondCostText }) }}</strong>
              </div>

              <div class="travel-readout">
                <span>{{ t("strataOverview.travelEntropyLabel") }}</span>
                <strong>{{ t("strataOverview.travelEntropyValue", { value: dreamSeaSecondEntropyRateText }) }}</strong>
              </div>
            </div>

            <div v-else-if="travelDialogTarget === 'reality'" class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.returnCarryLabel") }}</span>
                <strong>{{ t("strataOverview.returnCarryValue", { tier: 1, value: returnChaoticEtherText }) }}</strong>
              </div>

              <div class="travel-readout">
                <span>{{ t("strataOverview.returnResetLabel") }}</span>
                <strong>{{ t("strataOverview.returnResetValue") }}</strong>
              </div>
            </div>

            <div v-else-if="travelDialogTarget === 'dreamSeaFirstReturn'" class="travel-readouts">
              <div class="travel-readout">
                <span>{{ t("strataOverview.returnCarryLabel") }}</span>
                <strong>{{ t("strataOverview.returnCarryValue", { tier: 2, value: returnToFirstChaoticEtherText }) }}</strong>
              </div>

              <div class="travel-readout">
                <span>{{ t("strataOverview.returnSecondResetLabel") }}</span>
                <strong>{{ t("strataOverview.returnSecondResetValue") }}</strong>
              </div>
            </div>

            <p class="travel-note">
              {{ travelDialogNote }}
            </p>

            <div class="travel-actions">
              <button class="travel-button secondary" @click="closeTravelDialog">
                {{ t("strataOverview.travelCancel") }}
              </button>
              <button class="travel-button primary" @click="confirmTravel">
                {{ travelDialogConfirmText }}
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
  min-height: 560px;
}

.depth-map {
  position: relative;
  min-height: 560px;
  overflow: hidden;
  border: 1px solid rgba(71, 91, 145, 0.72);
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 5%, rgba(209, 238, 255, 0.16), transparent 22%),
    linear-gradient(180deg, rgba(17, 30, 53, 0.98) 0%, rgba(12, 20, 40, 0.98) 28%, rgba(24, 14, 45, 0.98) 64%, rgba(8, 8, 28, 0.98) 100%);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.34),
    inset 0 0 42px rgba(128, 154, 255, 0.08);
  isolation: isolate;
}

.depth-map::before {
  content: "";
  position: absolute;
  inset: 22% 0 0;
  background:
    linear-gradient(180deg, rgba(136, 207, 255, 0.24), transparent 16%),
    linear-gradient(125deg, transparent 0 44%, rgba(196, 149, 255, 0.12) 45% 48%, transparent 49%),
    linear-gradient(58deg, transparent 0 41%, rgba(99, 242, 217, 0.1) 42% 46%, transparent 47%);
  clip-path: polygon(6% 0, 94% 0, 82% 100%, 18% 100%);
  opacity: 0.85;
  z-index: -1;
}

.depth-map::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 0 12%, rgba(218, 235, 255, 0.08) 13%, transparent 14% 86%, rgba(218, 235, 255, 0.08) 87%, transparent 88%),
    repeating-linear-gradient(180deg, transparent 0 42px, rgba(255, 255, 255, 0.035) 43px 44px);
  mask-image: linear-gradient(180deg, transparent 0%, #000 14%, #000 92%, transparent 100%);
  pointer-events: none;
}

.skyline {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 18%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 244, 255, 0.72), transparent);
  box-shadow: 0 0 18px rgba(156, 214, 255, 0.46);
}

.depth-band {
  position: absolute;
  left: 50%;
  top: var(--band-top);
  width: var(--band-width);
  height: 12%;
  transform: translateX(-50%);
  border: 1px solid rgba(126, 148, 221, 0.2);
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent, rgba(120, 190, 255, 0.06), transparent),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);
  opacity: calc(0.48 - var(--band-index) * 0.045);
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
  left: 50%;
  top: 10%;
  width: 96px;
  aspect-ratio: 1;
  transform: translateX(-50%);
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #f7fbff;
  cursor: pointer;
  font: inherit;
}

.dream-sea-node {
  top: 42%;
}

.dream-sea-second-node {
  top: 72%;
}

.stratum-node:disabled {
  cursor: not-allowed;
}

.node-orbit {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(210, 234, 255, 0.62);
  border-radius: 50%;
  background:
    conic-gradient(from 18deg, transparent, rgba(121, 209, 255, 0.34), transparent 34%, rgba(225, 174, 255, 0.32), transparent 68%, rgba(129, 255, 210, 0.26), transparent),
    radial-gradient(circle, rgba(240, 249, 255, 0.18) 0 22%, transparent 58%);
  box-shadow:
    0 0 28px rgba(127, 199, 255, 0.28),
    inset 0 0 24px rgba(255, 255, 255, 0.08);
  animation: node-orbit 14s linear infinite;
}

.node-core {
  position: absolute;
  inset: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 26%, rgba(255, 255, 255, 0.32), transparent 30%),
    linear-gradient(180deg, rgba(87, 134, 184, 0.95), rgba(23, 46, 83, 0.95));
  box-shadow:
    inset 0 0 24px rgba(255, 255, 255, 0.12),
    0 10px 24px rgba(0, 0, 0, 0.28);
}

.node-title {
  font-size: 0.94rem;
  font-weight: 800;
  color: #ffffff;
}

.node-state {
  padding: 2px 7px;
  border: 1px solid rgba(220, 243, 255, 0.42);
  border-radius: 999px;
  background: rgba(10, 22, 43, 0.62);
  color: #c9edff;
  font-size: 0.68rem;
  font-weight: 700;
}

.stratum-node:hover .node-orbit {
  box-shadow:
    0 0 34px rgba(149, 218, 255, 0.44),
    inset 0 0 26px rgba(255, 255, 255, 0.1);
}

.dream-sea-node .node-orbit {
  border-color: rgba(221, 213, 255, 0.62);
  background:
    conic-gradient(from 80deg, transparent, rgba(219, 121, 255, 0.34), transparent 28%, rgba(86, 229, 255, 0.28), transparent 62%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(circle, rgba(247, 240, 255, 0.15) 0 20%, transparent 58%);
  box-shadow:
    0 0 28px rgba(188, 119, 255, 0.24),
    inset 0 0 24px rgba(255, 255, 255, 0.08);
}

.dream-sea-node .node-core {
  background:
    radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(180deg, rgba(93, 72, 146, 0.95), rgba(27, 24, 73, 0.96));
}

.dream-sea-second-node .node-orbit {
  border-color: rgba(255, 205, 156, 0.56);
  background:
    conic-gradient(from 140deg, transparent, rgba(255, 151, 86, 0.32), transparent 26%, rgba(176, 96, 255, 0.3), transparent 58%, rgba(102, 238, 255, 0.22), transparent),
    radial-gradient(circle, rgba(255, 226, 201, 0.13) 0 19%, transparent 58%);
  box-shadow:
    0 0 30px rgba(255, 145, 82, 0.2),
    inset 0 0 24px rgba(255, 255, 255, 0.08);
}

.dream-sea-second-node .node-core {
  background:
    radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.26), transparent 30%),
    linear-gradient(180deg, rgba(126, 62, 110, 0.95), rgba(35, 19, 64, 0.96));
}

.travel-dialog-backdrop {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 45%, rgba(151, 209, 255, 0.16), transparent 30%),
    rgba(3, 6, 18, 0.64);
  backdrop-filter: blur(5px);
}

.travel-dialog {
  position: relative;
  width: min(430px, 100%);
  overflow: hidden;
  padding: 24px;
  border: 1px solid rgba(198, 224, 255, 0.62);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(19, 27, 54, 0.97) 0%, rgba(10, 12, 31, 0.98) 100%);
  box-shadow:
    0 18px 54px rgba(0, 0, 0, 0.44),
    0 0 34px rgba(132, 201, 255, 0.18),
    inset 0 0 26px rgba(210, 231, 255, 0.06);
  color: #eef5ff;
  text-align: left;
}

.travel-dialog-glow {
  position: absolute;
  inset: -35% 20% auto;
  height: 130px;
  background: radial-gradient(circle, rgba(157, 217, 255, 0.24), transparent 62%);
  pointer-events: none;
}

.travel-dialog-kicker {
  position: relative;
  color: #9fe9ff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.travel-dialog-title {
  position: relative;
  margin: 6px 0 8px;
  color: #ffffff;
  font-family: "Georgia", "Times New Roman", "Noto Serif SC", serif;
  font-size: 1.5rem;
  line-height: 1.2;
}

.travel-dialog-copy,
.travel-note {
  position: relative;
  margin: 0;
  color: #b7c4e7;
  font-size: 0.9rem;
  line-height: 1.5;
}

.travel-readouts {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 18px 0 12px;
}

.travel-readout {
  min-height: 74px;
  padding: 12px;
  border: 1px solid rgba(126, 168, 232, 0.34);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(26, 43, 75, 0.72), rgba(12, 20, 41, 0.82));
  box-shadow: inset 0 0 18px rgba(150, 201, 255, 0.05);
}

.travel-readout span {
  display: block;
  color: #8fa1cc;
  font-size: 0.72rem;
  font-weight: 700;
}

.travel-readout strong {
  display: block;
  margin-top: 8px;
  color: #f7fbff;
  font-size: 1rem;
  font-weight: 850;
}

.travel-actions {
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.travel-button {
  min-width: 92px;
  height: 38px;
  border: 1px solid rgba(150, 183, 237, 0.58);
  border-radius: 6px;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    filter 0.15s ease,
    border-color 0.15s ease;
}

.travel-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.travel-button.secondary {
  background: rgba(12, 20, 39, 0.86);
  color: #c8d5f6;
}

.travel-button.primary {
  border-color: rgba(159, 235, 255, 0.74);
  background: linear-gradient(180deg, #8de9ff 0%, #4d86ff 100%);
  color: #031226;
  box-shadow: 0 0 20px rgba(107, 207, 255, 0.24);
}

.travel-dialog-fade-enter-active {
  animation: travel-dialog-fade-in 0.16s ease-out;
}

.travel-dialog-fade-leave-active {
  transition: opacity 0.12s ease;
}

.travel-dialog-fade-enter-from,
.travel-dialog-fade-leave-to {
  opacity: 0;
}

@keyframes travel-dialog-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes node-orbit {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes shard-glimmer {
  0%,
  100% {
    opacity: 0.24;
  }

  50% {
    opacity: 0.56;
  }
}

@media (max-width: 720px) {
  .strata-overview {
    width: 100%;
    min-height: 500px;
  }

  .depth-map {
    min-height: 500px;
  }

  .stratum-node {
    width: 86px;
  }

  .travel-readouts {
    grid-template-columns: 1fr;
  }
}
</style>
