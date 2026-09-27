import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ProgressProvider } from "../store/progress";
import { PurchasesProvider } from "../store/purchases";
import { useTheme } from "../theme";

// RevenueCat warns on every launch that a Test Store key is in use. That is
// expected in development, and it is the only warning silenced.
if (__DEV__) LogBox.ignoreLogs([/Test Store/]);

export default function Layout() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <PurchasesProvider>
        <ProgressProvider>
          <StatusBar style={t.scheme === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: t.paper },
              headerTintColor: t.ink,
              headerTitleStyle: { fontWeight: "700" },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: t.paper },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="course/[id]" options={{ title: "" }} />
            <Stack.Screen name="question/[course]/[qid]" options={{ title: "" }} />
            <Stack.Screen name="flashcards/[course]" options={{ title: "Flashcards" }} />
            <Stack.Screen name="mock/[course]" options={{ title: "Mock paper" }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false }} />
          </Stack>
        </ProgressProvider>
      </PurchasesProvider>
    </SafeAreaProvider>
  );
}
