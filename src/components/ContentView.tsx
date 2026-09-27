import { forwardRef, useMemo } from "react";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";

import { page } from "../lib/html";
import { useTheme } from "../theme";

// Renders worked solutions. The HTML is the app's own bundled content, never
// anything fetched, and the view is pinned to that one document: any attempt
// to navigate away is handed to the system browser instead.
export const ContentView = forwardRef<WebView, { body: string }>(function ContentView({ body }, ref) {
  const theme = useTheme();
  const html = useMemo(() => page(theme, body), [theme, body]);
  return (
    <WebView
      ref={ref}
      originWhitelist={["about:blank"]}
      source={{ html, baseUrl: "about:blank" }}
      style={{ flex: 1, backgroundColor: theme.paper }}
      containerStyle={{ backgroundColor: theme.paper }}
      javaScriptEnabled
      domStorageEnabled={false}
      allowFileAccess={false}
      setSupportMultipleWindows={false}
      overScrollMode="never"
      textZoom={100}
      onShouldStartLoadWithRequest={(req) => {
        if (req.url === "about:blank" || req.url.startsWith("data:")) return true;
        if (/^https?:\/\//.test(req.url)) Linking.openURL(req.url).catch(() => {});
        return false;
      }}
    />
  );
});
