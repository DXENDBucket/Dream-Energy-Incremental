<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { format, formatInt } from "@/engine/math/format";
import type { GameState } from "@/engine/core/state";
import { getChaoticEther } from "@/engine/strata/common/chaotic-ether";
import {
  DREAM_CRYSTAL_UPGRADE_BOUGHT_POWER_ID,
  DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID,
  DREAM_CRYSTAL_UPGRADE_REFINERY_EFFICIENCY_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID,
  DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID,
  DREAM_CRYSTAL_UPGRADE_ROWS,
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID,
  DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID,
  buyDreamCrystalUpgrade,
  canBuyDreamCrystalUpgrade,
  getDreamCrystalBoughtPowerBase,
  getDreamCrystalFirstTierUpgradeMultiplier,
  getDreamCrystalRefineryEfficiencyMultiplier,
  getDreamCrystalRefineryLogBase,
  getDreamCrystalRepeatableUpgradeBought,
  getDreamCrystalUpgradeCost,
  getDreamCrystalUpgradeDefinition,
  isDreamCrystalUpgradeUnlockedForPurchase,
  hasDreamCrystalUpgrade,
  type DreamCrystalUpgradeId,
} from "@/engine/strata/common/dream-crystals/upgrades";
import {
  getDreamEnergySoftcapOneBaseStrengthDisplay,
  getDreamEnergySoftcapTwoStrengthGrowth,
} from "@/engine/strata/common/dream-energy";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import UpgradeGridPage from "./UpgradeGridPage.vue";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const chaoticEtherText = computed(() => format(getChaoticEther(activeStratum.value)));

const upgradeRows = computed(() => {
  return DREAM_CRYSTAL_UPGRADE_ROWS.map((row) => {
    return row.map((id) => {
      const definition = getDreamCrystalUpgradeDefinition(id);
      const isBought = definition.kind === "single" && hasDreamCrystalUpgrade(activeStratum.value, id);
      const canBuy = canBuyDreamCrystalUpgrade(activeStratum.value, id);
      const costText = format(getDreamCrystalUpgradeCost(activeStratum.value, id));
      const rowUnlocked = isDreamCrystalUpgradeUnlockedForPurchase(activeStratum.value, id);

      return {
        id,
        title: t(`dreamCrystalUpgrades.items.${id}.title`),
        description: t(`dreamCrystalUpgrades.items.${id}.description`),
        footer: getUpgradeFooter(id),
        costText: t("dreamCrystalUpgrades.cost", { value: costText }),
        stateText: getUpgradeStateText(id, rowUnlocked),
        canBuy,
        isBought,
        rowUnlocked,
      };
    });
  });
});

function getUpgradeFooter(id: DreamCrystalUpgradeId): string {
  if (id === DREAM_CRYSTAL_UPGRADE_FIRST_TIER_TRIPLE_ID) {
    return t("dreamCrystalUpgrades.currentMultiplier", {
      value: format(getDreamCrystalFirstTierUpgradeMultiplier(activeStratum.value, 1)),
    });
  }

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

  if (id === DREAM_CRYSTAL_UPGRADE_SOFTCAP_TWO_WEAKEN_ID) {
    return t("dreamCrystalUpgrades.softcapTwoStatus", {
      value: format(getDreamEnergySoftcapTwoStrengthGrowth(activeStratum.value)),
    });
  }

  if (id === DREAM_CRYSTAL_UPGRADE_REFINE_KEEP_CRYSTALS_ID) {
    return hasDreamCrystalUpgrade(activeStratum.value, id)
      ? t("dreamCrystalUpgrades.refineKeepStatus.enabled")
      : t("dreamCrystalUpgrades.refineKeepStatus.disabled");
  }

  if (id === DREAM_CRYSTAL_UPGRADE_REFINE_AUTOBUYER_ID) {
    return hasDreamCrystalUpgrade(activeStratum.value, id)
      ? t("dreamCrystalUpgrades.refineAutobuyerStatus.enabled")
      : t("dreamCrystalUpgrades.refineAutobuyerStatus.disabled");
  }

  if (id === DREAM_CRYSTAL_UPGRADE_REFINERY_LOG_BASE_ID) {
    const bought = getDreamCrystalRepeatableUpgradeBought(activeStratum.value, id);
    const logBase = getDreamCrystalRefineryLogBase(activeStratum.value);

    return t("dreamCrystalUpgrades.refineryLogBaseStatus", {
      count: formatInt(bought),
      value: format(logBase),
    });
  }

  if (id === DREAM_CRYSTAL_UPGRADE_SOFTCAP_ONE_WEAKEN_ID) {
    const bought = getDreamCrystalRepeatableUpgradeBought(activeStratum.value, id);
    const strength = getDreamEnergySoftcapOneBaseStrengthDisplay(activeStratum.value);

    return t("dreamCrystalUpgrades.softcapOneStatus", {
      count: formatInt(bought),
      value: format(strength),
    });
  }

  return "";
}

function getUpgradeStateText(id: DreamCrystalUpgradeId, rowUnlocked: boolean): string {
  if (!rowUnlocked) {
    return t("dreamCrystalUpgrades.rowLocked");
  }

  const definition = getDreamCrystalUpgradeDefinition(id);

  if (definition.kind === "repeatable") {
    const bought = getDreamCrystalRepeatableUpgradeBought(activeStratum.value, id);
    return bought.gt(0)
      ? t("dreamCrystalUpgrades.buyRepeatable")
      : t("dreamCrystalUpgrades.buy");
  }

  if (hasDreamCrystalUpgrade(activeStratum.value, id)) {
    return t("dreamCrystalUpgrades.purchased");
  }

  return t("dreamCrystalUpgrades.buy");
}

const resourceText = computed(() => {
  return t("dreamCrystalUpgrades.availableCE", { value: chaoticEtherText.value });
});

function onBuyUpgrade(id: string) {
  buyDreamCrystalUpgrade(activeStratum.value, id as DreamCrystalUpgradeId);
}
</script>

<template>
  <UpgradeGridPage
    :resource-text="resourceText"
    :rows="upgradeRows"
    theme="dream"
    @buy="onBuyUpgrade"
  />
</template>
