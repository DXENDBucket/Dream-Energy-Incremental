<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  COHERENCE_UPGRADE_AUTOBUYER_ID,
  COHERENCE_UPGRADE_AUTOBUYER_SPEED_ID,
  COHERENCE_UPGRADE_BEST_ENTRY_COHERENCE_ID,
  COHERENCE_UPGRADE_BEST_NEXT_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID,
  COHERENCE_UPGRADE_ENTROPY_TUNING_ID,
  COHERENCE_UPGRADE_NEXT_DREAM_CRYSTAL_MULTIPLIER_ID,
  COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID,
  COHERENCE_UPGRADE_ROWS,
  COHERENCE_UPGRADE_SOFTCAP_TWO_SLOWDOWN_ID,
  COHERENCE_UPGRADE_SOFTCAP_THREE_SLOWDOWN_ID,
  buyCoherenceUpgrade,
  canBuyCoherenceUpgrade,
  getCoherenceBestEntryCoherenceMultiplier,
  getCoherenceBestNextDreamEnergy,
  getCoherenceBestNextDreamEnergyMultiplier,
  getCoherenceDeeperInitialDreamEnergyBonus,
  getCoherenceEntropyTuningExponent,
  getCoherenceNextDreamCrystalMultiplierBonus,
  getCoherencePointGainMultiplier,
  getCoherenceRepeatableUpgradeBought,
  getCoherenceSoftcapTwoStrengthMultiplier,
  getCoherenceSoftcapThreeStrengthMultiplier,
  getCoherenceUpgradeCost,
  getCoherenceUpgradeDefinition,
  hasCoherenceUpgrade,
  isCoherenceRepeatableUpgradeMaxed,
  isCoherenceUpgradeUnlockedForPurchase,
  type CoherenceUpgradeId,
} from "@/engine/strata/common/coherence/upgrades";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { getDreamCrystalAutobuyerIntervalSec } from "@/engine/strata/common/dream-crystals/autobuyers";
import UpgradeGridPage from "./UpgradeGridPage.vue";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const coherencePointsText = computed(() => formatInt(getCoherencePoints(activeStratum.value)));

const upgradeRows = computed(() => COHERENCE_UPGRADE_ROWS.map(row =>
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
  }),
));

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
  if (id === COHERENCE_UPGRADE_SOFTCAP_THREE_SLOWDOWN_ID) {
    return t("coherenceUpgrades.softcapThreeSlowdownStatus", {
      count: formatInt(getCoherenceRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getCoherenceSoftcapThreeStrengthMultiplier(activeStratum.value)),
    });
  }
  if (id === COHERENCE_UPGRADE_AUTOBUYER_SPEED_ID) {
    return t("coherenceUpgrades.autobuyerSpeedStatus", {
      count: formatInt(getCoherenceRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getDreamCrystalAutobuyerIntervalSec(activeStratum.value)),
    });
  }
  if (id === COHERENCE_UPGRADE_DEEPER_INITIAL_DREAM_ENERGY_ID) {
    return t("coherenceUpgrades.deeperInitialDreamEnergyStatus", {
      count: formatInt(getCoherenceRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getCoherenceDeeperInitialDreamEnergyBonus(activeStratum.value)),
    });
  }
  if (id === COHERENCE_UPGRADE_POINT_GAIN_MULTIPLIER_ID) {
    return t("coherenceUpgrades.pointGainMultiplierStatus", {
      count: formatInt(getCoherenceRepeatableUpgradeBought(activeStratum.value, id)),
      value: format(getCoherencePointGainMultiplier(activeStratum.value)),
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
  if (id === COHERENCE_UPGRADE_AUTOBUYER_ID && hasCoherenceUpgrade(activeStratum.value, id)) {
    return t("coherenceUpgrades.autobuyer.unlockedStatus");
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
  return getCoherenceRepeatableUpgradeBought(activeStratum.value, id).gt(0)
    ? t("coherenceUpgrades.buyRepeatable")
    : t("coherenceUpgrades.buy");
}

const resourceText = computed(() => t("coherenceUpgrades.availableCP", {
  value: coherencePointsText.value,
}));

function onBuyUpgrade(id: string): void {
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
