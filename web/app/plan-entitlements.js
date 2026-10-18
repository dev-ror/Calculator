export const PLAN_CODES = Object.freeze({
  SANDBOX: "SANDBOX",
  STARTER: "STARTER",
  PRO: "PRO",
  PRO_PLUS: "PRO_PLUS",
});

export function entitlementsFor(plan) {
  const normalized = Object.values(PLAN_CODES).includes(plan)
    ? plan
    : PLAN_CODES.SANDBOX;

  return {
    shippingRatesLive: normalized === PLAN_CODES.PRO || normalized === PLAN_CODES.PRO_PLUS,
    customizationsLive: normalized !== PLAN_CODES.SANDBOX,
    customCodedRates: normalized === PLAN_CODES.PRO_PLUS,
  };
}
