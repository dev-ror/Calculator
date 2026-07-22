import { createShippingRequest } from "./ShippingRequest.js";

function object(value, field) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function optionalNumber(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw new TypeError(`${field} must be a number`);
  }
  return normalized;
}

function optionalCurrency(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new TypeError("currency must be a three-letter code");
  }
  return value.trim().toUpperCase();
}

function compact(objectValue) {
  return Object.fromEntries(
    Object.entries(objectValue).filter(([, value]) => value !== undefined),
  );
}

function normalizeItem(item, index) {
  const normalized = object(item, `items[${index}]`);
  return compact({
    ...normalized,
    quantity: optionalNumber(normalized.quantity, `items[${index}].quantity`) ?? 1,
    price: optionalNumber(normalized.price, `items[${index}].price`),
    weight: optionalNumber(normalized.weight, `items[${index}].weight`),
    product: normalized.product ? { ...object(normalized.product, `items[${index}].product`) } : undefined,
    variant: normalized.variant ? { ...object(normalized.variant, `items[${index}].variant`) } : undefined,
  });
}

export function map(input, { shopId } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Shipping request must be an object");
  }

  const request = input;
  const rawCart = object(request.cart, "cart");
  const rawItems = request.items ?? request.lineItems ?? rawCart.items ?? rawCart.lines ?? [];

  if (!Array.isArray(rawItems)) {
    throw new TypeError("items must be an array");
  }

  const currency = optionalCurrency(
    request.currency ?? request.currencyCode ?? rawCart.currency ?? rawCart.currencyCode,
  );
  const cart = compact({
    ...rawCart,
    subtotal: optionalNumber(
      rawCart.subtotal ?? rawCart.subtotalPrice ?? request.subtotal,
      "cart.subtotal",
    ),
    total: optionalNumber(rawCart.total ?? rawCart.totalPrice ?? request.total, "cart.total"),
    quantity: optionalNumber(rawCart.quantity ?? request.quantity, "cart.quantity"),
    weight: optionalNumber(rawCart.weight ?? request.weight, "cart.weight"),
    volume: optionalNumber(rawCart.volume ?? request.volume, "cart.volume"),
  });

  return createShippingRequest({
    ...request,
    shopId: shopId ?? request.shopId,
    currency,
    cart,
    items: rawItems.map(normalizeItem),
    destination: { ...object(request.destination ?? request.shippingAddress ?? request.address, "destination") },
    customer: { ...object(request.customer, "customer") },
  });
}
