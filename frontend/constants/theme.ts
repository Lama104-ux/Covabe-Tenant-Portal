// Covabe design tokens for React Native

export const Colors = {
  // Brand (official Covabe palette)
  teal900: "#004951",   // PRIMARY brand
  teal500: "#00ABA0",   // Secondary
  cyan300: "#00FCE3",   // Highlight (dark surfaces only)
  teal800: "#044850",
  teal700: "#082832",
  teal100: "#DFE5E6",   // Soft chip bg

  // Brand blue (accent)
  blue700: "#0033CA",
  blue500: "#4F74DF",

  // Neutrals
  ink900: "#1F1F1F",   // Primary text
  ink600: "#5F5F5F",   // Secondary text
  ink500: "#9AA0A6",   // Faint
  bgApp: "#F5F7F8",
  bgCard: "#FFFFFF",
  bgInput: "#FAFBFB",
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.10)",

  // Semantic
  success: "#16A34A",
  warning: "#FFCA00",
  danger: "#8C181A",

  // Dark mode
  dark: {
    bg: "#0e1517",
    surface: "#162124",
    surfaceAlt: "#1c2a2e",
    border: "rgba(255,255,255,0.07)",
    borderStrong: "rgba(255,255,255,0.12)",
    text: "#F1F5F6",
    textMute: "rgba(241,245,246,0.6)",
    textFaint: "rgba(241,245,246,0.4)",
    inputBg: "#1c2a2e",
  },
};

export const Fonts = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  display: "Outfit_700Bold",
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32,
};

export type Theme = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMute: string;
  textFaint: string;
  inputBg: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
  dark: boolean;
};

export function makeTheme(dark = false, accent = Colors.teal900): Theme {
  const d = Colors.dark;
  return {
    bg: dark ? d.bg : Colors.bgApp,
    surface: dark ? d.surface : Colors.bgCard,
    surfaceAlt: dark ? d.surfaceAlt : "#FAFBFB",
    border: dark ? d.border : Colors.border,
    borderStrong: dark ? d.borderStrong : Colors.borderStrong,
    text: dark ? d.text : Colors.ink900,
    textMute: dark ? d.textMute : Colors.ink600,
    textFaint: dark ? d.textFaint : Colors.ink500,
    inputBg: dark ? d.inputBg : Colors.bgInput,
    accent,
    accentSoft: dark ? `${accent}22` : `${accent}15`,
    danger: Colors.danger,
    success: Colors.success,
    dark,
  };
}
