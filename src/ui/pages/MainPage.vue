<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { PRIMARY_TABS, UI_CONFIG } from "../uiConfig";
import { format, formatInt } from "@/engine/math/format";
import { mul, type Num } from "@/engine/math/num";
import { getActiveDreamEnergy, getActiveStratum } from "@/engine/strata/manager/selectors";
import DreamCrystalsPage from "./dream-crystals/DreamCrystalsPage.vue";
import ConceptCrystalsPage from "./concept-crystals/ConceptCrystalsPage.vue";
import DreamCrystalUpgradesPage from "./upgrades/DreamCrystalUpgradesPage.vue";
import CoherenceUpgradesPage from "./upgrades/CoherenceUpgradesPage.vue";
import DreamCrystalAutobuyersPage from "./autobuyers/DreamCrystalAutobuyersPage.vue";
import DreamEnergyMilestonesPage from "./milestones/DreamEnergyMilestones.vue";
import RealityMilestonesPage from "./milestones/RealityMilestonesPage.vue";
import CrushMilestonesPage from "./milestones/CrushMilestonesPage.vue";
import CharacterProductionPage from "./characters/CharacterProductionPage.vue";
import CharacterUnlocksPage from "./characters/CharacterUnlocksPage.vue";
import CharacterLevelsPage from "./characters/CharacterLevelsPage.vue";
import StratumSpeedPage from "./debug/StratumSpeedPage.vue";
import DebugProgressionPage from "./debug/DebugProgressionPage.vue";
import {
  getDreamEnergyPercentageGainPerSecond,
  isDreamEnergyConceptConflictActive,
  isDreamEnergySoftcapOneActive,
  isDreamEnergySoftcapThreeActive,
  isDreamEnergySoftcapTwoActive,
  isDreamEnergyShieldingActive,
} from "@/engine/strata/common/dream-energy";
import {
  isCoherenceUpgradesUnlocked,
  isConceptCrystalsUnlocked,
  isUpgradesUnlocked,
} from "@/engine/strata/common/milestones";
import {
  canCondenseCoherence,
  condenseCoherence,
  getCoherencePointGain,
  getCoherencePoints,
  getCoherenceProductionLoss,
} from "@/engine/strata/common/coherence";
import {
  canExtractChaoticEther,
  extractChaoticEther,
  getChaoticEther,
  getChaoticEtherProducedTierForStratumId,
  getChaoticEtherGain,
} from "@/engine/strata/common/chaotic-ether";
import {
  getEntropyTuningExponent,
  getEntropyValue,
} from "@/engine/strata/common/entropy";
import {
  isDreamCrystalAutobuyerUnlocked,
  isDreamCrystalRefineAutobuyerUnlocked,
} from "@/engine/strata/common/dream-crystals/upgrades";
import { isCoherenceAutobuyerUnlocked } from "@/engine/strata/common/coherence/autobuyer";
import {
  STRATUM_DEFINITIONS,
  dreamSeaFourthStratumId,
  realityStratumId,
} from "@/engine/strata/defs";
import { isCharacterProductionUnlocked } from "@/engine/reality/milestones";
import {
  CRUSH_MILESTONE_COUNT,
  CRUSH_MILESTONE_DEFINITIONS,
  canCrush,
  crush,
  getCrushMilestoneCount,
  isCrushUnlocked,
} from "@/engine/crush";
import CurrentStratumPage from "./strata/CurrentStratumPage.vue";
import LiftPage from "./strata/LiftPage.vue";
import StrataOverviewPage from "./strata/StrataOverviewPage.vue";
import SavePage from "./options/SavePage.vue";
import ThemePage from "./options/ThemePage.vue";
import MultiplierBreakdownPage from "./stats/MultiplierBreakdownPage.vue";
import { formatPercentagePerSecondText } from "@/ui/formatters/progression";

import type { GameStore } from "@/store/gameStore";

const props = defineProps<{
  game: GameStore;
}>();

