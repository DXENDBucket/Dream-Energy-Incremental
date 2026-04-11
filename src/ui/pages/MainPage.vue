<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { PRIMARY_TABS, UI_CONFIG } from "../uiConfig";
import { format, formatInt } from "@/engine/math/format";
import { getActiveDreamEnergy, getActiveStratum } from "@/engine/strata/manager/selectors";
import type { GameState } from "@/engine/core/state";
import DreamCrystalsPage from "./dream-crystals/DreamCrystalsPage.vue";
import DreamEnergyMilestonesPage from "./milestones/DreamEnergyMilestones.vue";
import StratumSpeedPage from "./debug/StratumSpeedPage.vue";
import { getDreamEnergyPercentageText } from "@/engine/math/dream-energy/computed";
import { isDreamEnergySoftcapOneActive } from "@/engine/strata/common/dream-energy";
import CurrentStratumPage from "./strata/CurrentStratumPage.vue";
import SavePage from "./options/SavePage.vue";
import ThemePage from "./options/ThemePage.vue";

import type { GameStore } from "@/store/gameStore";

const props = defineProps<{
  game: GameStore;
}>();

const { t } = useI18n();
const ui = UI_CONFIG;

function getDefaultSecondaryId(primaryId: string): string {
  const tab = PRIMARY_TABS.find(x => x.id === primaryId);
  return tab?.children[0]?.id ?? "dream-crystals";
}

const lastSecondaryByPrimary = ref<Record<string, string>>(
  Object.fromEntries(
    PRIMARY_TABS.map(tab => [tab.id, tab.children[0]?.id ?? "dream-crystals"])
  )
);

const selectedPrimary = ref("crystals");
const selectedSecondary = ref(lastSecondaryByPrimary.value.crystals ?? "dream-crystals");

const hoveredPrimary = ref<string | null>(null);
const secondaryAnchorPrimary = ref<string | null>(null);
const secondaryCenterPx = ref(0);

const hoveredSecondaryLabelKey = ref<string | null>(null);
const hoveredSecondaryLeftPx = ref(0);

let hideTimer: number | null = null;

function clearHideTimer() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function hideSecondaryMenu() {
  hoveredPrimary.value = null;
  secondaryAnchorPrimary.value = null;
  hoveredSecondaryLabelKey.value = null;
}

function scheduleHideSecondaryMenu() {
  clearHideTimer();
  hideTimer = window.setTimeout(() => {
    hideSecondaryMenu();
  }, 90);
}

function onPrimaryEnter(tabId: string, index: number) {
  clearHideTimer();
  hoveredPrimary.value = tabId;
  secondaryAnchorPrimary.value = tabId;
  secondaryCenterPx.value =
    index * ui.sizes.primaryButtonHeight + ui.sizes.primaryButtonHeight / 2;
}

function onPrimaryMenuLeave() {
  scheduleHideSecondaryMenu();
}

function onSecondaryWrapEnter() {
  clearHideTimer();
}

function onSecondaryWrapLeave() {
  scheduleHideSecondaryMenu();
}

function onPrimaryClick(primaryId: string) {
  const rememberedSecondary =
    lastSecondaryByPrimary.value[primaryId] ?? getDefaultSecondaryId(primaryId);

  selectedPrimary.value = primaryId;
  selectedSecondary.value = rememberedSecondary;
  lastSecondaryByPrimary.value[primaryId] = rememberedSecondary;
}

function openPage(primaryId: string, secondaryId: string) {
  selectedPrimary.value = primaryId;
  selectedSecondary.value = secondaryId;
  lastSecondaryByPrimary.value[primaryId] = secondaryId;
  //hideSecondaryMenu();
}

function onSecondaryButtonEnter(labelKey: string, index: number) {
  hoveredSecondaryLabelKey.value = labelKey;
  hoveredSecondaryLeftPx.value =
    ui.sizes.secondaryGap +
    ui.sizes.secondaryMenuPadding +
    index * (ui.sizes.secondaryButtonSize + ui.sizes.secondaryButtonGap) +
    ui.sizes.secondaryButtonSize / 2;
}

function onSecondaryButtonLeave() {
  hoveredSecondaryLabelKey.value = null;
}

const showSecondaryMenu = computed(() => {
  return hoveredPrimary.value !== null || secondaryAnchorPrimary.value !== null;
});

const visiblePrimaryId = computed(() => {
  return hoveredPrimary.value ?? secondaryAnchorPrimary.value ?? selectedPrimary.value;
});

const visibleSecondaryTabs = computed(() => {
  return PRIMARY_TABS.find(tab => tab.id === visiblePrimaryId.value)?.children ?? [];
});

