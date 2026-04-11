<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatGain } from "@/engine/math/format";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  getDreamEnergyGainPerSecond,
  getRawDreamEnergyGainPerSecond,
  getDreamEnergySoftcapOneDivisor,
  getDreamEnergySoftcapOnePowerDisplay,
  isDreamEnergySoftcapOneActive,
} from "@/engine/strata/common/dream-energy";
import { getDreamEnergy } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));

const currentDreamEnergyText = computed(() => {
  return format(getDreamEnergy(activeStratum.value));
});

const rawDreamEnergyGainText = computed(() => {
  return formatGain(getRawDreamEnergyGainPerSecond(activeStratum.value));
});

const finalDreamEnergyGainText = computed(() => {
  return formatGain(getDreamEnergyGainPerSecond(activeStratum.value));
});

const softcapOneActive = computed(() => {
  return isDreamEnergySoftcapOneActive(activeStratum.value);
});

const softcapOneDivisorText = computed(() => {
  return format(getDreamEnergySoftcapOneDivisor(activeStratum.value));
});

const softcapOnePowerDisplayText = computed(() => {
  return format(getDreamEnergySoftcapOnePowerDisplay());
});
</script>

<template>
  <div class="current-stratum-page">
    <div class="detail-card">
      <div class="detail-title">{{ t("currentStratum.title") }}</div>

      <template v-if="softcapOneActive">
        <div class="detail-line">{{ t("currentStratum.underPressure") }}</div>

        <i18n-t keypath="currentStratum.detail" tag="div" class="detail-line">
          <template #current>
            <span class="detail-number">{{ currentDreamEnergyText }}</span>
          </template>
          <template #raw>
            <span class="detail-number">{{ rawDreamEnergyGainText }}</span>
          </template>
          <template #power>
            <span class="detail-number">{{ softcapOnePowerDisplayText }}</span>
          </template>
        </i18n-t>

        <i18n-t keypath="currentStratum.reducedTo" tag="div" class="detail-line">
          <template #divisor>
            <span class="detail-number">÷{{ softcapOneDivisorText }}</span>
          </template>
          <template #final>
            <span class="detail-number">{{ finalDreamEnergyGainText }}</span>
          </template>
        </i18n-t>
      </template>

      <template v-else>
        <div class="detail-line">{{ t("currentStratum.stable") }}</div>

        <div class="detail-line">{{ t("currentStratum.noRepulsion") }}</div>

        <i18n-t keypath="currentStratum.currentProduction" tag="div" class="detail-line">
          <template #value>
            <span class="detail-number">{{ finalDreamEnergyGainText }}</span>
          </template>
        </i18n-t>
      </template>
    </div>
  </div>
</template>

<style scoped>
.current-stratum-page {
  width: min(1180px, 97%);
  margin: 0 auto;
}

.detail-card {
  padding: 18px 20px;
  border: 1px solid #7a2746;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(42, 12, 24, 0.94) 0%, rgba(24, 7, 15, 0.98) 100%);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 0 20px rgba(176, 48, 96, 0.08);
}

.detail-title {
  font-size: 1.28rem;
  font-weight: 700;
  color: #ffd5e5;
  margin-bottom: 12px;
}

.detail-line {
  color: #B03060;
  font-size: 1.02rem;
  line-height: 1.72;
  margin-top: 8px;
}

.detail-number {
  color: #ffd6e8;
  font-size: 1.16em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 0 0.18em;
}
</style>
