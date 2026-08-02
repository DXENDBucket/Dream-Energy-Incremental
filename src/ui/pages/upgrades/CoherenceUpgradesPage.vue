<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { mul } from "@/engine/math/num";
import { getCoherencePointGain, getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  ensureCoherenceAutobuyerState,
  getCoherenceAutobuyerComparisonBase,
  isCoherenceAutobuyerUnlocked,
  setCoherenceAutobuyerEnabled,
  setCoherenceAutobuyerDynamicAmount,
  setCoherenceAutobuyerGainRatio,
  setCoherenceAutobuyerInterval,
  setCoherenceAutobuyerMinimumGain,
  setCoherenceAutobuyerMode,
  type CoherenceAutobuyerMode,
} from "@/engine/strata/common/coherence/autobuyer";
import {
  COHERENCE_UPGRADE_AUTOBUYER_ID,
  COHERENCE_UPGRADE_BEST_ENTRY_COHERENCE_ID,
  COHERENCE_UPGRADE_BEST_NEXT_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ENTROPY_TUNING_ID,
  COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID,
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  COHERENCE_UPGRADE_ROWS,
  COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID,
  buyCoherenceUpgrade,
  canBuyCoherenceUpgrade,
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceBestEntryCoherenceMultiplier,
  getCoherenceBestNextDreamEnergy,
  getCoherenceBestNextDreamEnergyMultiplier,
  getCoherenceEntropyTuningExponent,
  getCoherenceNextDreamCrystalMultiplierBonus,
  getCoherencePointGainMultiplier,
  getCoherenceRepeatableUpgradeBought,
  getCoherenceSoftcapTwoStrengthMultiplier,
  getCoherenceUpgradeCost,
  getCoherenceUpgradeDefinition,
  hasCoherenceUpgrade,
  isCoherenceUpgradeUnlockedForPurchase,
  isCoherenceRepeatableUpgradeMaxed,
  type CoherenceUpgradeId,
} from "@/engine/strata/common/coherence/upgrades";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import UpgradeGridPage from "./UpgradeGridPage.vue";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const coherencePointsText = computed(() => formatInt(getCoherencePoints(activeStratum.value)));
const coherenceAutobuyer = computed(() => ensureCoherenceAutobuyerState(activeStratum.value));
const coherenceAutobuyerUnlocked = computed(() => isCoherenceAutobuyerUnlocked(activeStratum.value));
const autobuyerModes: CoherenceAutobuyerMode[] = ["interval", "amount", "ratio"];
const pendingCoherenceGain = computed(() => getCoherencePointGain(activeStratum.value));
const pendingCoherenceGainText = computed(() => formatInt(pendingCoherenceGain.value));
const ratioRequiredGainText = computed(() => formatInt(mul(
  getCoherenceAutobuyerComparisonBase(getCoherencePoints(activeStratum.value)),
  coherenceAutobuyer.value.gainRatio,
)));

const upgradeRows = computed(() => {
  return COHERENCE_UPGRADE_ROWS.map(row =>
    row.map((id) => {
      const definition = getCoherenceUpgradeDefinition(id);
      const isMaxed = isCoherenceRepeatableUpgradeMaxed(activeStratum.value, id);
      const isBought = (
        definition.kind === "single" && hasCoherenceUpgrade(activeStratum.value, id)
      ) || isMaxed;

      return {
        id: definition.id,
        title: t(`coherenceUpgrades.items.${definition.id}.title`),
        description: t(`coherenceUpgrades.items.${definition.id}.description`),
        footer: getUpgradeFooter(definition.id),
        costText: definition.kind !== "placeholder" && !isMaxed
          ? t("coherenceUpgrades.cost", {
            value: formatInt(getCoherenceUpgradeCost(activeStratum.value, definition.id)),
          })
          : "",
        stateText: getUpgradeStateText(definition.id),
        canBuy: canBuyCoherenceUpgrade(activeStratum.value, definition.id),
        isBought,
      };
    })
  );
});

