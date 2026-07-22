import { pipeline, services, validators } from "@calculator/backend";

export function executeShippingPipeline(request) {
  return pipeline.ShippingPipeline.execute(request);
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

export async function loadRateData(shopDomain) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  const [rates, rules] = await Promise.all([
    services.RateService.findRatesByShop(shopId),
    services.RuleService.findRulesByShop(shopId),
  ]);

  return { rates, rules };
}

export async function findRatesByShop(shopDomain) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  return services.RateService.findRatesByShop(shopId);
}

export async function createRate(shopDomain, data) {
  const shop = await ensureShop(shopDomain);
  validators.RateValidator.validateRate({ ...data, shopId: shop.id });

  return services.RateService.createRate({ ...data, shopId: shop.id });
}

export async function updateRate(shopDomain, id, data) {
  const shop = await ensureShop(shopDomain);
  validators.RateValidator.validateRate({ ...data, shopId: shop.id });

  return services.RateService.updateRate(id, shop.id, data);
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

  return services.CustomizationService.createCustomization({
    ...data,
    shopId: validated.shopId,
  });
}

export async function updateCustomization(shopDomain, id, data) {
  const shop = await ensureShop(shopDomain);
  validators.CustomizationValidator.validateCustomization({
    ...data,
    shopId: shop.id,
  });

  return services.CustomizationService.updateCustomization(id, shop.id, data);
}

export async function deleteCustomization(shopDomain, id) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validators.ShippingValidator.validateShippingRequest({
    shopId: shop.id,
  });

  return services.CustomizationService.deleteCustomization(id, shopId);
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
