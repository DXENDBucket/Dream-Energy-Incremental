<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  title: string;
  amountText: string;
  percentageText: string;
  multiplierText: string;
  costText: string;
  canBuy: boolean;
  canRefine: boolean;
  refineUnlocked: boolean;
  refineHint?: string;
}>();

const emit = defineEmits<{
  buy: [];
  buyMax: [];
  refine: [];
}>();

const { t } = useI18n();
const showRefineTooltip = ref(false);

const refineTooltipText = computed(() => {
  if (!props.canRefine) {
    return props.refineHint ?? t("dreamCrystalRow.lockedTooltip");
  }

  return props.refineHint ?? t("dreamCrystalRow.refineThisCrystal");
});

function onRefineClick() {
  if (!props.canRefine) return;
  emit("refine");
}

function onBuyClick() {
  if (!props.canBuy) return;
  emit("buy");
}
</script>

<template>
  <div class="dc-row">
    <div class="dc-left">
      <div class="dc-title">{{ title }}</div>
      <div class="dc-multiplier">{{ multiplierText }}</div>
    </div>

    <div class="dc-center">
      <div class="dc-amount">{{ amountText }}</div>
      <div v-if="percentageText" class="dc-percent">{{ percentageText }}</div>
    </div>

    <div class="dc-right">
      <button
        class="dc-button buy-button"
        :class="{ disabled: !canBuy }"
        :disabled="!canBuy"
        @click="onBuyClick"
      >
        {{ t("dreamCrystalRow.buy") }}
        <span class="dc-button-sub">{{ t("dreamCrystalRow.cost", { value: costText }) }}</span>
      </button>

      <button class="dc-button secondary-button" @click="emit('buyMax')">
        {{ t("dreamCrystalRow.buyMax") }}
      </button>

      <div
        v-if="refineUnlocked"
        class="refine-wrap"
        @mouseenter="showRefineTooltip = true"
        @mouseleave="showRefineTooltip = false"
      >
        <transition name="refine-tooltip-rise">
          <div
            v-if="showRefineTooltip && refineUnlocked"
            class="refine-tooltip"
          >
            {{ refineTooltipText }}
          </div>
        </transition>
        <button
          class="dc-button refine-button"
          :class="{ disabled: !canRefine }"
          :disabled="!canRefine"
          @click="onRefineClick"
        >
          {{ t("dreamCrystalRow.refine") }}
          <span class="dc-button-sub">
            {{ canRefine ? t("dreamCrystalRow.executable") : t("dreamCrystalRow.locked") }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dc-row {
  --dc-button-width: 110px;

  width: min(1180px, 97%);
  min-height: 30px;

  display: grid;
  grid-template-columns: 0.9fr 1.6fr 1.5fr;
  align-items: center;

  margin: 0 auto;
  padding: 8px 20px;

  border: 1px solid #2b3758;
  border-radius: 4px;
  background:
    linear-gradient(180deg, rgba(20, 28, 50, 0.94) 0%, rgba(12, 18, 33, 0.98) 100%);
  box-shadow:
    inset 0 0 22px rgba(112, 88, 193, 0.08),
    0 8px 28px rgba(0, 0, 0, 0.34);

  color: #e9ecff;
}

.dc-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
}

.dc-title {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.1;
  color: #f6f3ff;
}

.dc-multiplier {
  margin-top: 6px;
  font-size: 0.98rem;
  color: #aeb8da;
}

.dc-center {
  display: grid;
  grid-template-columns: minmax(90px, 1fr) 160px;
  align-items: center;
  justify-items: start;
  column-gap: 10px;
  padding-left: 12px;
}

.dc-amount {
  font-size: 1.65rem;
  font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  text-align: left;
}

.dc-percent {
  font-size: 0.82rem;
  color: #aeb8da;
  white-space: nowrap;
  text-align: left;
}

.dc-right {
  display: grid;
  grid-template-columns: repeat(3, var(--dc-button-width));
  gap: 10px;
  justify-content: end;
  align-items: stretch;
}

.dc-button {
  position: relative;

  min-height: 20px;
  padding: 10px 8px;

  border: 1px solid #314366;
  border-radius: 3px;
  background:
    linear-gradient(180deg, #192440 0%, #121a30 100%);
  color: #eef2ff;

  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  transition:
    transform 0.12s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    color 0.15s ease;
}

.dc-button:hover {
  transform: translateY(-1px);
  border-color: #5670c9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

.dc-button-sub {
  margin-top: 3px;
  font-size: 0.76rem;
  font-weight: 500;
  color: #aeb8da;
}

.buy-button {
  background:
    linear-gradient(180deg, #24422b 0%, #172b1b 100%);
  border-color: #426f4f;
  color: #f2fff2;
}

.buy-button:hover {
  border-color: #6eb989;
}

.buy-button.disabled {
  background:
    linear-gradient(180deg, #2a2330 0%, #1a1620 100%);
  border-color: #4a3a55;
  color: #c8bfd6;
  cursor: not-allowed;
  opacity: 0.72;
}

.buy-button.disabled:hover {
  transform: none;
  border-color: #4a3a55;
  box-shadow: none;
}

.secondary-button {
  background:
    linear-gradient(180deg, #1b2746 0%, #131c33 100%);
}

.refine-button {
  background:
    linear-gradient(180deg, #3a2746 0%, #26192f 100%);
  border-color: #6e4d86;
  width: 90px;
  min-width: 90px;
  min-height: 20px;
  flex: 0 0 124px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.refine-button:hover {
  border-color: #b07cff;
}

.refine-wrap {
  position: relative;
}

.refine-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);

  min-width: 180px;
  max-width: 240px;
  padding: 8px 10px;

  border: 1px solid #7b6be4;
  border-radius: 8px;
  background: rgba(12, 18, 34, 0.97);
  color: #eef2ff;
  font-size: 0.82rem;
  line-height: 1.3;
  text-align: center;

  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.34),
    inset 0 0 12px rgba(125, 131, 255, 0.08);

  z-index: 30;
  pointer-events: none;
}

.refine-button.disabled {
  background:
    linear-gradient(180deg, #2a2330 0%, #1a1620 100%);
  border-color: #4a3a55;
  color: #c8bfd6;
  cursor: not-allowed;
  opacity: 0.72;
}

.refine-button.disabled:hover {
  transform: none;
  border-color: #4a3a55;
  box-shadow: none;
}

.refine-tooltip-rise-enter-active {
  animation: refine-tooltip-rise-in 0.14s ease-out;
}

.refine-tooltip-rise-leave-active {
  transition: opacity 0.08s ease;
}

.refine-tooltip-rise-enter-from,
.refine-tooltip-rise-leave-to {
  opacity: 0;
}

@keyframes refine-tooltip-rise-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
