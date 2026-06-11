<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import { mul } from "@/engine/math/num";
import {
  canUnlockLift,
  getLiftUnlockProgress,
  getLiftUnlockRequirement,
  unlockLift,
} from "@/engine/strata/lift";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const lift = computed(() => props.game.state.lift);
const isUnlocked = computed(() => lift.value.isLiftUnlocked);
const activeStratumId = computed(() => props.game.state.activeStratumId);
const lightThreads = Array.from({ length: 10 }, (_, index) => index);
const unlockProgress = computed(() => getLiftUnlockProgress(props.game.state));
const unlockProgressPercentText = computed(() => {
  return `${format(mul(unlockProgress.value, 100))}%`;
});
const unlockProgressStyle = computed(() => ({
  width: `${unlockProgress.value.mul(100).toNumber()}%`,
}));
const unlockRequirementText = computed(() => format(getLiftUnlockRequirement()));
const liftCanUnlock = computed(() => canUnlockLift(props.game.state));

function onUnlockLift() {
  unlockLift(props.game.state);
}
</script>

<template>
  <div class="lift-page-wrap">
    <div class="lift-page">
      <div class="thread-field" aria-hidden="true">
        <span
          v-for="index in lightThreads"
          :key="index"
          class="light-thread"
          :style="{
            '--thread-left': `${8 + index * 9}%`,
            '--thread-delay': `${index * -0.55}s`,
          }"
        />
      </div>

      <div class="lift-shaft" aria-hidden="true">
        <div class="shaft-rune-line shaft-rune-line-left" />
        <div class="shaft-rune-line shaft-rune-line-right" />
        <div class="lift-cabin">
          <div class="cabin-door cabin-door-left" />
          <div class="cabin-door cabin-door-right" />
          <div class="cabin-light" />
        </div>
      </div>

      <div v-if="isUnlocked" class="lift-status">
        <div class="status-kicker">{{ t("lift.status") }}</div>
        <div class="status-title">{{ t("lift.ready") }}</div>
      </div>

      <div v-else class="locked-banner">
        <div class="locked-text">{{ t("lift.locked") }}</div>
      </div>
    </div>

    <div v-if="!isUnlocked" class="unlock-area">
      <div class="unlock-panel">
        <div class="unlock-header">
          <span>{{ t("lift.unlockProgress") }}</span>
          <span>{{ t("lift.unlockRequirement", { value: unlockRequirementText }) }}</span>
        </div>
        <div class="unlock-progress">
          <div class="unlock-progress-fill" :style="unlockProgressStyle" />
          <div class="unlock-progress-text">{{ unlockProgressPercentText }}</div>
        </div>
        <button
          class="unlock-button"
          :disabled="!liftCanUnlock"
          @click="onUnlockLift"
        >
          {{ t("lift.unlock") }}
        </button>
      </div>
    </div>

    <div v-else class="lift-detail-area">
      <div class="status-grid">
        <div class="status-cell">
          <div class="status-label">{{ t("lift.currentPosition") }}</div>
            <div class="status-value">{{ lift.currentLiftPosition }}</div>
          </div>
          <div class="status-cell">
            <div class="status-label">{{ t("lift.activeStratum") }}</div>
          <div class="status-value">{{ activeStratumId }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lift-page-wrap {
  width: min(980px, 96%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.lift-page {
  position: relative;
  width: 100%;
  min-height: 500px;
  overflow: hidden;
  border: 1px solid #3a4d82;
  border-radius: 8px;
  background:
    linear-gradient(115deg, rgba(15, 26, 52, 0.96) 0%, rgba(20, 14, 44, 0.98) 52%, rgba(7, 21, 36, 0.98) 100%),
    repeating-linear-gradient(90deg, rgba(190, 222, 255, 0.08) 0 1px, transparent 1px 46px);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.34),
    inset 0 0 38px rgba(125, 151, 255, 0.1);
  isolation: isolate;
}

.lift-page::before {
  content: "";
  position: absolute;
  inset: -35%;
  z-index: -2;
  background:
    linear-gradient(115deg, transparent 10%, rgba(109, 202, 255, 0.2) 18%, transparent 31%),
    linear-gradient(72deg, transparent 18%, rgba(213, 145, 255, 0.17) 37%, transparent 55%),
    linear-gradient(142deg, transparent 28%, rgba(129, 255, 213, 0.14) 49%, transparent 72%);
  background-size: 190% 190%;
  filter: blur(24px);
  opacity: 0.92;
  animation: aurora-flow 11s ease-in-out infinite alternate;
}

.lift-page::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    repeating-linear-gradient(0deg, transparent 0 34px, rgba(214, 235, 255, 0.09) 35px 36px),
    repeating-linear-gradient(90deg, transparent 0 58px, rgba(174, 155, 255, 0.08) 59px 60px);
  mask-image: linear-gradient(180deg, transparent 0%, #000 20%, #000 76%, transparent 100%);
  opacity: 0.72;
  animation: grid-drift 8s linear infinite;
}

.thread-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.light-thread {
  position: absolute;
  top: -35%;
  left: var(--thread-left);
  width: 2px;
  height: 170%;
  background: linear-gradient(180deg, transparent, rgba(223, 245, 255, 0.7), transparent);
  opacity: 0.22;
  transform: rotate(9deg);
  animation: thread-glide 5.8s ease-in-out infinite;
  animation-delay: var(--thread-delay);
}

.lift-shaft {
  position: absolute;
  inset: 54px 13% 38px;
  border-left: 1px solid rgba(154, 183, 255, 0.42);
  border-right: 1px solid rgba(154, 183, 255, 0.42);
  background:
    linear-gradient(90deg, rgba(110, 145, 255, 0.11), transparent 16%, transparent 84%, rgba(110, 145, 255, 0.11)),
    linear-gradient(180deg, transparent 0%, rgba(222, 244, 255, 0.12) 48%, transparent 100%);
}

.shaft-rune-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  background: repeating-linear-gradient(
    180deg,
    rgba(220, 238, 255, 0.18) 0 2px,
    transparent 2px 18px,
    rgba(184, 148, 255, 0.18) 18px 20px,
    transparent 20px 42px
  );
  opacity: 0.75;
  animation: glyph-rise 7s linear infinite;
}

.shaft-rune-line-left {
  left: 18%;
}

.shaft-rune-line-right {
  right: 18%;
  animation-delay: -3.5s;
}

.lift-cabin {
  position: absolute;
  left: 50%;
  bottom: 44px;
  width: min(280px, 46%);
  aspect-ratio: 0.72;
  transform: translateX(-50%);
  border: 1px solid rgba(220, 238, 255, 0.58);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(26, 43, 82, 0.86) 0%, rgba(46, 29, 86, 0.88) 50%, rgba(16, 52, 77, 0.86) 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 42%);
  box-shadow:
    0 0 26px rgba(126, 193, 255, 0.22),
    inset 0 0 28px rgba(223, 238, 255, 0.09);
  animation: cabin-float 4.8s ease-in-out infinite;
}

