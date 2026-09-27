import * as Haptics from "expo-haptics";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WebView } from "react-native-webview";

import { ContentView } from "../../../components/ContentView";
import { Button } from "../../../components/ui";
import { flatten, getBodies, getCourse, sectionUnlocked } from "../../../lib/content";
import { questionBody, REVEAL_JS } from "../../../lib/html";
import { useProgress, type Mark } from "../../../store/progress";
import { usePurchases } from "../../../store/purchases";
import { space, useTheme } from "../../../theme";

export default function QuestionScreen() {
  const { course: courseId, qid } = useLocalSearchParams<{ course: string; qid: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const progress = useProgress();
  const { plus, ready } = usePurchases();
  const [revealed, setRevealed] = useState(false);

  const course = getCourse(courseId);
  const all = useMemo(() => (course ? flatten(course) : []), [course]);
  const at = all.findIndex((e) => e.question.id === qid);
  const entry = all[at];

  const open = !!course && !!entry && sectionUnlocked(course, entry.section, plus);

  const { visit } = progress;
  useEffect(() => {
    setRevealed(false);
    if (open) visit(courseId, qid);
  }, [open, courseId, qid, visit]);

  // The document is built once per question, always with the solution hidden.
  // Revealing is done inside the page so a long question keeps its scroll place.
  const body = useMemo(() => {
    if (!entry || !open) return "";
    const b = getBodies(courseId)[qid];
    return b ? questionBody(b.prompt, b.solution, entry.question.label, entry.question.title, false) : "";
  }, [courseId, qid, entry, open]);

  if (!course || !entry) return <Text style={{ padding: space.xl, color: t.ink }}>Question not found.</Text>;
  // A locked question reached by a deep link or the next button goes to the
  // paywall, not to the content. Wait for the entitlement before deciding.
  if (!open) return ready ? <Redirect href="/paywall" /> : null;

  const current = progress.marks[courseId]?.[qid];
  const next = all[at + 1];

  const set = (value: Mark) => {
    Haptics.selectionAsync().catch(() => {});
    progress.mark(courseId, qid, current === value ? null : value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.paper }}>
      <Stack.Screen options={{ title: `${course.code} · ${entry.question.num}` }} />
      <View style={[styles.head, { borderBottomColor: t.rule }]}>
        <Text style={[styles.title, { color: t.ink }]}>{entry.question.title}</Text>
        <Text style={[styles.meta, { color: t.muted }]}>
          {entry.question.marks} · {at + 1} of {all.length}
        </Text>
      </View>

      <ContentView key={`${courseId}/${qid}`} ref={web} body={body} />

      <View
        style={[
          styles.foot,
          { borderTopColor: t.rule, backgroundColor: t.surface, paddingBottom: insets.bottom + space.md },
        ]}
      >
        {revealed ? (
          <>
            <Text style={[styles.ask, { color: t.muted }]}>How did it go?</Text>
            <View style={styles.row}>
              <Button
                label={current === "shaky" ? "Shaky ✓" : "Shaky"}
                kind="amber"
                style={styles.grow}
                onPress={() => set("shaky")}
              />
              <Button
                label={current === "solid" ? "Got it ✓" : "Got it"}
                kind="green"
                style={styles.grow}
                onPress={() => set("solid")}
              />
              {next ? (
                <Button
                  label="Next"
                  style={styles.grow}
                  onPress={() => router.replace(`/question/${courseId}/${next.question.id}`)}
                />
              ) : null}
            </View>
          </>
        ) : (
          <Button
            label={`Show ${entry.question.label.toLowerCase()}`}
            onPress={() => {
              setRevealed(true);
              web.current?.injectJavaScript(REVEAL_JS);
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: 1 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: space.xs, fontVariant: ["tabular-nums"] },
  foot: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: 1 },
  ask: { fontSize: 13, marginBottom: space.sm },
  row: { flexDirection: "row", gap: space.sm },
  grow: { flex: 1, paddingHorizontal: space.sm },
});
