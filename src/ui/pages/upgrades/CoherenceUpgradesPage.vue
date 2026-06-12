<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ROW_ONE,
  buyCoherenceUpgrade,
  canBuyCoherenceUpgrade,
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceRepeatableUpgradeBought,
  getCoherenceUpgradeCost,
  getCoherenceUpgradeDefinition,
  type CoherenceUpgradeId,
} from "@/engine/strata/common/coherence/upgrades";
import { getActiveStratum } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const coherencePointsText = computed(() => formatInt(getCoherencePoints(activeStratum.value)));

const upgradeRows = computed(() => {
  return [
    COHERENCE_UPGRADE_ROW_ONE.map((id) => {
      const definition = getCoherenceUpgradeDefinition(id);

      return {
        id: definition.id,
        title: t(`coherenceUpgrades.items.${definition.id}.title`),
        description: t(`coherenceUpgrades.items.${definition.id}.description`),
        footer: getUpgradeFooter(definition.id),
        costText: definition.kind === "repeatable"
          ? t("coherenceUpgrades.cost", {
            value: formatInt(getCoherenceUpgradeCost(activeStratum.value, definition.id)),
          })
          : "",
        stateText: getUpgradeStateText(definition.id),
        canBuy: canBuyCoherenceUpgrade(activeStratum.value, definition.id),
      };
    }),
  ];
});

function getUpgradeFooter(id: CoherenceUpgradeId): string {
  if (id === COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID) {
    const bought = getCoherenceRepeatableUpgradeBought(activeStratum.value, id);
    const bonus = getCoherenceDeeperInitialDreamEnergyBonus(activeStratum.value);

    return t("coherenceUpgrades.deeperInitialDreamEnergyStatus", {
      count: formatInt(bought),
      value: format(bonus),
    });
  }

  return "";
}

function getUpgradeStateText(id: CoherenceUpgradeId): string {
  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind !== "repeatable") return t("coherenceUpgrades.pending");

  const bought = getCoherenceRepeatableUpgradeBought(activeStratum.value, id);
  return bought.gt(0)
    ? t("coherenceUpgrades.buyRepeatable")
    : t("coherenceUpgrades.buy");
}

function onBuyUpgrade(id: CoherenceUpgradeId) {
  buyCoherenceUpgrade(activeStratum.value, id);
}
</script>

<template>
  <div class="coherence-upgrades-page">
    <div class="coherence-upgrades-resource">
      {{ t("coherenceUpgrades.availableCP", { value: coherencePointsText }) }}
    </div>

    <div class="upgrade-grid" role="list">
      <template v-for="(row, rowIndex) in upgradeRows" :key="rowIndex">
        <button
          v-for="upgrade in row"
          :key="upgrade.id"
          class="upgrade-button"
          :disabled="!upgrade.canBuy"
          role="listitem"
          @click="onBuyUpgrade(upgrade.id)"
        >
          <span class="upgrade-title">{{ upgrade.title }}</span>
          <span class="upgrade-description">{{ upgrade.description }}</span>
          <span v-if="upgrade.footer" class="upgrade-footer">{{ upgrade.footer }}</span>
          <span v-if="upgrade.costText" class="upgrade-cost">{{ upgrade.costText }}</span>
          <span class="upgrade-state">{{ upgrade.stateText }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.coherence-upgrades-page {
  width: min(1180px, 100%);
}

.coherence-upgrades-resource {
  margin-bottom: 14px;
  color: #bdefff;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
  text-shadow: 0 0 12px rgba(91, 213, 250, 0.3);
}

.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 196px));
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  justify-content: center;
}

.upgrade-button {
  min-height: 160px;
  padding: 12px 10px;
  border: 1px solid rgba(94, 204, 244, 0.66);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(17, 42, 64, 0.96) 0%, rgba(9, 22, 38, 0.98) 100%);
  color: #effbff;
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.28),
    inset 0 0 24px rgba(91, 213, 250, 0.08);
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.upgrade-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(189, 239, 255, 0.86);
  filter: brightness(1.06);
}

.upgrade-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.upgrade-title {
  color: #ffffff;
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.2;
}

.upgrade-description {
  color: #b9dced;
  font-size: 0.78rem;
  line-height: 1.35;
}

.upgrade-footer {
  margin-top: auto;
  color: #bdefff;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.3;
}

.upgrade-cost {
  color: #9eeaff;
  font-size: 0.78rem;
  font-weight: 800;
}

.upgrade-state {
  color: #bdefff;
  font-size: 0.78rem;
  font-weight: 900;
}

@media (max-width: 1080px) {
  .upgrade-grid {
    grid-template-columns: repeat(3, minmax(132px, 1fr));
  }
}

@media (max-width: 700px) {
  .upgrade-grid {
    grid-template-columns: 1fr;
  }
}
</style>
