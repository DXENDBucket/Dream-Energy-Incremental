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
    label: "Crystals",
    borderColor: "#5b7cfa",
    textColor: "#dce6ff",
    children: [
      { id: "dream-crystals", icon: "◇", label: "Dream Crystals" },
    ],
  },
  {
    id: "upgrades",
    label: "Upgrades",
    borderColor: "#5bb5fa",
    textColor: "#dce6ff",
    children: [
      { id: "dc-upgrades", icon: "↑", label: "Dream Crystals Upgrades" },
    ],
  },
  {
    id: "milestones",
    label: "Milestones",
    borderColor: "#805bfa",
    textColor: "#dce6ff",
    children: [
      { id: "de-milestones", icon: "⚐", label: "Dream Energy Milestones" },
    ],
  },
  {
    id: "strata",
    label: "Strata",
    borderColor: "#8b6cff",
    textColor: "#efe3ff",
    children: [
      { id: "surface", icon: "S", label: "Surface" },
      { id: "depth", icon: "D", label: "Depth" },
      { id: "dream", icon: "✦", label: "Dream" },
    ],
  },
  {
    id: "stats",
    label: "Stats",
    borderColor: "#39c0b2",
    textColor: "#d7fffb",
    children: [
      { id: "numbers", icon: "#", label: "Numbers" },
      { id: "history", icon: "H", label: "History" },
    ],
  },
  {
    id: "options",
    label: "Options",
    borderColor: "#c082ff",
    textColor: "#f2deff",
    children: [
      { id: "save", icon: "S", label: "Save" },
      { id: "theme", icon: "T", label: "Theme" },
      { id: "debug", icon: "!", label: "Debug" },
    ],
  },
] as const;