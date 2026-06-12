<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ENTROPY_TUNING_ID,
  COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID,
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  COHERENCE_UPGRADE_ROW_ONE,
  COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID,
  buyCoherenceUpgrade,
  canBuyCoherenceUpgrade,
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceEntropyTuningExponent,
  getCoherenceNextDreamCrystalMultiplierBonus,
  getCoherencePointGainMultiplier,
  getCoherenceRepeatableUpgradeBought,
  getCoherenceSoftcapTwoStrengthMultiplier,
  getCoherenceUpgradeCost,
  getCoherenceUpgradeDefinition,
  hasCoherenceUpgrade,
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

const upgradeRows = computed(() => {
  return [
    COHERENCE_UPGRADE_ROW_ONE.map((id) => {
      const definition = getCoherenceUpgradeDefinition(id);
      const isBought = definition.kind === "single" && hasCoherenceUpgrade(activeStratum.value, id);

      return {
        id: definition.id,
        title: t(`coherenceUpgrades.items.${definition.id}.title`),
        description: t(`coherenceUpgrades.items.${definition.id}.description`),
        footer: getUpgradeFooter(definition.id),
        costText: definition.kind !== "placeholder"
          ? t("coherenceUpgrades.cost", {
            value: formatInt(getCoherenceUpgradeCost(activeStratum.value, definition.id)),
          })
          : "",
        stateText: getUpgradeStateText(definition.id),
        canBuy: canBuyCoherenceUpgrade(activeStratum.value, definition.id),
        isBought,
      };
    }),
  ];
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

  return "";
}

function getUpgradeStateText(id: CoherenceUpgradeId): string {
  const definition = getCoherenceUpgradeDefinition(id);
  if (definition.kind === "placeholder") return t("coherenceUpgrades.pending");

  if (definition.kind === "single") {
    return hasCoherenceUpgrade(activeStratum.value, id)
      ? t("coherenceUpgrades.purchased")
      : t("coherenceUpgrades.buy");
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
</script>

<template>
  <UpgradeGridPage
    :resource-text="resourceText"
    :rows="upgradeRows"
    theme="coherence"
    @buy="onBuyUpgrade"
  />
</template>
