import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

// The one entitlement in the RevenueCat project. Every product, whatever its
// length, unlocks the same thing, so the app only ever asks "is Plus active".
export const ENTITLEMENT = "Plus";

// Keys are public SDK keys and are safe in the bundle. The Test Store key is
// only ever used in development: RevenueCat deliberately crashes a release
// build configured with one, so it must never reach a store build.
const STORE_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";
const TEST_KEY = process.env.EXPO_PUBLIC_RC_TEST_KEY ?? "";
// A demo build is a debuggable build made for judges and testers to install
// directly. It is never uploaded to a store, and it says so on the paywall.
export const DEMO_BUILD = process.env.EXPO_PUBLIC_DEMO_BUILD === "1";
const API_KEY = (__DEV__ || DEMO_BUILD) && TEST_KEY ? TEST_KEY : STORE_KEY;

// "pending" is a payment the store accepted that has not unlocked Plus yet. It
// must never be reported as a failure: the customer has paid.
export type PurchaseOutcome = "purchased" | "pending" | "cancelled" | "failed";

type Store = {
  // False when the build has no key. The app still runs, on the free tier.
  configured: boolean;
  ready: boolean;
  plus: boolean;
  // When Plus runs out, or null for a lifetime unlock.
  expires: string | null;
  lifetime: boolean;
  offering: PurchasesOffering | null;
  error: string | null;
  buy: (pack: PurchasesPackage) => Promise<PurchaseOutcome>;
  restore: () => Promise<boolean>;
  reload: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const message = (e: unknown) => (e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong.");

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const configured = Platform.OS === "android" && API_KEY.length > 0;
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [ready, setReady] = useState(!configured);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured) return;
    setError(null);
    try {
      // Customer info is cached on the device by the SDK, so Plus keeps working
      // in a lecture hall with no signal. Offerings need the network and are
      // allowed to fail without taking the entitlement down with them.
      setInfo(await Purchases.getCustomerInfo());
    } catch (e) {
      setError(message(e));
    }
    try {
      setOffering((await Purchases.getOfferings()).current);
    } catch (e) {
      setError(message(e));
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: API_KEY });
    // Fires on purchase, restore, renewal and expiry, including ones that
    // happen while the app is in the background.
    const onUpdate = (next: CustomerInfo) => setInfo(next);
    Purchases.addCustomerInfoUpdateListener(onUpdate);
    reload().finally(() => setReady(true));
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, [configured, reload]);

  const buy = useCallback(async (pack: PurchasesPackage): Promise<PurchaseOutcome> => {
    setError(null);
    try {
      const result = await Purchases.purchasePackage(pack);
      setInfo(result.customerInfo);
      return result.customerInfo.entitlements.active[ENTITLEMENT] ? "purchased" : "pending";
    } catch (e) {
      if (typeof e === "object" && e && "userCancelled" in e && (e as { userCancelled: unknown }).userCancelled) {
        return "cancelled";
      }
      setError(message(e));
      return "failed";
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    try {
      const next = await Purchases.restorePurchases();
      setInfo(next);
      return !!next.entitlements.active[ENTITLEMENT];
    } catch (e) {
      setError(message(e));
      return false;
    }
  }, []);

  const value = useMemo<Store>(() => {
    const active = info?.entitlements.active[ENTITLEMENT];
    return {
      configured,
      ready,
      plus: !!active,
      expires: active?.expirationDate ?? null,
      lifetime: !!active && !active.expirationDate,
      offering,
      error,
      buy,
      restore,
      reload,
    };
  }, [configured, ready, info, offering, error, buy, restore, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePurchases() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePurchases must be used inside PurchasesProvider");
  return ctx;
}
