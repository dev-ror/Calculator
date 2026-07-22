import { map as mapInternalRequest } from "../contracts/RequestMapper.js";

function item(shopifyItem) {
  return {
    ...shopifyItem,
    quantity: shopifyItem.quantity,
    price: shopifyItem.price,
    weight: shopifyItem.grams ?? shopifyItem.weight,
    properties: shopifyItem.properties,
    product: {
      id: shopifyItem.product_id ?? shopifyItem.productId ?? shopifyItem.product?.id,
      title: shopifyItem.product_title ?? shopifyItem.productTitle ?? shopifyItem.product?.title,
      type: shopifyItem.product_type ?? shopifyItem.productType ?? shopifyItem.product?.type,
      vendor: shopifyItem.vendor ?? shopifyItem.product?.vendor,
      tags: shopifyItem.tags ?? shopifyItem.product?.tags,
      collections: shopifyItem.collections ?? shopifyItem.product?.collections,
      metafields: shopifyItem.product_metafields ?? shopifyItem.product?.metafields,
    },
    variant: {
      id: shopifyItem.variant_id ?? shopifyItem.variantId ?? shopifyItem.variant?.id,
      title: shopifyItem.variant_title ?? shopifyItem.variantTitle ?? shopifyItem.variant?.title,
      sku: shopifyItem.sku ?? shopifyItem.variant?.sku,
      barcode: shopifyItem.barcode ?? shopifyItem.variant?.barcode,
      metafields: shopifyItem.variant_metafields ?? shopifyItem.variant?.metafields,
    },
  };
}

export function mapRequest(shopifyRequest) {
  if (!shopifyRequest || typeof shopifyRequest !== "object" || Array.isArray(shopifyRequest)) {
    throw new TypeError("Shopify shipping request must be an object");
  }

  const payload = shopifyRequest.rate ?? shopifyRequest.shippingRequest ?? shopifyRequest;
  const shopifyItems = payload.items ?? payload.line_items ?? [];

  if (!Array.isArray(shopifyItems)) {
    throw new TypeError("Shopify shipping request items must be an array");
  }

  const destination = payload.destination ?? {};
  const customer = payload.customer ?? {};

  return mapInternalRequest({
    shopId: shopifyRequest.shopId ?? payload.shopId,
    currency: payload.currency ?? payload.currency_code,
    locale: payload.locale,
    cart: {
      subtotal: payload.subtotal ?? payload.subtotal_price,
      total: payload.total ?? payload.total_price,
      quantity: payload.quantity,
      weight: payload.weight ?? payload.total_weight,
      attributes: payload.attributes,
      locale: payload.locale,
    },
    items: shopifyItems.map(item),
    destination: {
      ...destination,
      address1: destination.address1 ?? destination.address_1,
      address2: destination.address2 ?? destination.address_2,
      city: destination.city,
      province: destination.province,
      provinceCode: destination.provinceCode ?? destination.province_code,
      country: destination.country,
      countryCode: destination.countryCode ?? destination.country_code,
      postalCode: destination.postalCode ?? destination.postal_code ?? destination.zip,
    },
    customer: {
      ...customer,
      firstName: customer.firstName ?? customer.first_name,
      lastName: customer.lastName ?? customer.last_name,
      tags: customer.tags,
      loggedIn: customer.loggedIn ?? customer.logged_in,
    },
  });
}
