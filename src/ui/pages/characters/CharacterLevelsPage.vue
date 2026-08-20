<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import {
  CHARACTER_DEFINITIONS,
  canUpgradeCharacterLevel,
  getCharacterAffixDefinition,
  getCharacterAffixValue,
  getCharacterLevel,
  getCharacterLevelCost,
  getCharacterLevelCostDefinition,
  getCharacterLevelResourceAmount,
  getMaxAffordableCharacterLevels,
  isCharacterOwned,
  upgradeCharacterLevel,
  upgradeCharacterLevelMax,
} from "@/engine/characters";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const characterRows = computed(() => CHARACTER_DEFINITIONS
  .filter(character => isCharacterOwned(props.game.state, character.id))
  .map(character => {
    const level = getCharacterLevel(props.game.state, character.id);
    const costDefinition = getCharacterLevelCostDefinition(character.id)!;
    return {
      character,
      levelText: formatInt(level),
      costText: format(getCharacterLevelCost(props.game.state, character.id)),
      resourceName: t(`characterLevels.resources.${costDefinition.resource}`),
      resourceAmountText: format(
        getCharacterLevelResourceAmount(props.game.state, costDefinition.resource),
      ),
      canUpgrade: canUpgradeCharacterLevel(props.game.state, character.id),
      maxLevelGainText: formatInt(getMaxAffordableCharacterLevels(props.game.state, character.id)),
      effects: character.affixIds.map(affixId => {
        const affix = getCharacterAffixDefinition(affixId);
        const value = getCharacterAffixValue(affixId, level);
        return {
          id: affix.id,
          label: t(affix.labelKey),
          value: `${affix.operator === "power" ? "^" : "×"}${
            affix.operator === "power" ? value.toFixed(3) : format(value)
          }`,
        };
      }),
    };
  }));

function onUpgrade(characterId: string): void {
  upgradeCharacterLevel(props.game.state, characterId);
}

function onUpgradeMax(characterId: string): void {
  upgradeCharacterLevelMax(props.game.state, characterId);
}
</script>

<template>
  <section class="levels-page">
    <article
      v-for="row in characterRows"
      :key="row.character.id"
      class="level-card"
      :class="`theme-${row.character.theme}`"
    >
      <div class="identity">
        <span class="symbol">{{ row.character.symbol }}</span>
        <div>
          <h3>{{ t(row.character.nameKey) }}</h3>
          <strong class="level-number">{{ row.levelText }}</strong>
        </div>
      </div>

      <div class="effects">
        <div v-for="effect in row.effects" :key="effect.id" class="effect-row">
          <span>{{ effect.label }}</span>
          <strong>{{ effect.value }}</strong>
        </div>
      </div>

      <div class="upgrade-area">
        <div class="resource-owned">
          {{ t("characterLevels.available", {
            resource: row.resourceName,
            amount: row.resourceAmountText,
          }) }}
        </div>
        <div class="upgrade-buttons">
          <button
            :disabled="!row.canUpgrade"
            @click="onUpgrade(row.character.id)"
          >
            {{ t("characterLevels.upgrade", { cost: row.costText, resource: row.resourceName }) }}
          </button>
          <button
            :disabled="!row.canUpgrade"
            @click="onUpgradeMax(row.character.id)"
          >
            {{ t("characterLevels.upgradeMax", { count: row.maxLevelGainText }) }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.levels-page {
  box-sizing: border-box;
  width: min(1240px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 14px;
  color: #edf0ff;
}

.level-card {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(140px, 0.65fr) minmax(180px, 0.9fr) minmax(300px, 1.2fr);
  align-items: center;
  gap: 18px;
  padding: 16px 18px;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-background);
  box-shadow: inset 0 0 20px var(--theme-glow), 0 8px 22px rgba(0,0,0,0.22);
}

.theme-monochrome {
  --theme-border: #e8e8eb;
  --theme-background: linear-gradient(145deg, #292b31, #0b0c10 70%);
  --theme-glow: rgba(255,255,255,0.08);
}

.theme-cyan {
  --theme-border: #7ff8ff;
  --theme-background: linear-gradient(145deg, #123d48, #071c24 70%);
  --theme-glow: rgba(89,240,255,0.1);
}

.theme-gold {
  --theme-border: #ffe28a;
  --theme-background: linear-gradient(145deg, #50380d, #1d1304 70%);
  --theme-glow: rgba(255,208,76,0.11);
}

.theme-orange {
  --theme-border: #ffad5c;
  --theme-background: linear-gradient(145deg, #543015, #211006 70%);
  --theme-glow: rgba(255,139,48,0.14);
}

.theme-shielding {
  --theme-border: #9eeaff;
  --theme-background: linear-gradient(145deg, #285d70, #0a2132 70%);
  --theme-glow: rgba(104,207,255,0.16);
}

.identity { display: flex; align-items: center; gap: 15px; }
.symbol { font: 3.2rem/1 Georgia, serif; text-shadow: 0 0 12px currentColor; }
h3 { margin: 0 0 4px; }
.level-number { font-family: var(--font-number, monospace); font-size: 1.15rem; }

.effects { display: grid; gap: 6px; }
.effect-row { display: flex; justify-content: space-between; gap: 14px; color: #c4cce0; }
.effect-row strong { color: #fff; }

.upgrade-area { display: grid; gap: 7px; }
.resource-owned { color: #aeb8d3; font-size: 0.78rem; text-align: center; }
button {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 5px;
  color: #10131a;
  background: #eef2ff;
  font: inherit;
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
}
button:disabled { color: #858c9d; background: #202631; cursor: not-allowed; }

.upgrade-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
}

@media (max-width: 850px) {
  .level-card { grid-template-columns: 1fr; }
  .upgrade-area { width: min(100%, 460px); justify-self: center; }
}
</style>