const currentPageTitle = computed(() => {
  for (const tab of PRIMARY_TABS) {
    const child = tab.children.find(x => x.id === selectedSecondary.value);
    if (child) return t(child.labelKey);
  }
  return t("common.unknown");
});

const activeDreamEnergyText = computed(() => {
  return formatInt(getActiveDreamEnergy(props.game.state));
});

const activeDreamEnergyPercentageText = computed(() => {
  return getDreamEnergyPercentageText(getActiveStratum(props.game.state));
});

const isFirstDreamEnergySoftcapReached = computed(() => {
  return isDreamEnergySoftcapOneActive(getActiveStratum(props.game.state))
})

const rootStyle = computed(() => ({
  "--left-width": `${ui.sizes.leftWidth}px`,
  "--info-height": `${ui.sizes.infoHeight}px`,
  "--primary-button-height": `${ui.sizes.primaryButtonHeight}px`,
  "--primary-accent-width": `${ui.sizes.primaryAccentWidth}px`,
  "--secondary-button-size": `${ui.sizes.secondaryButtonSize}px`,
  "--secondary-button-gap": `${ui.sizes.secondaryButtonGap}px`,
  "--secondary-gap": `${ui.sizes.secondaryGap}px`,
  "--secondary-menu-padding": `${ui.sizes.secondaryMenuPadding}px`,
  "--tooltip-offset-y": `${ui.sizes.tooltipOffsetY}px`,
  "--right-top-height": `${ui.sizes.rightTopHeight}px`,
  "--panel-padding": `${ui.sizes.panelPadding}px`,
  "--radius": `${ui.sizes.radius}px`,

  "--font-main": ui.fonts.main,
  "--font-title": ui.fonts.title,
  "--font-mono": ui.fonts.mono,
  "--font-number": ui.fonts.number,

  "--bg-page": ui.colors.bgPage,
  "--bg-left": ui.colors.bgLeft,
  "--bg-info": ui.colors.bgInfo,

  "--bg-primary": ui.colors.bgPrimary,
  "--bg-primary-hover": ui.colors.bgPrimaryHover,
  "--bg-primary-active": ui.colors.bgPrimaryActive,

  "--text-primary": ui.colors.textPrimary,
  "--text-primary-hover": ui.colors.textPrimaryHover,
  "--text-primary-active": ui.colors.textPrimaryActive,

  "--bg-secondary": ui.colors.bgSecondary,
  "--bg-secondary-hover": ui.colors.bgSecondaryHover,
  "--bg-secondary-active": ui.colors.bgSecondaryActive,

  "--text-secondary": ui.colors.textSecondary,
  "--text-secondary-hover": ui.colors.textSecondaryHover,
  "--text-secondary-active": ui.colors.textSecondaryActive,

  "--bg-tooltip": ui.colors.bgTooltip,
  "--text-tooltip": ui.colors.textTooltip,
  "--border-tooltip": ui.colors.borderTooltip,

  "--bg-right-top": ui.colors.bgRightTop,
  "--bg-right-bottom": ui.colors.bgRightBottom,

  "--text-main": ui.colors.textMain,
  "--text-dim": ui.colors.textDim,
  "--text-soft": ui.colors.textSoft,

  "--border-soft": ui.colors.borderSoft,
  "--border-glow": ui.colors.borderGlow,
  "--shadow-color": ui.colors.shadow,
}));

const secondaryWrapStyle = computed(() => ({
  left: "var(--left-width)",
  top: `calc(var(--info-height) + ${secondaryCenterPx.value}px)`,
}));

const secondaryTooltipStyle = computed(() => ({
  left: `${hoveredSecondaryLeftPx.value}px`,
}));
</script>

