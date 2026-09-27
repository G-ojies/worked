import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bar, Button, Tag } from "../../components/ui";
import { getCourse, sectionUnlocked, toolsUnlocked } from "../../lib/content";
import { useProgress } from "../../store/progress";
import { usePurchases } from "../../store/purchases";
import { radius, space, useTheme } from "../../theme";

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const course = getCourse(id);
  const progress = useProgress();
  const { plus } = usePurchases();
  const [shakyOnly, setShakyOnly] = useState(false);

  const marks = progress.marks[id] ?? {};

  const sections = useMemo(
    () =>
      (course?.sections ?? [])
        .map((section) => ({
          section,
          data: shakyOnly ? section.questions.filter((q) => marks[q.id] === "shaky") : section.questions,
        }))
        .filter((s) => s.data.length > 0),
    [course, shakyOnly, marks],
  );

  if (!course) return <Text style={{ padding: space.xl, color: t.ink }}>Course not found.</Text>;

  const tally = progress.tally(course);
  const tools = toolsUnlocked(course, plus);
  const gate = (path: string) => router.push(tools ? path : "/paywall");

  return (
    <>
      <Stack.Screen options={{ title: course.code }} />
      <SectionList
        sections={sections}
        keyExtractor={(q) => q.id}
        stickySectionHeadersEnabled={false}
        style={{ backgroundColor: t.paper }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md }}>
            <Text style={[styles.h1, { color: t.ink }]}>{course.name}</Text>
            <Text style={[styles.blurb, { color: t.muted }]}>{course.blurb}</Text>
            <Bar solid={tally.solid} shaky={tally.shaky} total={course.count} />
            <Text style={[styles.meta, { color: t.muted }]}>
              {tally.solid} solid · {tally.shaky} shaky · {tally.left} left
            </Text>
            <View style={styles.tools}>
              <Button
                label={tools ? "Flashcards" : "Flashcards · Plus"}
                kind="quiet"
                style={styles.tool}
                onPress={() => gate(`/flashcards/${course.id}`)}
              />
              <Button
                label={tools ? "Mock paper" : "Mock paper · Plus"}
                kind="quiet"
                style={styles.tool}
                onPress={() => gate(`/mock/${course.id}`)}
              />
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: shakyOnly }}
              onPress={() => setShakyOnly((v) => !v)}
              style={[
                styles.filter,
                { borderColor: shakyOnly ? t.amber : t.rule2, backgroundColor: shakyOnly ? t.amberSoft : "transparent" },
              ]}
            >
              <Text style={{ color: shakyOnly ? t.amber : t.ink2, fontWeight: "600" }}>
                {shakyOnly ? "Showing shaky only" : "Show shaky only"}
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.blurb, { color: t.muted, textAlign: "center", marginTop: space.xl }]}>
            Nothing marked shaky yet. Mark a question shaky and it will wait for you here.
          </Text>
        }
        renderSectionHeader={({ section: { section } }) => {
          const open = sectionUnlocked(course, section, plus);
          return (
            <View style={[styles.sectionHead, { borderBottomColor: t.rule }]}>
              <View style={[styles.letter, { backgroundColor: t.blueSoft }]}>
                <Text style={{ color: t.blueInk, fontWeight: "800" }}>{section.letter}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: t.ink }]}>{section.title}</Text>
                <Text style={[styles.meta, { color: t.muted, marginTop: 0 }]}>{section.tally}</Text>
              </View>
              {open ? null : <Tag label="Plus" tone="muted" />}
              {open && section.kind === "paper" ? <Tag label="Paper" tone="blue" /> : null}
            </View>
          );
        }}
        renderItem={({ item, section: { section } }) => {
          const open = sectionUnlocked(course, section, plus);
          const mark = marks[item.id];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.num} ${item.title}${open ? "" : ", locked"}`}
              onPress={() => router.push(open ? `/question/${course.id}/${item.id}` : "/paywall")}
              style={({ pressed }) => [styles.item, { borderBottomColor: t.rule }, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.num, { color: open ? t.blue : t.muted }]}>{item.num}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: open ? t.ink : t.muted }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: t.muted, marginTop: 2 }]}>{item.marks}</Text>
              </View>
              {mark ? (
                <View style={[styles.dot, { backgroundColor: mark === "solid" ? t.green : t.amber }]} />
              ) : null}
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, lineHeight: 31, fontWeight: "700", letterSpacing: -0.4 },
  blurb: { fontSize: 15, lineHeight: 22, marginTop: space.xs, marginBottom: space.md },
  meta: { fontSize: 13, marginTop: space.sm, fontVariant: ["tabular-nums"] },
  tools: { flexDirection: "row", gap: space.sm, marginTop: space.lg },
  tool: { flex: 1 },
  filter: {
    marginTop: space.sm,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingTop: space.xl,
    paddingBottom: space.md,
    borderBottomWidth: 1,
  },
  letter: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16.5, lineHeight: 22, fontWeight: "700" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 60,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  num: { width: 40, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  itemTitle: { fontSize: 15.5, lineHeight: 21, fontWeight: "500" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