function getUpgradeFooter(id: CoherenceUpgradeId): string {
  if (id === COHERENCE_UPGRADE_ENTROPY_TUNING_ID) {
    return t("coherenceUpgrades.entropyTuningStatus", {
      value: format(getCoherenceEntropyTuningExponent(activeStratum.value, getCoherencePoints(activeStratum.value))),
    });
  }

  if (id === COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID) {
    return t("coherenceUpgrades.nextDreamCrystalMultiplierStatus", {
      value: format(getCoherenceNextDreamCrystalMultiplierBonus(activeStratum.value)),
    });
  }

  if (id === COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID) {
    return t("coherenceUpgrades.softcapTwoSlowdownStatus", {
      value: format(getCoherenceSoftcapTwoStrengthMultiplier(activeStratum.value)),
    });
  }

  if (id === COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID) {
    const bought = getCoherenceRepeatableUpgradeBought(activeStratum.value, id);
    const bonus = getCoherenceDeeperInitialDreamEnergyBonus(activeStratum.value);

    return t("coherenceUpgrades.deeperInitialDreamEnergyStatus", {
      count: formatInt(bought),
      value: format(bonus),
    });
  }

  if (id === COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID) {
    const bought = getCoherenceRepeatableUpgradeBought(activeStratum.value, id);
    const multiplier = getCoherencePointGainMultiplier(activeStratum.value);

    return t("coherenceUpgrades.pointGainMultiplierStatus", {
      count: formatInt(bought),
      value: format(multiplier),
    });
  }

  if (id === COHERENCE_UPGRADE_BEST_NEXT_DREAM_ENERGY_ID) {
    return t("coherenceUpgrades.bestNextDreamEnergyStatus", {
      best: format(getCoherenceBestNextDreamEnergy(props.game.state, props.game.state.activeStratumId)),
      value: format(getCoherenceBestNextDreamEnergyMultiplier(
        props.game.state,
        props.game.state.activeStratumId,
      )),
    });
  }

  if (id === COHERENCE_UPGRADE_BEST_ENTRY_COHERENCE_ID) {
    return t("coherenceUpgrades.bestEntryCoherenceStatus", {
      best: formatInt(activeStratum.value.bestNextStratumEntryCoherencePoints),
      value: format(getCoherenceBestEntryCoherenceMultiplier(activeStratum.value)),
    });
  }

  if (id === COHERENCE_UPGRADE_AUTOBUYER_ID) {
    if (!hasCoherenceUpgrade(activeStratum.value, id)) return "";
    return t(
      coherenceAutobuyer.value.enabled
        ? "coherenceUpgrades.autobuyer.enabledStatus"
        : "coherenceUpgrades.autobuyer.disabledStatus",
    );
  }

  return "";
}

function getUpgradeStateText(id: CoherenceUpgradeId): string {
  if (!isCoherenceUpgradeUnlockedForPurchase(activeStratum.value, id)) {
    return t("coherenceUpgrades.rowLocked");
  }

  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind === "placeholder") return t("coherenceUpgrades.pending");

  if (definition.kind === "single") {
    return hasCoherenceUpgrade(activeStratum.value, id)
      ? t("coherenceUpgrades.purchased")
      : t("coherenceUpgrades.buy");
  }

  if (isCoherenceRepeatableUpgradeMaxed(activeStratum.value, id)) {
    return t("coherenceUpgrades.maxed");
  }

  const bought = getCoherenceRepeatableUpgradeBought(activeStratum.value, id);
  return bought.gt(0)
    ? t("coherenceUpgrades.buyRepeatable")
    : t("coherenceUpgrades.buy");
}

const resourceText = computed(() => {
  return t("coherenceUpgrades.availableCP", { value: coherencePointsText.value });
});

function onBuyUpgrade(id: string) {
  buyCoherenceUpgrade(activeStratum.value, id as CoherenceUpgradeId);
}

function setAutobuyerMode(mode: CoherenceAutobuyerMode): void {
  setCoherenceAutobuyerMode(activeStratum.value, mode);
}

