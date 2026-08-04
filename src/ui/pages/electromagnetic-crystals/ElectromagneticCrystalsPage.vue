<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  ELECTROMAGNETIC_JUDGE_LINE_X,
  ELECTROMAGNETIC_MAX_INITIAL_SPEED,
  ELECTROMAGNETIC_MAX_ELECTRIC_FIELD_STRENGTH,
  ELECTROMAGNETIC_MAX_MAGNETIC_FIELD_STRENGTH,
  ELECTROMAGNETIC_MIN_INITIAL_SPEED,
  ELECTROMAGNETIC_MIN_ELECTRIC_FIELD_STRENGTH,
  ELECTROMAGNETIC_MIN_MAGNETIC_FIELD_STRENGTH,
  ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND,
  ELECTROMAGNETIC_POWER_PER_CROSSING,
  ensureElectromagneticCrystalsState,
  getElectromagneticPower,
  resetElectromagneticParticle,
  setElectricFieldDirection,
  setElectricFieldStrength,
  setElectromagneticInitialDirection,
  setElectromagneticInitialSpeed,
  setMagneticFieldStrength,
} from "@/engine/electromagnetic-crystals";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const activeStratum = computed(() => getActiveStratum(props.game.state));
const electromagnetic = computed(() => ensureElectromagneticCrystalsState(activeStratum.value));
const powerText = computed(() => format(getElectromagneticPower(activeStratum.value)));
const decayText = format(ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND);
const crossingGainText = format(ELECTROMAGNETIC_POWER_PER_CROSSING);
const fieldCells = Array.from({ length: 25 }, (_, index) => index);

const particleStyle = computed(() => ({
  left: `${electromagnetic.value.particle.x * 100}%`,
  top: `${electromagnetic.value.particle.y * 100}%`,
}));

const electricArrowStyle = computed(() => ({
  transform: `translate(-50%, -50%) rotate(${electromagnetic.value.electricFieldDirectionDeg}deg)`,
}));

const velocityText = computed(() => {
  const particle = electromagnetic.value.particle;
  return Math.hypot(particle.velocityX, particle.velocityY).toFixed(3);
});

function inputValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}

function onElectricDirectionInput(event: Event): void {
  setElectricFieldDirection(activeStratum.value, inputValue(event));
}

function onElectricStrengthInput(event: Event): void {
  setElectricFieldStrength(activeStratum.value, inputValue(event));
}

function onMagneticStrengthInput(event: Event): void {
  setMagneticFieldStrength(activeStratum.value, inputValue(event));
}

function onInitialSpeedInput(event: Event): void {
  setElectromagneticInitialSpeed(activeStratum.value, inputValue(event));
}

function onInitialDirectionInput(event: Event): void {
  setElectromagneticInitialDirection(activeStratum.value, inputValue(event));
}
</script>

