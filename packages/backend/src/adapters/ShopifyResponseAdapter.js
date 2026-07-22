export function mapResponse(shippingResponse) {
  if (!shippingResponse || typeof shippingResponse !== "object" || Array.isArray(shippingResponse)) {
    throw new TypeError("Shipping response must be an object");
  }

  if (!Array.isArray(shippingResponse.rates)) {
    throw new TypeError("Shipping response rates must be an array");
  }

  return {
    rates: shippingResponse.rates.map((rate) => ({
      id: rate.id,
      name: rate.name,
      price: rate.price ?? null,
      currency: rate.currency ?? rate.currencyCode ?? shippingResponse.currency,
      minDeliveryDays: rate.minDeliveryDays ?? rate.minimumDays ?? null,
      maxDeliveryDays: rate.maxDeliveryDays ?? rate.maximumDays ?? null,
    })),
  };
}
