<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format } from "@/engine/math/format";
import {
  CRUSH_MILESTONE_COUNT,
  CRUSH_MILESTONE_DEFINITIONS,
  getCrushDreamCrystalMultiplier,
  getCrushMilestoneCount,
} from "@/engine/crush";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const milestoneCount = computed(() => getCrushMilestoneCount(props.game.state));
const dreamCrystalMultiplierText = computed(() => format(
  getCrushDreamCrystalMultiplier(props.game.state),
));
const milestoneRows = computed(() => CRUSH_MILESTONE_DEFINITIONS.map(definition => ({
  ...definition,
  reached: milestoneCount.value >= definition.index,
  next: milestoneCount.value + 1 === definition.index,
})));
</script>

<template>
  <section class="crush-milestones">
    <header class="crush-header">
      <div>
        <div class="crush-kicker">{{ t("crushMilestones.kicker") }}</div>
        <h3>{{ t("crushMilestones.title") }}</h3>
        <p>{{ t("crushMilestones.description") }}</p>
      </div>
      <div class="crush-summary">
        <div class="crush-total">
          <strong>{{ milestoneCount }}</strong>
          <span>/ {{ CRUSH_MILESTONE_COUNT }}</span>
        </div>
        <div class="crush-dc-bonus">
          {{ t("crushMilestones.currentDcBonus", { value: dreamCrystalMultiplierText }) }}
        </div>
      </div>
    </header>

    <div class="placeholder-note">{{ t("crushMilestones.placeholderNote") }}</div>

    <div class="milestone-grid">
      <article
        v-for="milestone in milestoneRows"
        :key="milestone.index"
        class="milestone-card"
        :class="{ reached: milestone.reached, next: milestone.next }"
      >
        <div class="milestone-index">{{ milestone.index }}</div>
        <div class="milestone-copy">
          <div class="milestone-title-row">
            <h4>{{ t(milestone.titleKey) }}</h4>
            <span class="milestone-status">
              {{ t(milestone.reached
                ? "crushMilestones.reached"
                : milestone.next
                  ? "crushMilestones.next"
                  : "crushMilestones.locked") }}
            </span>
          </div>
          <p>{{ t(milestone.effectKey) }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.crush-milestones {
  width: min(1120px, 97%);
  margin: 0 auto;
  color: #eadde0;
}

.crush-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid rgba(185, 28, 52, 0.72);
  border-radius: 8px;
  background:
    radial-gradient(circle at 90% 20%, rgba(222, 25, 54, 0.16), transparent 30%),
    linear-gradient(145deg, rgba(45, 4, 12, 0.98), rgba(10, 2, 5, 0.995));
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3), inset 0 0 28px rgba(255, 34, 69, 0.05);
}

.crush-kicker {
  color: #df5167;
  font-size: 0.73rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h3 { margin: 5px 0 7px; color: #fff0f2; font-size: 1.55rem; }
.crush-header p { margin: 0; color: #bc9299; }
.crush-total { display: flex; align-items: baseline; gap: 7px; color: #d78d98; }
.crush-total strong { color: #fff1f3; font: 800 2.3rem var(--font-number); text-shadow: 0 0 18px rgba(255, 40, 74, 0.4); }
.crush-summary { flex: 0 0 auto; text-align: right; }
.crush-dc-bonus { margin-top: 3px; color: #ff9aaa; font-size: 0.78rem; font-weight: 750; }

.placeholder-note {
  margin: 12px 0 16px;
  padding: 10px 13px;
  border-left: 3px solid #9c2438;
  background: rgba(72, 11, 21, 0.38);
  color: #c99ca4;
  font-size: 0.84rem;
}

.milestone-grid { display: grid; gap: 10px; }
.milestone-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: stretch;
  min-height: 92px;
  overflow: hidden;
  border: 1px solid rgba(95, 45, 54, 0.7);
  border-radius: 7px;
  background: linear-gradient(135deg, rgba(27, 18, 21, 0.98), rgba(10, 8, 10, 0.99));
  opacity: 0.68;
}

.milestone-card.next { border-color: rgba(213, 52, 76, 0.82); opacity: 1; box-shadow: 0 0 20px rgba(199, 25, 52, 0.12); }
.milestone-card.reached { border-color: rgba(181, 34, 57, 0.88); opacity: 1; background: linear-gradient(135deg, rgba(57, 7, 16, 0.98), rgba(15, 3, 7, 0.995)); }
.milestone-index { display: grid; place-items: center; border-right: 1px solid rgba(155, 43, 61, 0.38); color: #e15c71; font: 850 1.3rem var(--font-number); }
.milestone-copy { padding: 14px 16px; }
.milestone-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h4 { margin: 0; color: #f7e8eb; font-size: 1rem; }
.milestone-copy p { margin: 7px 0 0; color: #b99097; line-height: 1.45; }
.milestone-status { flex: 0 0 auto; padding: 2px 8px; border: 1px solid #6c3a43; border-radius: 999px; color: #bb8d95; font-size: 0.68rem; font-weight: 800; }
.reached .milestone-status { border-color: #bd374e; background: rgba(139, 19, 38, 0.5); color: #ffd8de; }
.next .milestone-status { border-color: #e06779; color: #ffbac5; }

@media (max-width: 650px) {
  .crush-header { align-items: flex-start; }
  .milestone-card { grid-template-columns: 44px 1fr; }
  .milestone-title-row { align-items: flex-start; flex-direction: column; gap: 6px; }
}
</style>