const { t } = useI18n();
const ui = UI_CONFIG;
const activeStratum = computed(() => getActiveStratum(props.game.state));
const availablePrimaryTabs = computed(() => {
  return PRIMARY_TABS
    .filter(tab => {
      if (tab.id === "upgrades") return isUpgradesUnlocked(activeStratum.value);
      if (tab.id === "characters") return isCharacterProductionUnlocked(props.game.state);
      if (tab.id === "autobuyers") {
        return (
          isDreamCrystalAutobuyerUnlocked(activeStratum.value) ||
          isDreamCrystalRefineAutobuyerUnlocked(activeStratum.value) ||
          isCoherenceAutobuyerUnlocked(activeStratum.value)
        );
      }
      return true;
    })
    .map(tab => {
      if (tab.id === "crystals") {
        return {
          ...tab,
          children: tab.children.filter(child => {
            return child.id !== "concept-crystals" || isConceptCrystalsUnlocked(activeStratum.value);
          }),
        };
      }

      if (tab.id === "milestones") {
        return {
          ...tab,
          children: tab.children.filter(child => {
            if (child.id === "reality-milestones") {
              return props.game.state.activeStratumId === realityStratumId;
            }
            if (child.id === "crush-milestones") {
              return isCrushUnlocked(props.game.state);
            }
            return true;
          }),
        };
      }

      if (tab.id !== "upgrades") return tab;

      return {
        ...tab,
        children: tab.children.filter(child => {
          return child.id !== "coherence-upgrades" || isCoherenceUpgradesUnlocked(activeStratum.value);
        }),
      };
    });
});

function getDefaultSecondaryId(primaryId: string): string {
  const tab = availablePrimaryTabs.value.find(x => x.id === primaryId);
  return tab?.children[0]?.id ?? "dream-crystals";
}

function getNextSecondaryId(primaryId: string, currentSecondaryId: string): string {
  const children = availablePrimaryTabs.value.find(x => x.id === primaryId)?.children ?? [];
  if (children.length === 0) return currentSecondaryId;

  const currentIndex = children.findIndex(child => child.id === currentSecondaryId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % children.length;
  return children[nextIndex]?.id ?? currentSecondaryId;
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
  if (selectedPrimary.value === primaryId) {
    const nextSecondary = getNextSecondaryId(primaryId, selectedSecondary.value);

    selectedSecondary.value = nextSecondary;
    lastSecondaryByPrimary.value[primaryId] = nextSecondary;
    return;
  }

  const rememberedSecondary =
    lastSecondaryByPrimary.value[primaryId] ?? getDefaultSecondaryId(primaryId);
  const tab = availablePrimaryTabs.value.find(x => x.id === primaryId);
  const nextSecondary = tab?.children.some(child => child.id === rememberedSecondary)
    ? rememberedSecondary
    : getDefaultSecondaryId(primaryId);

  selectedPrimary.value = primaryId;
  selectedSecondary.value = nextSecondary;
  lastSecondaryByPrimary.value[primaryId] = nextSecondary;
}

function openPage(primaryId: string, secondaryId: string) {
  const tab = availablePrimaryTabs.value.find(x => x.id === primaryId);
  if (!tab?.children.some(child => child.id === secondaryId)) return;

  selectedPrimary.value = primaryId;
  selectedSecondary.value = secondaryId;
  lastSecondaryByPrimary.value[primaryId] = secondaryId;
  //hideSecondaryMenu();
}

watch(
  availablePrimaryTabs,
  (tabs) => {
    const currentPrimary = tabs.find(tab => tab.id === selectedPrimary.value);

    if (currentPrimary) {
      if (!currentPrimary.children.some(child => child.id === selectedSecondary.value)) {
        const fallbackSecondary = getDefaultSecondaryId(selectedPrimary.value);
        selectedSecondary.value = fallbackSecondary;
        lastSecondaryByPrimary.value[selectedPrimary.value] = fallbackSecondary;
      }

      return;
    }

    selectedPrimary.value = "crystals";
    selectedSecondary.value = getDefaultSecondaryId("crystals");
  },
  { immediate: true },
);

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
  return availablePrimaryTabs.value.find(tab => tab.id === visiblePrimaryId.value)?.children ?? [];
});

const currentPageTitle = computed(() => {
  for (const tab of availablePrimaryTabs.value) {
    const child = tab.children.find(x => x.id === selectedSecondary.value);
    if (child) return t(child.labelKey);
  }
  return t("common.unknown");
});

function formatTopDreamEnergy(value: Num): string {
  if (!value || !value.isFinite()) return formatInt(value);
  if (value.abs().lt(1000)) return value.toNumber().toFixed(1);
  return formatInt(value);
}

const activeDreamEnergyText = computed(() => (
  formatTopDreamEnergy(getActiveDreamEnergy(props.game.state))
));

const activeDreamEnergyPercentageText = computed(() => {
  return formatPercentagePerSecondText(
    getDreamEnergyPercentageGainPerSecond(getActiveStratum(props.game.state)),
  );
});

const isFirstDreamEnergySoftcapReached = computed(() => {
  return isDreamEnergySoftcapOneActive(activeStratum.value);
});

