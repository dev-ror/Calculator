import prisma from "../client.js";

const completeRate = {
  conditions: true,
  rates: true,
  schedules: { orderBy: { position: "asc" } },
};

export function createRate({ rule, conditions, definitions, schedules }) {
  return prisma.$transaction(
    async (transaction) => {
      const createdRule = await transaction.rateRule.create({ data: rule });

      if (conditions.length > 0) {
        await transaction.rateCondition.createMany({
          data: conditions.map((condition) => ({
            ...condition,
            shopId: createdRule.shopId,
            rateRuleId: createdRule.id,
          })),
        });
      }

      if (definitions.length > 0) {
        await transaction.rateDefinition.createMany({
          data: definitions.map((definition) => ({
            ...definition,
            shopId: createdRule.shopId,
            rateRuleId: createdRule.id,
          })),
        });
      }

      if (schedules.length > 0) {
        await transaction.rateSchedule.createMany({
          data: schedules.map((schedule) => ({
            ...schedule,
            shopId: createdRule.shopId,
            rateRuleId: createdRule.id,
          })),
        });
      }

      return transaction.rateRule.findUnique({
        where: {
          id_shopId: { id: createdRule.id, shopId: createdRule.shopId },
        },
        include: completeRate,
      });
    },
    { timeout: 15_000 },
  );
}

export function findRateById(id, shopId) {
  return prisma.rateRule.findUnique({
    where: { id_shopId: { id, shopId } },
    include: completeRate,
  });
}

export function findRatesByShop(shopId) {
  return prisma.rateRule.findMany({
    where: { shopId },
    include: completeRate,
  });
}

export function updateRate(
  id,
  shopId,
  { rule, conditions, definitions, schedules },
) {
  return prisma.$transaction(
    async (transaction) => {
      await transaction.rateRule.update({
        where: { id_shopId: { id, shopId } },
        data: rule,
      });
      await transaction.rateCondition.deleteMany({
        where: { rateRuleId: id, shopId },
      });
      await transaction.rateDefinition.deleteMany({
        where: { rateRuleId: id, shopId },
      });
      await transaction.rateSchedule.deleteMany({
        where: { rateRuleId: id, shopId },
      });

      if (conditions.length > 0) {
        await transaction.rateCondition.createMany({
          data: conditions.map((condition) => ({
            ...condition,
            shopId,
            rateRuleId: id,
          })),
        });
      }

      if (definitions.length > 0) {
        await transaction.rateDefinition.createMany({
          data: definitions.map((definition) => ({
            ...definition,
            shopId,
            rateRuleId: id,
          })),
        });
      }

      if (schedules.length > 0) {
        await transaction.rateSchedule.createMany({
          data: schedules.map((schedule) => ({
            ...schedule,
            shopId,
            rateRuleId: id,
          })),
        });
      }

      return transaction.rateRule.findUnique({
        where: { id_shopId: { id, shopId } },
        include: completeRate,
      });
    },
    { timeout: 15_000 },
  );
}

export function deleteRate(id, shopId) {
  return prisma.rateRule.delete({ where: { id_shopId: { id, shopId } } });
}
