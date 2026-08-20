<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { getDreamEnergy } from "@/engine/strata/common/dream-energy";
import {
  getChaoticEther,
  getDreamCrystalUpgradeChaoticEtherTier,
} from "@/engine/strata/common/chaotic-ether";
import {
  ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID,
  ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID,
  ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID,
  ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID,
  ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID,
  ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID,
  ELECTROMAGNETIC_UPGRADE_ROWS,
  buyElectromagneticUpgrade,
  canBuyElectromagneticUpgrade,
  getElectromagneticDreamCrystalExponent,
  getElectromagneticHorizontalJudgeLines,
  getElectromagneticPower,
  getElectromagneticRepeatableUpgradeBought,
  getElectromagneticUpgradeDecayRateMultiplier,
  getElectromagneticUpgradeAdvancedPowerGainMultiplier,
  getElectromagneticUpgradeCoherencePointGainMultiplier,
  getElectromagneticUpgradeCost,
  getElectromagneticUpgradeDefinition,
  getElectromagneticUpgradePowerGainMultiplier,
  getElectromagneticVerticalJudgeLines,
  hasElectromagneticUpgrade,
  isElectromagneticUpgradeUnlockedForPurchase,
  isElectromagneticRepeatableUpgradeMaxed,
  type ElectromagneticUpgradeId,
} from "@/engine/electromagnetic-crystals";
import UpgradeGridPage from "./UpgradeGridPage.vue";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const activeStratum = computed(() => getActiveStratum(props.game.state));
const chaoticEtherTier = computed(() => (
  getDreamCrystalUpgradeChaoticEtherTier(activeStratum.value)
));
const resourceText = computed(() => t("electromagneticUpgrades.availableResources", {
  ep: format(getElectromagneticPower(activeStratum.value)),
  de: format(getDreamEnergy(activeStratum.value)),
  ceTier: chaoticEtherTier.value,
  ce: format(getChaoticEther(activeStratum.value, chaoticEtherTier.value)),
}));

function getUpgradeFooter(id: ElectromagneticUpgradeId): string {
  if (id === ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_ID) {
    return t("electromagneticUpgrades.judgeLineStatus", {
      count: getElectromagneticVerticalJudgeLines(activeStratum.value).length
        + getElectromagneticHorizontalJudgeLines(activeStratum.value).length,
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_VERTICAL_JUDGE_LINES_ID) {
    return t("electromagneticUpgrades.verticalJudgeLineStatus", {
      count: getElectromagneticVerticalJudgeLines(activeStratum.value).length,
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_HORIZONTAL_JUDGE_LINES_THREE_ID) {
    return t("electromagneticUpgrades.horizontalJudgeLineStatus", {
      count: getElectromagneticHorizontalJudgeLines(activeStratum.value).length,
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_MAGNETIC_FIELD_RANGE_ID) {
    return t("electromagneticUpgrades.magneticRangeStatus", {
      range: hasElectromagneticUpgrade(activeStratum.value, id) ? "-3～3" : "-2～2",
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_ELECTRIC_FIELD_RANGE_ID) {
    return t("electromagneticUpgrades.electricRangeStatus", {
      range: hasElectromagneticUpgrade(activeStratum.value, id) ? "0～3" : "0～2",
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_POWER_GAIN_ID) {
    return t("electromagneticUpgrades.powerGainStatus", {
      count: formatInt(getElectromagneticRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getElectromagneticUpgradePowerGainMultiplier(activeStratum.value)),
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_CONVERSION_EXPONENT_ID) {
    return t("electromagneticUpgrades.exponentStatus", {
      count: formatInt(getElectromagneticRepeatableUpgradeBought(activeStratum.value, id)),
      value: getElectromagneticDreamCrystalExponent(activeStratum.value).toFixed(2),
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_POWER_DECAY_ID) {
    return t("electromagneticUpgrades.decayRateStatus", {
      count: formatInt(getElectromagneticRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getElectromagneticUpgradeDecayRateMultiplier(activeStratum.value)),
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_ADVANCED_POWER_GAIN_ID) {
    return t("electromagneticUpgrades.advancedPowerGainStatus", {
      count: formatInt(getElectromagneticRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getElectromagneticUpgradeAdvancedPowerGainMultiplier(activeStratum.value)),
    });
  }
  if (id === ELECTROMAGNETIC_UPGRADE_COHERENCE_POINT_GAIN_ID) {
    return t("electromagneticUpgrades.coherencePointGainStatus", {
      value: format(getElectromagneticUpgradeCoherencePointGainMultiplier(activeStratum.value)),
    });
  }
  return t("electromagneticUpgrades.testingStatus");
}

function getUpgradeCostText(id: ElectromagneticUpgradeId): string {
  const definition = getElectromagneticUpgradeDefinition(id);
  if (
    definition.kind === "placeholder"
    || !definition.resource
    || isElectromagneticRepeatableUpgradeMaxed(activeStratum.value, id)
  ) return "";
  return t(`electromagneticUpgrades.cost.${definition.resource}`, {
    value: format(getElectromagneticUpgradeCost(activeStratum.value, id)),
    tier: chaoticEtherTier.value,
  });
}

function getUpgradeStateText(id: ElectromagneticUpgradeId): string {
  if (!isElectromagneticUpgradeUnlockedForPurchase(activeStratum.value, id)) {
    return t("electromagneticUpgrades.rowLocked");
  }
  const definition = getElectromagneticUpgradeDefinition(id);
  if (definition.kind === "placeholder") return t("electromagneticUpgrades.pending");
  if (definition.kind === "single") {
    return hasElectromagneticUpgrade(activeStratum.value, id)
      ? t("electromagneticUpgrades.purchased")
      : t("electromagneticUpgrades.buy");
  }
  if (isElectromagneticRepeatableUpgradeMaxed(activeStratum.value, id)) {
    return t("electromagneticUpgrades.maxed");
  }
  return getElectromagneticRepeatableUpgradeBought(activeStratum.value, id).gt(0)
    ? t("electromagneticUpgrades.buyRepeatable")
    : t("electromagneticUpgrades.buy");
}

const upgradeRows = computed(() => ELECTROMAGNETIC_UPGRADE_ROWS.map(row => row.map(id => {
  const definition = getElectromagneticUpgradeDefinition(id);
  const isMaxed = isElectromagneticRepeatableUpgradeMaxed(activeStratum.value, id);
  return {
    id,
    title: t(`electromagneticUpgrades.items.${id}.title`),
    description: t(`electromagneticUpgrades.items.${id}.description`),
    footer: getUpgradeFooter(id),
    costText: getUpgradeCostText(id),
    stateText: getUpgradeStateText(id),
    canBuy: canBuyElectromagneticUpgrade(activeStratum.value, id),
    isBought: (definition.kind === "single" && hasElectromagneticUpgrade(activeStratum.value, id))
      || isMaxed,
  };
})));

function onBuyUpgrade(id: string): void {
  buyElectromagneticUpgrade(activeStratum.value, id as ElectromagneticUpgradeId);
}
</script>

<template>
  <UpgradeGridPage
    :resource-text="resourceText"
    :rows="upgradeRows"
    theme="electromagnetic"
    @buy="onBuyUpgrade"
  />
</template>