const isSecondDreamEnergySoftcapReached = computed(() => {
  return isDreamEnergySoftcapTwoActive(activeStratum.value);
});

const isThirdDreamEnergySoftcapReached = computed(() => {
  return isDreamEnergySoftcapThreeActive(activeStratum.value);
});

const isDreamEnergyConceptConflictReached = computed(() => {
  return isDreamEnergyConceptConflictActive(activeStratum.value);
});

const isDreamEnergyShieldingReached = computed(() => {
  return isDreamEnergyShieldingActive(activeStratum.value);
});

const dreamEnergySoftcapWarningText = computed(() => {
  if (isDreamEnergyConceptConflictReached.value) {
    return t("mainPage.conceptConflictWarning");
  }

  if (isThirdDreamEnergySoftcapReached.value) {
    return t("mainPage.softcapThreeWarning");
  }

  return t(
    isSecondDreamEnergySoftcapReached.value
      ? "mainPage.softcapTwoWarning"
      : "mainPage.softcapWarning",
  );
});

const isLiftUnlocked = computed(() => props.game.state.lift.isLiftUnlocked);
const showChaoticEther = computed(() => STRATUM_DEFINITIONS.some(definition =>
  definition.producedChaoticEtherTier > 0 && definition.id in props.game.state.strata,
));
const activeChaoticEtherTier = computed(() => {
  const producedTier = getChaoticEtherProducedTierForStratumId(props.game.state.activeStratumId);
  return producedTier > 0 ? producedTier : 1;
});
const activeChaoticEtherName = computed(() => {
  return t(`resource.chaoticEtherTier.${activeChaoticEtherTier.value}`);
});
const isChaoticEtherProducerActive = computed(() => {
  return getChaoticEtherProducedTierForStratumId(props.game.state.activeStratumId) > 0;
});

const chaoticEtherText = computed(() => {
  return format(getChaoticEther(activeStratum.value, activeChaoticEtherTier.value));
});

const chaoticEtherGainText = computed(() => {
  return format(getChaoticEtherGain(activeStratum.value));
});

const canExtractCE = computed(() => canExtractChaoticEther(props.game.state));
const condenseConfirmationEnabled = computed(() => (
  props.game.state.settings.condenseConfirmationEnabled
));
const chaoticEtherConfirmationEnabled = computed(() => (
  props.game.state.settings.chaoticEtherConfirmationEnabled
));
const crushConfirmationEnabled = computed(() => (
  props.game.state.settings.crushConfirmationEnabled
));
const isExtractDialogOpen = ref(false);

function onExtractChaoticEther() {
  if (!canExtractCE.value) return;
  if (chaoticEtherConfirmationEnabled.value) {
    isExtractDialogOpen.value = true;
    return;
  }
  extractChaoticEther(props.game.state);
}

function closeExtractDialog(): void {
  isExtractDialogOpen.value = false;
}

function confirmExtractChaoticEther(): void {
  extractChaoticEther(props.game.state);
  closeExtractDialog();
}

const coherencePointsText = computed(() => {
  return formatInt(getCoherencePoints(activeStratum.value));
});

const coherencePointGainText = computed(() => {
  return formatInt(getCoherencePointGain(activeStratum.value));
});

const coherenceProductionLossText = computed(() => {
  return format(getCoherenceProductionLoss(activeStratum.value));
});

const canCondense = computed(() => canCondenseCoherence(props.game.state));
const isCondenseDialogOpen = ref(false);

function onCondenseCoherence() {
  if (!canCondense.value) return;
  if (condenseConfirmationEnabled.value) {
    isCondenseDialogOpen.value = true;
    return;
  }
  condenseCoherence(props.game.state);
}

function closeCondenseDialog(): void {
  isCondenseDialogOpen.value = false;
}

function confirmCondenseCoherence(): void {
  condenseCoherence(props.game.state);
  closeCondenseDialog();
}

const isFourthStratumActive = computed(() => (
  props.game.state.activeStratumId === dreamSeaFourthStratumId
));
const crushMilestoneCount = computed(() => getCrushMilestoneCount(props.game.state));
const canCrushNow = computed(() => canCrush(props.game.state));
const isCrushMaxed = computed(() => crushMilestoneCount.value >= CRUSH_MILESTONE_COUNT);
const isCrushDialogOpen = ref(false);
const nextCrushDreamCrystalMultiplierText = computed(() => String(
  2 ** Math.min(CRUSH_MILESTONE_COUNT, crushMilestoneCount.value + 1),
));
const nextCrushMilestone = computed(() => (
  CRUSH_MILESTONE_DEFINITIONS[crushMilestoneCount.value]
));