<template>
  <div class="layout" :style="rootStyle">
    <aside class="left-area">
      <div class="resource-box">
        <div class="resource-main">{{ activeDreamEnergyText }}</div>
        <div class="resource-sub">{{ t("resource.dreamEnergy") }}</div>
      </div>

      <div class="primary-menu" @mouseleave="onPrimaryMenuLeave">
        <button
          v-for="(tab, index) in PRIMARY_TABS"
          :key="tab.id"
          class="primary-button"
          :class="{ active: selectedPrimary === tab.id }"
          :style="{
            '--tab-border': tab.borderColor,
            '--tab-text': tab.textColor,
          }"
          @mouseenter="onPrimaryEnter(tab.id, index)"
          @click="onPrimaryClick(tab.id)"
        >
          {{ t(tab.labelKey) }}
        </button>
      </div>

      <transition name="submenu-slide">
        <div
          v-if="showSecondaryMenu"
          class="secondary-wrap"
          :style="secondaryWrapStyle"
          @mouseenter="onSecondaryWrapEnter"
          @mouseleave="onSecondaryWrapLeave"
        >
          <transition name="tooltip-rise">
            <div
              v-if="hoveredSecondaryLabelKey"
              class="secondary-tooltip"
              :style="secondaryTooltipStyle"
            >
              {{ t(hoveredSecondaryLabelKey) }}
            </div>
          </transition>

          <div class="secondary-menu">
            <button
              v-for="(sub, index) in visibleSecondaryTabs"
              :key="sub.id"
              class="secondary-button"
              :class="{
                active:
                  selectedSecondary === sub.id ||
                  lastSecondaryByPrimary[visiblePrimaryId] === sub.id
              }"
              :title="t(sub.labelKey)"
              @mouseenter="onSecondaryButtonEnter(sub.labelKey, index)"
              @mouseleave="onSecondaryButtonLeave"
              @click="openPage(visiblePrimaryId, sub.id)"
            >
              {{ sub.icon }}
            </button>
          </div>
        </div>
      </transition>
    </aside>

    <main class="right-area">
      <section class="top-panel">
        <div class="top-title">{{ t("mainPage.title") }}</div>
        <i18n-t keypath="mainPage.haveDreamEnergy" tag="div" class="top-main-line">
          <template #amount>
            <span class="big-number">{{ activeDreamEnergyText }}</span>
          </template>
        </i18n-t>
        <div class="top-sub-line">
          {{ t("mainPage.activeStratum", { id: props.game.state.activeStratumId }) }}
        </div>
        <div class="top-sub-line">{{ t("mainPage.gain", { value: activeDreamEnergyPercentageText }) }}</div>
        <div v-if="isFirstDreamEnergySoftcapReached" class="top-softcap-line">
          {{ t("mainPage.softcapWarning") }}
        </div>
      </section>

      <section class="bottom-panel">
        <h2 class="page-title">{{ currentPageTitle }}</h2>

        <div v-if="selectedSecondary === 'dream-crystals'" class="dream-crystals-page">
          <DreamCrystalsPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'de-milestones'" class="page-card">
          <DreamEnergyMilestonesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'stratum-speed'" class="dream-crystals-page">
          <StratumSpeedPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'current-stratum'" class="page-card">
          <CurrentStratumPage :game="props.game" />
        </div>
        
        <div v-else-if="selectedSecondary === 'save'" class="page-card">
          <SavePage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'dc-upgrades'" class="page-card">
          {{ t("mainPage.placeholders.upgrades") }}
        </div>

        <div v-else-if="selectedSecondary === 'surface'" class="page-card">
          {{ t("mainPage.placeholders.surface") }}
        </div>

        <div v-else-if="selectedSecondary === 'depth'" class="page-card">
          {{ t("mainPage.placeholders.depth") }}
        </div>

        <div v-else-if="selectedSecondary === 'dream'" class="page-card">
          {{ t("mainPage.placeholders.dream") }}
        </div>

        <div v-else-if="selectedSecondary === 'numbers'" class="page-card">
          {{ t("mainPage.placeholders.numbers") }}
        </div>

        <div v-else-if="selectedSecondary === 'history'" class="page-card">
          {{ t("mainPage.placeholders.history") }}
        </div>

        <div v-else-if="selectedSecondary === 'theme'" class="page-card">
          <ThemePage />
        </div>

        <div v-else-if="selectedSecondary === 'debug'" class="page-card">
          {{ t("mainPage.placeholders.debug") }}
        </div>

        <div v-else class="page-card">
          {{ t("mainPage.placeholders.unknownPage") }}
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: var(--left-width) 1fr;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(112, 94, 193, 0.12), transparent 30%),
    radial-gradient(circle at 80% 20%, rgba(70, 124, 255, 0.08), transparent 25%),
    linear-gradient(180deg, #0b1020 0%, #080d19 100%);
  color: var(--text-main);
  font-family: var(--font-main);
}

