<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import {
  CHARACTER_MIN_LEVEL,
  CHARACTER_UNLOCK_COSTS,
  CHARACTER_UNLOCK_ORDER,
  canUnlockCharacter,
  getCharacterAffixDefinition,
  getCharacterAffixValue,
  getCharacterDefinition,
  isCharacterOwned,
  isCharacterUnlockAvailable,
  unlockCharacter,
  type UnlockableCharacterId,
} from "@/engine/characters";
import { getCoherencePoints } from "@/engine/strata/common/coherence";
import { realityStratumId } from "@/engine/strata/defs";

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();

const realityCoherencePoints = computed(() =>
  getCoherencePoints(props.game.state.strata[realityStratumId]!),
);
const unlockRows = computed(() => CHARACTER_UNLOCK_ORDER.map(characterId => {
  const character = getCharacterDefinition(characterId)!;
  return {
    characterId,
    character,
    costText: formatInt(CHARACTER_UNLOCK_COSTS[characterId]),
    owned: isCharacterOwned(props.game.state, characterId),
    available: isCharacterUnlockAvailable(props.game.state, characterId),
    canUnlock: canUnlockCharacter(props.game.state, characterId),
    effects: character.affixIds.map(affixId => {
      const affix = getCharacterAffixDefinition(affixId);
      const value = getCharacterAffixValue(affixId, CHARACTER_MIN_LEVEL);
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

function onUnlock(characterId: UnlockableCharacterId): void {
  unlockCharacter(props.game.state, characterId);
}
</script>

<template>
  <section class="unlocks-page">
    <div class="resource-line">
      {{ t("characterUnlocks.realityCP", { value: formatInt(realityCoherencePoints) }) }}
    </div>

    <div class="unlock-grid">
      <article
        v-for="row in unlockRows"
        :key="row.characterId"
        class="unlock-card"
        :class="[`theme-${row.character.theme}`, { owned: row.owned, locked: !row.available }]"
      >
        <div class="character-preview">
          <div class="preview-symbol">{{ row.character.symbol }}</div>
          <h3>{{ t(row.character.nameKey) }}</h3>
          <span>Lv. 1</span>
        </div>

        <div class="effect-list">
          <div v-for="effect in row.effects" :key="effect.id" class="effect-row">
            <span>{{ effect.label }}</span>
            <strong>{{ effect.value }}</strong>
          </div>
        </div>

        <button
          :disabled="row.owned || !row.canUnlock"
          @click="onUnlock(row.characterId)"
        >
          <template v-if="row.owned">{{ t("characterUnlocks.unlocked") }}</template>
          <template v-else-if="!row.available">{{ t("characterUnlocks.previousRequired") }}</template>
          <template v-else>{{ t("characterUnlocks.unlockFor", { cost: row.costText }) }}</template>
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.unlocks-page {
  width: min(980px, 97%);
  margin: 0 auto;
  color: #edf0ff;
}

.resource-line {
  margin-bottom: 18px;
  color: #cbd3ed;
  text-align: center;
  font-weight: 800;
}

.unlock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 18px;
}

.unlock-card {
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-background);
  box-shadow: 0 10px 28px rgba(0,0,0,0.28), inset 0 0 22px var(--theme-glow);
}

.theme-cyan {
  --theme-border: #7ff8ff;
  --theme-background: linear-gradient(150deg, #123d48, #071c24 68%);
  --theme-glow: rgba(89,240,255,0.12);
}

.theme-gold {
  --theme-border: #ffe28a;
  --theme-background: linear-gradient(150deg, #50380d, #1d1304 68%);
  --theme-glow: rgba(255,208,76,0.13);
}

.unlock-card.locked { filter: grayscale(0.75); opacity: 0.68; }
.unlock-card.owned { border-color: #72cf92; }

.character-preview {
  padding: 20px;
  text-align: center;
}

.preview-symbol {
  font-family: Georgia, serif;
  font-size: 4rem;
  line-height: 1;
  text-shadow: 0 0 14px currentColor;
}

h3 { margin: 8px 0 3px; font-size: 1.3rem; }
.character-preview span { color: #bac2d8; font-size: 0.8rem; }

.effect-list {
  display: grid;
  align-content: start;
  gap: 7px;
  padding: 14px 18px;
  border-top: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.2);
}

.effect-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: #c9d0e2;
  font-size: 0.86rem;
}

.effect-row strong { color: #fff; }

button {
  min-height: 52px;
  border: 0;
  border-top: 1px solid rgba(255,255,255,0.18);
  color: #10131a;
  background: #eef2ff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

button:disabled {
  color: #8d94a6;
  background: #202631;
  cursor: not-allowed;
}

.owned button:disabled { color: #baffcf; background: #1d3c2a; }

@media (max-width: 650px) {
  .unlock-grid { grid-template-columns: 1fr; }
}
</style>
