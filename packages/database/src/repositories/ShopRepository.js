import prisma from "../client.js";

export function createShop(data) {
  return prisma.shop.create({ data });
}

export function findShopById(id) {
  return prisma.shop.findUnique({
    where: { id },
    include: { configuration: true },
  });
}

export function findShopByDomain(shopDomain) {
  return prisma.shop.findUnique({
    where: { shopDomain },
    include: { configuration: true },
  });
}

export function findShops() {
  return prisma.shop.findMany();
}

export function updateShop(id, data) {
  return prisma.shop.update({ where: { id }, data });
}

export function deleteShop(id) {
  return prisma.shop.delete({ where: { id } });
}
