<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { formatInt } from "@/engine/math/format";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import {
  COHERENCE_UPGRADE_ROW_ONE,
  getCoherenceUpgradeDefinition,
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
      };
    }),
  ];
});
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
          disabled
          role="listitem"
        >
          <span class="upgrade-title">{{ upgrade.title }}</span>
          <span class="upgrade-description">{{ upgrade.description }}</span>
          <span class="upgrade-state">{{ t("coherenceUpgrades.pending") }}</span>
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
  cursor: not-allowed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  opacity: 0.72;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.28),
    inset 0 0 24px rgba(91, 213, 250, 0.08);
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

.upgrade-state {
  margin-top: auto;
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
