function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

export function createShippingRequest({ shopId, currency = null, ...request }) {
  return {
    ...request,
    shopId: requiredString(shopId, "shopId"),
    currency,
  };
}
