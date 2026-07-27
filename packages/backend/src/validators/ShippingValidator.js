function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Shipping request must be an object");
  }
}

export function validateShippingRequest(data) {
  requireObject(data);

  if (typeof data.shopId !== "string") {
    throw new TypeError("shopId must be a string");
  }

  const shopId = data.shopId.trim();

  if (!shopId) {
    throw new TypeError("shopId is required");
  }

  if (shopId.length > 255) {
    throw new RangeError("shopId must be 255 characters or fewer");
  }

  return { ...data, shopId };
}
