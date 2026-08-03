<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { format, formatInt } from "@/engine/math/format";
import {
  CHARACTER_MIN_LEVEL,
  assignCharacterToProduction,
  getCharacterAffixDefinition,
  getCharacterAffixValue,
  getCharacterChaoticEtherGainMultiplier,
  getCharacterCoherencePointGainMultiplier,
  getCharacterDefinition,
  getCharacterDreamCrystalMultiplier,
  getCharacterDreamCrystalMultiplierPower,
  getCharacterLevel,
  getCharacterProductionSlots,
  getCharacterRosterSlots,
  moveCharacterToRosterSlot,
  normalizeCharacterSystemState,
  syncCharacterProductionPowers,
} from "@/engine/characters";
import { getStratumDefinition } from "@/engine/strata/defs";

interface DraggedCharacter {
  characterId: string;
}

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();
const draggedCharacter = ref<DraggedCharacter | null>(null);
const hoveredCharacterId = ref<string | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

const activeStratumId = computed(() => props.game.state.activeStratumId);
const activeStratumName = computed(() => {
  const definition = getStratumDefinition(activeStratumId.value);
  return definition ? t(definition.labelKey) : activeStratumId.value;
});
const productionSlots = computed(() =>
  getCharacterProductionSlots(props.game.state, activeStratumId.value),
);
const rosterSlots = computed(() => {
  return getCharacterRosterSlots(props.game.state);
});
const bonusMultiplierText = computed(() =>
  format(getCharacterDreamCrystalMultiplier(props.game.state, activeStratumId.value)),
);
const bonusPowerText = computed(() =>
  getCharacterDreamCrystalMultiplierPower(props.game.state, activeStratumId.value).toFixed(3),
);
const bonusCoherencePointText = computed(() =>
  format(getCharacterCoherencePointGainMultiplier(props.game.state, activeStratumId.value)),
);
const bonusChaoticEtherText = computed(() =>
  format(getCharacterChaoticEtherGainMultiplier(props.game.state, activeStratumId.value)),
);
const hoveredCharacter = computed(() =>
  hoveredCharacterId.value ? getCharacterDefinition(hoveredCharacterId.value) : undefined,
);
const hoveredCharacterLevel = computed(() => hoveredCharacter.value
  ? getCharacterLevel(props.game.state, hoveredCharacter.value.id)
  : CHARACTER_MIN_LEVEL,
);
const hoveredCharacterEffects = computed(() => hoveredCharacter.value?.affixIds.map(affixId => {
  const affix = getCharacterAffixDefinition(affixId);
  const value = getCharacterAffixValue(affixId, hoveredCharacterLevel.value);
  return {
    id: affix.id,
    label: t(affix.labelKey),
    value: `${affix.operator === "power" ? "^" : "×"}${
      affix.operator === "power" ? value.toFixed(3) : format(value)
    }`,
  };
}) ?? []);
const tooltipStyle = computed(() => ({
  left: `${tooltipX.value}px`,
  top: `${tooltipY.value}px`,
}));

onMounted(() => {
  normalizeCharacterSystemState(props.game.state);
  syncCharacterProductionPowers(props.game.state);
});

function updateTooltipPosition(event: MouseEvent): void {
  const tooltipWidth = 280;
  const tooltipHeight = 170;
  tooltipX.value = Math.max(8, Math.min(event.clientX + 16, window.innerWidth - tooltipWidth - 8));
  tooltipY.value = Math.max(8, Math.min(event.clientY + 16, window.innerHeight - tooltipHeight - 8));
}

function showTooltip(characterId: string, event: MouseEvent): void {
  hoveredCharacterId.value = characterId;
  updateTooltipPosition(event);
}

function hideTooltip(): void {
  hoveredCharacterId.value = null;
}

function getCharacterThemeClass(characterId: string): string {
  return `theme-${getCharacterDefinition(characterId)?.theme ?? "monochrome"}`;
}

