import Purchases, {
  PurchasesPackage,
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';

// Re-export type alias for consumers
export type { PurchasesPackage };

const RC_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';

let _initialized = false;

function isUserCancelledError(error: unknown): error is Error & { userCancelled: boolean } {
  return (
    error instanceof Error &&
    'userCancelled' in error &&
    (error as Error & { userCancelled?: boolean }).userCancelled === true
  );
}

/**
 * Configure RevenueCat SDK. Call once at app startup with the authenticated user ID.
 */
export async function initPurchases(userId: string): Promise<void> {
  if (!RC_KEY_IOS) {
    console.warn('[Purchases] EXPO_PUBLIC_REVENUECAT_API_KEY_IOS is not set — purchases will not work.');
    return;
  }

  if (_initialized) {
    // Just log in the new user
    await Purchases.logIn(userId);
    return;
  }

  Purchases.configure({ apiKey: RC_KEY_IOS });
  _initialized = true;

  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.error('[Purchases] logIn error:', e);
  }
}

/**
 * Fetch available offerings from RevenueCat.
 * Returns an empty array if unavailable.
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    const current: PurchasesOffering | null = offerings.current;
    if (!current) return [];
    return current.availablePackages;
  } catch (e) {
    console.error('[Purchases] getOfferings error:', e);
    return [];
  }
}

/**
 * Attempt to purchase a package.
 * Returns true if purchase was successful.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPro(customerInfo);
  } catch (e: unknown) {
    // User cancelled is not a real error
    if (isUserCancelledError(e)) {
      return false;
    }
    console.error('[Purchases] purchasePackage error:', e);
    return false;
  }
}

/**
 * Restore previous purchases.
 * Returns true if the user has active entitlements.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return isPro(customerInfo);
  } catch (e) {
    console.error('[Purchases] restorePurchases error:', e);
    return false;
  }
}

/**
 * Check whether a CustomerInfo object reflects an active Pro entitlement.
 */
function isPro(customerInfo: CustomerInfo): boolean {
  return 'pro' in (customerInfo.entitlements.active ?? {});
}
