import { createHmac, timingSafeEqual } from "node:crypto";

const CARRIER_SERVICE_NAME = "Calculator Shipping Rates";

const CARRIER_SERVICES_QUERY = `#graphql
  query CarrierServices {
    carrierServices(first: 50) {
      nodes {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
    }
  }
`;

const CREATE_CARRIER_SERVICE_MUTATION = `#graphql
  mutation CreateCarrierService($input: DeliveryCarrierServiceCreateInput!) {
    carrierServiceCreate(input: $input) {
      carrierService {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_CARRIER_SERVICE_MUTATION = `#graphql
  mutation UpdateCarrierService($input: DeliveryCarrierServiceUpdateInput!) {
    carrierServiceUpdate(input: $input) {
      carrierService {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  query CarrierRateProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        tags
        productType
        vendor
      }
    }
  }
`;

function appSecret() {
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!secret) {
    throw new Error("Shopify app secret is unavailable");
  }

  return secret;
}

function signatureForShop(shopDomain) {
  return createHmac("sha256", appSecret())
    .update(`carrier-rates:${shopDomain}`)
    .digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function callbackUrl(shopDomain) {
  const appUrl = process.env.SHOPIFY_APP_URL ?? process.env.HOST;

  if (!appUrl) {
    throw new Error("Shopify app URL is unavailable");
  }

  const url = new URL("/api/carrier-rates", appUrl);
  url.searchParams.set("shop", shopDomain);
  url.searchParams.set("signature", signatureForShop(shopDomain));

  return url.toString();
}

function graphQLError(payload, operation) {
  if (payload.errors?.length) {
    const details = payload.errors
      .map((error) => {
        const code = error.extensions?.code;
        return code ? `${error.message} (${code})` : error.message;
      })
      .filter(Boolean)
      .join("; ");

    throw new Error(
      `Shopify ${operation} failed${details ? `: ${details}` : ""}`,
    );
  }
}

function userError(result, operation) {
  if (result?.userErrors?.length) {
    const message = result.userErrors.map((error) => error.message).join("; ");
    throw new Error(`Shopify ${operation} was rejected: ${message}`);
  }
}

export function verifyCarrierCallback(requestUrl) {
  const url = new URL(requestUrl);
  const shopDomain = url.searchParams.get("shop")?.trim().toLowerCase();
  const signature = url.searchParams.get("signature");

  if (
    !shopDomain ||
    !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shopDomain) ||
    !signature
  ) {
    return null;
  }

  return safeEqual(signature, signatureForShop(shopDomain)) ? shopDomain : null;
}

export async function ensureCarrierService(admin, shopDomain) {
  const expectedCallbackUrl = callbackUrl(shopDomain);
  const queryResponse = await admin.graphql(CARRIER_SERVICES_QUERY);
  const queryPayload = await queryResponse.json();
  graphQLError(queryPayload, "carrier service lookup");

  const existing = queryPayload.data?.carrierServices?.nodes?.find(
    (service) => service.name === CARRIER_SERVICE_NAME,
  );

  if (
    existing &&
    existing.callbackUrl === expectedCallbackUrl &&
    existing.active &&
    existing.supportsServiceDiscovery === false
  ) {
    return { ...existing, created: false };
  }

  if (existing) {
    const updateResponse = await admin.graphql(
      UPDATE_CARRIER_SERVICE_MUTATION,
      {
        variables: {
          input: {
            id: existing.id,
            name: CARRIER_SERVICE_NAME,
            callbackUrl: expectedCallbackUrl,
            active: true,
            supportsServiceDiscovery: false,
          },
        },
      },
    );
    const updatePayload = await updateResponse.json();
    graphQLError(updatePayload, "carrier service update");
    userError(updatePayload.data?.carrierServiceUpdate, "carrier service update");

    return {
      ...updatePayload.data.carrierServiceUpdate.carrierService,
      created: false,
    };
  }

  const createResponse = await admin.graphql(
    CREATE_CARRIER_SERVICE_MUTATION,
    {
      variables: {
        input: {
          name: CARRIER_SERVICE_NAME,
          callbackUrl: expectedCallbackUrl,
          active: true,
          supportsServiceDiscovery: false,
        },
      },
    },
  );
  const createPayload = await createResponse.json();
  graphQLError(createPayload, "carrier service creation");
  userError(createPayload.data?.carrierServiceCreate, "carrier service creation");

  const carrierService = createPayload.data?.carrierServiceCreate?.carrierService;

  if (!carrierService) {
    throw new Error("Shopify did not return the carrier service");
  }

  return { ...carrierService, created: true };
}

function productGid(productId) {
  if (productId === undefined || productId === null || productId === "") {
    return null;
  }

  const normalized = String(productId);
  return normalized.startsWith("gid://shopify/Product/")
    ? normalized
    : `gid://shopify/Product/${normalized}`;
}

