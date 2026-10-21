import { createShippingResponse } from "./ShippingResponse.js";

export function map(engineResult, { shopId, currency = null } = {}) {
  if (!engineResult || typeof engineResult !== "object" || Array.isArray(engineResult)) {
    throw new TypeError("Shipping Engine result must be an object");
  }

  const rates = engineResult.visibleRates ?? engineResult.rates ?? [];
  const responseCurrency = currency ?? rates[0]?.currencyCode ?? engineResult.rates?.[0]?.currencyCode ?? null;

  return createShippingResponse({
    shopId,
    currency: responseCurrency,
    rates,
    matchedCustomizations: engineResult.matchedCustomizations ?? [],
    matchedRateRules: engineResult.matchedRateRules ?? [],
  });
}
