<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import {
  CHARACTER_ROSTER_SLOT_COUNT,
  assignCharacterToProduction,
  getCharacterDefinition,
  getCharacterDreamCrystalMultiplierPower,
  getCharacterProductionSlots,
  getUnassignedCharacterIds,
  unassignCharacterFromProduction,
} from "@/engine/characters";
import { getStratumDefinition } from "@/engine/strata/defs";

interface DraggedCharacter {
  characterId: string;
  sourceStratumId?: string;
  sourceSlotIndex?: number;
}

const props = defineProps<{ game: { state: GameState } }>();
const { t } = useI18n();
const draggedCharacter = ref<DraggedCharacter | null>(null);

const activeStratumId = computed(() => props.game.state.activeStratumId);
const activeStratumName = computed(() => {
  const definition = getStratumDefinition(activeStratumId.value);
  return definition ? t(definition.labelKey) : activeStratumId.value;
});
const productionSlots = computed(() =>
  getCharacterProductionSlots(props.game.state, activeStratumId.value),
);
const rosterSlots = computed(() => {
  const unassigned = getUnassignedCharacterIds(props.game.state);
  return Array.from({ length: CHARACTER_ROSTER_SLOT_COUNT }, (_, index) => unassigned[index] ?? null);
});
const powerText = computed(() =>
  getCharacterDreamCrystalMultiplierPower(props.game.state, activeStratumId.value).toFixed(3),
);

function beginDrag(characterId: string, event: DragEvent, sourceSlotIndex?: number): void {
  draggedCharacter.value = {
    characterId,
    sourceStratumId: sourceSlotIndex === undefined ? undefined : activeStratumId.value,
    sourceSlotIndex,
  };
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

function dropOnRoster(): void {
  const dragged = draggedCharacter.value;
  if (dragged?.sourceStratumId !== undefined && dragged.sourceSlotIndex !== undefined) {
    unassignCharacterFromProduction(
      props.game.state,
      dragged.sourceStratumId,
      dragged.sourceSlotIndex,
    );
  }
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
      <div class="power-readout">
        <span>{{ t("characters.productionPower") }}</span>
        <strong>^{{ powerText }}</strong>
      </div>
    </header>

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
          class="character-card alpha-card production-card"
          draggable="true"
          @dragstart="beginDrag(characterId, $event, index)"
          @dragend="endDrag"
        >
          <div class="character-symbol">{{ getCharacterDefinition(characterId)?.symbol }}</div>
          <div class="character-name">{{ t(getCharacterDefinition(characterId)!.nameKey) }}</div>
          <div class="character-effect">{{ t("characters.alpha.effect") }}</div>
        </div>
        <span v-else class="empty-label">{{ t("characters.emptySlot") }}</span>
      </div>
    </div>

    <div class="zone-title roster-title">{{ t("characters.sharedRoster") }}</div>
    <div
      class="roster-grid"
      @dragover.prevent
      @drop.prevent="dropOnRoster"
    >
      <div
        v-for="(characterId, index) in rosterSlots"
        :key="index"
        class="roster-slot"
        :class="{ occupied: characterId !== null }"
      >
        <div
          v-if="characterId && getCharacterDefinition(characterId)"
          class="character-card alpha-card"
          draggable="true"
          @dragstart="beginDrag(characterId, $event)"
          @dragend="endDrag"
        >
          <div class="character-symbol">{{ getCharacterDefinition(characterId)?.symbol }}</div>
          <div class="character-name">{{ t(getCharacterDefinition(characterId)!.nameKey) }}</div>
          <div class="character-effect">{{ t("characters.alpha.effect") }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.characters-page {
  width: min(1040px, 96%);
  margin: 0 auto;
  color: #e9ecff;
}

.characters-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  margin-bottom: 22px;
}

.eyebrow,
.zone-title,
.power-readout span {
  color: #9fa9c6;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 { margin: 4px 0 0; }

.power-readout {
  display: grid;
  justify-items: end;
  gap: 3px;
}

.power-readout strong {
  color: #fff;
  font-family: var(--font-number, monospace);
  font-size: 1.45rem;
}

.production-zone {
  display: grid;
  grid-template-columns: repeat(5, minmax(116px, 148px));
  justify-content: center;
  gap: 12px;
  margin-top: 9px;
  padding: 20px;
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
  display: grid;
  grid-template-columns: repeat(10, minmax(66px, 1fr));
  gap: 7px;
  margin-top: 9px;
  padding: 10px;
  border-radius: 7px;
  background: rgba(8, 11, 18, 0.62);
}

.roster-slot {
  aspect-ratio: 1 / 1;
  min-width: 0;
  border-style: solid;
  border-color: #303746;
  border-radius: 3px;
}

.character-card {
  box-sizing: border-box;
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

.alpha-card {
  border: 2px solid #fff;
  color: #fff;
  background:
    repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 7px),
    radial-gradient(circle at 50% 35%, #555 0%, #171717 46%, #050505 100%);
  box-shadow: inset 0 0 12px rgba(255,255,255,0.22), 0 0 9px rgba(255,255,255,0.16);
}

.character-symbol {
  font-family: Georgia, serif;
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  line-height: 1;
  text-shadow: 0 0 8px #fff;
}

.character-name {
  margin-top: 5px;
  font-size: 0.72rem;
  font-weight: 900;
}

.character-effect {
  width: 100%;
  margin-top: auto;
  padding: 3px 2px;
  color: #111;
  background: rgba(255,255,255,0.9);
  font-size: clamp(0.48rem, 0.8vw, 0.65rem);
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
}

.production-card .character-effect { font-size: 0.62rem; }

@media (max-width: 760px) {
  .production-zone { grid-template-columns: repeat(5, minmax(54px, 1fr)); padding: 10px; gap: 7px; }
  .roster-grid { grid-template-columns: repeat(5, minmax(54px, 1fr)); }
  .character-name { display: none; }
  .character-effect { white-space: normal; }
}
</style>
