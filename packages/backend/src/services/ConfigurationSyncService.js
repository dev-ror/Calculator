import {
  ConfigurationBuilder,
  ConfigurationSerializer,
} from "../configuration/index.js";
import * as ShopService from "./ShopService.js";
import * as CustomizationService from "./CustomizationService.js";
import * as RateService from "./RateService.js";

export async function syncFunctionConfiguration(
  shopId,
  writeConfiguration,
  { asOf = new Date() } = {},
) {
  if (typeof writeConfiguration !== "function") {
    throw new TypeError("Function configuration writer is required");
  }

  const [shop, customizations, rateRules] = await Promise.all([
    ShopService.findShopById(shopId),
    CustomizationService.findCustomizationsByShop(shopId),
    RateService.findRatesByShop(shopId),
  ]);

  const configurationObject = ConfigurationBuilder.build({
    shop,
    customizations,
    rateRules,
    asOf,
  });

  const configuration = ConfigurationSerializer.serialize(configurationObject);
  const { ownerId, metafield } = await writeConfiguration({
    shop,
    configuration,
  });

  return {
    success: true,
    ownerId,
    metafieldId: metafield.id,
    updatedAt: metafield.updatedAt,
  };
}