function toggleAutobuyer(event: Event): void {
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

function updateAutobuyerValue(
  event: Event,
  setting: "interval" | "amount" | "ratio",
): void {
  const input = event.target as HTMLInputElement;

  try {
    if (setting === "interval") {
      setCoherenceAutobuyerInterval(activeStratum.value, input.value);
      input.value = coherenceAutobuyer.value.intervalSec.toString();
    } else if (setting === "amount") {
      setCoherenceAutobuyerMinimumGain(activeStratum.value, input.value);
      input.value = coherenceAutobuyer.value.minimumGain.toString();
    } else {
      setCoherenceAutobuyerGainRatio(activeStratum.value, input.value);
      input.value = coherenceAutobuyer.value.gainRatio.toString();
    }
  } catch {
    input.value = setting === "interval"
      ? coherenceAutobuyer.value.intervalSec.toString()
      : setting === "amount"
        ? coherenceAutobuyer.value.minimumGain.toString()
        : coherenceAutobuyer.value.gainRatio.toString();
  }
}
</script>

<template>
  <div class="coherence-upgrades-page">
    <UpgradeGridPage
      :resource-text="resourceText"
      :rows="upgradeRows"
      theme="coherence"
      @buy="onBuyUpgrade"
    />

    <section v-if="coherenceAutobuyerUnlocked" class="autobuyer-panel">
      <div class="autobuyer-header">
        <div>
          <div class="autobuyer-title">{{ t("coherenceUpgrades.autobuyer.title") }}</div>
          <div class="autobuyer-summary">
            {{ t("coherenceUpgrades.autobuyer.pendingGain", { value: pendingCoherenceGainText }) }}
          </div>
        </div>

        <label class="autobuyer-toggle">
          <input
            type="checkbox"
            :checked="coherenceAutobuyer.enabled"
            @change="toggleAutobuyer"
          />
          <span>{{ t(coherenceAutobuyer.enabled ? "common.enabled" : "common.disabled") }}</span>
        </label>
      </div>

      <div class="autobuyer-modes">
        <button
          v-for="mode in autobuyerModes"
          :key="mode"
          type="button"
          class="mode-button"
          :class="{ active: coherenceAutobuyer.mode === mode }"
          @click="setAutobuyerMode(mode)"
        >
          <strong>{{ t(`coherenceUpgrades.autobuyer.modes.${mode}.title`) }}</strong>
          <span>{{ t(`coherenceUpgrades.autobuyer.modes.${mode}.description`) }}</span>
        </button>
      </div>

      <div class="autobuyer-setting">
        <template v-if="coherenceAutobuyer.mode === 'interval'">
          <label for="coherence-autobuyer-interval">
            {{ t("coherenceUpgrades.autobuyer.intervalLabel") }}
          </label>
          <div class="setting-input-wrap">
            <input
              id="coherence-autobuyer-interval"
              type="text"
              inputmode="decimal"
              :value="coherenceAutobuyer.intervalSec.toString()"
              @change="updateAutobuyerValue($event, 'interval')"
            />
            <span>{{ t("coherenceUpgrades.autobuyer.seconds") }}</span>
          </div>
        </template>

        <template v-else-if="coherenceAutobuyer.mode === 'amount'">
          <label for="coherence-autobuyer-amount">
            {{ t("coherenceUpgrades.autobuyer.amountLabel") }}
          </label>
          <div class="setting-input-wrap">
            <input
              id="coherence-autobuyer-amount"
              type="text"
              inputmode="decimal"
              :value="coherenceAutobuyer.minimumGain.toString()"
              @change="updateAutobuyerValue($event, 'amount')"
            />
            <span>CP</span>
          </div>
          <label class="dynamic-amount-toggle">
            <span>Dynamic Amount</span>
            <input
              type="checkbox"
              :checked="coherenceAutobuyer.dynamicAmount"
              @change="toggleDynamicAmount"
            />
          </label>
        </template>

        <template v-else>
          <label for="coherence-autobuyer-ratio">
            {{ t("coherenceUpgrades.autobuyer.ratioLabel") }}
          </label>
          <div class="setting-input-wrap">
            <input
              id="coherence-autobuyer-ratio"
              type="text"
              inputmode="decimal"
              :value="coherenceAutobuyer.gainRatio.toString()"
              @change="updateAutobuyerValue($event, 'ratio')"
            />
            <span>×</span>
          </div>
          <div class="setting-note">
            {{ t("coherenceUpgrades.autobuyer.ratioRequired", { value: ratioRequiredGainText }) }}
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.coherence-upgrades-page {
  width: min(1180px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.autobuyer-panel {
  width: min(900px, 96%);
  padding: 18px;
  border: 1px solid rgba(94, 204, 244, 0.66);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(14, 38, 59, 0.97), rgba(7, 19, 34, 0.98));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), inset 0 0 24px rgba(91, 213, 250, 0.06);
}

.autobuyer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.autobuyer-title { color: #eafaff; font-size: 1.08rem; font-weight: 900; }
.autobuyer-summary { margin-top: 5px; color: #9fd6e9; font-size: .8rem; }
.autobuyer-toggle { display: flex; align-items: center; gap: 8px; color: #c8f2ff; font-weight: 800; cursor: pointer; }
.autobuyer-toggle input { width: 18px; height: 18px; accent-color: #5dd4f7; }

.autobuyer-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin-top: 16px;
}

.mode-button {
  min-height: 82px;
  padding: 10px;
  border: 1px solid rgba(103, 166, 196, .42);
  border-radius: 6px;
  background: rgba(15, 38, 58, .72);
  color: #b8d8e6;
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mode-button strong { color: #e6f9ff; font-size: .84rem; }
.mode-button span { font-size: .72rem; line-height: 1.35; }
.mode-button.active { border-color: #8be3ff; background: rgba(29, 83, 107, .74); box-shadow: inset 0 0 18px rgba(91, 213, 250, .1); }

.autobuyer-setting {
  margin-top: 14px;
  padding: 13px;
  border-radius: 6px;
  background: rgba(5, 14, 26, .5);
  color: #bdefff;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 280px);
  align-items: center;
  gap: 10px 16px;
}

.autobuyer-setting label { font-size: .82rem; font-weight: 800; }
.setting-input-wrap { display: flex; align-items: center; gap: 8px; }
.setting-input-wrap input { width: 100%; padding: 8px 10px; border: 1px solid #437a91; border-radius: 5px; outline: none; background: #071522; color: #e8fbff; font: inherit; font-variant-numeric: tabular-nums; }
.setting-input-wrap input:focus { border-color: #8be3ff; box-shadow: 0 0 0 2px rgba(91, 213, 250, .12); }
.setting-note { grid-column: 1 / -1; color: #84bfd5; font-size: .74rem; }
.dynamic-amount-toggle { grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 9px; color: #d8f7ff; cursor: pointer; }
.dynamic-amount-toggle input { width: 17px; height: 17px; accent-color: #5dd4f7; }

@media (max-width: 700px) {
  .autobuyer-header { align-items: flex-start; }
  .autobuyer-modes { grid-template-columns: 1fr; }
  .autobuyer-setting { grid-template-columns: 1fr; }
}
</style>
