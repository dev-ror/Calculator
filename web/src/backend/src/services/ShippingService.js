import { repositories } from "@calculator/database";
import { map as mapRequest } from "../contracts/RequestMapper.js";
import { format } from "../formatters/ShippingResponseFormatter.js";
import { evaluate } from "../rules/RuleEngine.js";
import { evaluate as evaluateShipping } from "../shipping/ShippingEngine.js";

export async function findShippingDataByShop(shopId) {
  const [customizations, rates, rules] = await Promise.all([
    repositories.customizations.findCustomizationsByShop(shopId),
    repositories.rates.findRatesByShop(shopId),
    repositories.rules.findRulesByShop(shopId),
  ]);

  return { customizations, rates, rules };
}

export async function evaluateShippingRules(shopId, request) {
  const [shop, customizations, rateRules] = await Promise.all([
    repositories.shops.findShopById(shopId),
    repositories.customizations.findCustomizationsByShop(shopId),
    repositories.rates.findRatesByShop(shopId),
  ]);

  if (!shop) {
    throw new TypeError("Shop was not found");
  }

  return {
    ...evaluate({ shop, customizations, rateRules, request }),
    configuration: shop.configuration,
  };
}

export async function calculateShipping(shopId, request) {
  const mappedRequest = mapRequest(request, { shopId });
  const ruleEvaluation = await evaluateShippingRules(shopId, mappedRequest);
  const engineResult = evaluateShipping(ruleEvaluation);

  return format(engineResult);
}