.left-area {
  position: relative;
  background: linear-gradient(180deg, var(--bg-left) 0%, #0f1628 100%);
  border-right: 1px solid var(--border-soft);
  box-shadow: 3px 0 18px var(--shadow-color);
}

.resource-box {
  height: var(--info-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, var(--bg-info) 0%, #131d33 100%);
  border-bottom: 1px solid var(--border-soft);
  box-shadow: inset 0 0 20px rgba(88, 115, 200, 0.08);
}

.resource-main {
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 700;
  color: #f3f5ff;
  font-family: var(--font-number);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.resource-sub {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-dim);
  letter-spacing: 0.04em;
}

.primary-menu {
  display: flex;
  flex-direction: column;
}

.primary-button {
  height: var(--primary-button-height);
  border: none;
  border-bottom: 1px solid var(--border-soft);
  border-left: var(--primary-accent-width) solid var(--tab-border);
  background: linear-gradient(180deg, var(--bg-primary) 0%, #11192b 100%);
  color: var(--tab-text, var(--text-primary));
  font: inherit;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease,
    color 0.15s ease;
}

.primary-button:hover {
  background: linear-gradient(180deg, var(--bg-primary-hover) 0%, #1b2a48 100%);
  box-shadow: inset 0 0 16px rgba(111, 149, 255, 0.12);
  color: var(--text-primary-hover);
}

.primary-button.active {
  background: linear-gradient(180deg, var(--bg-primary-active) 0%, #2c457f 100%);
  color: var(--text-primary-active);
  box-shadow: inset 0 0 18px rgba(160, 188, 255, 0.14);
}

.secondary-wrap {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  padding-left: var(--secondary-gap);
  padding-top: 6px;
  padding-bottom: 6px;
}

.secondary-menu {
  position: relative;
  display: flex;
  gap: var(--secondary-button-gap);
  padding: var(--secondary-menu-padding);
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: rgba(12, 18, 34, 0.92);
  box-shadow:
    0 8px 24px var(--shadow-color),
    inset 0 0 16px rgba(110, 95, 200, 0.08);
  backdrop-filter: blur(4px);
}

.secondary-button {
  width: var(--secondary-button-size);
  height: var(--secondary-button-size);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, #121b31 100%);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition:
    background 0.15s ease,
    transform 0.1s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.secondary-button:hover {
  background: linear-gradient(180deg, var(--bg-secondary-hover) 0%, #22345e 100%);
  border-color: var(--border-glow);
  color: var(--text-secondary-hover);
  transform: translateY(-1px);
}

.secondary-button.active {
  background: linear-gradient(180deg, var(--bg-secondary-active) 0%, #334c85 100%);
  border-color: #89a3ff;
  color: var(--text-secondary-active);
}

.secondary-tooltip {
  position: absolute;
  z-index: 30;
  top: calc(-1 * var(--tooltip-offset-y) - 12px);
  transform: translateX(-50%);
  padding: 6px 10px;
  border: 1px solid var(--border-tooltip);
  border-radius: 8px;
  background: var(--bg-tooltip);
  color: var(--text-tooltip);
  font-size: 0.82rem;
  line-height: 1;
  white-space: nowrap;
  box-shadow:
    0 8px 20px var(--shadow-color),
    inset 0 0 12px rgba(125, 131, 255, 0.08);
  pointer-events: none;
}

.right-area {
  display: grid;
  grid-template-rows: var(--right-top-height) 1fr;
  min-width: 0;
  text-align: center;
}

.top-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: var(--panel-padding);
  background:
    radial-gradient(circle at center, rgba(114, 88, 211, 0.08), transparent 45%),
    linear-gradient(180deg, var(--bg-right-top) 0%, #0d1427 100%);
  border-bottom: 1px solid var(--border-soft);
}

.top-title {
  font-family: var(--font-title);
  font-size: 1.8rem;
  color: #f5f1ff;
  letter-spacing: 0.03em;
}

.top-main-line {
  font-size: 1.15rem;
  color: var(--text-main);
}

.big-number {
  font-size: 2rem;
  font-family: var(--font-number);
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  margin: 0 0.2rem;
}

.top-sub-line {
  color: var(--text-dim);
  font-size: 0.95rem;
}

.top-softcap-line {
  color: var(--text-dim);
  font-size: 0.95rem;
  color: #B03060
}

.bottom-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: var(--panel-padding);
  background:
    radial-gradient(circle at 50% 0%, rgba(87, 104, 205, 0.07), transparent 30%),
    linear-gradient(180deg, var(--bg-right-bottom) 0%, #070b15 100%);
}

.page-title {
  margin: 0 0 1rem;
  font-family: var(--font-title);
  font-size: 1.4rem;
  color: #f0ecff;
}

.page-card {
  width: min(760px, 92%);
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(20, 28, 50, 0.9) 0%, rgba(12, 18, 33, 0.95) 100%);
  box-shadow:
    inset 0 0 24px rgba(112, 88, 193, 0.06),
    0 8px 30px var(--shadow-color);
  color: var(--text-dim);
  padding: 24px;
}

.submenu-slide-enter-active {
  animation: submenu-slide-in 0.18s ease-out;
}

.submenu-slide-leave-active {
  transition: opacity 0.1s ease;
}

.submenu-slide-enter-from,
.submenu-slide-leave-to {
  opacity: 0;
}

@keyframes submenu-slide-in {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

.tooltip-rise-enter-active {
  animation: tooltip-rise-in 0.14s ease-out;
}

.tooltip-rise-leave-active {
  transition: opacity 0.08s ease;
}

.tooltip-rise-enter-from,
.tooltip-rise-leave-to {
  opacity: 0;
}

@keyframes tooltip-rise-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
