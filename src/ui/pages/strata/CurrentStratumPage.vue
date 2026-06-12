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
  getDreamEnergySoftcapTwoExcessExponent,
  getDreamEnergySoftcapTwoStrengthBase,
  getDreamEnergySoftcapTwoStrengthGrowth,
  getDreamEnergySoftcapTwoStrengthMultiplier,
  isDreamEnergySoftcapOneActive,
  isDreamEnergySoftcapTwoActive,
} from "@/engine/strata/common/dream-energy";
import { DREAM_ENERGY_SOFTCAP_TWO_START } from "@/engine/math/dream-energy/balance";
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
  return format(getDreamEnergySoftcapOnePowerDisplay(activeStratum.value));
});

const softcapTwoActive = computed(() => {
  return isDreamEnergySoftcapTwoActive(activeStratum.value);
});

const softcapTwoMultiplierText = computed(() => {
  return format(getDreamEnergySoftcapTwoStrengthMultiplier(activeStratum.value));
});

const softcapTwoThresholdText = computed(() => {
  return format(DREAM_ENERGY_SOFTCAP_TWO_START);
});

const softcapTwoExcessExponentText = computed(() => {
  return format(getDreamEnergySoftcapTwoExcessExponent(activeStratum.value));
});

const softcapTwoStrengthBaseText = computed(() => {
  return format(getDreamEnergySoftcapTwoStrengthBase());
});

const softcapTwoStrengthGrowthText = computed(() => {
  return format(getDreamEnergySoftcapTwoStrengthGrowth(activeStratum.value));
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

    <div v-if="softcapTwoActive" class="detail-card softcap-two-card">
      <div class="detail-title softcap-two-title">{{ t("currentStratum.softcapTwo.title") }}</div>

      <i18n-t keypath="currentStratum.softcapTwo.threshold" tag="div" class="detail-line softcap-two-line">
        <template #value>
          <span class="detail-number softcap-two-number">{{ softcapTwoThresholdText }}</span>
        </template>
      </i18n-t>

      <i18n-t keypath="currentStratum.softcapTwo.excessExponent" tag="div" class="detail-line softcap-two-line">
        <template #value>
          <span class="detail-number softcap-two-number">{{ softcapTwoExcessExponentText }}</span>
        </template>
      </i18n-t>

      <i18n-t keypath="currentStratum.softcapTwo.strengthBase" tag="div" class="detail-line softcap-two-line">
        <template #base>
          <span class="detail-number softcap-two-number">{{ softcapTwoStrengthBaseText }}</span>
        </template>
        <template #growth>
          <span class="detail-number softcap-two-number">×{{ softcapTwoStrengthGrowthText }}</span>
        </template>
      </i18n-t>

      <i18n-t keypath="currentStratum.softcapTwo.strengthMultiplier" tag="div" class="detail-line softcap-two-line">
        <template #value>
          <span class="detail-number softcap-two-number">×{{ softcapTwoMultiplierText }}</span>
        </template>
      </i18n-t>
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

.softcap-two-card {
  margin-top: 14px;
  border: 1px solid rgba(148, 35, 54, 0.78);
  background:
    linear-gradient(180deg, rgba(42, 8, 16, 0.95) 0%, rgba(17, 3, 8, 0.98) 100%);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.32),
    0 0 22px rgba(176, 35, 62, 0.12),
    inset 0 0 24px rgba(255, 79, 104, 0.06);
}

.softcap-two-title {
  color: #ffd1d8;
  text-shadow: 0 0 12px rgba(255, 91, 120, 0.28);
}

.softcap-two-line {
  color: #c44663;
}

.softcap-two-number {
  color: #ffd6e0;
  text-shadow: 0 0 12px rgba(255, 102, 133, 0.26);
}
</style>
