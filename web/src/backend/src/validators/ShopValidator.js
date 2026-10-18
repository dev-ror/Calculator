const SHOP_DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Shop data must be an object");
  }
}

export function validateShop(data) {
  requireObject(data);

  if (typeof data.shopDomain !== "string") {
    throw new TypeError("shopDomain must be a string");
  }

  const shopDomain = data.shopDomain.trim().toLowerCase();

  if (!shopDomain) {
    throw new TypeError("shopDomain is required");
  }

  if (shopDomain.length > 255) {
    throw new RangeError("shopDomain must be 255 characters or fewer");
  }

  if (!SHOP_DOMAIN_PATTERN.test(shopDomain)) {
    throw new TypeError("shopDomain must be a valid domain name");
  }

  return { ...data, shopDomain };
}
