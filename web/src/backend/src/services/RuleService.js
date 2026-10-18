import { repositories } from "@calculator/database";

export function createRule(data) {
  return repositories.rules.createRule(data);
}

export function findRuleById(id, shopId) {
  return repositories.rules.findRuleById(id, shopId);
}

export function findRulesByShop(shopId) {
  return repositories.rules.findRulesByShop(shopId);
}

export function updateRule(id, shopId, data) {
  return repositories.rules.updateRule(id, shopId, data);
}

export function deleteRule(id, shopId) {
  return repositories.rules.deleteRule(id, shopId);
}
