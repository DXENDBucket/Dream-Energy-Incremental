<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameStore } from "@/store/gameStore";

const props = defineProps<{
  game: GameStore;
}>();

const { t } = useI18n();
const progress = computed(() => props.game.offlineProgress);
const progressPercent = computed(() => {
  if (progress.value.totalSec <= 0) return 100;
  return Math.max(0, Math.min(100, (progress.value.simulatedSec / progress.value.totalSec) * 100));
});

function formatDuration(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) {
    return t("offlineProgress.duration.seconds", { value: 0 });
  }

  const roundedSec = Math.max(0, Math.floor(totalSec));
  const units = [
    { seconds: 86400, key: "days" },
    { seconds: 3600, key: "hours" },
    { seconds: 60, key: "minutes" },
    { seconds: 1, key: "seconds" },
  ] as const;
  let remainingSec = roundedSec;
  const parts: string[] = [];

  for (const unit of units) {
    const value = Math.floor(remainingSec / unit.seconds);
    if (value <= 0 && parts.length === 0) continue;
    if (value > 0) {
      parts.push(t(`offlineProgress.duration.${unit.key}`, { value }));
      remainingSec -= value * unit.seconds;
    }
    if (parts.length >= 2) break;
  }

  return parts.length > 0
    ? parts.join(" ")
    : t("offlineProgress.duration.seconds", { value: 0 });
}

const totalDurationText = computed(() => formatDuration(progress.value.totalSec));
const remainingDurationText = computed(() => formatDuration(progress.value.remainingSec));
const stepDurationText = computed(() => formatDuration(progress.value.currentStepSec));
const modeText = computed(() => {
  if (progress.value.isSkipping) return t("offlineProgress.mode.skipping");
  if (progress.value.speedUpCount > 0) {
    return t("offlineProgress.mode.accelerated", {
      factor: Math.pow(2, progress.value.speedUpCount),
    });
  }
  return t("offlineProgress.mode.accurate");
});
</script>

<template>
  <Teleport to="body">
    <transition name="offline-fade">
      <div v-if="progress.isActive" class="offline-overlay" role="dialog" aria-modal="true">
        <section class="offline-modal">
          <div class="offline-kicker">{{ t("offlineProgress.kicker") }}</div>
          <h2 class="offline-title">{{ t("offlineProgress.title") }}</h2>
          <p class="offline-description">{{ t("offlineProgress.description") }}</p>

          <div class="offline-time">{{ totalDurationText }}</div>
          <div class="offline-time-label">{{ t("offlineProgress.totalOfflineTime") }}</div>

          <div
            class="offline-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(progressPercent)"
          >
            <div class="offline-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
          </div>
          <div class="offline-progress-percent">{{ progressPercent.toFixed(1) }}%</div>

          <div class="offline-stats">
            <div class="offline-stat">
              <span>{{ t("offlineProgress.remaining") }}</span>
              <strong>{{ remainingDurationText }}</strong>
            </div>
            <div class="offline-stat">
              <span>{{ t("offlineProgress.ticks") }}</span>
              <strong>{{ progress.completedTicks }} / {{ progress.plannedTicks }}</strong>
            </div>
            <div class="offline-stat">
              <span>{{ t("offlineProgress.tickLength") }}</span>
              <strong>{{ stepDurationText }}</strong>
            </div>
            <div class="offline-stat">
              <span>{{ t("offlineProgress.modeLabel") }}</span>
              <strong>{{ modeText }}</strong>
            </div>
          </div>

          <div class="offline-actions">
            <button
              class="offline-button speed-up"
              :disabled="progress.remainingTicks <= 1 || progress.isSkipping"
              type="button"
              @click="props.game.speedUpOfflineProgress"
            >
              <span>{{ t("offlineProgress.speedUp") }}</span>
              <small>{{ t("offlineProgress.speedUpHint") }}</small>
            </button>
            <button
              class="offline-button skip"
              :disabled="progress.isSkipping"
              type="button"
              @click="props.game.skipOfflineProgress"
            >
              <span>{{ t("offlineProgress.skip") }}</span>
              <small>{{ t("offlineProgress.skipHint") }}</small>
            </button>
          </div>

          <p class="offline-warning">{{ t("offlineProgress.warning") }}</p>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.offline-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    radial-gradient(circle at 50% 35%, rgba(105, 145, 255, 0.16), transparent 36%),
    rgba(2, 6, 15, 0.86);
  backdrop-filter: blur(6px);
}

.offline-modal {
  width: min(620px, 100%);
  box-sizing: border-box;
  padding: 26px 28px 22px;
  border: 1px solid rgba(125, 169, 255, 0.58);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(18, 31, 62, 0.98) 0%, rgba(8, 15, 32, 0.99) 100%);
  color: #eef4ff;
  text-align: center;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.58),
    0 0 38px rgba(85, 133, 255, 0.16),
    inset 0 0 26px rgba(120, 161, 255, 0.06);
}

.offline-kicker {
  color: #8faeff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.offline-title {
  margin: 7px 0 0;
  color: #ffffff;
  font-size: 1.55rem;
}

.offline-description {
  margin: 9px auto 0;
  max-width: 500px;
  color: #aebfe8;
  font-size: 0.88rem;
  line-height: 1.5;
}

.offline-time {
  margin-top: 20px;
  color: #ffffff;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  font-size: 2rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px rgba(131, 174, 255, 0.3);
}

.offline-time-label {
  margin-top: 2px;
  color: #8298c8;
  font-size: 0.75rem;
  font-weight: 800;
}

.offline-progress-track {
  height: 14px;
  margin-top: 20px;
  overflow: hidden;
  border: 1px solid rgba(109, 145, 218, 0.58);
  border-radius: 999px;
  background: rgba(3, 9, 21, 0.88);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}

.offline-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #507ee8 0%, #8ab9ff 62%, #d5ebff 100%);
  box-shadow: 0 0 16px rgba(112, 169, 255, 0.58);
  transition: width 0.1s linear;
}

.offline-progress-percent {
  margin-top: 5px;
  color: #cfe0ff;
  font-size: 0.8rem;
  font-weight: 900;
}

.offline-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.offline-stat {
  min-height: 52px;
  padding: 9px 11px;
  border: 1px solid rgba(89, 119, 180, 0.4);
  border-radius: 7px;
  background: rgba(5, 13, 29, 0.56);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.offline-stat span {
  color: #8297c5;
  font-size: 0.7rem;
  font-weight: 800;
}

.offline-stat strong {
  color: #eef5ff;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}

.offline-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.offline-button {
  min-height: 62px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #ffffff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: transform 0.1s ease, filter 0.15s ease, opacity 0.15s ease;
}

.offline-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.offline-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.offline-button small {
  color: rgba(238, 245, 255, 0.74);
  font-size: 0.68rem;
  font-weight: 700;
}

.offline-button.speed-up {
  border: 1px solid rgba(121, 183, 255, 0.74);
  background: linear-gradient(180deg, #346ab5 0%, #234780 100%);
}

.offline-button.skip {
  border: 1px solid rgba(194, 148, 255, 0.66);
  background: linear-gradient(180deg, #6847a4 0%, #402d71 100%);
}

.offline-warning {
  margin: 12px 0 0;
  color: #8296bd;
  font-size: 0.7rem;
  line-height: 1.4;
}

.offline-fade-enter-active,
.offline-fade-leave-active {
  transition: opacity 0.16s ease;
}

.offline-fade-enter-from,
.offline-fade-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .offline-modal {
    padding: 22px 18px 18px;
  }

  .offline-stats,
  .offline-actions {
    grid-template-columns: 1fr;
  }
}
</style>
