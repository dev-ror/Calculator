import { repositories } from "@calculator/database";
import { validateCustomization } from "../validators/CustomizationValidator.js";

export function createCustomization(data) {
  const validated = validateCustomization(data);
  const {
    conditions,
    methods,
    schedules,
    conditionsBySet: _conditionsBySet,
    ...customization
  } = validated;

  return repositories.customizations.createCustomization({
    customization,
    conditions,
    methods,
    schedules,
  });
}

export function findCustomizationById(id, shopId) {
  return repositories.customizations.findCustomizationById(id, shopId);
}

export function findCustomizationsByShop(shopId) {
  return repositories.customizations.findCustomizationsByShop(shopId);
}

export function updateCustomization(id, shopId, data) {
  const validated = validateCustomization({ ...data, shopId });
  const {
    conditions,
    methods,
    schedules,
    conditionsBySet: _conditionsBySet,
    ...customization
  } = validated;

  return repositories.customizations.updateCustomization(id, shopId, {
    customization,
    conditions,
    methods,
    schedules,
  });
}

export function deleteCustomization(id, shopId) {
  return repositories.customizations.deleteCustomization(id, shopId);
}
