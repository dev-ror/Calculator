import prisma from "../client.js";

export function createCustomization({ customization, conditions, methods, schedules }) {
  return prisma.$transaction(async (transaction) => {
    const createdCustomization = await transaction.customization.create({
      data: customization,
    });

    if (conditions.length > 0) {
      await transaction.customizationCondition.createMany({
        data: conditions.map((condition) => ({
          ...condition,
          shopId: createdCustomization.shopId,
          customizationId: createdCustomization.id,
        })),
      });
    }

    await transaction.customizationMethod.createMany({
      data: methods.map((method) => ({
        ...method,
        shopId: createdCustomization.shopId,
        customizationId: createdCustomization.id,
      })),
    });

    if (schedules.length > 0) {
      await transaction.customizationSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          shopId: createdCustomization.shopId,
          customizationId: createdCustomization.id,
        })),
      });
    }

    return transaction.customization.findUnique({
      where: {
        id_shopId: {
          id: createdCustomization.id,
          shopId: createdCustomization.shopId,
        },
      },
      include: {
        conditions: true,
        methods: true,
        schedules: { orderBy: { position: "asc" } },
      },
    });
  });
}

export function findCustomizationById(id, shopId) {
  return prisma.customization.findUnique({
    where: { id_shopId: { id, shopId } },
    include: {
      conditions: true,
      methods: true,
      schedules: { orderBy: { position: "asc" } },
    },
  });
}

export function findCustomizationsByShop(shopId) {
  return prisma.customization.findMany({
    where: { shopId },
    include: {
      conditions: true,
      methods: true,
      schedules: { orderBy: { position: "asc" } },
    },
  });
}

export function updateCustomization(
  id,
  shopId,
  { customization, conditions, methods, schedules },
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.customization.update({
      where: { id_shopId: { id, shopId } },
      data: customization,
    });
    await transaction.customizationCondition.deleteMany({
      where: { customizationId: id, shopId },
    });
    await transaction.customizationMethod.deleteMany({
      where: { customizationId: id, shopId },
    });
    await transaction.customizationSchedule.deleteMany({
      where: { customizationId: id, shopId },
    });

    if (conditions.length > 0) {
      await transaction.customizationCondition.createMany({
        data: conditions.map((condition) => ({
          ...condition,
          shopId,
          customizationId: id,
        })),
      });
    }

    await transaction.customizationMethod.createMany({
      data: methods.map((method) => ({
        ...method,
        shopId,
        customizationId: id,
      })),
    });

    if (schedules.length > 0) {
      await transaction.customizationSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          shopId,
          customizationId: id,
        })),
      });
    }

    return transaction.customization.findUnique({
      where: { id_shopId: { id, shopId } },
      include: {
        conditions: true,
        methods: true,
        schedules: { orderBy: { position: "asc" } },
      },
    });
  });
}

export function deleteCustomization(id, shopId) {
  return prisma.customization.delete({ where: { id_shopId: { id, shopId } } });
}

export function findConditionsByCustomization(customizationId, shopId) {
  return prisma.customizationCondition.findMany({
    where: { customizationId, shopId },
    orderBy: { position: "asc" },
  });
}

export function findMethodsByCustomization(customizationId, shopId) {
  return prisma.customizationMethod.findMany({
    where: { customizationId, shopId },
    orderBy: { position: "asc" },
  });
}
