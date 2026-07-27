import { repositories } from "@calculator/database";

export function createShop(data) {
  return repositories.shops.createShop(data);
}

export function findShopById(id) {
  return repositories.shops.findShopById(id);
}

export function findShopByDomain(shopDomain) {
  return repositories.shops.findShopByDomain(shopDomain);
}

export function findShops() {
  return repositories.shops.findShops();
}

export function updateShop(id, data) {
  return repositories.shops.updateShop(id, data);
}

export function deleteShop(id) {
  return repositories.shops.deleteShop(id);
}