async function loadProducts(admin, items) {
  const ids = [
    ...new Set(items.map((item) => productGid(item.product_id)).filter(Boolean)),
  ];

  if (!ids.length) return new Map();

  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { ids },
  });
  const payload = await response.json();
  graphQLError(payload, "product lookup");

  return new Map(
    (payload.data?.nodes ?? [])
      .filter(Boolean)
      .map((product) => [product.id, product]),
  );
}

function number(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function destination(rate) {
  const address = rate.destination ?? {};

  return {
    ...address,
    countryCode: address.country,
    provinceCode: address.province,
    zip: address.postal_code,
    address1: address.address1,
  };
}

function origin(rate) {
  const address = rate.origin ?? {};

  return {
    ...address,
    countryCode: address.country,
    provinceCode: address.province,
    zip: address.postal_code,
    postcode: address.postal_code,
  };
}

export async function mapCarrierRequest(admin, payload, shopId) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Carrier request must be an object");
  }

  const rate = payload.rate;

  if (!rate || typeof rate !== "object" || Array.isArray(rate)) {
    throw new TypeError("Carrier request rate is required");
  }

  const rawItems = Array.isArray(rate.items) ? rate.items : [];
  const products = await loadProducts(admin, rawItems);
  const items = rawItems.map((item) => {
    const productId = productGid(item.product_id);
    const product = products.get(productId);
    const quantity = number(item.quantity, 1);

    return {
      ...item,
      quantity,
      price: number(item.price) / 100,
      weight: number(item.grams),
      productId,
      variantId: item.variant_id
        ? `gid://shopify/ProductVariant/${item.variant_id}`
        : null,
      product: product
        ? {
            id: product.id,
            title: product.title,
            tags: product.tags,
            productType: product.productType,
            vendor: product.vendor,
          }
        : {
            id: productId,
            title: item.name,
            vendor: item.vendor,
          },
      variant: {
        id: item.variant_id
          ? `gid://shopify/ProductVariant/${item.variant_id}`
          : null,
        sku: item.sku,
      },
    };
  });

  return {
    shopId,
    currency: rate.currency,
    locale: rate.locale,
    origin: origin(rate),
    destination: destination(rate),
    cart: {
      subtotal: items.reduce(
        (total, item) => total + number(item.price) * number(item.quantity, 1),
        0,
      ),
      quantity: items.reduce(
        (total, item) => total + number(item.quantity, 1),
        0,
      ),
      weight: items.reduce(
        (total, item) => total + number(item.weight) * number(item.quantity, 1),
        0,
      ),
    },
    items,
  };
}

function sameCountry(request) {
  const originCountry = String(request.origin?.countryCode ?? "").toUpperCase();
  const destinationCountry = String(
    request.destination?.countryCode ?? "",
  ).toUpperCase();

  return Boolean(
    originCountry &&
      destinationCountry &&
      originCountry === destinationCountry,
  );
}

function matchesZone(rate, request) {
  const zone = String(rate.zoneKey ?? "").trim().toLowerCase();

  if (!zone || !["domestic", "international"].includes(zone)) return true;
  return zone === "domestic" ? sameCountry(request) : !sameCountry(request);
}

function serviceCode(rate) {
  const identity = String(rate.id ?? `${rate.rule?.id}-${rate.position}`);
  const normalized = identity.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  return `calculator-${normalized}`.slice(0, 100);
}

export function formatCarrierResponse(result, request) {
  const rates = Array.isArray(result?.rates) ? result.rates : [];

  return {
    rates: rates
      .filter(
        (rate) =>
          String(rate.status).toUpperCase() === "ACTIVE" &&
          matchesZone(rate, request) &&
          Number.isFinite(Number(rate.price)) &&
          Number(rate.price) >= 0,
      )
      .map((rate) => ({
        service_name: String(rate.name),
        service_code: serviceCode(rate),
        description: String(
          rate.description || rate.rule?.name || rate.name,
        ),
        currency: String(
          rate.currencyCode || request.currency || "USD",
        ).toUpperCase(),
        total_price: String(Math.round(Number(rate.price) * 100)),
      })),
  };
}
