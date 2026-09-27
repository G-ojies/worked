import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PACKAGE_TYPE, type PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Tag } from "../components/ui";
import { courses, totalQuestions } from "../lib/content";
import { DEMO_BUILD, usePurchases } from "../store/purchases";
import { radius, space, useTheme } from "../theme";

const PRIVACY_URL = "https://g-ojies.github.io/worked/privacy.html";

const BENEFITS = [
  [`All ${courses.length} courses`, `Every one of the ${totalQuestions} worked questions, including the real past papers.`],
  ["Timed mock papers", "Sit a drawn paper against the clock, then mark it against the worked solutions."],
  ["Flashcards", "Every question as a card, with the ones you find shaky dealt first."],
  ["Still fully offline", "Nothing to download after install. Plus works in the hall with no signal."],
];

// A semester is what a student actually revises for, so that is how the plans
// are named, whatever length the store calls them.
function describe(pack: PurchasesPackage) {
  switch (pack.packageType) {
    case PACKAGE_TYPE.MONTHLY:
      return { name: "Monthly", per: "per month", note: "For the exam month. Cancel any time." };
    case PACKAGE_TYPE.SIX_MONTH:
      return { name: "Semester", per: "per 6 months", note: "One payment covers the whole semester." };
    case PACKAGE_TYPE.ANNUAL:
      return { name: "Session", per: "per year", note: "Both semesters of the academic session." };
    case PACKAGE_TYPE.LIFETIME:
      return { name: "Lifetime", per: "once", note: "Pay once, keep it through to graduation." };
    default:
      return { name: pack.product.title, per: "", note: pack.product.description };
  }
}

