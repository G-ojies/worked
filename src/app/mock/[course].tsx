import * as Haptics from "expo-haptics";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContentView } from "../../components/ContentView";
import { Button, Card } from "../../components/ui";
import { flatten, getBodies, getCourse, toolsUnlocked, type Question } from "../../lib/content";
import { useProgress, type Mark } from "../../store/progress";
import { usePurchases } from "../../store/purchases";
import { space, useTheme } from "../../theme";

const PAPER_LENGTH = 4;

// Time follows the marks, at the pace of a real paper: about a minute and a
// half per mark. Questions with no mark count (definitions, recall) get ten.
function minutesFor(q: Question) {
  const marks = parseInt(q.marks, 10);
  return Number.isFinite(marks) ? Math.min(30, Math.max(6, Math.round(marks * 1.5))) : 10;
}

// Draws a paper the way an examiner would: from real and mock papers where the
// course has them, from everything otherwise.
function draw(pool: Question[], n: number) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Mock() {
  const { course: courseId } = useLocalSearchParams<{ course: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const course = getCourse(courseId);
  const progress = useProgress();
  const { plus, ready } = usePurchases();

  const [phase, setPhase] = useState<"brief" | "sitting" | "marking" | "result">("brief");
  const [paper, setPaper] = useState<Question[]>([]);
  const [at, setAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [results, setResults] = useState<Mark[]>([]);

  const pool = useMemo(() => {
    if (!course) return [];
    const papers = course.sections.filter((s) => s.kind === "paper").flatMap((s) => s.questions);
    return papers.length >= PAPER_LENGTH ? papers : flatten(course).map((e) => e.question);
  }, [course]);

  // The clock runs off a deadline, not a counter, so time spent with the app in
  // the background is still time spent.
  const [deadline, setDeadline] = useState(0);
  useEffect(() => {
    if (phase !== "sitting") return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        setAt(0);
        setPhase("marking");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, deadline]);

  if (!course) return <Text style={{ padding: space.xl, color: t.ink }}>Course not found.</Text>;
  if (!toolsUnlocked(course, plus)) return ready ? <Redirect href="/paywall" /> : null;

  const start = () => {
    const drawn = draw(pool, PAPER_LENGTH);
    setPaper(drawn);
    setResults([]);
    setAt(0);
    setDeadline(Date.now() + drawn.reduce((n, q) => n + minutesFor(q), 0) * 60 * 1000);
    setPhase("sitting");
  };

  const foot = { borderTopColor: t.rule, backgroundColor: t.surface, paddingBottom: insets.bottom + space.md };

  if (phase === "brief") {
    return (
      <View style={[styles.centre, { backgroundColor: t.paper }]}>
        <Card>
          <Text style={[styles.kicker, { color: t.blue }]}>{course.code} · MOCK PAPER</Text>
          <Text style={[styles.h1, { color: t.ink }]}>
            {PAPER_LENGTH} questions, against the clock
          </Text>
          <Text style={[styles.body, { color: t.ink2 }]}>
            Time is set by the marks on the questions drawn. Work on paper. Solutions stay hidden until the clock stops or you hand in, then you mark each answer
            against the worked solution.
          </Text>
          <Button label="Start the clock" onPress={start} />
        </Card>
      </View>
    );
  }

  if (phase === "result") {
    const solid = results.filter((r) => r === "solid").length;
    return (
      <View style={[styles.centre, { backgroundColor: t.paper }]}>
        <Card>
          <Text style={[styles.kicker, { color: t.blue }]}>{course.code} · RESULT</Text>
          <Text style={[styles.h1, { color: t.ink }]}>
            {solid} of {paper.length} solid
          </Text>
          <Text style={[styles.body, { color: t.ink2 }]}>
            {solid === paper.length
              ? "A clean paper. Sit another to make sure it was not luck."
              : "The ones you marked shaky are saved. Filter the course by shaky to work through them."}
          </Text>
          <View style={{ gap: space.sm }}>
            <Button label="Sit another" onPress={start} />
            <Button label="Back to course" kind="quiet" onPress={() => router.back()} />
          </View>
        </Card>
      </View>
    );
  }

  const q = paper[at];
  const bodies = getBodies(courseId)[q.id];
  const ask = `<p class="app-label">${q.num} · ${q.marks}</p><div class="prompt">${bodies?.prompt || `<p><strong>${q.title}</strong></p>`}</div>`;

  if (phase === "sitting") {
    const handIn = () =>
      Alert.alert("Hand in the paper?", "The clock stops and the solutions open for marking.", [
        { text: "Keep working", style: "cancel" },
        {
          text: "Hand in",
          onPress: () => {
            setAt(0);
            setPhase("marking");
          },
        },
      ]);
    return (
      <View style={{ flex: 1, backgroundColor: t.paper }}>
        <View style={[styles.head, { borderBottomColor: t.rule }]}>
          <Text style={[styles.count, { color: t.muted }]}>
            Question {at + 1} of {paper.length}
          </Text>
          <Text
            accessibilityLabel={`${Math.ceil(left / 60)} minutes left`}
            style={[styles.clock, { color: left < 300 ? t.amber : t.ink }]}
          >
            {clock(left)}
          </Text>
        </View>
        <ContentView key={q.id} body={ask} />
        <View style={[styles.foot, foot]}>
          <View style={styles.row}>
            <Button
              label="Previous"
              kind="quiet"
              style={{ flex: 1 }}
              disabled={at === 0}
              onPress={() => setAt((n) => n - 1)}
            />
            {at < paper.length - 1 ? (
              <Button label="Next" style={{ flex: 1 }} onPress={() => setAt((n) => n + 1)} />
            ) : (
              <Button label="Hand in" style={{ flex: 1 }} onPress={handIn} />
            )}
          </View>
        </View>
      </View>
    );
  }

  const markIt = (value: Mark) => {
    Haptics.selectionAsync().catch(() => {});
    progress.mark(courseId, q.id, value);
    setResults((r) => [...r, value]);
    if (at < paper.length - 1) setAt((n) => n + 1);
    else setPhase("result");
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.paper }}>
      <View style={[styles.head, { borderBottomColor: t.rule }]}>
        <Text style={[styles.count, { color: t.muted }]}>
          Marking {at + 1} of {paper.length}
        </Text>
        <Text style={[styles.count, { color: t.muted }]}>Be strict</Text>
      </View>
      <ContentView
        key={`mark:${q.id}`}
        body={`${ask}<hr class="app-rule"><p class="app-label">${q.label}</p><div class="sol-body">${bodies?.solution ?? ""}</div>`}
      />
      <View style={[styles.foot, foot]}>
        <View style={styles.row}>
          <Button label="Shaky" kind="amber" style={{ flex: 1 }} onPress={() => markIt("shaky")} />
          <Button label="Got it" kind="green" style={{ flex: 1 }} onPress={() => markIt("solid")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: "center", padding: space.xl },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: space.sm },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 23, marginVertical: space.md },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
  },
  count: { fontSize: 14, fontVariant: ["tabular-nums"] },
  clock: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  foot: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: 1 },
  row: { flexDirection: "row", gap: space.sm },
});
