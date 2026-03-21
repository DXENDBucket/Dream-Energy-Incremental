<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "@/engine/core/state";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  MILESTONE_ORDER,
  MILESTONE_META,
  getMilestoneRequirementText,
  hasMilestone,
  canClaimMilestone,
  claimMilestone,
} from "@/engine/strata/common/milestones";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const activeStratum = computed(() => getActiveStratum(props.game.state));

const milestoneRows = computed(() => {
  return MILESTONE_ORDER.map((id) => ({
    id,
    title: MILESTONE_META[id].title,
    description: MILESTONE_META[id].description,
    rewardText: MILESTONE_META[id].rewardText,
    requirementText: getMilestoneRequirementText(id),
    claimed: hasMilestone(activeStratum.value.milestones, id),
    canClaim: canClaimMilestone(activeStratum.value, id),
  }));
});

function onClaimMilestone(id: string) {
  claimMilestone(activeStratum.value, id);
}
</script>

<template>
  <div class="milestones-page">
    <div
      v-for="row in milestoneRows"
      :key="row.id"
      class="milestone-card"
      :class="{ claimed: row.claimed }"
    >
      <div class="milestone-left">
        <div class="milestone-title">{{ row.title }}</div>
        <div class="milestone-reward">{{ row.rewardText }}</div>
        <div class="milestone-description">{{ row.description }}</div>
        <div class="milestone-requirement">{{ row.requirementText }}</div>
      </div>

      <div class="milestone-right">
        <button
          class="claim-button"
          :class="{
            disabled: !row.canClaim && !row.claimed,
            claimed: row.claimed
          }"
          :disabled="row.claimed || !row.canClaim"
          @click="onClaimMilestone(row.id)"
        >
          {{ row.claimed ? "Claimed" : "Claim" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.milestones-page {
  width: min(1180px, 97%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.milestone-card {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid #2b3758;
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(20, 28, 50, 0.94) 0%, rgba(12, 18, 33, 0.98) 100%);
  color: #e9ecff;
}

.milestone-card.claimed {
  border-color: #5b8f70;
}

.milestone-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f6f3ff;
}

.milestone-description,
.milestone-requirement,
.milestone-reward {
  margin-top: 6px;
  color: #aeb8da;
  line-height: 1.35;
}

.claim-button {
  width: 100%;
  min-height: 54px;
  border: 1px solid #426f4f;
  border-radius: 4px;
  background:
    linear-gradient(180deg, #24422b 0%, #172b1b 100%);
  color: #f2fff2;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.claim-button.disabled {
  border-color: #4a3a55;
  background:
    linear-gradient(180deg, #2a2330 0%, #1a1620 100%);
  color: #c8bfd6;
  cursor: not-allowed;
}

.claim-button.claimed {
  border-color: #5b8f70;
  background:
    linear-gradient(180deg, #294634 0%, #1b2f22 100%);
}
</style>