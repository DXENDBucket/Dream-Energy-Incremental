<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { DREAM_CRYSTAL_TIERS, type DreamCrystalTier } from "@/engine/math/dream-crystals";
import { format } from "@/engine/math/format";
import type { GameState } from "@/engine/core/state";
import {
  DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC,
  getDreamCrystalAutobuyerRemainingSec,
  isDreamCrystalAutobuyerEnabled,
  toggleDreamCrystalAutobuyer,
} from "@/engine/strata/common/dream-crystals/autobuyers";
import { isDreamCrystalAutobuyerUnlocked } from "@/engine/strata/common/dream-crystals/upgrades";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { getDreamCrystalTitle } from "@/ui/meta/dreamCrystals";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const unlocked = computed(() => isDreamCrystalAutobuyerUnlocked(activeStratum.value));
const remainingText = computed(() => format(getDreamCrystalAutobuyerRemainingSec(activeStratum.value)));
const intervalText = computed(() => format(DREAM_CRYSTAL_AUTOBUYER_INTERVAL_SEC));

const rows = computed(() => {
  return DREAM_CRYSTAL_TIERS.map((tier) => ({
    tier,
    title: getDreamCrystalTitle(t, tier as DreamCrystalTier),
    enabled: isDreamCrystalAutobuyerEnabled(activeStratum.value, tier),
  }));
});

function onToggle(tier: number) {
  toggleDreamCrystalAutobuyer(activeStratum.value, tier);
}
</script>

<template>
  <div class="autobuyers-page">
    <div class="autobuyers-header">
      <div class="autobuyers-title">{{ t("autobuyers.dreamCrystals.title") }}</div>
      <div class="autobuyers-sub">
        {{ t("autobuyers.dreamCrystals.interval", { interval: intervalText, remaining: remainingText }) }}
      </div>
    </div>

    <div class="autobuyer-grid">
      <button
        v-for="row in rows"
        :key="row.tier"
        class="autobuyer-button"
        :class="{ enabled: row.enabled }"
        :disabled="!unlocked"
        @click="onToggle(row.tier)"
      >
        <span class="autobuyer-title">{{ row.title }}</span>
        <span class="autobuyer-state">
          {{ row.enabled ? t("autobuyers.enabled") : t("autobuyers.disabled") }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.autobuyers-page {
  width: min(900px, 100%);
}

.autobuyers-header {
  margin-bottom: 16px;
  text-align: center;
}

.autobuyers-title {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 900;
}

.autobuyers-sub {
  margin-top: 5px;
  color: #aeb8da;
  font-size: 0.86rem;
}

.autobuyer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 10px;
}

.autobuyer-button {
  min-height: 92px;
  padding: 12px 10px;
  border: 1px solid rgba(80, 102, 159, 0.82);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(22, 32, 59, 0.96) 0%, rgba(12, 18, 34, 0.98) 100%);
  color: #eef3ff;
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.28),
    inset 0 0 20px rgba(110, 150, 255, 0.06);
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.autobuyer-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(121, 231, 255, 0.74);
  filter: brightness(1.06);
}

.autobuyer-button.enabled {
  border-color: rgba(95, 231, 189, 0.76);
  background:
    linear-gradient(180deg, rgba(22, 70, 67, 0.96) 0%, rgba(10, 35, 40, 0.98) 100%);
}

.autobuyer-title {
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 900;
}

.autobuyer-state {
  color: #b7c3e7;
  font-size: 0.78rem;
  font-weight: 800;
}

.autobuyer-button.enabled .autobuyer-state {
  color: #9cf4d7;
}

@media (max-width: 840px) {
  .autobuyer-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}

@media (max-width: 520px) {
  .autobuyer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