.cabin-door {
  position: absolute;
  top: 15%;
  bottom: 12%;
  width: 43%;
  border: 1px solid rgba(214, 235, 255, 0.2);
  background:
    linear-gradient(120deg, transparent 18%, rgba(255, 255, 255, 0.16) 28%, transparent 38%),
    linear-gradient(180deg, rgba(20, 35, 69, 0.78), rgba(11, 23, 48, 0.92));
}

.cabin-door-left {
  left: 7%;
}

.cabin-door-right {
  right: 7%;
}

.cabin-light {
  position: absolute;
  left: 18%;
  right: 18%;
  top: 8%;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(235, 250, 255, 0.92), transparent);
  box-shadow: 0 0 18px rgba(176, 222, 255, 0.7);
  animation: light-breathe 2.6s ease-in-out infinite;
}

.locked-banner,
.lift-status {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.unlock-area {
  width: min(680px, 96%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lift-detail-area {
  width: min(680px, 96%);
  display: flex;
  justify-content: center;
}

.locked-text {
  padding: 16px 28px;
  border: 1px solid rgba(255, 188, 228, 0.34);
  border-radius: 8px;
  background: rgba(20, 12, 34, 0.68);
  color: #ffd7ee;
  font-size: 1.62rem;
  font-weight: 800;
  letter-spacing: 0;
  text-shadow: 0 0 18px rgba(255, 127, 205, 0.42);
  box-shadow:
    0 0 30px rgba(177, 85, 255, 0.18),
    inset 0 0 22px rgba(255, 188, 228, 0.08);
}

.unlock-panel {
  width: min(620px, 100%);
  margin-top: 22px;
  padding: 18px;
  border: 1px solid rgba(137, 176, 255, 0.34);
  border-radius: 8px;
  background: rgba(8, 17, 35, 0.72);
  box-shadow:
    0 0 28px rgba(82, 145, 255, 0.16),
    inset 0 0 24px rgba(156, 185, 255, 0.08);
}

.unlock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #b9c8ec;
  font-size: 0.9rem;
  line-height: 1.4;
}

.unlock-progress {
  position: relative;
  height: 28px;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid rgba(209, 230, 255, 0.32);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(6, 13, 29, 0.92), rgba(16, 24, 49, 0.9)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 24px);
  box-shadow: inset 0 0 18px rgba(10, 15, 32, 0.9);
}

.unlock-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  min-width: 0;
  border-radius: 7px;
  background:
    linear-gradient(90deg, rgba(94, 211, 255, 0.86), rgba(177, 138, 255, 0.92) 55%, rgba(255, 186, 229, 0.9)),
    repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.22) 0 8px, transparent 8px 16px);
  box-shadow:
    0 0 20px rgba(116, 194, 255, 0.48),
    inset 0 0 14px rgba(255, 255, 255, 0.18);
  transition: width 0.2s ease;
}