function beginDrag(characterId: string, event: DragEvent): void {
  hideTooltip();
  draggedCharacter.value = { characterId };
  event.dataTransfer?.setData("text/plain", characterId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function endDrag(): void {
  draggedCharacter.value = null;
}

function dropOnProduction(slotIndex: number): void {
  const dragged = draggedCharacter.value;
  if (!dragged) return;
  assignCharacterToProduction(
    props.game.state,
    activeStratumId.value,
    slotIndex,
    dragged.characterId,
  );
  draggedCharacter.value = null;
}

function dropOnRoster(slotIndex: number): void {
  const dragged = draggedCharacter.value;
  if (!dragged) return;
  moveCharacterToRosterSlot(props.game.state, slotIndex, dragged.characterId);
  draggedCharacter.value = null;
}
</script>

<template>
  <section class="characters-page">
    <header class="characters-header">
      <div>
        <div class="eyebrow">{{ t("characters.currentStratum") }}</div>
        <h2>{{ activeStratumName }}</h2>
      </div>
    </header>

    <div class="character-layout">
      <div class="character-storage">
        <div class="zone-title">{{ t("characters.productionZone") }}</div>
        <div class="production-zone">
          <div
            v-for="(characterId, index) in productionSlots"
            :key="index"
            class="production-slot"
            :class="{ occupied: characterId !== null }"
            @dragover.prevent
            @drop.prevent="dropOnProduction(index)"
          >
            <div
              v-if="characterId && getCharacterDefinition(characterId)"
              class="character-card"
              :class="getCharacterThemeClass(characterId)"
              draggable="true"
              @dragstart="beginDrag(characterId, $event)"
              @dragend="endDrag"
              @mouseenter="showTooltip(characterId, $event)"
              @mousemove="updateTooltipPosition"
              @mouseleave="hideTooltip"
            >
              <div class="character-symbol">{{ getCharacterDefinition(characterId)?.symbol }}</div>
              <div class="character-name">{{ t(getCharacterDefinition(characterId)!.nameKey) }}</div>
              <div class="character-level">{{ formatInt(getCharacterLevel(props.game.state, characterId)) }}</div>
            </div>
            <span v-else class="empty-label">{{ t("characters.emptySlot") }}</span>
          </div>
        </div>

        <div class="zone-title roster-title">{{ t("characters.sharedRoster") }}</div>
        <div class="roster-grid">
          <div
            v-for="(characterId, index) in rosterSlots"
            :key="index"
            class="roster-slot"
            :class="{ occupied: characterId !== null }"
            @dragover.prevent
            @drop.stop.prevent="dropOnRoster(index)"
          >
            <div
              v-if="characterId && getCharacterDefinition(characterId)"
              class="character-card"
              :class="getCharacterThemeClass(characterId)"
              draggable="true"
              @dragstart="beginDrag(characterId, $event)"
              @dragend="endDrag"
              @mouseenter="showTooltip(characterId, $event)"
              @mousemove="updateTooltipPosition"
              @mouseleave="hideTooltip"
            >
              <div class="character-symbol">{{ getCharacterDefinition(characterId)?.symbol }}</div>
              <div class="character-name">{{ t(getCharacterDefinition(characterId)!.nameKey) }}</div>
              <div class="character-level">{{ formatInt(getCharacterLevel(props.game.state, characterId)) }}</div>
            </div>
          </div>
        </div>
      </div>

      <aside class="bonus-panel">
        <div class="bonus-heading">{{ t("characters.characterBonuses") }}</div>
        <div class="bonus-row">
          <span>{{ t("characters.dreamCrystalMultiplier") }}</span>
          <strong>×{{ bonusMultiplierText }}</strong>
        </div>
        <div class="bonus-row">
          <span>{{ t("characters.dreamCrystalMultiplierPower") }}</span>
          <strong>^{{ bonusPowerText }}</strong>
        </div>
        <div class="bonus-row">
          <span>{{ t("characters.coherencePointGainMultiplier") }}</span>
          <strong>×{{ bonusCoherencePointText }}</strong>
        </div>
        <div class="bonus-row">
          <span>{{ t("characters.chaoticEtherGainMultiplier") }}</span>
          <strong>×{{ bonusChaoticEtherText }}</strong>
        </div>
      </aside>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="hoveredCharacter"
      class="character-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-heading">
        <span class="tooltip-symbol">{{ hoveredCharacter.symbol }}</span>
        <strong>{{ t(hoveredCharacter.nameKey) }}</strong>
        <span class="tooltip-level">{{ formatInt(hoveredCharacterLevel) }}</span>
      </div>
      <div
        v-for="effect in hoveredCharacterEffects"
        :key="effect.id"
        class="tooltip-ability"
      >
        <span>{{ effect.label }}</span>
        <b>{{ effect.value }}</b>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.characters-page {
  box-sizing: border-box;
  width: min(1280px, 99%);
  margin: 0 auto;
  padding: 0 8px;
  color: #e9ecff;
}

.characters-header {
  margin-bottom: 18px;
}

.character-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  align-items: start;
  gap: 18px;
}

.character-storage { min-width: 0; }

.eyebrow,
.zone-title,
.bonus-heading {
  color: #9fa9c6;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 { margin: 4px 0 0; }

.bonus-panel {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid #3d4458;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(20, 25, 38, 0.98), rgba(9, 12, 19, 0.98));
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
}

.bonus-heading {
  margin-bottom: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid #353c4e;
}

.bonus-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  color: #aeb8d3;
  font-size: 0.78rem;
}

.bonus-row strong {
  color: #fff;
  font-family: var(--font-number, monospace);
  font-size: 1rem;
}

.production-zone {
  grid-template-columns: repeat(2, calc((100% - 49px) / 8));
  justify-content: center;
  margin-top: 9px;
  border: 1px solid #3d4458;
  border-radius: 8px;
  background: radial-gradient(circle at 50% 10%, rgba(255,255,255,0.06), transparent 45%), #10141f;
}

.production-slot,
.roster-slot {
  display: grid;
  place-items: center;
  border: 1px dashed #485066;
  background: #1b202c;
}

.production-slot {
  aspect-ratio: 1 / 1;
  min-width: 0;
  border-radius: 6px;
}

.production-slot.occupied,
.roster-slot.occupied {
  border-style: solid;
  border-color: #eee;
}

.empty-label {
  color: #5f687f;
  font-size: 0.75rem;
}

.roster-title { margin-top: 25px; }

.roster-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr));
  margin-top: 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: rgba(8, 11, 18, 0.62);
}

