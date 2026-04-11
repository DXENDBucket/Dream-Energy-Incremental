<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import DreamCrystalRow from "./DreamCrystalRow.vue";
import { format, formatInt } from "@/engine/math/format";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import { isRefineUnlocked } from "@/engine/strata/common/milestones";
import {
  canRefineDreamCrystal,
  getDreamCrystalRefinementMultiplierGainRatio,
  refineDreamCrystal,
} from "@/engine/strata/common/dream-crystals/refinement";
import {
  DREAM_CRYSTAL_TIERS,
  getDreamCrystalMultiplier,
  getDreamCrystalPercentageGainPerSecond,
  type DreamCrystalTier,
} from "@/engine/math/dream-crystals";
import {
  getCurrentDreamCrystalCost,
  canBuyDreamCrystal,
  buyDreamCrystal,
  buyMaxDreamCrystal,
} from "@/engine/strata/common/dream-crystals/logic";
import { getDreamCrystalAmount } from "@/engine/strata/common/dream-crystals/selectors";
import type { GameState } from "@/engine/core/state";
import { getDreamCrystalTitle } from "@/ui/meta/dreamCrystals";
import {
  formatMultiplierText,
  formatPercentagePerSecondText,
} from "@/ui/formatters/progression";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const refineUnlocked = computed(() => isRefineUnlocked(activeStratum.value));

const dreamCrystalRows = computed(() => {
  return DREAM_CRYSTAL_TIERS.map((tier) => {
    const multiplier = getDreamCrystalMultiplier(activeStratum.value, tier);
    const refinementIncrement = getDreamCrystalRefinementMultiplierGainRatio(activeStratum.value, tier);
    const canRefine = canRefineDreamCrystal(activeStratum.value, tier);

    return {
      tier,
      title: getDreamCrystalTitle(t, tier as DreamCrystalTier),
      amountText: formatInt(getDreamCrystalAmount(activeStratum.value.dreamCrystals, tier)),
      percentageText: formatPercentagePerSecondText(
        getDreamCrystalPercentageGainPerSecond(activeStratum.value, tier),
      ),
      multiplierText: formatMultiplierText(multiplier),
      costText: format(getCurrentDreamCrystalCost(activeStratum.value, tier)),
      canBuy: canBuyDreamCrystal(activeStratum.value, tier),
      refineUnlocked: refineUnlocked.value,
      canRefine,
      refineHint: canRefine
        ? t("dreamCrystals.refineGain", { value: formatMultiplierText(refinementIncrement) })
        : t("dreamCrystals.noRefinementGain"),
    };
  });
});

function onBuyDreamCrystal(tier: number) {
  buyDreamCrystal(activeStratum.value, tier);
}

function onBuyMaxDreamCrystal(tier: number) {
  buyMaxDreamCrystal(activeStratum.value, tier);
}

function onRefineDreamCrystal(tier: number) {
  refineDreamCrystal(activeStratum.value, tier);
}
</script>

<template>
  <div class="crystals-page">
    <div class="crystals-list">
      <DreamCrystalRow
        v-for="row in dreamCrystalRows"
        :key="row.tier"
        :title="row.title"
        :amount-text="row.amountText"
        :percentage-text="row.percentageText"
        :multiplier-text="row.multiplierText"
        :cost-text="row.costText"
        :can-buy="row.canBuy"
        :refine-unlocked="row.refineUnlocked"
        :can-refine="row.canRefine"
        :refine-hint="row.refineHint"
        @buy="onBuyDreamCrystal(row.tier)"
        @buyMax="onBuyMaxDreamCrystal(row.tier)"
        @refine="onRefineDreamCrystal(row.tier)"
      />
    </div>
  </div>
</template>

<style scoped>
.crystals-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.crystals-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}
</style>
