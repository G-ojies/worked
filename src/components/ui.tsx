import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { radius, space, useTheme } from "../theme";

export function Button({
  label,
  onPress,
  kind = "primary",
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "quiet" | "amber" | "green";
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const fill = { primary: t.blue, quiet: "transparent", amber: t.amberSoft, green: t.greenSoft }[kind];
  const ink = { primary: t.onBlue, quiet: t.blue, amber: t.amber, green: t.green }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: fill, borderColor: kind === "quiet" ? t.rule2 : "transparent" },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={ink} /> : <Text style={[styles.buttonText, { color: ink }]}>{label}</Text>}
    </Pressable>
  );
}

export function Bar({ solid, shaky, total }: { solid: number; shaky: number; total: number }) {
  const t = useTheme();
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%` as const;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${solid} solid and ${shaky} shaky of ${total}`}
      style={[styles.bar, { backgroundColor: t.rule }]}
    >
      <View style={{ width: pct(solid), backgroundColor: t.green }} />
      <View style={{ width: pct(shaky), backgroundColor: t.amber }} />
    </View>
  );
}

export function Tag({ label, tone = "blue" }: { label: string; tone?: "blue" | "amber" | "green" | "muted" }) {
  const t = useTheme();
  const bg = { blue: t.blueSoft, amber: t.amberSoft, green: t.greenSoft, muted: t.sunk }[tone];
  const fg = { blue: t.blueInk, amber: t.amber, green: t.green, muted: t.muted }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.rule }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  bar: { height: 6, borderRadius: radius.pill, flexDirection: "row", overflow: "hidden" },
  tag: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: "flex-start" },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
});
