import { useColorScheme } from "react-native";

// The same palette as the worked solutions rendered inside the WebView, so the
// native chrome and the content read as one surface.
const light = {
  scheme: "light" as "light" | "dark",
  paper: "#FFFFFF",
  surface: "#FFFFFF",
  sunk: "#F5F7FA",
  band: "#EEF3FE",
  ink: "#1F1F1F",
  ink2: "#3D4A5C",
  muted: "#5B6876",
  rule: "#E4E8EF",
  rule2: "#C6CFDC",
  blue: "#0056D2",
  blueInk: "#00419E",
  blueSoft: "#E3EDFD",
  amber: "#B4690E",
  amberSoft: "rgba(180,105,14,0.12)",
  green: "#087443",
  greenSoft: "rgba(8,116,67,0.12)",
  onBlue: "#FFFFFF",
};

const dark: typeof light = {
  scheme: "dark",
  paper: "#0F1319",
  surface: "#171C24",
  sunk: "#1C222C",
  band: "#141C2B",
  ink: "#EDF0F4",
  ink2: "#C3CBD6",
  muted: "#8E9AA8",
  rule: "#262E3A",
  rule2: "#364152",
  blue: "#6BA4FF",
  blueInk: "#9CC2FF",
  blueSoft: "rgba(107,164,255,0.14)",
  amber: "#E0A544",
  amberSoft: "rgba(224,165,68,0.16)",
  green: "#4ECB8B",
  greenSoft: "rgba(78,203,139,0.16)",
  onBlue: "#0F1319",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
