import { repositories } from "@calculator/database";
import { validateRate } from "../validators/RateValidator.js";

export function createRate(data) {
  return repositories.rates.createRate(validateRate(data));
}

export function findRateById(id, shopId) {
  return repositories.rates.findRateById(id, shopId);
}

export function findRatesByShop(shopId) {
  return repositories.rates.findRatesByShop(shopId);
}

export function updateRate(id, shopId, data) {
  return repositories.rates.updateRate(id, shopId, validateRate({ ...data, shopId }));
}

export function deleteRate(id, shopId) {
  return repositories.rates.deleteRate(id, shopId);
}
