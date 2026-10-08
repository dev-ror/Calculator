import { pipeline, services, validators } from "@calculator/backend";
import { ensureCarrierService as ensureShopifyCarrierService } from "./carrier-service.server";
import { unauthenticated } from "./shopify.server";
import { canUse, getPlan } from "./billing.server";

const SYNC_FUNCTION_CONFIGURATION_MUTATION = `#graphql
  mutation SyncFunctionConfiguration($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export function executeShippingPipeline(request) {
  return pipeline.ShippingPipeline.execute(request);
}

export async function ensureCarrierService(shopDomain, authenticatedAdmin) {
  let admin = authenticatedAdmin;

  if (!admin) {
    try {
      ({ admin } = await unauthenticated.admin(shopDomain));
    } catch {
      throw new Error("Shopify authentication is unavailable");
    }
  }

  return ensureShopifyCarrierService(admin, shopDomain);
}

export async function ensureDeliveryCustomizationOwner(shopId) {
  const shop = await services.ShopService.findShopById(shopId);

  if (!shop) {
    throw new Error("Shop was not found");
  }

  let admin;

  try {
    ({ admin } = await unauthenticated.admin(shop.shopDomain));
  } catch {
    throw new Error("Shopify authentication is unavailable");
  }

  return services.DeliveryCustomizationOwnerService.ensureDeliveryCustomizationOwner(
    {
      admin,
      appKey: process.env.SHOPIFY_API_KEY,
      functionHandle: "delivery-customization",
      title: "Calculator Delivery Customization",
    },
  );
}

export async function syncFunctionConfiguration(shopId, { asOf = new Date() } = {}) {
  try {
    return await services.ConfigurationSyncService.syncFunctionConfiguration(
      shopId,
      async ({ shop, configuration }) => {
        let admin;
        let session;

        try {
          ({ admin, session } = await unauthenticated.admin(shop.shopDomain));
        } catch {
          throw new Error("Shopify authentication is unavailable");
        }

        const plan = await getPlan(admin, session);
        const configurationObject = JSON.parse(configuration);
        configurationObject.testMode =
          configurationObject.testMode || !canUse(plan, "customizations");

        const owner =
          await services.DeliveryCustomizationOwnerService.ensureDeliveryCustomizationOwner(
            {
              admin,
              appKey: process.env.SHOPIFY_API_KEY,
              functionHandle: "delivery-customization",
              title: "Calculator Delivery Customization",
            },
          );

        const metafieldResponse = await admin.graphql(
          SYNC_FUNCTION_CONFIGURATION_MUTATION,
          {
            variables: {
              metafields: [
                {
                  ownerId: owner.ownerId,
                  namespace: "$app:delivery-customization",
                  key: "function-configuration",
                  type: "json",
                  value: JSON.stringify(configurationObject),
                },
              ],
            },
          },
        );
        const metafieldPayload = await metafieldResponse.json();

        if (metafieldPayload.errors?.length) {
          throw new Error("Unable to synchronize Shopify Function configuration");
        }

        const result = metafieldPayload.data?.metafieldsSet;

        if (result?.userErrors?.length) {
          const messages = result.userErrors.map(({ message }) => message).join("; ");
          throw new Error(`Shopify rejected Function configuration: ${messages}`);
        }

        const metafield = result?.metafields?.[0];

        if (!metafield) {
          throw new Error("Shopify did not return the synchronized metafield");
        }

        return {
          ownerId: owner.ownerId,
          metafield,
        };
      },
      { asOf },
    );
  } catch (error) {
    const safeMessages = new Set([
      "Shop was not found",
      "Shopify authentication is unavailable",
      "Unable to load Shopify Delivery Customizations",
      "Unable to create Shopify Delivery Customization",
      "Shopify did not return a Delivery Customization owner",
      "Unable to synchronize Shopify Function configuration",
      "Shopify did not return the synchronized metafield",
    ]);

    if (
      error instanceof Error &&
      (safeMessages.has(error.message) ||
        error.message.startsWith("Shopify rejected Delivery Customization:") ||
        error.message.startsWith("Shopify rejected Function configuration:"))
    ) {
      throw error;
    }

    throw new Error("Unable to synchronize Shopify Function configuration");
  }
}

export function processCustomizationSchedules({ asOf = new Date() } = {}) {
  return services.ScheduleRuntimeService.processSchedules({
    asOf,
    syncShop: (shopId, effectiveAt) =>
      syncFunctionConfiguration(shopId, { asOf: effectiveAt }),
  });
}

export async function ensureShop(shopDomain) {
  const shopData = validators.ShopValidator.validateShop({ shopDomain });
  const existingShop = await services.ShopService.findShopByDomain(shopData.shopDomain);

  return existingShop ?? services.ShopService.createShop(shopData);
}

export async function loadCustomizations(shopDomain) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  return services.CustomizationService.findCustomizationsByShop(shopId);
}

export async function loadRateData(shopDomain, admin) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  const [rates, rules, carrierServiceResult] = await Promise.all([
    services.RateService.findRatesByShop(shopId),
    services.RuleService.findRulesByShop(shopId),
    ensureCarrierService(shopDomain, admin)
      .then((carrierService) => ({ available: true, carrierService }))
      .catch((error) => ({
        available: false,
        error:
          error instanceof Error
            ? error.message
            : "Carrier-calculated shipping is unavailable",
      })),
  ]);

  return { rates, rules, carrierService: carrierServiceResult };
}

export async function findRatesByShop(shopDomain) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  return services.RateService.findRatesByShop(shopId);
}

function isCustomCodeRate(rate) {
  return /custom[\s_-]*cod(?:e|ed)/i.test(String(rate.calculation ?? ""));
}

async function enforceCustomCodePlan(shopDomain, definitions) {
  if (!definitions.some(isCustomCodeRate)) return;

  const { admin, session } = await unauthenticated.admin(shopDomain);
  const plan = await getPlan(admin, session);
  if (!canUse(plan, "customCode")) {
    throw new TypeError("Custom coded shipping rates require the Pro+ plan.");
  }
}

export async function createRate(shopDomain, data, admin) {
  const shop = await ensureShop(shopDomain);
  const validated = validators.RateValidator.validateRate({ ...data, shopId: shop.id });
  await enforceCustomCodePlan(shopDomain, validated.definitions);

  const rate = await services.RateService.createRate({ ...data, shopId: shop.id });
  await ensureCarrierService(shopDomain, admin).catch(() => null);

  return rate;
}

export async function updateRate(shopDomain, id, data, admin) {
  const shop = await ensureShop(shopDomain);
  const validated = validators.RateValidator.validateRate({ ...data, shopId: shop.id });
  await enforceCustomCodePlan(shopDomain, validated.definitions);

  const rate = await services.RateService.updateRate(id, shop.id, data);
  await ensureCarrierService(shopDomain, admin).catch(() => null);

  return rate;
}

export async function validateCustomizationSubmission(shopDomain, data) {
  const shop = await ensureShop(shopDomain);

  return validators.CustomizationValidator.validateCustomization({
    ...data,
    shopId: shop.id,
  });
}

export async function createCustomization(shopDomain, data) {
  const validated = await validateCustomizationSubmission(shopDomain, data);

  const customization = await services.CustomizationService.createCustomization({
    ...data,
    shopId: validated.shopId,
  });
  await syncFunctionConfiguration(validated.shopId);

  return customization;
}

export async function updateCustomization(shopDomain, id, data) {
  const shop = await ensureShop(shopDomain);
  validators.CustomizationValidator.validateCustomization({
    ...data,
    shopId: shop.id,
  });

  const customization = await services.CustomizationService.updateCustomization(
    id,
    shop.id,
    data,
  );
  await syncFunctionConfiguration(shop.id);

  return customization;
}

export async function deleteCustomization(shopDomain, id) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  const customization = await services.CustomizationService.deleteCustomization(id, shopId);
  await syncFunctionConfiguration(shopId);

  return customization;
}

export async function deleteRate(shopDomain, id) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  return services.RateService.deleteRate(id, shopId);
}

export async function validateRuleSubmission(shopDomain, data) {
  const shop = await ensureShop(shopDomain);

  return validators.RuleValidator.validateRule({
    ...data,
    shopId: shop.id,
  });
}
