import * as Haptics from "expo-haptics";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContentView } from "../../components/ContentView";
import { Button, Card } from "../../components/ui";
import { flatten, getBodies, getCourse, toolsUnlocked } from "../../lib/content";
import { useProgress, type Mark } from "../../store/progress";
import { usePurchases } from "../../store/purchases";
import { space, useTheme } from "../../theme";

export default function Flashcards() {
  const { course: courseId } = useLocalSearchParams<{ course: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const course = getCourse(courseId);
  const progress = useProgress();
  const { plus, ready } = usePurchases();

  // The deck is ordered once, when it is opened: shaky first, then unseen, then
  // solid. Re-sorting as cards are marked would shuffle the deck under the reader.
  const deck = useMemo(() => {
    if (!course) return [];
    const marks = progress.marks[courseId] ?? {};
    const rank = (id: string) => (marks[id] === "shaky" ? 0 : marks[id] === "solid" ? 2 : 1);
    return flatten(course)
      .map((e) => e.question)
      .sort((a, b) => rank(a.id) - rank(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, courseId]);

  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ solid: 0, shaky: 0 });

  if (!course) return <Text style={{ padding: space.xl, color: t.ink }}>Course not found.</Text>;
  if (!toolsUnlocked(course, plus)) return ready ? <Redirect href="/paywall" /> : null;

  const card = deck[at];

  if (!card) {
    return (
      <View style={[styles.done, { backgroundColor: t.paper }]}>
        <Card>
          <Text style={[styles.h1, { color: t.ink }]}>Deck finished</Text>
          <Text style={[styles.body, { color: t.ink2 }]}>
            {score.solid} got it, {score.shaky} shaky. The shaky ones come first next time.
          </Text>
          <Button label="Back to course" onPress={() => router.back()} />
        </Card>
      </View>
    );
  }

  const bodies = getBodies(courseId)[card.id];
  const front = `<p class="app-label">${card.num} · ${card.marks}</p><div class="prompt">${bodies?.prompt || `<p><strong>${card.title}</strong></p>`}</div>`;
  const back = `<p class="app-label">${card.label}</p><div class="sol-body">${bodies?.solution ?? ""}</div>`;

  const answer = (value: Mark) => {
    Haptics.selectionAsync().catch(() => {});
    progress.mark(courseId, card.id, value);
    setScore((s) => ({ ...s, [value]: s[value] + 1 }));
    setFlipped(false);
    setAt((n) => n + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.paper }}>
      <View style={[styles.head, { borderBottomColor: t.rule }]}>
        <Text style={[styles.count, { color: t.muted }]}>
          Card {at + 1} of {deck.length} · {flipped ? "Answer" : "Question"}
        </Text>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={2}>
          {card.title}
        </Text>
      </View>

      <ContentView key={`${card.id}:${flipped}`} body={flipped ? back : front} />

      <View
        style={[
          styles.foot,
          { borderTopColor: t.rule, backgroundColor: t.surface, paddingBottom: insets.bottom + space.md },
        ]}
      >
        {flipped ? (
          <View style={styles.row}>
            <Button label="Shaky" kind="amber" style={{ flex: 1 }} onPress={() => answer("shaky")} />
            <Button label="Got it" kind="green" style={{ flex: 1 }} onPress={() => answer("solid")} />
          </View>
        ) : (
          <Button label="Flip card" onPress={() => setFlipped(true)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1 },
  count: { fontSize: 13, fontVariant: ["tabular-nums"] },
  title: { fontSize: 18, lineHeight: 24, fontWeight: "700", marginTop: 2 },
  foot: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: 1 },
  row: { flexDirection: "row", gap: space.sm },
  done: { flex: 1, justifyContent: "center", padding: space.xl },
  h1: { fontSize: 24, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 23, marginVertical: space.md },
});