.production-zone,
.roster-grid {
  box-sizing: border-box;
  width: 100%;
  display: grid;
  gap: 7px;
  padding: 10px;
}

.roster-slot {
  aspect-ratio: 1 / 1;
  min-width: 0;
  border-style: solid;
  border-color: #303746;
  border-radius: 3px;
}

.character-card {
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.character-card:active { cursor: grabbing; }

.theme-monochrome {
  border: 2px solid #fff;
  color: #fff;
  background:
    repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 7px),
    radial-gradient(circle at 50% 35%, #555 0%, #171717 46%, #050505 100%);
  box-shadow: inset 0 0 12px rgba(255,255,255,0.22), 0 0 9px rgba(255,255,255,0.16);
}

.theme-cyan {
  border: 2px solid #8cffff;
  color: #dfffff;
  background:
    repeating-linear-gradient(135deg, rgba(128,255,255,0.12) 0 2px, transparent 2px 7px),
    radial-gradient(circle at 50% 35%, #1f8990 0%, #0b3e48 46%, #041a22 100%);
  box-shadow: inset 0 0 12px rgba(130,255,255,0.3), 0 0 9px rgba(87,244,255,0.2);
}

.theme-gold {
  border: 2px solid #ffe79a;
  color: #fff4c7;
  background:
    repeating-linear-gradient(135deg, rgba(255,224,120,0.13) 0 2px, transparent 2px 7px),
    radial-gradient(circle at 50% 35%, #a47720 0%, #4a3109 46%, #1d1303 100%);
  box-shadow: inset 0 0 12px rgba(255,225,125,0.32), 0 0 9px rgba(255,207,75,0.22);
}

.character-symbol {
  font-family: Georgia, serif;
  font-size: max(20px, 45cqw);
  line-height: 1;
  text-shadow: 0 0 8px #fff;
}

.character-name {
  margin-top: 3cqw;
  font-size: max(8px, 12cqw);
  font-weight: 900;
}

.character-level {
  position: absolute;
  right: 3px;
  bottom: 2px;
  max-width: calc(100% - 6px);
  overflow: hidden;
  font-family: var(--font-number, monospace);
  font-size: max(7px, 8cqw);
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.84;
}

.character-tooltip {
  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  width: 280px;
  padding: 12px 14px;
  pointer-events: none;
  border: 1px solid #f2f2f2;
  border-radius: 6px;
  color: #f7f7f7;
  background: rgba(7, 8, 11, 0.97);
  box-shadow: 0 10px 30px rgba(0,0,0,0.48), inset 0 0 18px rgba(255,255,255,0.06);
}

.tooltip-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 9px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3f424b;
}

.tooltip-symbol {
  font-family: Georgia, serif;
  font-size: 1.55rem;
  line-height: 1;
}

.tooltip-level {
  margin-left: auto;
  color: #aeb5c7;
  font-size: 0.78rem;
}

.tooltip-ability {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 3px 0;
  color: #bfc4d1;
  font-size: 0.82rem;
}

.tooltip-ability b { color: #fff; }

@media (max-width: 720px) {
  .character-layout { grid-template-columns: 1fr; }
  .production-zone { grid-template-columns: repeat(2, calc((100% - 28px) / 5)); }
  .roster-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
</style>