.unlock-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.75);
}

.unlock-button {
  min-width: 150px;
  height: 42px;
  margin-top: 14px;
  padding: 0 18px;
  border: 1px solid rgba(185, 214, 255, 0.52);
  border-radius: 8px;
  background: linear-gradient(180deg, #24437a 0%, #172b55 100%);
  color: #f7fbff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 0 18px rgba(88, 177, 255, 0.24),
    inset 0 0 18px rgba(255, 255, 255, 0.08);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease,
    opacity 0.15s ease;
}

.unlock-button:hover:not(:disabled) {
  border-color: rgba(235, 248, 255, 0.86);
  box-shadow:
    0 0 26px rgba(121, 207, 255, 0.42),
    inset 0 0 22px rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.unlock-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  filter: grayscale(0.32);
}

.status-kicker {
  color: #a9dfff;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.status-title {
  margin-top: 8px;
  color: #f6fbff;
  font-size: 1.75rem;
  font-weight: 800;
  text-shadow: 0 0 18px rgba(133, 205, 255, 0.44);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 12px;
  width: min(560px, 100%);
  margin-top: 24px;
}

.status-cell {
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(155, 184, 255, 0.32);
  border-radius: 8px;
  background: rgba(10, 19, 38, 0.72);
  box-shadow: inset 0 0 18px rgba(116, 143, 255, 0.08);
}

.status-label {
  color: #94a9d5;
  font-size: 0.84rem;
}

.status-value {
  margin-top: 8px;
  color: #ffffff;
  font-size: 1.08rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

@keyframes aurora-flow {
  from {
    transform: translateX(-4%) translateY(2%) rotate(-3deg);
    background-position: 0% 40%;
  }

  to {
    transform: translateX(4%) translateY(-2%) rotate(3deg);
    background-position: 100% 60%;
  }
}

@keyframes grid-drift {
  from {
    background-position: 0 0, 0 0;
  }

  to {
    background-position: 0 72px, 90px 0;
  }
}

@keyframes thread-glide {
  0%,
  100% {
    opacity: 0.14;
    transform: translateY(-3%) rotate(9deg);
  }

  50% {
    opacity: 0.36;
    transform: translateY(3%) rotate(9deg);
  }
}

@keyframes glyph-rise {
  from {
    background-position-y: 0;
  }

  to {
    background-position-y: -84px;
  }
}

@keyframes cabin-float {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}

@keyframes light-breathe {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .lift-page-wrap {
    width: 100%;
  }

  .lift-page {
    width: 100%;
    min-height: 440px;
  }

  .lift-shaft {
    inset: 48px 8% 34px;
  }

  .locked-banner,
  .lift-status {
    padding: 24px 16px;
  }

  .locked-text {
    font-size: 1.36rem;
  }

  .unlock-header {
    flex-direction: column;
    align-items: center;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
