<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import {
  REALITY_MILESTONE_ORDER,
  REALITY_MILESTONE_CHARACTER_PRODUCTION_ID,
  canClaimRealityMilestone,
  claimRealityMilestone,
  getRealityMilestoneDefinition,
  hasRealityMilestone,
  type RealityMilestoneId,
} from "@/engine/reality/milestones";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const milestoneRows = computed(() => REALITY_MILESTONE_ORDER
  .filter(id => !(
    id === REALITY_MILESTONE_CHARACTER_PRODUCTION_ID
    && props.game.state.crush.milestoneCount >= 6
  ))
  .map(id => {
    const definition = getRealityMilestoneDefinition(id);
    const claimed = hasRealityMilestone(props.game.state, id);
    const canClaim = canClaimRealityMilestone(props.game.state, id);
    return {
      ...definition,
      claimed,
      canClaim,
      requirement: t("realityMilestones.requirement", {
        amount: format(definition.dreamEnergyRequirement),
      }),
    };
  }));

function onClaim(id: RealityMilestoneId): void {
  claimRealityMilestone(props.game.state, id);
}
</script>

<template>
  <section class="reality-milestones">
    <div class="page-intro">{{ t("realityMilestones.description") }}</div>

    <article
      v-for="milestone in milestoneRows"
      :key="milestone.id"
      class="milestone-card"
      :class="{ claimed: milestone.claimed, reachable: milestone.canClaim }"
    >
      <div class="milestone-copy">
        <div class="milestone-title-row">
          <h3>{{ t(milestone.titleKey) }}</h3>
          <span
            class="status"
            :class="{ claimed: milestone.claimed, reachable: milestone.canClaim }"
          >
            {{ milestone.claimed
              ? t("realityMilestones.claimed")
              : milestone.canClaim
                ? t("realityMilestones.reachable")
                : t("realityMilestones.unreached") }}
          </span>
        </div>
        <div class="reward">{{ t(milestone.rewardKey) }}</div>
        <div class="detail">{{ t(milestone.descriptionKey) }}</div>
        <div class="requirement">{{ milestone.requirement }}</div>
      </div>

      <button
        class="claim-button"
        :class="{ claimed: milestone.claimed }"
        :disabled="milestone.claimed || !milestone.canClaim"
        @click="onClaim(milestone.id)"
      >
        {{ milestone.claimed ? t("realityMilestones.claimed") : t("realityMilestones.claim") }}
      </button>
    </article>
  </section>
</template>

<style scoped>
.reality-milestones {
  width: min(1100px, 97%);
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.page-intro {
  color: #b9c3df;
  text-align: center;
}

.milestone-card {
  display: grid;
  grid-template-columns: 1fr 150px;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border: 1px solid #333d58;
  border-radius: 7px;
  background: linear-gradient(145deg, rgba(28, 30, 39, 0.97), rgba(10, 12, 18, 0.99));
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.24);
}

.milestone-card.reachable {
  border-color: #d9d9d9;
  box-shadow: 0 0 22px rgba(255, 255, 255, 0.1);
}

.milestone-card.claimed {
  border-color: #70bb88;
  background: linear-gradient(145deg, rgba(22, 48, 34, 0.95), rgba(9, 20, 15, 0.99));
}

.milestone-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h3 {
  margin: 0;
  color: #f5f5f7;
}

.status {
  padding: 2px 8px;
  border: 1px solid #596078;
  border-radius: 999px;
  color: #c9cee0;
  font-size: 0.72rem;
  font-weight: 800;
}

.status.claimed {
  border-color: rgba(122, 231, 159, 0.8);
  color: #baffcf;
  background: rgba(28, 79, 50, 0.74);
}

.status.reachable:not(.claimed) {
  border-color: rgba(255, 192, 94, 0.85);
  color: #ffe3a8;
  background: rgba(94, 56, 18, 0.74);
}

.reward,
.detail,
.requirement {
  margin-top: 7px;
  color: #aeb8d3;
}

.reward {
  color: #f0f0f2;
  font-weight: 700;
}

.claim-button {
  min-height: 54px;
  border: 1px solid #cfcfd4;
  border-radius: 5px;
  color: #0a0a0c;
  background: linear-gradient(#fff, #bfc1c7);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.claim-button:disabled {
  border-color: #484c59;
  color: #858a9a;
  background: #20232b;
  cursor: not-allowed;
}

.claim-button.claimed,
.claim-button.claimed:disabled {
  border-color: #5b8f70;
  color: #baffcf;
  background: linear-gradient(180deg, #294634 0%, #1b2f22 100%);
}

@media (max-width: 700px) {
  .milestone-card { grid-template-columns: 1fr; }
}
</style>