<template>
  <section class="electromagnetic-page">
    <header class="power-header">
      <div>
        <div class="eyebrow">{{ t("electromagneticCrystals.resourceName") }}</div>
        <div class="power-value">{{ powerText }}</div>
      </div>
      <div class="decay-note">
        {{ t("electromagneticCrystals.powerRule", { gain: crossingGainText, divisor: decayText }) }}
      </div>
    </header>

    <div class="demo-layout">
      <div class="arena-scroll">
        <div class="arena" role="img" :aria-label="t('electromagneticCrystals.arenaLabel')">
          <div class="field-grid" aria-hidden="true">
            <span
              v-for="cell in fieldCells"
              :key="cell"
              class="magnetic-glyph"
            >{{ electromagnetic.magneticFieldStrength > 0
              ? "⊗"
              : electromagnetic.magneticFieldStrength < 0
                ? "⊙"
                : "·" }}</span>
          </div>

          <div
            v-for="lineX in ELECTROMAGNETIC_JUDGE_LINE_X"
            :key="lineX"
            class="judge-line"
            :style="{ left: `${lineX * 100}%` }"
          />

          <div class="electric-arrow" :style="electricArrowStyle" aria-hidden="true">
            <span class="arrow-shaft" />
            <span class="arrow-head">▶</span>
            <span class="arrow-label">E</span>
          </div>

          <div class="particle" :style="particleStyle" aria-hidden="true">+</div>
          <div class="wrap-label wrap-horizontal">↔</div>
          <div class="wrap-label wrap-vertical">↕</div>
        </div>
      </div>

      <aside class="controls-panel">
        <div class="control-group">
          <div class="control-heading">{{ t("electromagneticCrystals.electricField") }}</div>
          <label>
            <span>{{ t("electromagneticCrystals.direction") }}</span>
            <output>{{ electromagnetic.electricFieldDirectionDeg.toFixed(0) }}°</output>
          </label>
          <input
            type="range"
            min="0"
            max="359"
            step="1"
            :value="electromagnetic.electricFieldDirectionDeg"
            @input="onElectricDirectionInput"
          >

          <label>
            <span>{{ t("electromagneticCrystals.strength") }}</span>
            <output>×{{ electromagnetic.electricFieldStrength.toFixed(2) }}</output>
          </label>
          <input
            type="range"
            :min="ELECTROMAGNETIC_MIN_ELECTRIC_FIELD_STRENGTH"
            :max="ELECTROMAGNETIC_MAX_ELECTRIC_FIELD_STRENGTH"
            step="0.05"
            :value="electromagnetic.electricFieldStrength"
            @input="onElectricStrengthInput"
          >
        </div>

        <div class="control-group">
          <div class="control-heading">{{ t("electromagneticCrystals.magneticField") }}</div>
          <label>
            <span>{{ t("electromagneticCrystals.strength") }}</span>
            <output>{{ electromagnetic.magneticFieldStrength.toFixed(2) }}</output>
          </label>
          <input
            class="magnetic-strength-slider"
            type="range"
            :min="ELECTROMAGNETIC_MIN_MAGNETIC_FIELD_STRENGTH"
            :max="ELECTROMAGNETIC_MAX_MAGNETIC_FIELD_STRENGTH"
            step="0.05"
            :value="electromagnetic.magneticFieldStrength"
            @input="onMagneticStrengthInput"
          >
          <div class="field-axis-labels">
            <span>⊙ {{ t("electromagneticCrystals.outOfPlane") }}</span>
            <span>0</span>
            <span>{{ t("electromagneticCrystals.intoPlane") }} ⊗</span>
          </div>
        </div>

        <div class="control-group launch-group">
          <div class="control-heading">{{ t("electromagneticCrystals.initialConditions") }}</div>
          <label>
            <span>{{ t("electromagneticCrystals.initialSpeed") }}</span>
            <output>{{ electromagnetic.initialSpeed.toFixed(2) }}</output>
          </label>
          <input
            type="range"
            :min="ELECTROMAGNETIC_MIN_INITIAL_SPEED"
            :max="ELECTROMAGNETIC_MAX_INITIAL_SPEED"
            step="0.01"
            :value="electromagnetic.initialSpeed"
            @input="onInitialSpeedInput"
          >

          <label>
            <span>{{ t("electromagneticCrystals.initialDirection") }}</span>
            <output>{{ electromagnetic.initialDirectionDeg.toFixed(0) }}°</output>
          </label>
          <input
            type="range"
            min="0"
            max="359"
            step="1"
            :value="electromagnetic.initialDirectionDeg"
            @input="onInitialDirectionInput"
          >

          <button class="launch-button" @click="resetElectromagneticParticle(activeStratum)">
            {{ t("electromagneticCrystals.launch") }}
          </button>
        </div>

        <div class="telemetry">
          <span>{{ t("electromagneticCrystals.currentSpeed") }}</span>
          <strong>{{ velocityText }}</strong>
        </div>

        <p class="hint">{{ t("electromagneticCrystals.wrapNote") }}</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.electromagnetic-page {
  width: min(980px, 100%);
  margin: 0 auto;
  color: #daf8ff;
}

.power-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
  padding: 14px 18px;
  border: 1px solid rgba(85, 224, 255, 0.5);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(8, 34, 50, 0.96), rgba(10, 17, 32, 0.98));
  box-shadow: 0 0 24px rgba(52, 202, 255, 0.12);
  text-align: left;
}

.eyebrow {
  color: #7fdcf1;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.power-value {
  margin-top: 2px;
  color: #f0fdff;
  font-family: var(--font-number);
  font-size: 1.8rem;
  font-weight: 900;
  text-shadow: 0 0 18px rgba(104, 231, 255, 0.45);
}

