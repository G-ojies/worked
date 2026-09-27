import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card } from "../components/ui";
import { useProgress } from "../store/progress";
import { usePurchases } from "../store/purchases";
import { space, useTheme } from "../theme";

export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const store = usePurchases();
  const progress = useProgress();
  const [restoring, setRestoring] = useState(false);

  const restore = async () => {
    setRestoring(true);
    const found = await store.restore();
    setRestoring(false);
    Alert.alert(
      found ? "Worked Plus restored" : "Nothing to restore",
      found ? "Every course is unlocked again." : "No earlier purchase was found on this account.",
    );
  };

  const reset = () =>
    Alert.alert("Clear all progress?", "Every shaky and got it mark is removed. Purchases are not affected.", [
      { text: "Keep it", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: progress.reset },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: t.paper }}
      contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: insets.bottom + space.xxl }}
    >
      <Card>
        <Text style={[styles.kicker, { color: t.blue }]}>YOUR PLAN</Text>
        <Text style={[styles.title, { color: t.ink }]}>{store.plus ? "Worked Plus" : "Free"}</Text>
        <Text style={[styles.body, { color: t.muted }]}>
          {store.plus
            ? store.lifetime
              ? "Lifetime unlock. Every course, flashcards and mock papers."
              : `Active until ${new Date(store.expires ?? "").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}. Manage or cancel it in Google Play.`
            : "One full course, and the first two sections of every other course."}
        </Text>
        <View style={{ gap: space.sm }}>
          {store.plus ? null : <Button label="See Worked Plus" onPress={() => router.push("/paywall")} />}
          <Button
            label="Restore purchases"
            kind="quiet"
            busy={restoring}
            disabled={!store.configured}
            onPress={restore}
          />
        </View>
      </Card>

      <Card>
        <Text style={[styles.kicker, { color: t.blue }]}>PROGRESS</Text>
        <Text style={[styles.body, { color: t.muted, marginTop: 0 }]}>
          Marks are kept on this phone only. Nothing about your revision leaves the device.
        </Text>
        <Button label="Clear all progress" kind="quiet" onPress={reset} />
      </Card>

      <Text style={[styles.foot, { color: t.muted }]}>
        Worked 1.0.0 · Open source. Solutions are study aids written by students and may contain mistakes: check
        anything that matters against your own lecture notes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: space.xs },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22, marginTop: space.xs, marginBottom: space.md },
  foot: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: space.md, paddingHorizontal: space.lg },
});
