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
    ],
  },
  {
    id: "upgrades",
    labelKey: "navigation.primary.upgrades",
    borderColor: "#5bb5fa",
    textColor: "#dce6ff",
    children: [
      { id: "dc-upgrades", icon: "↑", labelKey: "navigation.secondary.dreamCrystalUpgrades" },
    ],
  },
  {
    id: "milestones",
    labelKey: "navigation.primary.milestones",
    borderColor: "#805bfa",
    textColor: "#dce6ff",
    children: [
      { id: "de-milestones", icon: "⚐", labelKey: "navigation.secondary.dreamEnergyMilestones" },
    ],
  },
  {
    id: "strata",
    labelKey: "navigation.primary.strata",
    borderColor: "#8b6cff",
    textColor: "#efe3ff",
    children: [
      { id: "current-stratum", icon: "C", labelKey: "navigation.secondary.currentStratum" },
      { id: "surface", icon: "S", labelKey: "navigation.secondary.surface" },
      { id: "depth", icon: "D", labelKey: "navigation.secondary.depth" },
      { id: "dream", icon: "✦", labelKey: "navigation.secondary.dream" },
    ],
  },
  {
    id: "stats",
    labelKey: "navigation.primary.stats",
    borderColor: "#39c0b2",
    textColor: "#d7fffb",
    children: [
      { id: "numbers", icon: "#", labelKey: "navigation.secondary.numbers" },
      { id: "history", icon: "H", labelKey: "navigation.secondary.history" },
    ],
  },
  {
    id: "options",
    labelKey: "navigation.primary.options",
    borderColor: "#c082ff",
    textColor: "#f2deff",
    children: [
      { id: "save", icon: "S", labelKey: "navigation.secondary.save" },
      { id: "theme", icon: "T", labelKey: "navigation.secondary.theme" },
    ],
  },
  {
    id: "debug",
    labelKey: "navigation.primary.debug",
    borderColor: "#f44e6d",
    textColor: "#ffb2ea",
    children: [
      { id: "stratum-speed", icon: "»", labelKey: "navigation.secondary.stratumSpeed" },
    ],
  },
] as const;
