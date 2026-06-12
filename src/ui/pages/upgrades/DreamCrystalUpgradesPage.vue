<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { format, formatInt } from "@/engine/math/format";
import type { GameState } from "@/engine/core/state";
import { getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import {
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  DREAM_CRYSTAL_UPGRADE_ROW_ONE,
  buyDreamCrystalUpgrade,
  canBuyDreamCrystalUpgrade,
  getDreamCrystalBoughtPowerBase,
  getDreamCrystalRefineryEfficiencyMultiplier,
  getDreamCrystalRepeatableUpgradeBought,
  getDreamCrystalUpgradeCost,
  getDreamCrystalUpgradeDefinition,
  hasDreamCrystalUpgrade,
  type DreamCrystalUpgradeId,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { getActiveStratum } from "@/engine/strata/manager/selectors";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const chaoticEtherText = computed(() => format(getChaoticEther(activeStratum.value)));

const upgradeRows = computed(() => {
  return [
    DREAM_CRYSTAL_UPGRADE_ROW_ONE.map((id) => {
      const definition = getDreamCrystalUpgradeDefinition(id);
      const isBought = definition.kind === "single" && hasDreamCrystalUpgrade(activeStratum.value, id);
      const canBuy = canBuyDreamCrystalUpgrade(activeStratum.value, id);
      const costText = format(getDreamCrystalUpgradeCost(activeStratum.value, id));

      return {
        id,
        title: t(`dreamCrystalUpgrades.items.${id}.title`),
        description: t(`dreamCrystalUpgrades.items.${id}.description`),
        footer: getUpgradeFooter(id),
        costText: t("dreamCrystalUpgrades.cost", { value: costText }),
        stateText: getUpgradeStateText(id),
        canBuy,
        isBought,
      };
    }),
  ];
});

function getUpgradeFooter(id: DreamCrystalUpgradeId): string {
  if (id === DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID) {
    const bought = getDreamCrystalRepeatableUpgradeBought(activeStratum.value, id);
    const base = getDreamCrystalBoughtPowerBase(activeStratum.value);

    return t("dreamCrystalUpgrades.repeatableStatus", {
      count: formatInt(bought),
      bonus: format(base),
    });
  }

  if (id === DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID) {
    const bought = getDreamCrystalRepeatableUpgradeBought(activeStratum.value, id);
    const multiplier = getDreamCrystalRefineryEfficiencyMultiplier(activeStratum.value);

    return t("dreamCrystalUpgrades.refineryStatus", {
      count: formatInt(bought),
      multiplier: format(multiplier),
    });
  }

  return "";
}

function getUpgradeStateText(id: DreamCrystalUpgradeId): string {
  const definition = getDreamCrystalUpgradeDefinition(id);

  if (definition.kind === "repeatable") {
    return t("dreamCrystalUpgrades.buyRepeatable");
  }

  if (hasDreamCrystalUpgrade(activeStratum.value, id)) {
    return t("dreamCrystalUpgrades.purchased");
  }

  return t("dreamCrystalUpgrades.buy");
}

function onBuyUpgrade(id: DreamCrystalUpgradeId) {
  buyDreamCrystalUpgrade(activeStratum.value, id);
}
</script>

<template>
  <div class="dc-upgrades-page">
    <div class="dc-upgrades-resource">
      {{ t("dreamCrystalUpgrades.availableCE", { value: chaoticEtherText }) }}
    </div>

    <div class="upgrade-grid" role="list">
      <template v-for="(row, rowIndex) in upgradeRows" :key="rowIndex">
        <button
          v-for="upgrade in row"
          :key="upgrade.id"
          class="upgrade-button"
          :class="{ purchased: upgrade.isBought }"
          :disabled="!upgrade.canBuy"
          role="listitem"
          @click="onBuyUpgrade(upgrade.id)"
        >
          <span class="upgrade-title">{{ upgrade.title }}</span>
          <span class="upgrade-description">{{ upgrade.description }}</span>
          <span v-if="upgrade.footer" class="upgrade-footer">{{ upgrade.footer }}</span>
          <span class="upgrade-cost">{{ upgrade.costText }}</span>
          <span class="upgrade-state">{{ upgrade.stateText }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dc-upgrades-page {
  width: min(1180px, 100%);
}

.dc-upgrades-resource {
  margin-bottom: 14px;
  color: #ffd19a;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
  text-shadow: 0 0 12px rgba(255, 151, 72, 0.28);
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
  min-height: 178px;
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
  justify-content: flex-start;
  gap: 8px;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.28),
    inset 0 0 20px rgba(110, 150, 255, 0.06);
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.upgrade-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(255, 179, 93, 0.72);
  filter: brightness(1.06);
}

.upgrade-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.upgrade-button.purchased {
  border-color: rgba(128, 231, 174, 0.74);
  background:
    linear-gradient(180deg, rgba(25, 61, 42, 0.95) 0%, rgba(13, 29, 22, 0.98) 100%);
}

.upgrade-title {
  color: #ffffff;
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.2;
}

.upgrade-description {
  color: #b7c3e7;
  font-size: 0.78rem;
  line-height: 1.35;
}

.upgrade-footer {
  margin-top: auto;
  color: #ffd19a;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.3;
}

.upgrade-cost {
  color: #f4af73;
  font-size: 0.78rem;
  font-weight: 800;
}

.upgrade-state {
  color: #eff6ff;
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