function openCrushDialog(): void {
  if (!canCrushNow.value) return;
  if (crushConfirmationEnabled.value) {
    isCrushDialogOpen.value = true;
    return;
  }
  crush(props.game.state);
}

function closeCrushDialog(): void {
  isCrushDialogOpen.value = false;
}

function confirmCrush(): void {
  if (crush(props.game.state)) closeCrushDialog();
}

const showEntropy = computed(() => {
  return (activeStratum.value.entropy?.formulaId ?? "none") !== "none";
});

const entropyPercentText = computed(() => {
  return `${format(mul(getEntropyValue(activeStratum.value), 100))}%`;
});

const entropyTuningText = computed(() => {
  return format(getEntropyTuningExponent(activeStratum.value));
});

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
          v-for="(tab, index) in availablePrimaryTabs"
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
        <div class="top-center-content">
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
          <div v-if="showEntropy" class="entropy-panel">
            <div class="entropy-primary">
              <span class="entropy-label">{{ t("entropy.label") }}</span>
              <span class="entropy-value">{{ entropyPercentText }}</span>
            </div>
            <div class="entropy-meta">
              {{ t("entropy.meta", {
                tuning: entropyTuningText,
              }) }}
            </div>
          </div>
          <div v-if="isFirstDreamEnergySoftcapReached" class="top-softcap-line">
            {{ dreamEnergySoftcapWarningText }}
          </div>
          <div v-if="isDreamEnergyShieldingReached" class="top-shielding-line">
            {{ t("mainPage.shieldingWarning") }}
          </div>
        </div>

        <div v-if="showChaoticEther" class="chaotic-ether-panel">
          <div class="chaotic-ether-resource-line">
            <span class="chaotic-ether-label">{{ activeChaoticEtherName }}</span>
            <span class="chaotic-ether-amount">{{ chaoticEtherText }}</span>
          </div>
          <button
            v-if="isChaoticEtherProducerActive"
            class="chaotic-ether-button"
            :disabled="!canExtractCE"
            :title="canExtractCE ? t('chaoticEther.extractAvailable') : t('chaoticEther.extractUnavailable')"
            @click="onExtractChaoticEther"
          >
            {{ t("chaoticEther.extract", { tier: activeChaoticEtherTier, value: chaoticEtherGainText }) }}
          </button>
          <div v-else class="chaotic-ether-note">
            {{ t("chaoticEther.realityStorage") }}
          </div>
        </div>

        <div
          v-if="isLiftUnlocked && isFourthStratumActive"
          class="coherence-panel crush-panel"
        >
          <div class="coherence-resource-line">
            <span class="coherence-label crush-label">{{ t("resource.crushMilestones") }}</span>
            <span class="coherence-amount crush-amount">{{ crushMilestoneCount }}</span>
          </div>
          <button
            class="condense-button crush-button"
            :disabled="!canCrushNow"
            :title="t(isCrushMaxed ? 'crush.maxed' : canCrushNow ? 'crush.available' : 'crush.unavailable')"
            @click="openCrushDialog"
          >
            {{ t("crush.action") }}
          </button>
          <div class="coherence-loss-line crush-progress-line">
            {{ t("crush.globalProgress", { current: crushMilestoneCount, total: CRUSH_MILESTONE_COUNT }) }}
          </div>
        </div>

        <div v-else-if="isLiftUnlocked" class="coherence-panel">
          <div class="coherence-resource-line">
            <span class="coherence-label">{{ t("resource.coherencePoints") }}</span>
            <span class="coherence-amount">{{ coherencePointsText }}</span>
          </div>
          <button
            class="condense-button"
            :disabled="!canCondense"
            :title="canCondense ? t('coherence.condenseAvailable') : t('coherence.condenseUnavailable')"
            @click="onCondenseCoherence"
          >
            {{ t("coherence.condense", { value: coherencePointGainText }) }}
          </button>
          <div class="coherence-loss-line">
            {{ t("coherence.productionLoss", { value: coherenceProductionLossText }) }}
          </div>
        </div>
      </section>

      <section class="bottom-panel">
        <h2 class="page-title">{{ currentPageTitle }}</h2>

        <div v-if="selectedSecondary === 'dream-crystals'" class="dream-crystals-page">
          <DreamCrystalsPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'concept-crystals'" class="dream-crystals-page">
          <ConceptCrystalsPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'de-milestones'" class="page-card">
          <DreamEnergyMilestonesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'reality-milestones'" class="page-card">
          <RealityMilestonesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'crush-milestones'" class="page-card">
          <CrushMilestonesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'character-production'" class="page-card">
          <CharacterProductionPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'character-unlocks'" class="page-card">
          <CharacterUnlocksPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'character-levels'" class="page-card">
          <CharacterLevelsPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'stratum-speed'" class="dream-crystals-page">
          <StratumSpeedPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'debug-progression'" class="dream-crystals-page">
          <DebugProgressionPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'strata-overview'" class="strata-overview-host">
          <StrataOverviewPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'current-stratum'" class="page-card">
          <CurrentStratumPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'lift'" class="lift-page-host">
          <LiftPage :game="props.game" />
        </div>
        
        <div v-else-if="selectedSecondary === 'save'" class="page-card">
          <SavePage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'dc-upgrades'" class="dream-crystals-page">
          <DreamCrystalUpgradesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'coherence-upgrades'" class="dream-crystals-page">
          <CoherenceUpgradesPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'dc-autobuyers'" class="dream-crystals-page">
          <DreamCrystalAutobuyersPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'numbers'" class="page-card">
          {{ t("mainPage.placeholders.numbers") }}
        </div>

        <div v-else-if="selectedSecondary === 'multiplier-breakdown'" class="dream-crystals-page">
          <MultiplierBreakdownPage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'theme'" class="page-card">
          <ThemePage :game="props.game" />
        </div>

        <div v-else-if="selectedSecondary === 'debug'" class="page-card">
          {{ t("mainPage.placeholders.debug") }}
        </div>

        <div v-else class="page-card">
          {{ t("mainPage.placeholders.unknownPage") }}
        </div>
      </section>
    </main>

    <Teleport to="body">
      <transition name="crush-dialog-fade">
        <div
          v-if="isCondenseDialogOpen"
          class="crush-dialog-backdrop"
          @click.self="closeCondenseDialog"
        >
          <section
            class="crush-dialog condense-prestige-dialog"
            role="dialog"
            aria-modal="true"
            :aria-label="t('prestigeConfirmations.condense.title')"
          >
            <div class="crush-dialog-kicker condense-dialog-kicker">
              {{ t("prestigeConfirmations.kicker") }}
            </div>
            <h3>{{ t("prestigeConfirmations.condense.title") }}</h3>
            <p class="crush-dialog-warning">{{ t("prestigeConfirmations.condense.warning") }}</p>

            <div class="crush-dialog-section">
              <h4>{{ t("prestigeConfirmations.resetTitle") }}</h4>
              <ul>
                <li>{{ t("prestigeConfirmations.condense.resetDreamEnergy") }}</li>
                <li>{{ t("prestigeConfirmations.condense.resetDreamCrystals") }}</li>
              </ul>
              <p class="crush-preserved">{{ t("prestigeConfirmations.condense.preserved") }}</p>
            </div>

            <div class="crush-dialog-section condense-reward-section">
              <h4>{{ t("prestigeConfirmations.rewardTitle") }}</h4>
              <div class="crush-dialog-gain">
                {{ t("prestigeConfirmations.condense.reward", { value: coherencePointGainText }) }}
              </div>
            </div>

            <div class="crush-dialog-actions">
              <button class="crush-cancel-button" @click="closeCondenseDialog">
                {{ t("prestigeConfirmations.cancel") }}
              </button>
              <button class="crush-confirm-button condense-confirm-button" @click="confirmCondenseCoherence">
                {{ t("coherence.condense", { value: coherencePointGainText }) }}
              </button>
            </div>
          </section>
        </div>
      </transition>

      <transition name="crush-dialog-fade">
        <div
          v-if="isExtractDialogOpen"
          class="crush-dialog-backdrop"
          @click.self="closeExtractDialog"
        >
          <section
            class="crush-dialog extract-prestige-dialog"
            role="dialog"
            aria-modal="true"
            :aria-label="t('prestigeConfirmations.extract.title')"
          >
            <div class="crush-dialog-kicker extract-dialog-kicker">
              {{ t("prestigeConfirmations.kicker") }}
            </div>
            <h3>{{ t("prestigeConfirmations.extract.title") }}</h3>
            <p class="crush-dialog-warning">{{ t("prestigeConfirmations.extract.warning") }}</p>

            <div class="crush-dialog-section">
              <h4>{{ t("prestigeConfirmations.resetTitle") }}</h4>
              <ul>
                <li>{{ t("prestigeConfirmations.extract.resetDreamEnergy") }}</li>
                <li>{{ t("prestigeConfirmations.extract.resetDreamCrystals") }}</li>
                <li>{{ t("prestigeConfirmations.extract.entropy") }}</li>
              </ul>
              <p class="crush-preserved">{{ t("prestigeConfirmations.extract.preserved") }}</p>
            </div>

            <div class="crush-dialog-section extract-reward-section">
              <h4>{{ t("prestigeConfirmations.rewardTitle") }}</h4>
              <div class="crush-dialog-gain">
                {{ t("prestigeConfirmations.extract.reward", {
                  value: chaoticEtherGainText,
                  tier: activeChaoticEtherTier,
                }) }}
              </div>
            </div>

            <div class="crush-dialog-actions">
              <button class="crush-cancel-button" @click="closeExtractDialog">
                {{ t("prestigeConfirmations.cancel") }}
              </button>
              <button class="crush-confirm-button extract-confirm-button" @click="confirmExtractChaoticEther">
                {{ t("chaoticEther.extract", {
                  value: chaoticEtherGainText,
                  tier: activeChaoticEtherTier,
                }) }}
              </button>
            </div>
          </section>
        </div>
      </transition>

      <transition name="crush-dialog-fade">
        <div
          v-if="isCrushDialogOpen"
          class="crush-dialog-backdrop"
          @click.self="closeCrushDialog"
        >
          <section class="crush-dialog" role="dialog" aria-modal="true" :aria-label="t('crush.dialog.title')">
            <div class="crush-dialog-kicker">{{ t("crush.dialog.kicker") }}</div>
            <h3>{{ t("crush.dialog.title") }}</h3>
            <p class="crush-dialog-warning">{{ t("crush.dialog.warning") }}</p>

            <div class="crush-dialog-section">
              <h4>{{ t("crush.dialog.resetTitle") }}</h4>
              <ul>
                <li>{{ t("crush.dialog.resetStrata") }}</li>
                <li>{{ t("crush.dialog.resetProgression") }}</li>
                <li>{{ t("crush.dialog.resetCharacters") }}</li>
              </ul>
              <p class="crush-preserved">{{ t("crush.dialog.preserved") }}</p>
            </div>

            <div class="crush-dialog-section reward-section">
              <h4>{{ t("crush.dialog.rewardTitle") }}</h4>
              <div class="crush-dialog-gain">
                {{ t("crush.dialog.reward", {
                  current: crushMilestoneCount,
                  next: crushMilestoneCount + 1,
                  multiplier: nextCrushDreamCrystalMultiplierText,
                }) }}
              </div>
              <p v-if="nextCrushMilestone" class="next-crush-effect">
                {{ t("crush.dialog.nextEffect", { effect: t(nextCrushMilestone.effectKey) }) }}
              </p>
              <p class="crush-placeholder-warning">{{ t("crush.dialog.placeholderWarning") }}</p>
            </div>

            <div class="crush-dialog-actions">
              <button class="crush-cancel-button" @click="closeCrushDialog">
                {{ t("crush.dialog.cancel") }}
              </button>
              <button class="crush-confirm-button" @click="confirmCrush">
                {{ t("crush.action") }}
              </button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>
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
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  text-align: center;
}

