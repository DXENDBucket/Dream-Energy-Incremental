<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { formatInt } from "@/engine/math/format";
import { N, mul } from "@/engine/math/num";
import { getCoherencePointGain, getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  ensureCoherenceAutobuyerState,
  getCoherenceAutobuyerComparisonBase,
  setCoherenceAutobuyerDynamicAmount,
  setCoherenceAutobuyerEnabled,
  setCoherenceAutobuyerGainRatio,
  setCoherenceAutobuyerInterval,
  setCoherenceAutobuyerMinimumGain,
  setCoherenceAutobuyerMode,
  type CoherenceAutobuyerMode,
} from "@/engine/strata/common/coherence/autobuyer";
import { getActiveStratum } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

type NumericSetting = "interval" | "amount" | "ratio";

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const autobuyer = computed(() => ensureCoherenceAutobuyerState(activeStratum.value));
const modes: CoherenceAutobuyerMode[] = ["interval", "amount", "ratio"];
const focusedSetting = ref<NumericSetting | null>(null);
const drafts = reactive<Record<NumericSetting, string>>({
  interval: "",
  amount: "",
  ratio: "",
});

const pendingGainText = computed(() => formatInt(getCoherencePointGain(activeStratum.value)));
const ratioRequiredGainText = computed(() => formatInt(mul(
  getCoherenceAutobuyerComparisonBase(getCoherencePoints(activeStratum.value)),
  autobuyer.value.gainRatio,
)));

function settingValue(setting: NumericSetting): string {
  if (setting === "interval") return autobuyer.value.intervalSec.toString();
  if (setting === "amount") return autobuyer.value.minimumGain.toString();
  return autobuyer.value.gainRatio.toString();
}

watch(
  () => [
    activeStratum.value.stratumId,
    autobuyer.value.intervalSec.toString(),
    autobuyer.value.minimumGain.toString(),
    autobuyer.value.gainRatio.toString(),
  ] as const,
  () => {
    for (const setting of ["interval", "amount", "ratio"] as const) {
      if (focusedSetting.value !== setting) drafts[setting] = settingValue(setting);
    }
  },
  { immediate: true },
);

function setMode(mode: CoherenceAutobuyerMode): void {
  setCoherenceAutobuyerMode(activeStratum.value, mode);
}

function toggleEnabled(event: Event): void {
  setCoherenceAutobuyerEnabled(
    activeStratum.value,
    (event.target as HTMLInputElement).checked,
  );
}

function toggleDynamicAmount(event: Event): void {
  setCoherenceAutobuyerDynamicAmount(
    activeStratum.value,
    (event.target as HTMLInputElement).checked,
  );
}

function beginEditing(setting: NumericSetting): void {
  focusedSetting.value = setting;
}

function updateDraft(event: Event, setting: NumericSetting): void {
  drafts[setting] = (event.target as HTMLInputElement).value;
}

function parseCommittedValue(raw: string) {
  const trimmed = raw.trim();
  const conventionalNumber = /^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (!conventionalNumber.test(trimmed)) return N(1);

  try {
    const parsed = N(trimmed);
    return parsed.isFinite() && parsed.gte(0) ? parsed : N(1);
  } catch {
    return N(1);
  }
}

function commitDraft(setting: NumericSetting): void {
  const value = parseCommittedValue(drafts[setting]);
  if (setting === "interval") {
    setCoherenceAutobuyerInterval(activeStratum.value, value);
  } else if (setting === "amount") {
    setCoherenceAutobuyerMinimumGain(activeStratum.value, value);
  } else {
    setCoherenceAutobuyerGainRatio(activeStratum.value, value);
  }

  focusedSetting.value = null;
  drafts[setting] = settingValue(setting);
}

function finishOnEnter(event: KeyboardEvent): void {
  (event.target as HTMLInputElement).blur();
}
</script>

