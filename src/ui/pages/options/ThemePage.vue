<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { setAppLocale, type AppLocale } from "@/ui/i18n";

const { t, locale } = useI18n();

const localeOptions: { value: AppLocale; labelKey: "language.english" | "language.zhCN" }[] = [
  { value: "en", labelKey: "language.english" },
  { value: "zh-CN", labelKey: "language.zhCN" },
];

const currentLocale = computed<AppLocale>(() => {
  return locale.value === "zh-CN" ? "zh-CN" : "en";
});

function onSelectLocale(nextLocale: AppLocale) {
  if (currentLocale.value === nextLocale) return;
  setAppLocale(nextLocale);
}
</script>

<template>
  <div class="theme-page">
    <div class="theme-card">
      <div class="section-title">{{ t("theme.title") }}</div>
      <div class="section-description">{{ t("theme.description") }}</div>

      <div class="section-title section-gap">{{ t("theme.languageSection") }}</div>
      <div class="section-hint">{{ t("theme.languageHint") }}</div>

      <div class="language-row">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          class="language-button"
          :class="{ active: currentLocale === option.value }"
          type="button"
          @click="onSelectLocale(option.value)"
        >
          {{ t(option.labelKey) }}
        </button>
      </div>

      <div class="current-language">
        {{ t("theme.currentLanguage") }}: {{ t(currentLocale === "zh-CN" ? "language.zhCN" : "language.english") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-page {
  width: min(960px, 96%);
  margin: 0 auto;
}

.theme-card {
  padding: 18px 20px;
  border: 1px solid #2e3a5e;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(20, 28, 50, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%);
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

.section-description,
.section-hint,
.current-language {
  margin-top: 10px;
  color: #b9c5e7;
  line-height: 1.55;
}

.language-row {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.language-button {
  min-width: 160px;
  height: 42px;
  padding: 0 16px;
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
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.language-button:hover {
  transform: translateY(-1px);
  border-color: #6d89df;
  background: linear-gradient(180deg, #22345f 0%, #182642 100%);
}

.language-button.active {
  border-color: #8aa4ff;
  background: linear-gradient(180deg, #2a3f73 0%, #1b2a4d 100%);
  box-shadow: inset 0 0 14px rgba(160, 188, 255, 0.14);
}
</style>