.top-panel {
  display: grid;
  grid-template-columns: minmax(218px, 1fr) minmax(280px, 2fr) minmax(218px, 1fr);
  align-items: center;
  column-gap: clamp(12px, 2vw, 28px);
  min-height: var(--right-top-height);
  box-sizing: border-box;
  padding: var(--panel-padding);
  background:
    radial-gradient(circle at center, rgba(114, 88, 211, 0.08), transparent 45%),
    linear-gradient(180deg, var(--bg-right-top) 0%, #0d1427 100%);
  border-bottom: 1px solid var(--border-soft);
}

.top-center-content {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.coherence-panel {
  grid-column: 3;
  grid-row: 1;
  justify-self: center;
  width: 218px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid rgba(142, 222, 255, 0.48);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(16, 39, 62, 0.92) 0%, rgba(8, 22, 40, 0.96) 100%);
  box-shadow:
    0 0 24px rgba(89, 194, 255, 0.16),
    inset 0 0 20px rgba(153, 223, 255, 0.08);
  text-align: left;
}

.crush-panel {
  border-color: rgba(202, 35, 61, 0.7);
  background:
    radial-gradient(circle at 80% 8%, rgba(238, 31, 62, 0.14), transparent 38%),
    linear-gradient(180deg, rgba(55, 5, 14, 0.96) 0%, rgba(19, 2, 7, 0.99) 100%);
  box-shadow:
    0 0 26px rgba(211, 20, 50, 0.2),
    inset 0 0 22px rgba(255, 45, 76, 0.07);
}

.chaotic-ether-panel {
  grid-column: 1;
  grid-row: 1;
  justify-self: center;
  width: 218px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid rgba(255, 180, 88, 0.54);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(66, 34, 15, 0.92) 0%, rgba(31, 17, 10, 0.96) 100%);
  box-shadow:
    0 0 24px rgba(255, 139, 61, 0.16),
    inset 0 0 20px rgba(255, 191, 117, 0.08);
  text-align: left;
}

