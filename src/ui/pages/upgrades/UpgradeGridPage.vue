<script setup lang="ts">
interface UpgradeGridItem {
  id: string;
  title: string;
  description: string;
  footer?: string;
  costText?: string;
  stateText: string;
  canBuy: boolean;
  isBought?: boolean;
}

withDefaults(defineProps<{
  resourceText: string;
  rows: UpgradeGridItem[][];
  theme?: "dream" | "coherence";
}>(), {
  theme: "dream",
});

const emit = defineEmits<{
  buy: [id: string];
}>();
</script>

<template>
  <div class="upgrades-page" :class="`theme-${theme}`">
    <div class="upgrades-resource">
      {{ resourceText }}
    </div>

    <div class="upgrade-grid" role="list">
      <template v-for="(row, rowIndex) in rows" :key="rowIndex">
        <button
          v-for="upgrade in row"
          :key="upgrade.id"
          class="upgrade-button"
          :class="{ purchased: upgrade.isBought }"
          :disabled="!upgrade.canBuy"
          role="listitem"
          type="button"
          @click="emit('buy', upgrade.id)"
        >
          <span class="upgrade-title">{{ upgrade.title }}</span>
          <span class="upgrade-description">{{ upgrade.description }}</span>
          <span class="upgrade-bottom">
            <span v-if="upgrade.footer" class="upgrade-footer">{{ upgrade.footer }}</span>
            <span v-if="upgrade.costText" class="upgrade-cost">{{ upgrade.costText }}</span>
            <span class="upgrade-state">{{ upgrade.stateText }}</span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.upgrades-page {
  width: min(1180px, 100%);
  --upgrade-resource-color: #ffd19a;
  --upgrade-resource-shadow: rgba(255, 151, 72, 0.28);
  --upgrade-border: rgba(80, 102, 159, 0.82);
  --upgrade-bg-top: rgba(22, 32, 59, 0.96);
  --upgrade-bg-bottom: rgba(12, 18, 34, 0.98);
  --upgrade-inset: rgba(110, 150, 255, 0.06);
  --upgrade-hover-border: rgba(255, 179, 93, 0.72);
  --upgrade-description: #b7c3e7;
  --upgrade-footer: #ffd19a;
  --upgrade-cost: #f4af73;
  --upgrade-state: #eff6ff;
}

.upgrades-page.theme-coherence {
  --upgrade-resource-color: #bdefff;
  --upgrade-resource-shadow: rgba(91, 213, 250, 0.3);
  --upgrade-border: rgba(94, 204, 244, 0.66);
  --upgrade-bg-top: rgba(17, 42, 64, 0.96);
  --upgrade-bg-bottom: rgba(9, 22, 38, 0.98);
  --upgrade-inset: rgba(91, 213, 250, 0.08);
  --upgrade-hover-border: rgba(189, 239, 255, 0.86);
  --upgrade-description: #b9dced;
  --upgrade-footer: #bdefff;
  --upgrade-cost: #9eeaff;
  --upgrade-state: #bdefff;
}

.upgrades-resource {
  margin-bottom: 14px;
  color: var(--upgrade-resource-color);
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
  text-shadow: 0 0 12px var(--upgrade-resource-shadow);
}

.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(178px, 220px));
  gap: 12px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  justify-content: center;
  align-items: stretch;
}

.upgrade-button {
  width: 100%;
  min-height: 210px;
  padding: 12px 10px;
  border: 1px solid var(--upgrade-border);
  border-radius: 6px;
  background:
    linear-gradient(180deg, var(--upgrade-bg-top) 0%, var(--upgrade-bg-bottom) 100%);
  color: #eef3ff;
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.28),
    inset 0 0 20px var(--upgrade-inset);
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.upgrade-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--upgrade-hover-border);
  filter: brightness(1.06);
}

.upgrade-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.upgrade-button.purchased {
  border-color: rgba(128, 231, 174, 0.74);
  background:
    linear-gradient(180deg, rgba(25, 61, 42, 0.95) 0%, rgba(13, 29, 22, 0.98) 100%);
}

.upgrade-title {
  color: #ffffff;
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.2;
}

.upgrade-description {
  color: var(--upgrade-description);
  font-size: 0.78rem;
  line-height: 1.35;
}

.upgrade-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.upgrade-footer {
  color: var(--upgrade-footer);
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.3;
}

.upgrade-cost {
  color: var(--upgrade-cost);
  font-size: 0.78rem;
  font-weight: 800;
}

.upgrade-state {
  color: var(--upgrade-state);
  font-size: 0.78rem;
  font-weight: 900;
}

@media (max-width: 1080px) {
  .upgrade-grid {
    grid-template-columns: repeat(3, minmax(170px, 1fr));
    width: min(100%, 720px);
  }
}

@media (max-width: 700px) {
  .upgrade-grid {
    grid-template-columns: 1fr;
    width: min(100%, 360px);
  }
}
</style>
