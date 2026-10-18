import assert from "node:assert/strict";
import test from "node:test";

import { build, resolveEffectiveStatus } from "../src/configuration/ConfigurationBuilder.js";
import { processSchedules } from "../src/services/ScheduleRuntimeService.js";

const ACTIVE = { id: "customization-1", status: "ACTIVE", schedules: [] };
const at = "2026-08-11T12:00:00.000Z";

function schedule(action, scheduledAt, position = 0, id = `${action}-${position}`) {
  return { id, action, scheduledAt, position, timezone: "UTC" };
}

test("no schedules preserves the base status", () => {
  assert.equal(resolveEffectiveStatus(ACTIVE, at), "ACTIVE");
});

test("future ACTIVATE preserves the base status", () => {
  const customization = {
    ...ACTIVE,
    status: "INACTIVE",
    schedules: [schedule("ACTIVATE", "2026-08-11T13:00:00.000Z")],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "INACTIVE");
});

test("future DEACTIVATE preserves the base status", () => {
  const customization = {
    ...ACTIVE,
    schedules: [schedule("DEACTIVATE", "2026-08-11T13:00:00.000Z")],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "ACTIVE");
});

test("past ACTIVATE makes the effective status active", () => {
  const customization = {
    ...ACTIVE,
    status: "INACTIVE",
    schedules: [schedule("ACTIVATE", "2026-08-11T11:00:00.000Z")],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "ACTIVE");
});

test("past DEACTIVATE makes the effective status inactive", () => {
  const customization = {
    ...ACTIVE,
    schedules: [schedule("DEACTIVATE", "2026-08-11T11:00:00.000Z")],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "INACTIVE");
});

test("ACTIVATE then DEACTIVATE uses the last due transition", () => {
  const customization = {
    ...ACTIVE,
    status: "INACTIVE",
    schedules: [
      schedule("ACTIVATE", "2026-08-11T10:00:00.000Z", 0),
      schedule("DEACTIVATE", "2026-08-11T11:00:00.000Z", 1),
    ],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "INACTIVE");
});

test("DEACTIVATE then ACTIVATE uses the last due transition", () => {
  const customization = {
    ...ACTIVE,
    schedules: [
      schedule("DEACTIVATE", "2026-08-11T10:00:00.000Z", 0),
      schedule("ACTIVATE", "2026-08-11T11:00:00.000Z", 1),
    ],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "ACTIVE");
});

test("missed transitions are resolved from complete due history", () => {
  const customization = {
    ...ACTIVE,
    schedules: [schedule("DEACTIVATE", "2026-08-10T12:00:00.000Z")],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "INACTIVE");
});

test("same-time schedules use position deterministically", () => {
  const customization = {
    ...ACTIVE,
    schedules: [
      schedule("DEACTIVATE", "2026-08-11T11:00:00.000Z", 0, "a"),
      schedule("ACTIVATE", "2026-08-11T11:00:00.000Z", 1, "b"),
    ],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "ACTIVE");
});

test("invalid schedule data is ignored safely", () => {
  const customization = {
    ...ACTIVE,
    schedules: [
      schedule("UNKNOWN", "2026-08-11T10:00:00.000Z"),
      schedule("DEACTIVATE", "invalid", 1),
    ],
  };
  assert.equal(resolveEffectiveStatus(customization, at), "ACTIVE");
});

test("configuration applies effective state without mutating persisted input", () => {
  const customization = {
    ...ACTIVE,
    schedules: [schedule("DEACTIVATE", "2026-08-11T11:00:00.000Z")],
  };
  const configuration = build({
    shop: { id: "shop-1" },
    customizations: [customization],
    rateRules: [],
    asOf: at,
  });
  assert.equal(configuration.customizations[0].status, "INACTIVE");
  assert.equal(customization.status, "ACTIVE");
});

test("worker processes multiple shops in deterministic order", async () => {
  const calls = [];
  const result = await processSchedules({
    asOf: at,
    findDueShopIds: async () => ["shop-b", "shop-a", "shop-b"],
    syncShop: async (shopId) => calls.push(shopId),
  });
  assert.deepEqual(calls, ["shop-a", "shop-b"]);
  assert.equal(result.processed, 2);
  assert.equal(result.failed.length, 0);
});

test("repeated execution remains safe and deterministic", async () => {
  const calls = [];
  const options = {
    asOf: at,
    findDueShopIds: async () => ["shop-1"],
    syncShop: async (shopId, effectiveAt) =>
      calls.push(`${shopId}:${effectiveAt.toISOString()}`),
  };
  await processSchedules(options);
  await processSchedules(options);
  assert.deepEqual(calls, [`shop-1:${at}`, `shop-1:${at}`]);
});

test("a Shopify failure is retained for retry without stopping other shops", async () => {
  const calls = [];
  const result = await processSchedules({
    asOf: at,
    findDueShopIds: async () => ["shop-a", "shop-b"],
    syncShop: async (shopId) => {
      calls.push(shopId);
      if (shopId === "shop-a") throw new Error("temporary Shopify failure");
      return { success: true };
    },
  });
  assert.deepEqual(calls, ["shop-a", "shop-b"]);
  assert.equal(result.succeeded.length, 1);
  assert.deepEqual(result.failed, [
    { shopId: "shop-a", error: "temporary Shopify failure" },
  ]);
});

test("failed shops are retried on the next execution", async () => {
  let attempts = 0;
  const options = {
    asOf: at,
    findDueShopIds: async () => ["shop-1"],
    syncShop: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary failure");
      return { success: true };
    },
  };
  const first = await processSchedules(options);
  const second = await processSchedules(options);
  assert.equal(first.failed.length, 1);
  assert.equal(second.succeeded.length, 1);
  assert.equal(attempts, 2);
});

test("invalid processing time is rejected", async () => {
  await assert.rejects(
    processSchedules({
      asOf: "invalid",
      findDueShopIds: async () => [],
      syncShop: async () => {},
    }),
    /valid date/,
  );
});