.decay-note { color: #8fb9c5; font-size: 0.82rem; }

.demo-layout {
  display: grid;
  grid-template-columns: 540px minmax(280px, 1fr);
  align-items: start;
  gap: 18px;
}

.arena-scroll { overflow: auto; padding: 8px; }

.arena {
  position: relative;
  width: 520px;
  height: 520px;
  overflow: hidden;
  border: 2px solid #70dff7;
  border-radius: 5px;
  background:
    linear-gradient(rgba(79, 185, 214, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 185, 214, 0.06) 1px, transparent 1px),
    radial-gradient(circle at center, #10243a 0%, #070f20 72%);
  background-size: 26px 26px, 26px 26px, auto;
  box-shadow: inset 0 0 55px rgba(36, 191, 255, 0.1), 0 0 28px rgba(45, 190, 236, 0.12);
}

.field-grid {
  position: absolute;
  inset: 25px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  place-items: center;
  color: rgba(98, 205, 231, 0.2);
  font-size: 1.1rem;
}

.judge-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-1px);
  background: linear-gradient(180deg, #ffdb68, #fff5ba 45%, #ffbd3f);
  box-shadow: 0 0 9px rgba(255, 212, 80, 0.82);
}

.electric-arrow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 130px;
  height: 28px;
  transform-origin: center;
  opacity: 0.52;
  pointer-events: none;
}

.arrow-shaft {
  position: absolute;
  left: 0;
  right: 15px;
  top: 13px;
  height: 2px;
  background: #78edff;
  box-shadow: 0 0 8px #42dfff;
}

.arrow-head { position: absolute; right: 0; top: 2px; color: #8ff3ff; }
.arrow-label { position: absolute; left: 48px; top: -10px; color: #a7f6ff; font-weight: 900; }

.particle {
  position: absolute;
  z-index: 4;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  transform: translate(-50%, -50%);
  border: 2px solid #fff7dc;
  border-radius: 50%;
  background: #ffb43e;
  color: #3a1a00;
  font-size: 0.82rem;
  font-weight: 1000;
  box-shadow: 0 0 10px #ffce69, 0 0 22px rgba(255, 151, 42, 0.72);
}

.wrap-label {
  position: absolute;
  z-index: 5;
  color: rgba(150, 236, 255, 0.7);
  font-weight: 900;
  pointer-events: none;
}
.wrap-horizontal { left: 50%; bottom: 5px; transform: translateX(-50%); }
.wrap-vertical { right: 7px; top: 50%; transform: translateY(-50%); }

.controls-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(91, 166, 195, 0.42);
  border-radius: 8px;
  background: rgba(8, 18, 31, 0.95);
  text-align: left;
}

.control-group {
  padding: 12px;
  border: 1px solid rgba(65, 128, 151, 0.38);
  border-radius: 6px;
  background: rgba(16, 35, 49, 0.72);
}

.control-heading { margin-bottom: 10px; color: #c5f7ff; font-weight: 850; }
.control-group label, .telemetry { display: flex; justify-content: space-between; gap: 12px; color: #91bdc9; font-size: 0.82rem; }
.control-group output, .telemetry strong { color: #effcff; font-family: var(--font-number); }
.control-group input[type="range"] { width: 100%; margin: 8px 0 12px; accent-color: #55d9f6; }
.control-group input[type="range"]:last-child { margin-bottom: 0; }

.field-axis-labels {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  margin-top: -5px;
  color: #789fab;
  font-size: 0.7rem;
}

.field-axis-labels span:nth-child(2) { color: #dffbff; text-align: center; }
.field-axis-labels span:last-child { text-align: right; }
.magnetic-strength-slider { accent-color: #a98cff !important; }

.direction-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.direction-buttons button, .launch-button {
  min-height: 38px;
  border: 1px solid #356678;
  border-radius: 5px;
  background: #142c3b;
  color: #9fc6d1;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}
.direction-buttons button.active {
  border-color: #84e9ff;
  background: #205e72;
  color: #f2fdff;
  box-shadow: 0 0 12px rgba(75, 222, 255, 0.2);
}
.launch-button { width: 100%; border-color: #d7b35c; background: linear-gradient(#f0c969, #a56b21); color: #231200; }
.telemetry { padding: 0 4px; }
.hint { margin: 0; color: #688e99; font-size: 0.78rem; line-height: 1.5; }

@media (max-width: 900px) {
  .demo-layout { grid-template-columns: 1fr; }
  .arena-scroll { width: 100%; box-sizing: border-box; }
}
</style>