export default function Paywall() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const store = usePurchases();
  const packs = store.offering?.availablePackages ?? [];

  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Default to the semester plan where there is one: it is the one priced for
  // how the product is used.
  useEffect(() => {
    if (chosen || packs.length === 0) return;
    const preferred = packs.find((p) => p.packageType === PACKAGE_TYPE.SIX_MONTH) ?? packs[0];
    setChosen(preferred.identifier);
  }, [packs, chosen]);

  const selected = packs.find((p) => p.identifier === chosen);

  const buy = async () => {
    if (!selected) return;
    setBusy("buy");
    setNotice(null);
    const outcome = await store.buy(selected);
    setBusy(null);
    if (outcome === "purchased") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } else if (outcome === "pending") {
      setNotice("Your payment went through but Plus has not unlocked yet. Tap Restore purchases in a moment.");
    } else if (outcome === "failed") {
      setNotice("The purchase did not go through and you have not been charged. Please try again.");
    }
  };

  const restore = async () => {
    setBusy("restore");
    setNotice(null);
    const found = await store.restore();
    setBusy(null);
    if (found) router.back();
    else setNotice("No earlier purchase was found on this account.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.paper, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: space.lg }}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.close}>
          <Text style={[styles.closeText, { color: t.muted }]}>Close</Text>
        </Pressable>

        <Text style={[styles.eyebrow, { color: t.blue }]}>WORKED PLUS</Text>
        <Text style={[styles.h1, { color: t.ink }]}>Every paper, worked. For less than one textbook.</Text>

        <View style={styles.benefits}>
          {BENEFITS.map(([title, detail]) => (
            <View key={title} style={styles.benefit}>
              <View style={[styles.tick, { backgroundColor: t.greenSoft }]}>
                <Text style={{ color: t.green, fontWeight: "800" }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitTitle, { color: t.ink }]}>{title}</Text>
                <Text style={[styles.benefitDetail, { color: t.muted }]}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {store.plus ? (
          <View style={[styles.state, { backgroundColor: t.greenSoft }]}>
            <Text style={[styles.benefitTitle, { color: t.green }]}>Worked Plus is active</Text>
            <Text style={[styles.benefitDetail, { color: t.ink2 }]}>
              {store.lifetime
                ? "Yours for good. Thank you."
                : `Runs until ${new Date(store.expires ?? "").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.`}
            </Text>
          </View>
        ) : !store.configured ? (
          <View style={[styles.state, { backgroundColor: t.sunk }]}>
            <Text style={[styles.benefitTitle, { color: t.ink }]}>Store not connected</Text>
            <Text style={[styles.benefitDetail, { color: t.muted }]}>
              This build has no RevenueCat key, so plans cannot be shown. The free course still works in full.
            </Text>
          </View>
        ) : !store.ready ? (
          <ActivityIndicator color={t.blue} style={{ marginVertical: space.xl }} />
        ) : packs.length === 0 ? (
          <View style={[styles.state, { backgroundColor: t.sunk }]}>
            <Text style={[styles.benefitTitle, { color: t.ink }]}>Plans could not be loaded</Text>
            <Text style={[styles.benefitDetail, { color: t.muted }]}>
              Check your connection and try again. Anything you have already bought keeps working offline.
            </Text>
            <Button label="Try again" kind="quiet" style={{ marginTop: space.md }} onPress={store.reload} />
          </View>
        ) : (
          <View accessibilityRole="radiogroup" style={{ gap: space.sm }}>
            {packs.map((pack) => {
              const on = pack.identifier === chosen;
              const d = describe(pack);
              return (
                <Pressable
                  key={pack.identifier}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setChosen(pack.identifier);
                  }}
                  style={[
                    styles.plan,
                    { borderColor: on ? t.blue : t.rule2, backgroundColor: on ? t.blueSoft : t.surface },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTop}>
                      <Text style={[styles.planName, { color: t.ink }]}>{d.name}</Text>
                      {pack.packageType === PACKAGE_TYPE.SIX_MONTH ? <Tag label="Best value" /> : null}
                    </View>
                    <Text style={[styles.benefitDetail, { color: t.muted }]}>{d.note}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.price, { color: t.ink }]}>{pack.product.priceString}</Text>
                    <Text style={[styles.per, { color: t.muted }]}>{d.per}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

      </ScrollView>

      <View
        style={[
          styles.foot,
          { borderTopColor: t.rule, backgroundColor: t.surface, paddingBottom: insets.bottom + space.md },
        ]}
      >
        {store.plus ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : (
          <>
            {notice || store.error ? (
              <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: t.amber }]}>
                {notice ?? store.error}
              </Text>
            ) : null}
            <Button
              label={selected ? `Continue with ${describe(selected).name}` : "Continue"}
              busy={busy === "buy"}
              disabled={!selected || busy !== null}
              onPress={buy}
            />
            <View style={styles.links}>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                disabled={!store.configured || busy !== null}
                onPress={restore}
              >
                <Text style={[styles.linkText, { color: t.blue }]}>
                  {busy === "restore" ? "Restoring..." : "Restore purchases"}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="link" hitSlop={10} onPress={() => Linking.openURL(PRIVACY_URL)}>
                <Text style={[styles.linkText, { color: t.blue }]}>Privacy</Text>
              </Pressable>
            </View>
            <Text style={[styles.small, { color: t.muted }]}>
              {DEMO_BUILD
                ? "Demo build. Purchases use the RevenueCat Test Store and nothing is charged."
                : "Subscriptions renew until cancelled. Cancel any time in Google Play."}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: "flex-end", minHeight: 32, justifyContent: "center" },
  closeText: { fontSize: 15, fontWeight: "600" },
  eyebrow: { fontSize: 13, fontWeight: "800", letterSpacing: 1.5, marginTop: space.md },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.4, marginTop: space.sm },
  benefits: { marginVertical: space.xl, gap: space.lg },
  benefit: { flexDirection: "row", gap: space.md },
  tick: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  benefitTitle: { fontSize: 16, fontWeight: "700" },
  benefitDetail: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  state: { borderRadius: radius.md, padding: space.lg },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.lg,
    minHeight: 76,
  },
  planTop: { flexDirection: "row", alignItems: "center", gap: space.sm },
  planName: { fontSize: 17, fontWeight: "700" },
  price: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  per: { fontSize: 12.5 },
  notice: { fontSize: 14, lineHeight: 20, marginBottom: space.md },
  foot: { paddingHorizontal: space.xl, paddingTop: space.md, borderTopWidth: 1 },
  links: { flexDirection: "row", justifyContent: "center", gap: space.xl, marginTop: space.md },
  linkText: { fontSize: 14.5, fontWeight: "600" },
  small: { fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: space.sm },
});
