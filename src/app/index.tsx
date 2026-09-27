import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bar, Button, Card, Tag } from "../components/ui";
import { courses, getCourse, totalQuestions } from "../lib/content";
import { useProgress } from "../store/progress";
import { usePurchases } from "../store/purchases";
import { radius, space, useTheme } from "../theme";

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const { plus } = usePurchases();

  const lastCourse = progress.last ? getCourse(progress.last.course) : undefined;
  const lastQuestion = lastCourse?.sections
    .flatMap((s) => s.questions)
    .find((q) => q.id === progress.last?.question);

  const done = courses.reduce((n, c) => n + progress.tally(c).solid, 0);

  return (
    <ScrollView
      style={{ backgroundColor: t.paper }}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
    >
      <View style={[styles.hero, { backgroundColor: t.band, paddingTop: insets.top + space.xl }]}>
        <View style={styles.heroTop}>
          <Text style={[styles.eyebrow, { color: t.blue }]}>WORKED</Text>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.push("/settings")}>
            <Text style={[styles.link, { color: t.blue }]}>Settings</Text>
          </Pressable>
        </View>
        <Text style={[styles.h1, { color: t.ink }]}>Past questions, solved end to end.</Text>
        <Text style={[styles.lede, { color: t.ink2 }]}>
          {totalQuestions} exam questions with every step written out. All of it works with no signal.
        </Text>
        <View style={styles.stats}>
          <Stat value={String(done)} label="solid" />
          <Stat value={String(totalQuestions - done)} label="to go" />
          <Stat value={String(progress.streak)} label="day streak" />
        </View>
      </View>

      <View style={styles.body}>
        {lastCourse && lastQuestion ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/question/${lastCourse.id}/${lastQuestion.id}`)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Card style={{ borderColor: t.blue, backgroundColor: t.blueSoft }}>
              <Text style={[styles.cardKicker, { color: t.blueInk }]}>CONTINUE · {lastCourse.code}</Text>
              <Text style={[styles.cardTitle, { color: t.ink }]} numberOfLines={2}>
                {lastQuestion.num} {lastQuestion.title}
              </Text>
            </Card>
          </Pressable>
        ) : null}

        <Text style={[styles.h2, { color: t.ink }]}>Courses</Text>

        {courses.map((course) => {
          const tally = progress.tally(course);
          return (
            <Pressable
              key={course.id}
              accessibilityRole="button"
              onPress={() => router.push(`/course/${course.id}`)}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Card>
                <View style={styles.row}>
                  <Text style={[styles.code, { color: t.blue }]}>{course.code}</Text>
                  {course.free ? <Tag label="Free" tone="green" /> : plus ? null : <Tag label="Plus" tone="muted" />}
                </View>
                <Text style={[styles.cardTitle, { color: t.ink }]}>{course.name}</Text>
                <Text style={[styles.blurb, { color: t.muted }]}>{course.blurb}</Text>
                <Bar solid={tally.solid} shaky={tally.shaky} total={course.count} />
                <Text style={[styles.meta, { color: t.muted }]}>
                  {tally.solid} solid · {tally.shaky} shaky · {tally.left} left
                </Text>
              </Card>
            </Pressable>
          );
        })}

        {plus ? null : (
          <Card style={{ backgroundColor: t.sunk }}>
            <Text style={[styles.cardTitle, { color: t.ink }]}>Unlock every course</Text>
            <Text style={[styles.blurb, { color: t.muted }]}>
              Worked Plus opens all six courses, flashcards and timed mock papers.
            </Text>
            <Button label="See Worked Plus" onPress={() => router.push("/paywall")} />
          </Card>
        )}
      </View>
    </ScrollView>
  );

  function Stat({ value, label }: { value: string; label: string }) {
    return (
      <View>
        <Text style={[styles.statValue, { color: t.ink }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: t.muted }]}>{label}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg },
  eyebrow: { fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  link: { fontSize: 15, fontWeight: "600" },
  h1: { fontSize: 30, lineHeight: 35, fontWeight: "700", letterSpacing: -0.5 },
  lede: { fontSize: 16, lineHeight: 23, marginTop: space.md },
  stats: { flexDirection: "row", gap: space.xxl, marginTop: space.xl },
  statValue: { fontSize: 24, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 13, marginTop: 2 },
  body: { padding: space.lg, gap: space.md },
  h2: { fontSize: 20, fontWeight: "700", marginTop: space.md, marginHorizontal: space.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.xs },
  code: { fontSize: 13, fontWeight: "800", letterSpacing: 0.8 },
  cardKicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: space.xs },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  blurb: { fontSize: 14.5, lineHeight: 21, marginTop: space.xs, marginBottom: space.md },
  meta: { fontSize: 13, marginTop: space.sm, fontVariant: ["tabular-nums"] },
  radius: { borderRadius: radius.lg },
});
