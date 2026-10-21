import prisma from "../client.js";

export function createRule(data) {
  return prisma.rateRule.create({ data });
}

export function findRuleById(id, shopId) {
  return prisma.rateRule.findUnique({ where: { id_shopId: { id, shopId } } });
}

export function findRulesByShop(shopId) {
  return prisma.rateRule.findMany({ where: { shopId } });
}

export function updateRule(id, shopId, data) {
  return prisma.rateRule.update({
    where: { id_shopId: { id, shopId } },
    data,
  });
}

export function deleteRule(id, shopId) {
  return prisma.rateRule.delete({ where: { id_shopId: { id, shopId } } });
}