<template>
  <section class="coherence-autobuyer-panel">
    <div class="panel-header">
      <div class="panel-copy">
        <div class="panel-title">{{ t("coherenceUpgrades.autobuyer.title") }}</div>
        <div class="panel-summary">
          {{ t("coherenceUpgrades.autobuyer.pendingGain", { value: pendingGainText }) }}
        </div>
      </div>

      <label class="toggle">
        <input type="checkbox" :checked="autobuyer.enabled" @change="toggleEnabled" />
        <span>{{ t(autobuyer.enabled ? "common.enabled" : "common.disabled") }}</span>
      </label>
    </div>

    <div class="mode-grid">
      <button
        v-for="mode in modes"
        :key="mode"
        type="button"
        class="mode-button"
        :class="{ active: autobuyer.mode === mode }"
        @click="setMode(mode)"
      >
        <strong>{{ t(`coherenceUpgrades.autobuyer.modes.${mode}.title`) }}</strong>
        <span>{{ t(`coherenceUpgrades.autobuyer.modes.${mode}.description`) }}</span>
      </button>
    </div>

    <div class="setting-row">
      <template v-if="autobuyer.mode === 'interval'">
        <label for="coherence-autobuyer-interval">
          {{ t("coherenceUpgrades.autobuyer.intervalLabel") }}
        </label>
        <div class="input-wrap">
          <input
            id="coherence-autobuyer-interval"
            type="text"
            inputmode="decimal"
            :value="drafts.interval"
            @focus="beginEditing('interval')"
            @input="updateDraft($event, 'interval')"
            @blur="commitDraft('interval')"
            @keydown.enter.prevent="finishOnEnter"
          />
          <span>{{ t("coherenceUpgrades.autobuyer.seconds") }}</span>
        </div>
      </template>

      <template v-else-if="autobuyer.mode === 'amount'">
        <label for="coherence-autobuyer-amount">
          {{ t("coherenceUpgrades.autobuyer.amountLabel") }}
        </label>
        <div class="input-wrap">
          <input
            id="coherence-autobuyer-amount"
            type="text"
            inputmode="decimal"
            :value="drafts.amount"
            @focus="beginEditing('amount')"
            @input="updateDraft($event, 'amount')"
            @blur="commitDraft('amount')"
            @keydown.enter.prevent="finishOnEnter"
          />
          <span>CP</span>
        </div>
        <label class="dynamic-toggle">
          <span>Dynamic Amount</span>
          <input
            type="checkbox"
            :checked="autobuyer.dynamicAmount"
            @change="toggleDynamicAmount"
          />
        </label>
      </template>

      <template v-else>
        <label for="coherence-autobuyer-ratio">
          {{ t("coherenceUpgrades.autobuyer.ratioLabel") }}
        </label>
        <div class="input-wrap">
          <input
            id="coherence-autobuyer-ratio"
            type="text"
            inputmode="decimal"
            :value="drafts.ratio"
            @focus="beginEditing('ratio')"
            @input="updateDraft($event, 'ratio')"
            @blur="commitDraft('ratio')"
            @keydown.enter.prevent="finishOnEnter"
          />
          <span>×</span>
        </div>
        <div class="setting-note">
          {{ t("coherenceUpgrades.autobuyer.ratioRequired", { value: ratioRequiredGainText }) }}
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.coherence-autobuyer-panel {
  margin-top: 26px;
  padding: 18px;
  border: 1px solid rgba(94, 204, 244, 0.66);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(14, 38, 59, 0.97), rgba(7, 19, 34, 0.98));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), inset 0 0 24px rgba(91, 213, 250, 0.06);
}

.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.panel-copy { flex: 1; min-width: 0; text-align: left; }
.panel-title { display: block; color: #eafaff; font-size: 1.08rem; font-weight: 900; text-align: left; }
.panel-summary { display: block; margin-top: 5px; color: #9fd6e9; font-size: .8rem; text-align: left; white-space: nowrap; }
.toggle, .dynamic-toggle { display: flex; align-items: center; gap: 8px; color: #c8f2ff; font-weight: 800; cursor: pointer; }
.toggle input, .dynamic-toggle input { width: 18px; height: 18px; accent-color: #5dd4f7; }

.mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-top: 16px; }
.mode-button { min-height: 82px; padding: 10px; border: 1px solid rgba(103,166,196,.42); border-radius: 6px; background: rgba(15,38,58,.72); color: #b8d8e6; font: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 5px; }
.mode-button strong { color: #e6f9ff; font-size: .84rem; }
.mode-button span { font-size: .72rem; line-height: 1.35; }
.mode-button.active { border-color: #8be3ff; background: rgba(29,83,107,.74); box-shadow: inset 0 0 18px rgba(91,213,250,.1); }

.setting-row { margin-top: 14px; padding: 13px; border-radius: 6px; background: rgba(5,14,26,.5); color: #bdefff; display: grid; grid-template-columns: minmax(180px,1fr) minmax(180px,280px); align-items: center; gap: 10px 16px; }
.setting-row > label:not(.dynamic-toggle) { font-size: .82rem; font-weight: 800; }
.input-wrap { display: flex; align-items: center; gap: 8px; }
.input-wrap input { width: 100%; padding: 8px 10px; border: 1px solid #437a91; border-radius: 5px; outline: none; background: #071522; color: #e8fbff; font: inherit; font-variant-numeric: tabular-nums; }
.input-wrap input:focus { border-color: #8be3ff; box-shadow: 0 0 0 2px rgba(91,213,250,.12); }
.setting-note, .dynamic-toggle { grid-column: 1 / -1; justify-self: center; }
.setting-note { color: #84bfd5; font-size: .74rem; }

@media (max-width: 700px) {
  .panel-header { align-items: flex-start; }
  .mode-grid, .setting-row { grid-template-columns: 1fr; }
}
</style>
