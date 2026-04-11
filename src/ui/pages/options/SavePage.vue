<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { GameStore } from "@/store/gameStore";

const props = defineProps<{
  game: GameStore;
}>();

const { t } = useI18n();
const saveText = ref("");
const hardResetText = ref("");
const statusKey = ref("common.ready");

const statusText = computed(() => t(statusKey.value));

const autoSaveInterval = computed({
  get: () => props.game.state.settings.autoSaveIntervalSec,
  set: (value: number) => {
    props.game.state.settings.autoSaveIntervalSec = value;
  },
});

const autoSaveLabel = computed(() => {
  const value = autoSaveInterval.value;
  if (value <= 0) return t("save.off");
  if (value === 1) return t("save.everySecond");
  return t("save.everySeconds", { value });
});

function onSaveNow() {
  props.game.saveNow();
  statusKey.value = "save.status.savedToLocalStorage";
}

function onLoadFromDisk() {
  const ok = props.game.loadFromDisk();
  statusKey.value = ok
    ? "save.status.loadedFromLocalStorage"
    : "save.status.noLocalSaveFound";
}

function onExportSave() {
  saveText.value = props.game.exportSaveString();
  statusKey.value = "save.status.exportedToTextBox";
}

async function onCopyExport() {
  if (!saveText.value) {
    saveText.value = props.game.exportSaveString();
  }

  try {
    await navigator.clipboard.writeText(saveText.value);
    statusKey.value = "save.status.copiedToClipboard";
  } catch (error) {
    console.error(error);
    statusKey.value = "save.status.copyFailed";
  }
}

function onImportSave() {
  const raw = saveText.value.trim();
  if (!raw) {
    statusKey.value = "save.status.pasteFirst";
    return;
  }

  const ok = props.game.importSaveString(raw);
  statusKey.value = ok
    ? "save.status.importSuccess"
    : "save.status.importFailed";
}

function onHardReset() {
  if (hardResetText.value !== "RESET") {
    statusKey.value = "save.status.typeReset";
    return;
  }

  props.game.hardReset();
  hardResetText.value = "";
  saveText.value = "";
  statusKey.value = "save.status.hardResetComplete";
}
</script>

<template>
  <div class="save-page">
    <div class="save-card">
      <div class="section-title">{{ t("save.title") }}</div>

      <div class="button-row">
        <button class="action-button" @click="onSaveNow">{{ t("save.saveNow") }}</button>
        <button class="action-button" @click="onLoadFromDisk">{{ t("save.loadLocalSave") }}</button>
        <button class="action-button" @click="onExportSave">{{ t("save.exportSave") }}</button>
        <button class="action-button" @click="onCopyExport">{{ t("save.copyExport") }}</button>
      </div>

      <div class="section-title section-gap">{{ t("save.importExport") }}</div>

      <textarea
        v-model="saveText"
        class="save-textarea"
        spellcheck="false"
        :placeholder="t('save.importExportPlaceholder')"
      />

      <div class="button-row">
        <button class="action-button" @click="onImportSave">{{ t("save.importSave") }}</button>
      </div>

      <div class="section-title section-gap">{{ t("save.autoSave") }}</div>

      <div class="slider-line">
        <div class="slider-label">{{ t("save.interval") }}</div>
        <div class="slider-value">{{ autoSaveLabel }}</div>
      </div>

      <input
        v-model.number="autoSaveInterval"
        class="interval-slider"
        type="range"
        min="0"
        max="120"
        step="1"
      />

      <div class="slider-hints">
        <span>{{ t("save.off") }}</span>
        <span>30s</span>
        <span>60s</span>
        <span>90s</span>
        <span>120s</span>
      </div>

      <div class="section-title section-gap danger-title">{{ t("save.hardResetTitle") }}</div>

      <div class="danger-text">
        {{ t("save.hardResetWarning") }}
      </div>

      <i18n-t keypath="save.hardResetInstruction" tag="div" class="danger-text">
        <template #resetText>
          <span class="danger-code">RESET</span>
        </template>
      </i18n-t>

      <input
        v-model="hardResetText"
        class="reset-input"
        type="text"
        :placeholder="t('save.hardResetPlaceholder')"
      />

      <div class="button-row">
        <button
          class="action-button danger-button"
          :disabled="hardResetText !== 'RESET'"
          @click="onHardReset"
        >
          {{ t("save.hardResetTitle") }}
        </button>
      </div>

      <div class="status-line">
        {{ statusText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.save-page {
  width: min(1100px, 96%);
  margin: 0 auto;
}

.save-card {
  padding: 18px 20px;
  border: 1px solid #253150;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(18, 26, 46, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 0 20px rgba(104, 129, 220, 0.05);
  text-align: left;
}

.section-title {
  font-size: 1.12rem;
  font-weight: 700;
  color: #eef3ff;
}

.section-gap {
  margin-top: 22px;
}

.button-row {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-button {
  min-width: 132px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #324773;
  border-radius: 8px;
  background: linear-gradient(180deg, #18233f 0%, #111a2f 100%);
  color: #edf1ff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  border-color: #6d89df;
  background: linear-gradient(180deg, #22345f 0%, #182642 100%);
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.save-textarea {
  width: 100%;
  min-height: 150px;
  margin-top: 12px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #324773;
  border-radius: 8px;
  background: #0d1427;
  color: #eaf0ff;
  font: 0.92rem/1.45 Consolas, "Courier New", monospace;
  resize: vertical;
}

.slider-line {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.slider-label {
  color: #dbe4ff;
  font-weight: 600;
}

.slider-value {
  color: #ffffff;
  font-weight: 700;
}

.interval-slider {
  width: 100%;
  margin-top: 10px;
}

.slider-hints {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  color: #93a3cf;
  font-size: 0.86rem;
}

.slider-hints span:nth-child(1) {
  text-align: left;
}

.slider-hints span:nth-child(2),
.slider-hints span:nth-child(3),
.slider-hints span:nth-child(4) {
  text-align: center;
}

.slider-hints span:nth-child(5) {
  text-align: right;
}

.danger-title {
  color: #ffd7df;
}

.danger-text {
  margin-top: 8px;
  color: #d8b5bf;
  line-height: 1.5;
}

.danger-code {
  color: #fff0f4;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.reset-input {
  width: 100%;
  height: 40px;
  margin-top: 12px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #6b3246;
  border-radius: 8px;
  background: #1a1016;
  color: #ffe8ee;
  font: inherit;
}

.danger-button {
  border-color: #8a3b4e;
  background: linear-gradient(180deg, #4a1d29 0%, #311219 100%);
  color: #fff1f4;
}

.danger-button:hover {
  border-color: #d06b84;
  background: linear-gradient(180deg, #612636 0%, #421823 100%);
}

.status-line {
  margin-top: 18px;
  color: #9fb0de;
  font-size: 0.94rem;
}
</style>
