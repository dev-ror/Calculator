function array(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  return value;
}

export function createShippingResponse({
  shopId,
  currency,
  rates,
  matchedCustomizations,
  matchedRateRules,
}) {
  return {
    shopId,
    currency,
    rates: array(rates, "rates"),
    matchedCustomizations: array(matchedCustomizations, "matchedCustomizations"),
    matchedRateRules: array(matchedRateRules, "matchedRateRules"),
  };
}
