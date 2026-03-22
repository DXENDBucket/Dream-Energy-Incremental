<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "@/engine/core/state";
import { format, formatGain } from "@/engine/math/format";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  getDreamEnergyGain,
  getRawDreamEnergyGain,
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

const activeStratum = computed(() => getActiveStratum(props.game.state));

const currentDreamEnergyText = computed(() => {
  return format(getDreamEnergy(activeStratum.value));
});

const rawDreamEnergyGainText = computed(() => {
  return formatGain(getRawDreamEnergyGain(activeStratum.value));
});

const finalDreamEnergyGainText = computed(() => {
  return formatGain(getDreamEnergyGain(activeStratum.value));
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
      <div class="detail-title">Dream Energy Repulsion</div>

      <template v-if="softcapOneActive">
        <div class="detail-line">
          Your Dream Energy storage is under pressure.
        </div>

        <div class="detail-line">
          Because you currently hold
          <span class="detail-number">{{ currentDreamEnergyText }}</span>
          Dream Energy, your raw production of
          <span class="detail-number">{{ rawDreamEnergyGainText }}</span>
          is facing a repulsion strength of
          <span class="detail-number">{{ softcapOnePowerDisplayText }}</span>.
        </div>

        <div class="detail-line">
          This reduces your production by
          <span class="detail-number">÷{{ softcapOneDivisorText }}</span>
          to
          <span class="detail-number">{{ finalDreamEnergyGainText }}</span>.
        </div>
      </template>

      <template v-else>
        <div class="detail-line">
          Your current Dream Energy storage is stable.
        </div>

        <div class="detail-line">
          No repulsion is affecting Dream Energy production right now.
        </div>

        <div class="detail-line">
          Current production:
          <span class="detail-number">{{ finalDreamEnergyGainText }}</span>
        </div>
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