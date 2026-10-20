import type { Subscription } from "@/types/api";

/** Must match the backend's SubscriptionGracePeriod (3 days). */
export const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

/** Last moment this subscription grants access. */
export function accessEndsAt(sub: Subscription): Date {
  if (sub.grace_period_end) return new Date(sub.grace_period_end);
  return new Date(new Date(sub.current_period_end).getTime() + GRACE_PERIOD_MS);
}

/** Whether the subscription currently unlocks premium content. */
export function hasActiveAccess(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status !== "active") return false;
  return accessEndsAt(sub).getTime() > Date.now();
}

/**
 * True once the paid period ended but the 3-day renewal grace window is still
 * open. Access is retained and the user should be prompted to pay/renew.
 */
export function isInGrace(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status !== "active") return false;
  const now = Date.now();
  return (
    new Date(sub.current_period_end).getTime() <= now &&
    accessEndsAt(sub).getTime() > now
  );
}

/**
 * Picks the subscription that currently grants access, preferring the latest
 * access end when several are active. Expired/canceled rows are ignored.
 */
export function findActiveSubscription(
  subs: Subscription[] | null | undefined
): Subscription | null {
  if (!subs?.length) return null;
  return (
    subs
      .filter((s) => s.status === "active")
      .sort((a, b) => accessEndsAt(b).getTime() - accessEndsAt(a).getTime())
      .find(hasActiveAccess) ?? null
  );
}
