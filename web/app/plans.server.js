import prisma from "./db.server";
import { entitlementsFor, PLAN_CODES } from "./plan-entitlements";
export { entitlementsFor, PLAN_CODES } from "./plan-entitlements";

export const BILLING_PLANS = Object.freeze({
  "STARTER:monthly": "Starter Monthly",
  "STARTER:yearly": "Starter Yearly",
  "PRO:monthly": "Pro Monthly",
  "PRO:yearly": "Pro Yearly",
  "PRO_PLUS:monthly": "Pro+ Monthly",
  "PRO_PLUS:yearly": "Pro+ Yearly",
});

const billingPlanLookup = new Map(
  Object.entries(BILLING_PLANS).map(([key, name]) => [name, key]),
);

export function billingIsTest() {
  if (process.env.SHOPIFY_BILLING_TEST === "true") return true;
  if (process.env.SHOPIFY_BILLING_TEST === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export async function resolveBillingPlan(billing) {
  const result = await billing.check({
    plans: Object.values(BILLING_PLANS),
    isTest: billingIsTest(),
  });
  const active = result.appSubscriptions?.[0];
  const mapped = active ? billingPlanLookup.get(active.name) : null;

  if (!result.hasActivePayment || !active || !mapped) {
    return {
      plan: PLAN_CODES.SANDBOX,
      cycle: null,
      subscriptionId: null,
      status: "INACTIVE",
      subscription: null,
    };
  }

  const [plan, cycle] = mapped.split(":");
  return {
    plan,
    cycle,
    subscriptionId: active.id,
    status: active.status ?? "ACTIVE",
    subscription: active,
  };
}

export async function persistBillingState(shopId, state) {
  const permissions = entitlementsFor(state.plan);
  return prisma.shopConfiguration.upsert({
    where: { shopId },
    create: {
      shopId,
      plan: state.plan,
      billingCycle: state.cycle,
      billingSubscriptionId: state.subscriptionId,
      billingStatus: state.status,
      shippingRatesEnabled: false,
      customizationsEnabled: false,
    },
    update: {
      plan: state.plan,
      billingCycle: state.cycle,
      billingSubscriptionId: state.subscriptionId,
      billingStatus: state.status,
      ...(!permissions.shippingRatesLive ? { shippingRatesEnabled: false } : {}),
      ...(!permissions.customizationsLive ? { customizationsEnabled: false } : {}),
    },
  });
}

export function billingPlanName(plan, cycle) {
  return BILLING_PLANS[`${plan}:${cycle}`] ?? null;
}
