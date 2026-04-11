<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import { N, ZERO, TEN, min, max, lte, log10, pow } from "@/engine/math/num";
import { getActiveStratum } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const SLIDER_MAX = 1000;
const SPEED_MAX = N(1e4);

const activeStratum = computed(() => getActiveStratum(props.game.state));

function sliderToSpeed(position: number) {
  if (position <= 0) return ZERO;

  const exponent = ((position - 1) / (SLIDER_MAX - 1)) * 4;
  return pow(TEN, exponent);
}

function speedToSlider(speed: ReturnType<typeof N>): number {
  if (lte(speed, ZERO)) return 0;

  const clamped = min(max(speed, N(1)), SPEED_MAX);
  const exponent = log10(clamped).toNumber();

  return Math.round(1 + (exponent / 4) * (SLIDER_MAX - 1));
}

const sliderValue = computed(() => {
  return speedToSlider(activeStratum.value.stratumSpeed);
});

const speedText = computed(() => {
  return format(activeStratum.value.stratumSpeed);
});

function onSliderInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const position = Number(target.value);

  activeStratum.value.stratumSpeed = sliderToSpeed(position);
}

function setPreset(value: number) {
  activeStratum.value.stratumSpeed = N(value);
}

function setPaused() {
  activeStratum.value.stratumSpeed = ZERO;
}
</script>

<template>
  <div class="speed-page">
    <div class="speed-card">
      <div class="speed-title">{{ t("stratumSpeed.title") }}</div>
      <div class="speed-main-line">
        {{ t("stratumSpeed.currentSpeed") }}: <span class="speed-value">×{{ speedText }}</span>
      </div>
      <div class="speed-sub-line">
        {{ t("stratumSpeed.sliderHint") }}
      </div>

      <div class="slider-wrap">
        <input
          class="speed-slider"
          type="range"
          min="0"
          :max="SLIDER_MAX"
          :value="sliderValue"
          @input="onSliderInput"
        />

        <div class="slider-labels">
          <span>0</span>
          <span>1</span>
          <span>10</span>
          <span>100</span>
          <span>1e3</span>
          <span>1e4</span>
        </div>
      </div>

      <div class="preset-row">
        <button class="preset-button" @click="setPaused">{{ t("common.pause") }}</button>
        <button class="preset-button" @click="setPreset(1)">×1</button>
        <button class="preset-button" @click="setPreset(10)">×10</button>
        <button class="preset-button" @click="setPreset(100)">×100</button>
        <button class="preset-button" @click="setPreset(10000)">×1e4</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.speed-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.speed-card {
  width: min(920px, 100%);
  padding: 22px 24px;
  border: 1px solid #253150;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(17, 25, 45, 0.96) 0%, rgba(10, 16, 34, 0.98) 100%);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 0 18px rgba(115, 96, 212, 0.06);
  color: #e9ecff;
}

.speed-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f3f5ff;
}

.speed-main-line {
  margin-top: 10px;
  font-size: 1.08rem;
  color: #dfe6ff;
}

.speed-value {
  font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.speed-sub-line {
  margin-top: 6px;
  color: #aeb8da;
  font-size: 0.94rem;
}

.slider-wrap {
  margin-top: 24px;
}

.speed-slider {
  width: 100%;
}

.slider-labels {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  font-size: 0.88rem;
  color: #98a7d3;
}

.slider-labels span:nth-child(1) {
  text-align: left;
}

.slider-labels span:nth-child(2),
.slider-labels span:nth-child(3),
.slider-labels span:nth-child(4),
.slider-labels span:nth-child(5) {
  text-align: center;
}

.slider-labels span:nth-child(6) {
  text-align: right;
}

.preset-row {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preset-button {
  min-width: 86px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #324773;
  border-radius: 8px;
  background: linear-gradient(180deg, #18233f 0%, #111a2f 100%);
  color: #edf1ff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.preset-button:hover {
  transform: translateY(-1px);
  border-color: #6d89df;
  background: linear-gradient(180deg, #22345f 0%, #182642 100%);
}
</style>
