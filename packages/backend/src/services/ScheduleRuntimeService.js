import * as CustomizationService from "./CustomizationService.js";

function validInstant(value) {
  const instant = new Date(value);

  if (Number.isNaN(instant.getTime())) {
    throw new TypeError("Schedule processing time must be a valid date");
  }

  return instant;
}

function safeErrorMessage(error) {
  return error instanceof Error && error.message
    ? error.message
    : "Unable to synchronize scheduled configuration";
}

export async function processSchedules({
  asOf = new Date(),
  findDueShopIds = CustomizationService.findShopIdsWithDueCustomizationSchedules,
  syncShop,
} = {}) {
  if (typeof findDueShopIds !== "function") {
    throw new TypeError("Due schedule loader is required");
  }

  if (typeof syncShop !== "function") {
    throw new TypeError("Scheduled configuration synchronizer is required");
  }

  const effectiveAt = validInstant(asOf);
  const shopIds = [
    ...new Set((await findDueShopIds(effectiveAt)).filter(Boolean)),
  ].sort((left, right) => String(left).localeCompare(String(right)));
  const succeeded = [];
  const failed = [];

  for (const shopId of shopIds) {
    try {
      const synchronization = await syncShop(shopId, effectiveAt);
      succeeded.push({ shopId, synchronization });
    } catch (error) {
      failed.push({ shopId, error: safeErrorMessage(error) });
    }
  }

  return {
    asOf: effectiveAt.toISOString(),
    processed: shopIds.length,
    succeeded,
    failed,
  };
}