.coherence-resource-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chaotic-ether-resource-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.coherence-label {
  color: #aeeaff;
  font-size: 0.78rem;
  font-weight: 700;
}

.crush-label { color: #ff9caa; }

.chaotic-ether-label {
  color: #ffd19a;
  font-size: 0.78rem;
  font-weight: 700;
}

.coherence-amount {
  color: #eefcff;
  font-family: var(--font-number);
  font-size: 1.18rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 14px rgba(126, 226, 255, 0.36);
}

.crush-amount {
  color: #fff0f2;
  text-shadow: 0 0 15px rgba(255, 35, 68, 0.5);
}

.chaotic-ether-amount {
  color: #fff5e8;
  font-family: var(--font-number);
  font-size: 1.18rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 14px rgba(255, 157, 80, 0.36);
}

.condense-button {
  width: 100%;
  height: 36px;
  margin-top: 10px;
  border: 1px solid rgba(173, 236, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, #57c8ee 0%, #247aab 100%);
  color: #031221;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 0 18px rgba(84, 205, 255, 0.26),
    inset 0 0 14px rgba(255, 255, 255, 0.18);
  transition:
    transform 0.1s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.condense-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.condense-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  filter: grayscale(0.35);
}

.crush-button {
  border-color: rgba(255, 111, 132, 0.72);
  background: linear-gradient(180deg, #d92c48 0%, #750b20 100%);
  color: #fff4f5;
  box-shadow:
    0 0 20px rgba(226, 25, 57, 0.28),
    inset 0 0 14px rgba(255, 255, 255, 0.12);
  letter-spacing: 0.05em;
}

.crush-progress-line { color: #d26072; }

.chaotic-ether-button {
  width: 100%;
  height: 36px;
  margin-top: 10px;
  border: 1px solid rgba(255, 208, 147, 0.66);
  border-radius: 8px;
  background: linear-gradient(180deg, #ffb053 0%, #c95e21 100%);
  color: #1b0903;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 0 18px rgba(255, 127, 54, 0.26),
    inset 0 0 14px rgba(255, 255, 255, 0.18);
  transition:
    transform 0.1s ease,
    filter 0.15s ease,
    opacity 0.15s ease;
}

.chaotic-ether-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.chaotic-ether-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  filter: grayscale(0.35);
}

.coherence-loss-line {
  margin-top: 8px;
  color: #8ecde7;
  font-size: 0.76rem;
  text-align: center;
}

.chaotic-ether-note {
  margin-top: 10px;
  color: #f0a76e;
  font-size: 0.78rem;
  text-align: center;
}

.crush-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 0, 2, 0.82);
  backdrop-filter: blur(6px);
}

.crush-dialog {
  width: min(570px, 100%);
  max-height: min(760px, calc(100vh - 48px));
  overflow-y: auto;
  box-sizing: border-box;
  padding: 25px;
  border: 1px solid rgba(224, 49, 76, 0.78);
  border-radius: 8px;
  background:
    radial-gradient(circle at 85% 5%, rgba(233, 31, 63, 0.18), transparent 30%),
    linear-gradient(155deg, #32050d 0%, #110207 55%, #080104 100%);
  color: #ead9dc;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62), 0 0 42px rgba(192, 17, 45, 0.22);
  text-align: left;
}

.crush-dialog-kicker {
  color: #e6536a;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.crush-dialog h3 { margin: 7px 0 6px; color: #fff0f2; font-size: 1.65rem; }
.crush-dialog-warning { margin: 0 0 18px; color: #e896a3; line-height: 1.5; }
.crush-dialog-section { margin-top: 12px; padding: 14px 15px; border: 1px solid rgba(135, 45, 59, 0.58); border-radius: 6px; background: rgba(24, 4, 9, 0.68); }
.crush-dialog-section h4 { margin: 0 0 8px; color: #f4cbd1; }
.crush-dialog-section ul { margin: 0; padding-left: 20px; color: #cf9ba4; line-height: 1.55; }
.crush-preserved { margin: 9px 0 0; color: #98757c; font-size: 0.8rem; }
.reward-section { border-color: rgba(195, 43, 67, 0.68); }
.crush-dialog-gain { color: #fff0f2; font-family: var(--font-number); font-size: 1.05rem; font-weight: 800; }
.next-crush-effect { margin: 9px 0 0; color: #dca2ac; line-height: 1.5; }
.crush-placeholder-warning { margin: 9px 0 0; color: #a46f78; font-size: 0.78rem; }
.crush-dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.crush-dialog-actions button { min-width: 108px; padding: 10px 16px; border-radius: 6px; color: #f8e9ec; font: inherit; font-weight: 800; cursor: pointer; }
.crush-cancel-button { border: 1px solid #70414a; background: #28171b; }
.crush-confirm-button { border: 1px solid #f06c81; background: linear-gradient(180deg, #d92b47, #760a1f); box-shadow: 0 0 18px rgba(220, 25, 56, 0.22); }
.crush-dialog-fade-enter-active, .crush-dialog-fade-leave-active { transition: opacity 0.16s ease; }
.crush-dialog-fade-enter-from, .crush-dialog-fade-leave-to { opacity: 0; }

.condense-prestige-dialog {
  border-color: rgba(95, 205, 244, 0.78);
  background:
    radial-gradient(circle at 85% 5%, rgba(74, 199, 243, 0.17), transparent 30%),
    linear-gradient(155deg, #0c3042 0%, #061824 55%, #030c12 100%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62), 0 0 42px rgba(47, 175, 226, 0.2);
}
.condense-prestige-dialog .crush-dialog-section { border-color: rgba(70, 153, 188, 0.52); background: rgba(4, 24, 34, 0.72); }
.condense-prestige-dialog .crush-dialog-warning { color: #9ad7ed; }
.condense-dialog-kicker { color: #6fd5f5; }
.condense-reward-section { border-color: rgba(89, 204, 240, 0.7) !important; }
.condense-confirm-button { border-color: #83dcfa; background: linear-gradient(180deg, #329fca, #155775); box-shadow: 0 0 18px rgba(50, 174, 220, 0.22); }

.extract-prestige-dialog {
  border-color: rgba(255, 174, 79, 0.8);
  background:
    radial-gradient(circle at 85% 5%, rgba(255, 139, 48, 0.19), transparent 30%),
    linear-gradient(155deg, #42210a 0%, #211006 55%, #100702 100%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62), 0 0 42px rgba(226, 111, 31, 0.2);
}
.extract-prestige-dialog .crush-dialog-section { border-color: rgba(186, 109, 48, 0.56); background: rgba(37, 17, 4, 0.72); }
.extract-prestige-dialog .crush-dialog-warning { color: #efbd8b; }
.extract-dialog-kicker { color: #ffad60; }
.extract-reward-section { border-color: rgba(240, 149, 67, 0.72) !important; }
.extract-confirm-button { border-color: #ffc27f; background: linear-gradient(180deg, #d98131, #864215); box-shadow: 0 0 18px rgba(224, 122, 39, 0.24); }

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

.top-shielding-line {
  color: #8edfff;
  font-size: 0.95rem;
  text-shadow: 0 0 10px rgba(112, 211, 255, 0.24);
}

.entropy-panel {
  min-width: 220px;
  padding: 7px 14px 8px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.52);
  box-shadow:
    0 0 18px rgba(255, 255, 255, 0.18),
    inset 0 0 12px rgba(255, 255, 255, 0.05);
}

.entropy-primary {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  color: #f8fbff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.34);
}

.entropy-label {
  font-size: 0.84rem;
  font-weight: 800;
}

.entropy-value {
  font-family: var(--font-number);
  font-size: 1.15rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.entropy-meta {
  margin-top: 2px;
  color: rgba(235, 241, 255, 0.68);
  font-size: 0.72rem;
  font-weight: 600;
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

.lift-page-host {
  width: min(1040px, 100%);
  display: flex;
  justify-content: center;
}

.strata-overview-host {
  width: min(1040px, 100%);
  display: flex;
  justify-content: center;
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

@media (max-width: 980px) {
  .top-panel {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.5rem;
  }

  .top-center-content {
    grid-column: 1;
    grid-row: auto;
  }

  .chaotic-ether-panel {
    grid-column: 1;
    grid-row: auto;
    width: min(360px, 100%);
    margin-top: 6px;
  }

  .coherence-panel {
    grid-column: 1;
    grid-row: auto;
    width: min(360px, 100%);
    margin-top: 6px;
  }
}
</style>
