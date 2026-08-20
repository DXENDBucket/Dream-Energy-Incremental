export const UI_CONFIG = {
  sizes: {
    leftWidth: 180,
    infoHeight: 82,

    primaryButtonHeight: 52,
    primaryAccentWidth: 8,

    secondaryButtonSize: 46,
    secondaryButtonGap: 6,
    secondaryGap: 5,
    secondaryMenuPadding: 8,

    tooltipOffsetY: 10,

    rightTopHeight: 220,
    panelPadding: 20,
    radius: 10,
  },

  fonts: {
    main: `"Segoe UI", "Trebuchet MS", "Noto Sans SC", sans-serif`,
    title: `"Georgia", "Times New Roman", "Noto Serif SC", serif`,
    mono: `"Consolas", "Courier New", monospace`,
    number: `"Bahnschrift", "Segoe UI", "Arial", sans-serif`,
  },

  colors: {
    bgPage: "#0b1020",
    bgLeft: "#11182d",
    bgInfo: "#161f38",

    bgPrimary: "#131c31",
    bgPrimaryHover: "#22345f",
    bgPrimaryActive: "#314b8c",

    textPrimary: "#dfe6ff",
    textPrimaryHover: "#ffffff",
    textPrimaryActive: "#ffffff",

    bgSecondary: "#151f37",
    bgSecondaryHover: "#24365e",
    bgSecondaryActive: "#39528e",

    textSecondary: "#e6ebff",
    textSecondaryHover: "#ffffff",
    textSecondaryActive: "#ffffff",

    bgTooltip: "rgba(12, 18, 34, 0.96)",
    textTooltip: "#eef2ff",
    borderTooltip: "#6e7fe0",

    bgRightTop: "#0f1730",
    bgRightBottom: "#0a1023",

    textMain: "#e9ecff",
    textDim: "#aeb8da",
    textSoft: "#7f8bb3",

    borderSoft: "#253150",
    borderGlow: "#5670c9",
    shadow: "rgba(0, 0, 0, 0.35)",
  },
} as const;

export const PRIMARY_TABS = [
  {
    id: "crystals",
    labelKey: "navigation.primary.crystals",
    borderColor: "#5b7cfa",
    textColor: "#dce6ff",
    children: [
      { id: "dream-crystals", icon: "◇", labelKey: "navigation.secondary.dreamCrystals" },
      { id: "concept-crystals", icon: "⬡", labelKey: "navigation.secondary.conceptCrystals" },
      { id: "electromagnetic-crystals", icon: "⊕", labelKey: "navigation.secondary.electromagneticCrystals" },
    ],
  },
  {
    id: "upgrades",
    labelKey: "navigation.primary.upgrades",
    borderColor: "#5bb5fa",
    textColor: "#dce6ff",
    children: [
      { id: "dc-upgrades", icon: "↑", labelKey: "navigation.secondary.dreamCrystalUpgrades" },
      { id: "coherence-upgrades", icon: "U", labelKey: "navigation.secondary.coherenceUpgrades" },
      { id: "electromagnetic-upgrades", icon: "⚡", labelKey: "navigation.secondary.electromagneticUpgrades" },
    ],
  },
  {
    id: "milestones",
    labelKey: "navigation.primary.milestones",
    borderColor: "#805bfa",
    textColor: "#dce6ff",
    children: [
      { id: "de-milestones", icon: "⚐", labelKey: "navigation.secondary.dreamEnergyMilestones" },
      { id: "reality-milestones", icon: "R", labelKey: "navigation.secondary.realityMilestones" },
      { id: "crush-milestones", icon: "✦", labelKey: "navigation.secondary.crushMilestones" },
    ],
  },
  {
    id: "characters",
    labelKey: "navigation.primary.characters",
    borderColor: "#f0f0f0",
    textColor: "#ffffff",
    children: [
      { id: "character-production", icon: "α", labelKey: "navigation.secondary.characterProduction" },
      { id: "character-unlocks", icon: "+", labelKey: "navigation.secondary.characterUnlocks" },
      { id: "character-levels", icon: "↑", labelKey: "navigation.secondary.characterLevels" },
    ],
  },
  {
    id: "strata",
    labelKey: "navigation.primary.strata",
    borderColor: "#8b6cff",
    textColor: "#efe3ff",
    children: [
      { id: "current-stratum", icon: "C", labelKey: "navigation.secondary.currentStratum" },
      { id: "strata-overview", icon: "O", labelKey: "navigation.secondary.strataOverview" },
      { id: "lift", icon: "L", labelKey: "navigation.secondary.lift" },
    ],
  },
  {
    id: "autobuyers",
    labelKey: "navigation.primary.autobuyers",
    borderColor: "#48d8d2",
    textColor: "#d7fffb",
    children: [
      { id: "dc-autobuyers", icon: "A", labelKey: "navigation.secondary.dreamCrystalAutobuyers" },
    ],
  },
  {
    id: "stats",
    labelKey: "navigation.primary.stats",
    borderColor: "#39c0b2",
    textColor: "#d7fffb",
    children: [
      { id: "numbers", icon: "#", labelKey: "navigation.secondary.numbers" },
      { id: "multiplier-breakdown", icon: "×", labelKey: "navigation.secondary.multiplierBreakdown" },
    ],
  },
  {
    id: "options",
    labelKey: "navigation.primary.options",
    borderColor: "#c082ff",
    textColor: "#f2deff",
    children: [
      { id: "save", icon: "S", labelKey: "navigation.secondary.save" },
      { id: "theme", icon: "V", labelKey: "navigation.secondary.visual" },
    ],
  },
  {
    id: "debug",
    labelKey: "navigation.primary.debug",
    borderColor: "#f44e6d",
    textColor: "#ffb2ea",
    children: [
      { id: "debug-progression", icon: "D", labelKey: "navigation.secondary.debugProgression" },
      { id: "stratum-speed", icon: "»", labelKey: "navigation.secondary.stratumSpeed" },
    ],
  },
] as const;
