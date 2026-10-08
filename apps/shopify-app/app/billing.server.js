import { BILLING_PLANS, authenticate } from "./shopify.server";
import { canUse, planLabel } from "./billing.shared";

export { canUse, planLabel };

const PLAN_TTL_MS = 60_000;
const planCache = new Map();
const BILLING_PLAN_NAMES = Object.values(BILLING_PLANS);
const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
  query ActiveBillingSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        name
        status
        test
      }
    }
  }
`;

export function isBillingTest() {
  return process.env.NODE_ENV !== "production" || process.env.BILLING_TEST === "true";
}

function planForName(name) {
  if (name === BILLING_PLANS.STARTER_MONTHLY || name === BILLING_PLANS.STARTER_YEARLY) {
    return "starter";
  }
  if (name === BILLING_PLANS.PRO_MONTHLY || name === BILLING_PLANS.PRO_YEARLY) {
    return "pro";
  }
  if (name === BILLING_PLANS.PROPLUS_MONTHLY || name === BILLING_PLANS.PROPLUS_YEARLY) {
    return "proplus";
  }
  return "sandbox";
}

export function billingPlanName(plan, cycle) {
  const key = `${String(plan).toUpperCase()}_${cycle === "yearly" ? "YEARLY" : "MONTHLY"}`;
  return BILLING_PLANS[key] ?? null;
}

function findPlan(subscriptions, isTest) {
  const active = subscriptions
    .filter((subscription) =>
      subscription.status === undefined || subscription.status === "ACTIVE",
    )
    .sort((left, right) =>
      Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? ""),
    );
  const current = active.find((subscription) => subscription.test === isTest) ??
    active.find((subscription) => subscription.test === true) ??
    active[0];
  return current ? planForName(current.name) : "sandbox";
}

export async function getPlan(billingOrAdmin, session) {
  const shop = session?.shop;
  if (!shop || !billingOrAdmin) return "sandbox";

  const cached = planCache.get(shop);
  if (cached && cached.expiresAt > Date.now()) return cached.plan;

  const isTest = isBillingTest();
  const cache = (plan) => {
    planCache.set(shop, { plan, expiresAt: Date.now() + PLAN_TTL_MS });
    return plan;
  };
  try {
    let subscriptions;
    if (typeof billingOrAdmin.check === "function") {
      const result = await billingOrAdmin.check({
        plans: BILLING_PLAN_NAMES,
        isTest,
      });
      subscriptions = result.appSubscriptions ?? [];
    } else if (typeof billingOrAdmin.graphql === "function") {
      const response = await billingOrAdmin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
      const payload = await response.json();
      if (payload.errors?.length) return cache("sandbox");
      subscriptions = payload.data?.currentAppInstallation?.activeSubscriptions ?? [];
    } else {
      return cache("sandbox");
    }

    const validSubscriptions = subscriptions.filter(
      (subscription) => subscription.test === undefined || subscription.test === isTest,
    );
    const plan = findPlan(validSubscriptions, isTest);
    return cache(plan);
  } catch {
    return cache("sandbox");
  }
}

export async function requireFeature(request, feature, { enforce = false, context } = {}) {
  const { billing, session } = context ?? await authenticate.admin(request);
  const plan = await getPlan(billing, session);
  const allowed = canUse(plan, feature);

  if (enforce && !allowed) {
    throw new Response("This feature is not available on your current plan.", {
      status: 403,
    });
  }

  return { plan, allowed };
}

export function invalidatePlanCache(shop) {
  if (shop) planCache.delete(shop);
  else planCache.clear();
}
