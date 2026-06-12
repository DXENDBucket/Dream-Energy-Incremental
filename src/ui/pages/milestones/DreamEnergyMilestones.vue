<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { getActiveStratum } from "@/engine/strata/manager/selectors";
import {
  MILESTONE_ORDER,
  getMilestoneRequirement,
  hasMilestone,
  canClaimMilestone,
  claimMilestone,
  type MilestoneId,
} from "@/engine/strata/common/milestones";
import {
  getMilestoneRequirementLabel,
  getMilestoneUiText,
} from "@/ui/meta/milestones";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const activeStratum = computed(() => getActiveStratum(props.game.state));
const claimEffectId = ref<string | null>(null);
let claimEffectTimer: number | null = null;

const milestoneRows = computed(() => {
  return MILESTONE_ORDER.map((id) => {
    const uiText = getMilestoneUiText(t, id as MilestoneId);
    const claimed = hasMilestone(activeStratum.value.milestones, id);
    const canClaim = canClaimMilestone(activeStratum.value, id);

    return {
      id,
      title: uiText.title,
      description: uiText.description,
      rewardText: uiText.rewardText,
      requirementText: getMilestoneRequirementLabel(t, getMilestoneRequirement(id)),
      claimed,
      canClaim,
      statusText: claimed
        ? t("milestones.claimed")
        : canClaim
          ? t("milestones.reachable")
          : t("milestones.unreached"),
    };
  });
});

function onClaimMilestone(id: string) {
  if (!canClaimMilestone(activeStratum.value, id)) return;

  claimMilestone(activeStratum.value, id);
  claimEffectId.value = id;

  if (claimEffectTimer !== null) {
    window.clearTimeout(claimEffectTimer);
  }

  claimEffectTimer = window.setTimeout(() => {
    claimEffectId.value = null;
    claimEffectTimer = null;
  }, 820);
}
</script>

<template>
  <div class="milestones-page">
    <div
      v-for="row in milestoneRows"
      :key="row.id"
      class="milestone-card"
      :class="{
        claimed: row.claimed,
        reachable: row.canClaim,
        unreached: !row.claimed && !row.canClaim,
        'claim-effect': claimEffectId === row.id
      }"
    >
      <div class="milestone-left">
        <div class="milestone-heading">
          <div class="milestone-title">{{ row.title }}</div>
          <div
            class="milestone-status"
            :class="{
              claimed: row.claimed,
              reachable: row.canClaim,
              unreached: !row.claimed && !row.canClaim
            }"
          >
            {{ row.statusText }}
          </div>
        </div>
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
          {{ row.claimed ? t("milestones.claimed") : t("milestones.claim") }}
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
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid #263150;
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(14, 20, 38, 0.95) 0%, rgba(8, 12, 24, 0.99) 100%);
  color: #e9ecff;
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.2),
    inset 0 0 16px rgba(84, 107, 170, 0.04);
  transition:
    border-color 0.16s ease,
    filter 0.16s ease,
    opacity 0.16s ease,
    box-shadow 0.16s ease;
}

.milestone-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  opacity: 0;
  background:
    radial-gradient(circle at 18% 50%, rgba(255, 214, 120, 0.22), transparent 30%),
    linear-gradient(90deg, transparent 0%, rgba(255, 238, 180, 0.16) 45%, transparent 74%);
  transform: translateX(-22%);
}

.milestone-card.claimed {
  border-color: rgba(95, 187, 126, 0.78);
  background:
    linear-gradient(180deg, rgba(18, 45, 32, 0.94) 0%, rgba(9, 23, 17, 0.99) 100%);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.24),
    inset 0 0 20px rgba(103, 255, 166, 0.06);
}

.milestone-card.reachable {
  border-color: rgba(255, 181, 80, 0.9);
  background:
    linear-gradient(180deg, rgba(54, 35, 19, 0.96) 0%, rgba(24, 15, 10, 0.99) 100%);
  box-shadow:
    0 0 24px rgba(255, 158, 64, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 0 22px rgba(255, 184, 82, 0.07);
  animation: reachable-pulse 1.7s ease-in-out infinite;
}

.milestone-card.unreached {
  opacity: 0.72;
  filter: saturate(0.78);
}

.milestone-card.claim-effect::before {
  animation: claim-sweep 0.82s ease-out;
}

.milestone-card.claim-effect {
  animation: claim-pop 0.42s ease-out;
}

.milestone-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.milestone-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f6f3ff;
}

.milestone-status {
  padding: 3px 8px;
  border: 1px solid rgba(124, 143, 194, 0.6);
  border-radius: 999px;
  color: #b8c4e6;
  background: rgba(22, 31, 54, 0.76);
  font-size: 0.72rem;
  font-weight: 900;
}

.milestone-status.reachable {
  border-color: rgba(255, 192, 94, 0.85);
  color: #ffe3a8;
  background: rgba(94, 56, 18, 0.74);
}

.milestone-status.claimed {
  border-color: rgba(122, 231, 159, 0.8);
  color: #baffcf;
  background: rgba(28, 79, 50, 0.74);
}

.milestone-status.unreached {
  color: #7f8bb3;
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
  transition:
    transform 0.1s ease,
    filter 0.15s ease,
    border-color 0.15s ease;
}

.claim-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #f0bc66;
  filter: brightness(1.08);
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

@keyframes reachable-pulse {
  0%,
  100% {
    box-shadow:
      0 0 22px rgba(255, 158, 64, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.28),
      inset 0 0 22px rgba(255, 184, 82, 0.06);
  }
  50% {
    box-shadow:
      0 0 34px rgba(255, 168, 67, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.28),
      inset 0 0 24px rgba(255, 184, 82, 0.12);
  }
}

@keyframes claim-pop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.012);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes claim-sweep {
  0% {
    opacity: 0;
    transform: translateX(-28%);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(36%);
  }
}

@media (max-width: 720px) {
  .milestone-card {
    grid-template-columns: 1fr;
  }
}
</style>
