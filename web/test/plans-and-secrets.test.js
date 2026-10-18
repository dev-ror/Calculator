import assert from "node:assert/strict";
import test from "node:test";

process.env.SHOPIFY_API_SECRET ||= "test-only-shopify-secret";

const { entitlementsFor } = await import("../app/plan-entitlements.js");
const {
  createApiSecret,
  decryptApiSecret,
  encryptApiSecret,
  hashApiSecret,
} = await import("../app/settings-secret.server.js");

test("plans unlock only their advertised live features", () => {
  assert.deepEqual(entitlementsFor("SANDBOX"), {
    shippingRatesLive: false,
    customizationsLive: false,
    customCodedRates: false,
  });
  assert.deepEqual(entitlementsFor("STARTER"), {
    shippingRatesLive: false,
    customizationsLive: true,
    customCodedRates: false,
  });
  assert.deepEqual(entitlementsFor("PRO"), {
    shippingRatesLive: true,
    customizationsLive: true,
    customCodedRates: false,
  });
  assert.deepEqual(entitlementsFor("PRO_PLUS"), {
    shippingRatesLive: true,
    customizationsLive: true,
    customCodedRates: true,
  });
  assert.deepEqual(entitlementsFor("unknown"), entitlementsFor("SANDBOX"));
});

test("store clone secrets encrypt at rest and hash deterministically", () => {
  const secret = createApiSecret();
  const encrypted = encryptApiSecret(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decryptApiSecret(encrypted), secret);
  assert.equal(hashApiSecret(secret), hashApiSecret(secret));
  assert.notEqual(hashApiSecret(secret), hashApiSecret(`${secret}x`));
});
